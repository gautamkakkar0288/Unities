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
import { getCommunityBySlug, joinCommunity } from "@/lib/services/communities"

type Context = { params: Promise<{ slug: string }> }

/**
 * POST /api/mobile/communities/:slug/membership - ask to join.
 *
 * Every branch belongs to `joinCommunity` and `resolveJoinOutcome`: an open
 * community admits immediately and increments the member count in the same
 * transaction, an approval community records a pending request and does not,
 * an invite-only community refuses, and someone who is already a member gets
 * their existing state back unchanged.
 *
 * That last case is why success is 200 with a state rather than 201: the client
 * cannot know in advance whether it is joining or queuing, and the useful answer
 * is what its membership is now. The response therefore always names the state,
 * and `pending` says plainly whether a moderator still has to act.
 *
 * The applicant is the session. A body naming a user is refused.
 */
export const POST = withMobileRoute(
  "POST /api/mobile/communities/[slug]/membership",
  async (request: Request, context: Context) => {
    const authenticated = await requireMobileSession()
    if (!authenticated.ok) return authenticated.response

    const { slug: rawSlug } = await context.params
    const slug = parseSlug(rawSlug)
    if (!slug.ok) return mobileError("VALIDATION_ERROR", slug.message)

    const body = await readOptionalJson(request)
    if (!body.ok) return body.response

    const impersonation = rejectClientSuppliedUser(body.value)
    if (impersonation) return impersonation

    const { userId } = authenticated.session

    const community = await getCommunityBySlug({ slug: slug.value, viewerId: userId })

    if (!community) {
      return mobileError("NOT_FOUND", "That community no longer exists.")
    }

    const result = await joinCommunity({ userId, communityId: community.id })

    if (!result.ok) return mobileFailure(result)

    return mobileData({
      communitySlug: community.slug,
      state: result.data,
      viewerMembership: result.data,
      /** True while a moderator still has to review the request. */
      pending: result.data === "PENDING",
    })
  },
)
