import { requireMobileSession } from "@/lib/api/mobile/auth"
import { withMobileRoute } from "@/lib/api/mobile/handler"
import { notificationRefsForViewer } from "@/lib/api/mobile/projections"
import { parseListQuery } from "@/lib/api/mobile/query"
import { mobileError, mobileList } from "@/lib/api/mobile/response"
import { serializeNotification } from "@/lib/api/mobile/serializers/notification"
import {
  countUnreadNotifications,
  listNotifications,
} from "@/lib/services/notifications"

/**
 * GET /api/mobile/notifications - the Alerts screen.
 *
 * This is the one list in Phase 2 with real cursor pagination, because
 * `listNotifications` already pages by `before`: an ISO timestamp that returns
 * strictly older rows under a stable `createdAt, id` ordering. The cursor the
 * client passes back is therefore the last item's `createdAt`, and nothing has
 * to be invented for it.
 *
 * A viewer can only ever see their own alerts - the service scopes the query by
 * `viewerId`, and there is no parameter here that could point it at anyone else.
 *
 * `unreadCount` rides along in `meta` so the tab badge does not need a second
 * request on every poll.
 */
export const GET = withMobileRoute(
  "GET /api/mobile/notifications",
  async (request: Request) => {
    const authenticated = await requireMobileSession()
    if (!authenticated.ok) return authenticated.response

    const url = new URL(request.url)
    const query = parseListQuery(url)
    if (!query.ok) return mobileError("VALIDATION_ERROR", query.message)

    const { limit, cursor } = query.value
    const unreadOnly = url.searchParams.get("unreadOnly") === "true"
    const viewerId = authenticated.session.userId

    const rows = await listNotifications({
      viewerId,
      limit: limit + 1,
      before: cursor ?? undefined,
      unreadOnly,
    })

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows

    // Target and read timestamp are not in the web projection; this lookup is
    // scoped to the viewer's own rows.
    const refs = await notificationRefsForViewer(
      viewerId,
      page.map((notification) => notification.id),
    )

    const unreadCount = await countUnreadNotifications(viewerId)
    const last = page.at(-1)

    return mobileList(
      page.map((notification) =>
        serializeNotification(
          notification,
          viewerId,
          refs.get(notification.id),
        ),
      ),
      {
        // Only offered when there is genuinely another page behind it.
        nextCursor: hasMore && last ? last.createdAt : null,
        hasMore,
        limit,
        unreadCount,
      },
    )
  },
)
