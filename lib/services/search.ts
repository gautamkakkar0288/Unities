import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  communities,
  events,
  interests,
  opportunities,
  posts,
  users,
} from "@/lib/db/schema"
import {
  ALL_TAB_LIMIT,
  CATEGORY_TAB_LIMIT,
  rankSearchResults,
  type SearchCandidate,
  type SearchRequest,
} from "@/lib/domain/search"
import type { CommunitySummary, EventSummary } from "@/lib/domain/types"
import {
  listCommunitiesForViewer,
  scopePlaceIdsForUser,
} from "@/lib/services/communities"
import { listEvents } from "@/lib/services/events"
import {
  listOpportunities,
  type OpportunitySummary,
} from "@/lib/services/opportunities"
import { savedTargetIds } from "@/lib/services/saved"

/**
 * Search across events, communities, opportunities and campus updates.
 *
 * Two decisions shape this file.
 *
 * **Matching is SQL, ranking is domain.** Each category runs one `ilike` query
 * that decides *which rows match*, and `lib/domain/search.ts` decides *what
 * order they appear in*. Postgres can filter far better than JavaScript can and
 * cannot express "exact name beats prefix beats description" without a
 * hand-maintained pile of `case` expressions that no test could read. Splitting
 * it this way means the ranking rules are unit-testable against literals, and
 * the filtering runs where the indexes are.
 *
 * **Projections are borrowed, not rebuilt.** The match queries return ids and
 * the text they matched on; the display shape comes from `listEvents`,
 * `listCommunitiesForViewer` and `listOpportunities`. Writing a second
 * row-to-`EventSummary` mapper here would mean two definitions of what an event
 * looks like, and the day they disagree is the day a card renders a seat count
 * that no other screen agrees with. It also means search inherits, for free,
 * the viewer-registration and membership logic those services already own.
 *
 * The cost of borrowing is that hydration reads a category's visible set rather
 * than only the matched rows. That is bounded by campus size, not by result
 * count, and it is the documented upgrade point: give those three services an
 * `ids` filter - `listOpportunities` already has one - and hydration narrows
 * without a single change here.
 */

/**
 * How many matching rows a category will consider before ranking.
 *
 * Ranking needs a pool: taking the database's first ten rows and ordering those
 * is not relevance, because SQL ordered them by something unrelated to the
 * query. Sixty is comfortably above any plausible campus result set and still a
 * hard ceiling, so a two-letter query cannot turn into a table scan rendered to
 * a page.
 */
const MATCH_SCAN_LIMIT = 60

/**
 * Escape a term for `ilike`.
 *
 * `%` and `_` are wildcards, so a student searching for `100%` would otherwise
 * match everything. Postgres treats backslash as the default escape character,
 * so the backslash itself has to go first.
 */
function likePattern(term: string): string {
  const escaped = term.replace(/[\\%_]/g, (character) => `\\${character}`)
  return `%${escaped}%`
}

/**
 * Every term must appear in at least one of the given columns.
 *
 * AND across terms, OR across columns. "ai workshop" therefore means both words
 * somewhere in the row rather than either word anywhere, which is what a student
 * typing two words means - the alternative floods the results with rows that
 * merely mention "ai".
 */
function matchesAllTerms(
  terms: string[],
  columns: Array<Parameters<typeof ilike>[0]>,
) {
  return and(
    ...terms.map((term) =>
      or(...columns.map((column) => ilike(column, likePattern(term)))),
    ),
  )
}

export type SearchScope = {
  viewerId: string
  /** Campus and city, derived server-side. Empty means placeless content only. */
  placeIds: string[]
  now: Date
}

/**
 * The viewer's search scope, derived entirely from the session subject.
 *
 * `scopePlaceIdsForUser` is the same helper the community directory uses, so
 * search cannot see a wider campus than browsing does. This is the only place
 * scope is established, and it takes a user id rather than a place id -
 * accepting a `universityId` from anywhere near a request would make campus
 * scoping a suggestion rather than a boundary.
 */
export async function searchScopeFor(args: {
  viewerId: string
  now?: Date
}): Promise<SearchScope> {
  return {
    viewerId: args.viewerId,
    placeIds: await scopePlaceIdsForUser(args.viewerId),
    now: args.now ?? new Date(),
  }
}

/** Communities visible to a viewer: their places, plus placeless content. */
function visiblePlaces(placeIds: string[]) {
  return placeIds.length > 0
    ? or(inArray(communities.placeId, placeIds), isNull(communities.placeId))
    : isNull(communities.placeId)
}

/* ------------------------------------------------------------------------- *
 * Events
 * ------------------------------------------------------------------------- */

/**
 * Events matching a query, most relevant first.
 *
 * Searches title, description, venue, event kind and the interest label. Kind is
 * included because "workshop" is a word students type; it scores as taxonomy
 * rather than as a name, so a workshop actually called "Workshop" still wins.
 *
 * Drafts are excluded by `listEvents`, which is the other reason hydration goes
 * through it: an unpublished event must not become visible through search, and
 * that rule is enforced in one place rather than restated here.
 */
export async function searchEvents(
  request: SearchRequest,
  scope: SearchScope,
  limit: number,
): Promise<EventSummary[]> {
  if (!request.shouldSearch) return []

  const matches = await db
    .select({ id: events.id, description: events.description })
    .from(events)
    .innerJoin(communities, eq(communities.id, events.communityId))
    .innerJoin(interests, eq(interests.id, events.interestId))
    .where(
      and(
        sql`${events.status} <> 'DRAFT'`,
        isNull(communities.archivedAt),
        visiblePlaces(scope.placeIds),
        matchesAllTerms(request.terms, [
          events.title,
          events.description,
          events.venue,
          events.kind,
          interests.label,
        ]),
      ),
    )
    .limit(MATCH_SCAN_LIMIT)

  if (matches.length === 0) return []

  const descriptions = new Map(matches.map((row) => [row.id, row.description]))

  // One query, whatever the result count. Deliberately not a lookup per match.
  const visible = await listEvents({ viewerId: scope.viewerId, now: scope.now })

  const candidates = visible
    .filter((event) => descriptions.has(event.id))
    .map((event) => ({
      event,
      id: event.id,
      title: event.title,
      secondary: descriptions.get(event.id) ?? null,
      taxonomy: [event.kind, event.venue, event.interest.label, event.community.name],
      timelyAt: event.startsAt,
    }))

  return rankSearchResults(candidates, request.terms, {
    now: scope.now,
    limit,
  }).map((entry) => entry.event)
}

/* ------------------------------------------------------------------------- *
 * Communities
 * ------------------------------------------------------------------------- */

/**
 * Communities matching a query.
 *
 * Searches name, slug, tagline, about text and interest label. Slug is included
 * because students paste and type URLs, and `coding-club` should find the Coding
 * Club rather than nothing at all.
 */
export async function searchCommunities(
  request: SearchRequest,
  scope: SearchScope,
  limit: number,
): Promise<CommunitySummary[]> {
  if (!request.shouldSearch) return []

  const matches = await db
    .select({
      id: communities.id,
      tagline: communities.tagline,
      about: communities.about,
    })
    .from(communities)
    .innerJoin(interests, eq(interests.id, communities.interestId))
    .where(
      and(
        isNull(communities.archivedAt),
        visiblePlaces(scope.placeIds),
        matchesAllTerms(request.terms, [
          communities.name,
          communities.slug,
          communities.tagline,
          communities.about,
          interests.label,
        ]),
      ),
    )
    .limit(MATCH_SCAN_LIMIT)

  if (matches.length === 0) return []

  const prose = new Map(
    matches.map((row) => [row.id, [row.tagline, row.about].filter(Boolean).join(" ")]),
  )

  const visible = await listCommunitiesForViewer({ viewerId: scope.viewerId })

  const candidates = visible
    .filter((community) => prose.has(community.id))
    .map((community) => ({
      community,
      id: community.id,
      title: community.name,
      secondary: prose.get(community.id) ?? null,
      taxonomy: [community.slug, community.interest.label, community.place?.name ?? null],
      // A community is not an event. Nothing about it is more or less timely.
      timelyAt: null,
    }))

  return rankSearchResults(candidates, request.terms, {
    now: scope.now,
    limit,
  }).map((entry) => entry.community)
}

/* ------------------------------------------------------------------------- *
 * Opportunities
 * ------------------------------------------------------------------------- */

/**
 * Opportunities matching a query.
 *
 * Searches title, description, kind, interest label and the offering community's
 * name - the last of those being the "organisation/provider" the brief asks for.
 * There is no separate provider column: an opportunity is either offered by a
 * community or by nobody in particular, and inventing an organisation field
 * would mean inventing its values too.
 *
 * Hydration uses `listOpportunities({ ids })`, which already filters by id, so
 * this category reads only the rows it matched.
 */
export async function searchOpportunities(
  request: SearchRequest,
  scope: SearchScope,
  limit: number,
): Promise<OpportunitySummary[]> {
  if (!request.shouldSearch) return []

  const matches = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .innerJoin(interests, eq(interests.id, opportunities.interestId))
    .leftJoin(communities, eq(communities.id, opportunities.communityId))
    .where(
      and(
        isNull(opportunities.removedAt),
        // Placeless opportunities are national listings and stay visible.
        scope.placeIds.length > 0
          ? or(
              inArray(opportunities.placeId, scope.placeIds),
              isNull(opportunities.placeId),
            )
          : isNull(opportunities.placeId),
        matchesAllTerms(request.terms, [
          opportunities.title,
          opportunities.description,
          opportunities.kind,
          interests.label,
          communities.name,
        ]),
      ),
    )
    .limit(MATCH_SCAN_LIMIT)

  if (matches.length === 0) return []

  const hydrated = await listOpportunities({ ids: matches.map((row) => row.id) })

  const candidates = hydrated.map((opportunity) => ({
    opportunity,
    id: opportunity.id,
    title: opportunity.title,
    secondary: opportunity.description,
    taxonomy: [
      opportunity.kind,
      opportunity.interest.label,
      opportunity.community?.name ?? null,
    ],
    // A deadline is what makes an opportunity timely.
    timelyAt: opportunity.deadline,
  }))

  return rankSearchResults(candidates, request.terms, {
    now: scope.now,
    limit,
  }).map((entry) => entry.opportunity)
}

/* ------------------------------------------------------------------------- *
 * Campus updates
 * ------------------------------------------------------------------------- */

/**
 * A community announcement, reduced to what a result card renders.
 *
 * `authorName` and nothing else about the author. A search result set is the
 * last place an email address should be able to surface, so the projection
 * cannot carry one rather than relying on every caller to remember.
 */
export type UpdateSearchResult = {
  id: string
  title: string
  excerpt: string
  createdAt: string
  community: { slug: string; name: string; verification: CommunitySummary["verification"] }
  authorName: string | null
  event: { slug: string; title: string } | null
  href: string
}

/** Longest body text a result card shows. The card also clamps visually. */
const EXCERPT_LENGTH = 220

function excerptOf(body: string): string {
  const collapsed = body.replace(/\s+/g, " ").trim()
  if (collapsed.length <= EXCERPT_LENGTH) return collapsed
  return `${collapsed.slice(0, EXCERPT_LENGTH).trimEnd()}\u2026`
}

/**
 * Campus updates matching a query.
 *
 * One query with three joins resolves the community, the author's display name
 * and any linked event. Fetching those per row would be the textbook N+1, and
 * this is the one category with no existing service to borrow a projection from,
 * so the join lives here.
 *
 * Removed posts are never returned. Moderation removes rather than deletes
 * precisely so the decision stays reviewable, which would be pointless if the
 * removed text remained findable through search.
 */
export async function searchPosts(
  request: SearchRequest,
  scope: SearchScope,
  limit: number,
): Promise<UpdateSearchResult[]> {
  if (!request.shouldSearch) return []

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      createdAt: posts.createdAt,
      communitySlug: communities.slug,
      communityName: communities.name,
      communityVerification: communities.verification,
      authorName: users.name,
      eventSlug: events.slug,
      eventTitle: events.title,
    })
    .from(posts)
    .innerJoin(communities, eq(communities.id, posts.communityId))
    .leftJoin(users, eq(users.id, posts.authorId))
    .leftJoin(events, eq(events.id, posts.eventId))
    .where(
      and(
        isNull(posts.removedAt),
        isNull(communities.archivedAt),
        visiblePlaces(scope.placeIds),
        matchesAllTerms(request.terms, [
          posts.title,
          posts.body,
          communities.name,
        ]),
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit(MATCH_SCAN_LIMIT)

  const candidates = rows.map((row) => ({
    update: {
      id: row.id,
      title: row.title,
      excerpt: excerptOf(row.body),
      createdAt: row.createdAt.toISOString(),
      community: {
        slug: row.communitySlug,
        name: row.communityName,
        verification: row.communityVerification,
      },
      authorName: row.authorName ?? null,
      event:
        row.eventSlug && row.eventTitle
          ? { slug: row.eventSlug, title: row.eventTitle }
          : null,
      href: `/communities/${row.communitySlug}`,
    } satisfies UpdateSearchResult,
    id: row.id,
    title: row.title,
    secondary: row.body,
    taxonomy: [row.communityName],
    timelyAt: row.createdAt.toISOString(),
  }))

  return rankSearchResults(candidates, request.terms, {
    now: scope.now,
    limit,
  }).map((entry) => entry.update)
}

/* ------------------------------------------------------------------------- *
 * Everything
 * ------------------------------------------------------------------------- */

export type SearchResults = {
  events: EventSummary[]
  communities: CommunitySummary[]
  opportunities: OpportunitySummary[]
  updates: UpdateSearchResult[]
  /** Result counts after ranking and limiting. Rendered beside the tabs. */
  counts: {
    events: number
    communities: number
    opportunities: number
    updates: number
    total: number
  }
  /** The viewer's saved ids, so cards can render their state without asking. */
  saved: {
    events: Set<string>
    communities: Set<string>
    opportunities: Set<string>
  }
}

const EMPTY_RESULTS: SearchResults = {
  events: [],
  communities: [],
  opportunities: [],
  updates: [],
  counts: { events: 0, communities: 0, opportunities: 0, updates: 0, total: 0 },
  saved: { events: new Set(), communities: new Set(), opportunities: new Set() },
}

/**
 * Run the search the request describes.
 *
 * The active tab decides both the limits and the work: a request for the Events
 * tab does not search communities, so switching tabs costs one category's
 * queries rather than four. The All tab takes five of each, which is the point
 * of the per-category cap - forty events would bury the single opportunity that
 * was the best answer on the page.
 *
 * Every category runs concurrently, including the saved-id lookups, so the page
 * waits on the slowest query rather than the sum of them.
 */
export async function searchAll(
  request: SearchRequest,
  scope: SearchScope,
): Promise<SearchResults> {
  if (!request.shouldSearch) return EMPTY_RESULTS

  const wants = (tab: "EVENTS" | "COMMUNITIES" | "OPPORTUNITIES" | "UPDATES") =>
    request.tab === "ALL" || request.tab === tab

  const limit = request.tab === "ALL" ? ALL_TAB_LIMIT : CATEGORY_TAB_LIMIT

  const [
    eventResults,
    communityResults,
    opportunityResults,
    updateResults,
    savedEvents,
    savedCommunities,
    savedOpportunities,
  ] = await Promise.all([
    wants("EVENTS") ? searchEvents(request, scope, limit) : Promise.resolve([]),
    wants("COMMUNITIES")
      ? searchCommunities(request, scope, limit)
      : Promise.resolve([]),
    wants("OPPORTUNITIES")
      ? searchOpportunities(request, scope, limit)
      : Promise.resolve([]),
    wants("UPDATES") ? searchPosts(request, scope, limit) : Promise.resolve([]),
    savedTargetIds({ viewerId: scope.viewerId, targetKind: "EVENT" }),
    savedTargetIds({ viewerId: scope.viewerId, targetKind: "COMMUNITY" }),
    savedTargetIds({ viewerId: scope.viewerId, targetKind: "OPPORTUNITY" }),
  ])

  return {
    events: eventResults,
    communities: communityResults,
    opportunities: opportunityResults,
    updates: updateResults,
    counts: {
      events: eventResults.length,
      communities: communityResults.length,
      opportunities: opportunityResults.length,
      updates: updateResults.length,
      total:
        eventResults.length +
        communityResults.length +
        opportunityResults.length +
        updateResults.length,
    },
    saved: {
      events: savedEvents,
      communities: savedCommunities,
      opportunities: savedOpportunities,
    },
  }
}
