import { requireMobileSession } from "@/lib/api/mobile/auth"
import {
  readOptionalJson,
  rejectClientSuppliedUser,
} from "@/lib/api/mobile/body"
import { withMobileRoute } from "@/lib/api/mobile/handler"
import { parseId } from "@/lib/api/mobile/query"
import {
  mobileData,
  mobileError,
  mobileFailure,
} from "@/lib/api/mobile/response"
import { markNotificationRead } from "@/lib/services/notifications"

type Context = { params: Promise<{ id: string }> }

/**
 * POST /api/mobile/notifications/:id/read - mark one alert as seen.
 *
 * The obvious way to write this endpoint is to load the notification, compare
 * its `userId` to the session, and then update it. `markNotificationRead` is
 * built the better way: the viewer is part of the WHERE clause, so a
 * notification belonging to someone else does not match, is not updated, and
 * comes back as `NOT_FOUND`. There is no window between the check and the write,
 * and no branch here that could be forgotten.
 *
 * `NOT_FOUND` rather than `FORBIDDEN` for another student's alert is deliberate:
 * a 403 would confirm that the identifier exists, which turns this endpoint into
 * a way to enumerate other people's notifications.
 *
 * Already-read is a success. The client may retry, and marking twice is the same
 * outcome as marking once.
 */
export const POST = withMobileRoute(
  "POST /api/mobile/notifications/[id]/read",
  async (request: Request, context: Context) => {
    const authenticated = await requireMobileSession()
    if (!authenticated.ok) return authenticated.response

    const { id: rawId } = await context.params
    const id = parseId(rawId)
    if (!id.ok) return mobileError("VALIDATION_ERROR", id.message)

    const body = await readOptionalJson(request)
    if (!body.ok) return body.response

    const impersonation = rejectClientSuppliedUser(body.value)
    if (impersonation) return impersonation

    const result = await markNotificationRead({
      viewerId: authenticated.session.userId,
      notificationId: id.value,
    })

    if (!result.ok) return mobileFailure(result)

    return mobileData({ id: id.value, read: true })
  },
)
