import { requireMobileSession } from "@/lib/api/mobile/auth"
import { withMobileRoute } from "@/lib/api/mobile/handler"
import { parseListQuery } from "@/lib/api/mobile/query"
import {
  mobileError,
  mobileMissingCapability,
} from "@/lib/api/mobile/response"

/**
 * GET /api/mobile/feed - not built yet, and says so.
 *
 * There is no feed in this backend. `features/posts` contains components and no
 * service; there is no post query, no ranking, no visibility rule to reuse; and
 * the web `/home` page renders an empty state whose own copy says "the
 * recommendation feed arrives with communities and posts".
 *
 * So this route reports `MISSING_BACKEND_CAPABILITY` rather than returning an
 * empty array. An empty array is a lie a client cannot detect: it looks exactly
 * like a student with nothing to read, so the mobile app would ship a
 * permanently blank home screen and nobody would know whether that was a bug.
 * The capability code is a state the Flutter client already models.
 *
 * Authentication and parameter validation run first, on purpose. The gap is
 * about product surface, not about who is asking, and this route should start
 * behaving like every other one the day a feed service exists.
 */
export const GET = withMobileRoute(
  "GET /api/mobile/feed",
  async (request: Request) => {
    const authenticated = await requireMobileSession()
    if (!authenticated.ok) return authenticated.response

    const query = parseListQuery(new URL(request.url))
    if (!query.ok) return mobileError("VALIDATION_ERROR", query.message)

    return mobileMissingCapability(
      "The feed is not available yet. Browse events and communities in the meantime.",
    )
  },
)
