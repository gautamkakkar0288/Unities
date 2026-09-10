import { requireMobileSession } from "@/lib/api/mobile/auth"
import {
  readOptionalJson,
  rejectClientSuppliedUser,
} from "@/lib/api/mobile/body"
import { withMobileRoute } from "@/lib/api/mobile/handler"
import { parseSlug } from "@/lib/api/mobile/query"
import {
  mobileData,
  mobileError,
  mobileFailure,
} from "@/lib/api/mobile/response"
import { getEventBySlug, registerForEvent } from "@/lib/services/events"

type Context = { params: Promise<{ slug: string }> }

/**
 * POST /api/mobile/events/:slug/registration - take a seat.
 *
 * The whole endpoint is a translation. `registerForEvent` locks the event row,
 * decides between a seat and a waitlist place, refuses a cancelled or closed
 * event, is idempotent for a student who is already in, and writes the
 * confirmation notification inside the same transaction. None of that is
 * restated here, and none of it may be.
 *
 * The registered account is `session.userId`. No code path reads a user
 * identifier from the body or the URL, which is what makes registering somebody
 * else impossible rather than merely unsupported.
 *
 * Statuses follow the service's own vocabulary: a closed or cancelled event is a
 * 409 because the request was well-formed and the world said no, a missing or
 * draft event is a 404, and a student who is already registered gets 200 with
 * their existing state - a retry on a flaky connection must not look like a
 * failure.
 */
export const POST = withMobileRoute(
  "POST /api/mobile/events/[slug]/registration",
  async (request: Request, context: Context) => {
    const authenticated = await requireMobileSession()
    if (!authenticated.ok) return authenticated.response

    const { slug: rawSlug } = await context.params
    const slug = parseSlug(rawSlug)
    if (!slug.ok) return mobileError("VALIDATION_ERROR", slug.message)

    // A registration request needs no body, but one that arrives naming a user
    // is refused rather than ignored.
    const body = await readOptionalJson(request)
    if (!body.ok) return body.response

    const impersonation = rejectClientSuppliedUser(body.value)
    if (impersonation) return impersonation

    const { userId } = authenticated.session

    // The service works in identifiers, the client in slugs. This lookup is
    // also the visibility check: a draft event resolves to null here exactly as
    // it does on the detail screen.
    const event = await getEventBySlug({ slug: slug.value, viewerId: userId })

    if (!event) {
      return mobileError("NOT_FOUND", "That event no longer exists.")
    }

    const result = await registerForEvent({ userId, eventId: event.id })

    if (!result.ok) return mobileFailure(result)

    return mobileData({
      eventSlug: event.slug,
      /** "REGISTERED" or "WAITLISTED" - decided by the service, not here. */
      state: result.data,
      viewerRegistration: result.data,
      viewerRegistrationState: result.data,
    })
  },
)
