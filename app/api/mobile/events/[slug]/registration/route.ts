import { requireMobileSession } from "@/lib/api/mobile/auth"
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
 * The registered account is `session.userId`. There is no code path that reads
 * a user identifier from the body or the URL, which is what makes it impossible
 * to sign up somebody else. A body that names a `userId` is refused loudly
 * rather than ignored quietly, so a client written against the wrong assumption
 * finds out immediately instead of shipping.
 *
 * Statuses follow the service's own vocabulary: a closed or cancelled event is
 * a 409 because the request was well-formed and the world said no, a missing or
 * draft event is a 404, and an already-registered student gets 200 with their
 * existing state rather than an error - retrying on a flaky connection must not
 * look like a failure.
 */
export const POST = withMobileRoute(
  "POST /api/mobile/events/[slug]/registration",
  async (request: Request, context: Context) => {
    const authenticated = await requireMobileSession()
    if (!authenticated.ok) return authenticated.response

    const { slug: rawSlug } = await context.params
    const slug = parseSlug(rawSlug)
    if (!slug.ok) return mobileError("VALIDATION_ERROR", slug.message)

    const rejection = await rejectImpersonation(request)
    if (rejection) return rejection

    const { userId } = authenticated.session

    // The service works in identifiers; the mobile client works in slugs. This
    // lookup is also the visibility check: a draft event resolves to null here
    // exactly as it does on the detail screen.
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

/**
 * A registration request has no body. If one arrives carrying a `userId`, the
 * caller believes it can choose who gets the seat, and the honest answer is to
 * say no rather than to silently register the wrong assumption's author.
 */
async function rejectImpersonation(request: Request) {
  const raw = await request.text()

  if (raw.trim().length === 0) return null

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return mobileError("BAD_REQUEST", "That request body is not valid JSON.")
  }

  if (
    parsed !== null &&
    typeof parsed === "object" &&
    ("userId" in parsed || "user_id" in parsed)
  ) {
    return mobileError(
      "BAD_REQUEST",
      "Registration always applies to the signed-in account.",
    )
  }

  return null
}
