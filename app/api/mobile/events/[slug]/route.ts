import { requireMobileSession } from "@/lib/api/mobile/auth"
import { withMobileRoute } from "@/lib/api/mobile/handler"
import { parseSlug } from "@/lib/api/mobile/query"
import { mobileData, mobileError } from "@/lib/api/mobile/response"
import { serializeEventDetail } from "@/lib/api/mobile/serializers/event"
import { getEventBySlug } from "@/lib/services/events"

type Context = { params: Promise<{ slug: string }> }

/**
 * GET /api/mobile/events/:slug - everything the detail screen renders.
 *
 * `getEventBySlug` is viewer-aware: it computes `viewerRegistration` for the
 * caller and returns null for a draft. This route adds no visibility logic of
 * its own, and it does not include the registration list - that is
 * `listRegistrations`, which is organiser-only and returns names for a reason.
 */
export const GET = withMobileRoute(
  "GET /api/mobile/events/[slug]",
  async (_request: Request, context: Context) => {
    const authenticated = await requireMobileSession()
    if (!authenticated.ok) return authenticated.response

    const { slug: rawSlug } = await context.params
    const slug = parseSlug(rawSlug)
    if (!slug.ok) return mobileError("VALIDATION_ERROR", slug.message)

    const event = await getEventBySlug({
      slug: slug.value,
      viewerId: authenticated.session.userId,
    })

    if (!event) {
      return mobileError("NOT_FOUND", "That event no longer exists.")
    }

    return mobileData(serializeEventDetail(event))
  },
)
