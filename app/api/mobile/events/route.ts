import { requireMobileSession } from "@/lib/api/mobile/auth"
import { withMobileRoute } from "@/lib/api/mobile/handler"
import { eventStatusesByIds } from "@/lib/api/mobile/projections"
import { parseId, parseListQuery } from "@/lib/api/mobile/query"
import { mobileError, mobileList } from "@/lib/api/mobile/response"
import { serializeEventSummary } from "@/lib/api/mobile/serializers/event"
import { listEvents } from "@/lib/services/events"

/**
 * GET /api/mobile/events - what is on, soonest first.
 *
 * Not in the Phase 2 endpoint list, and added anyway for one reason: the event
 * detail endpoint takes a slug, and without a list the mobile client has no way
 * to learn a slug. The feed that would normally supply them does not exist. One
 * thin wrapper over an existing service is a smaller thing to justify than a
 * detail screen nobody can reach.
 *
 * All the rules stay in `listEvents`: drafts excluded, events in archived
 * communities excluded, cancelled events kept so a registered student sees the
 * cancellation, ordered by start time.
 *
 * `nextCursor` is always null. `listEvents` takes a limit and no cursor, and
 * inventing a cursor this layer cannot honour would be worse than admitting the
 * gap - so the client is told, truthfully, that there is no next page to ask
 * for and separately whether more rows exist. Keyset pagination belongs in the
 * service, next to the ordering it has to match.
 */
export const GET = withMobileRoute(
  "GET /api/mobile/events",
  async (request: Request) => {
    const authenticated = await requireMobileSession()
    if (!authenticated.ok) return authenticated.response

    const url = new URL(request.url)
    const query = parseListQuery(url)
    if (!query.ok) return mobileError("VALIDATION_ERROR", query.message)

    const rawCommunityId = url.searchParams.get("communityId")
    let communityId: string | undefined

    if (rawCommunityId !== null && rawCommunityId !== "") {
      const parsed = parseId(rawCommunityId)
      if (!parsed.ok) return mobileError("VALIDATION_ERROR", parsed.message)
      communityId = parsed.value
    }

    const { limit } = query.value

    // One extra row, discarded before serialising, is how `hasMore` is known
    // without a second count query.
    const rows = await listEvents({
      viewerId: authenticated.session.userId,
      communityId,
      limit: limit + 1,
    })

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const statuses = await eventStatusesByIds(page.map((event) => event.id))

    return mobileList(
      page.map((event) => serializeEventSummary(event, statuses.get(event.id))),
      { nextCursor: null, hasMore, limit },
    )
  },
)
