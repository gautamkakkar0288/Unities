import { requireMobileSession } from "@/lib/api/mobile/auth"
import { withMobileRoute } from "@/lib/api/mobile/handler"
import { parseListQuery } from "@/lib/api/mobile/query"
import { mobileError, mobileList } from "@/lib/api/mobile/response"
import { serializeCommunitySummary } from "@/lib/api/mobile/serializers/community"
import { filterCommunities, parseCommunityScope } from "@/lib/domain/community"
import { listCommunitiesForViewer } from "@/lib/services/communities"

/**
 * GET /api/mobile/communities - the directory this student can see.
 *
 * `listCommunitiesForViewer` decides visibility and ordering: campus first, then
 * city, then interest, then everywhere, archived communities excluded, and the
 * viewer's own membership state joined on. This route never adds a community
 * back that the service left out.
 *
 * Search and scope reuse `filterCommunities` and `parseCommunityScope` - the
 * same helpers the web directory uses, so the two surfaces cannot disagree about
 * what "foot" matches. `filterCommunities` documents that it is only equivalent
 * to SQL while the page holds every visible row, so a filtered request fetches
 * the viewer's whole directory first and pages afterwards. An unfiltered request
 * takes the cheaper path of asking for one row more than it needs.
 *
 * `nextCursor` is always null: the service takes a limit and no cursor, and a
 * cursor this layer cannot honour would be a worse answer than an honest null.
 * `hasMore` still tells the client whether rows were left behind. Keyset paging
 * belongs in the service, beside the ordering it has to match.
 */
export const GET = withMobileRoute(
  "GET /api/mobile/communities",
  async (request: Request) => {
    const authenticated = await requireMobileSession()
    if (!authenticated.ok) return authenticated.response

    const url = new URL(request.url)
    const query = parseListQuery(url)
    if (!query.ok) return mobileError("VALIDATION_ERROR", query.message)

    const { limit, search } = query.value
    // An unrecognised scope is "no filter", matching the web directory rather
    // than erroring on a stale link.
    const scope = parseCommunityScope(url.searchParams.get("scope"))
    const viewerId = authenticated.session.userId
    const filtering = search !== null || scope !== null

    const visible = await listCommunitiesForViewer({
      viewerId,
      limit: filtering ? undefined : limit + 1,
    })

    const matched = filtering
      ? filterCommunities(visible, { scope, query: search })
      : visible

    const hasMore = matched.length > limit
    const page = hasMore ? matched.slice(0, limit) : matched

    return mobileList(page.map(serializeCommunitySummary), {
      nextCursor: null,
      hasMore,
      limit,
    })
  },
)
