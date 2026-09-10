import { requireMobileSession } from "@/lib/api/mobile/auth"
import { withMobileRoute } from "@/lib/api/mobile/handler"
import { parseSlug } from "@/lib/api/mobile/query"
import { mobileData, mobileError } from "@/lib/api/mobile/response"
import { serializeCommunityDetail } from "@/lib/api/mobile/serializers/community"
import { listCommunityLeads } from "@/lib/services/community-members"
import { getCommunityBySlug } from "@/lib/services/communities"

type Context = { params: Promise<{ slug: string }> }

/**
 * GET /api/mobile/communities/:slug - one community, plus who runs it.
 *
 * `getCommunityBySlug` is viewer-aware, so `viewerMembership` is the caller's own
 * state and an archived community is simply gone.
 *
 * The people list is `listCommunityLeads`, which returns owners and moderators
 * only. That restriction is a decision the existing service already made -
 * ordinary members, pending applicants and invitees are not public information -
 * and this route must not widen it. Nothing here calls `listPendingRequests`,
 * which is moderator-only for the same reason.
 */
export const GET = withMobileRoute(
  "GET /api/mobile/communities/[slug]",
  async (_request: Request, context: Context) => {
    const authenticated = await requireMobileSession()
    if (!authenticated.ok) return authenticated.response

    const { slug: rawSlug } = await context.params
    const slug = parseSlug(rawSlug)
    if (!slug.ok) return mobileError("VALIDATION_ERROR", slug.message)

    const community = await getCommunityBySlug({
      slug: slug.value,
      viewerId: authenticated.session.userId,
    })

    if (!community) {
      return mobileError("NOT_FOUND", "That community no longer exists.")
    }

    const leads = await listCommunityLeads({ communityId: community.id })

    return mobileData(serializeCommunityDetail(community, leads))
  },
)
