import { bucketLabel, groupByBucket } from "@/lib/domain/time-buckets"
import {
  firstNameOf,
  greetingFor,
  rankCommunitySuggestions,
  rankForYou,
  viewerUpcoming,
  type FeedSignals,
  type GreetingPhrase,
} from "@/lib/domain/feed"
import { rankTrending } from "@/lib/domain/trending"
import type {
  CommunitySummary,
  EventSummary,
  EventTimeBucket,
} from "@/lib/domain/types"
import { listCommunitiesForViewer } from "@/lib/services/communities"
import { listEvents } from "@/lib/services/events"
import { getUserInterests } from "@/lib/services/interests"
import {
  listOpportunities,
  type OpportunitySummary,
} from "@/lib/services/opportunities"
import { listRecentPosts, type PostSummary } from "@/lib/services/posts"
import { savedTargetIds } from "@/lib/services/saved"

/**
 * The read model behind Home and Explore.
 *
 * This exists so the pages contain layout and nothing else. Both screens need
 * overlapping slices of the same six datasets, and the alternative - each
 * section fetching what it needs - is how a feed with eight sections becomes
 * forty queries and a page that renders in stages.
 *
 * The shape of the work is deliberate:
 *
 * - **Six queries, once, in parallel.** `Promise.all` rather than sequential
 *   awaits, because none of them depends on another.
 * - **Ranked in memory afterwards.** Every ranking function is pure and lives in
 *   `lib/domain`, so ordering can be tested without a database.
 * - **The viewer comes from the caller, which got it from `auth()`.** No
 *   function here accepts an id from a request payload.
 * - **Only projections cross the boundary.** Names, never email addresses; no
 *   password hashes; no raw rows.
 */

export type HomeFeed = {
  greeting: GreetingPhrase
  firstName: string
  /** ISO string used for every relative time on the page, so they agree. */
  now: string
  /** The student's own commitments, soonest first. */
  yourUpcoming: EventSummary[]
  forYou: EventSummary[]
  trending: EventSummary[]
  happeningSoon: Array<{
    bucket: EventTimeBucket
    label: string
    events: EventSummary[]
  }>
  suggestedCommunities: CommunitySummary[]
  opportunities: OpportunitySummary[]
  updates: PostSummary[]
  /** Which cards should render as already saved. */
  savedEventIds: string[]
  savedCommunityIds: string[]
  savedOpportunityIds: string[]
  /**
   * Real counts from the rows that were loaded. Nothing on the page is a
   * hardcoded number.
   */
  counts: {
    upcomingEvents: number
    joinedCommunities: number
    openOpportunities: number
    savedItems: number
  }
}

/** Membership states that mean the student is actually inside a community. */
const INSIDE = ["MEMBER", "MODERATOR", "OWNER"] as const

function isInside(community: CommunitySummary): boolean {
  return (INSIDE as readonly string[]).includes(community.viewerMembership)
}

/**
 * How many events to pull before ranking.
 *
 * The whole published list is small enough to rank in memory at demo scale, and
 * a limit here would silently truncate the input to trending - producing a
 * "trending" section that only ever considers the soonest N events, which is a
 * subtly wrong answer rather than a slower one.
 */
const COMMUNITY_SAMPLE = 60
const OPPORTUNITY_SAMPLE = 12
const UPDATE_SAMPLE = 8

export async function loadHomeFeed(args: {
  viewerId: string
  viewerName: string | null
  now?: Date
}): Promise<HomeFeed> {
  const now = args.now ?? new Date()
  const nowIso = now.toISOString()

  const [
    events,
    communities,
    opportunities,
    updates,
    interests,
    savedEvents,
    savedCommunities,
    savedOpportunities,
  ] = await Promise.all([
    listEvents({ viewerId: args.viewerId, now }),
    listCommunitiesForViewer({
      viewerId: args.viewerId,
      limit: COMMUNITY_SAMPLE,
    }),
    listOpportunities({ limit: OPPORTUNITY_SAMPLE }),
    listRecentPosts({ limit: UPDATE_SAMPLE }),
    getUserInterests(args.viewerId),
    savedTargetIds({ viewerId: args.viewerId, targetKind: "EVENT" }),
    savedTargetIds({ viewerId: args.viewerId, targetKind: "COMMUNITY" }),
    savedTargetIds({ viewerId: args.viewerId, targetKind: "OPPORTUNITY" }),
  ])

  const signals: FeedSignals = {
    viewerInterestSlugs: interests.map((interest) => interest.slug),
    joinedCommunityIds: communities.filter(isInside).map((c) => c.id),
    savedCommunityIds: [...savedCommunities],
    savedEventIds: [...savedEvents],
  }

  const yourUpcoming = viewerUpcoming(events, nowIso)

  /**
   * "Happening soon" excludes what the student already holds a place in, so it
   * does not simply repeat "Your upcoming events" two sections later.
   */
  const soonCandidates = events.filter(
    (event) => !yourUpcoming.some((held) => held.id === event.id),
  )

  return {
    greeting: greetingFor(nowIso),
    firstName: firstNameOf(args.viewerName),
    now: nowIso,
    yourUpcoming,
    forYou: rankForYou(events, signals, nowIso),
    trending: rankTrending(events, {
      now: nowIso,
      viewerInterestSlugs: signals.viewerInterestSlugs,
    }),
    happeningSoon: groupByBucket(soonCandidates, nowIso, [
      "TODAY",
      "TOMORROW",
      "THIS_WEEKEND",
    ]).map((group) => ({
      bucket: group.bucket,
      label: bucketLabel[group.bucket],
      events: group.events.slice(0, 3),
    })),
    suggestedCommunities: rankCommunitySuggestions(communities, signals),
    opportunities: opportunities.slice(0, 3),
    updates: updates.slice(0, 4),
    savedEventIds: [...savedEvents],
    savedCommunityIds: [...savedCommunities],
    savedOpportunityIds: [...savedOpportunities],
    counts: {
      upcomingEvents: events.filter(
        (event) => Date.parse(event.endsAt) >= Date.parse(nowIso),
      ).length,
      joinedCommunities: signals.joinedCommunityIds.length,
      openOpportunities: opportunities.length,
      savedItems:
        savedEvents.size + savedCommunities.size + savedOpportunities.size,
    },
  }
}

export type ExploreData = {
  now: string
  events: EventSummary[]
  communities: CommunitySummary[]
  opportunities: OpportunitySummary[]
  updates: PostSummary[]
  savedEventIds: string[]
  savedCommunityIds: string[]
  savedOpportunityIds: string[]
}

/**
 * Everything Explore can show, unfiltered.
 *
 * Filtering happens in `lib/domain/explore.ts` against this result rather than
 * in SQL. At demo scale that is the right trade: one query set serves every tab
 * and every chip combination, so switching a filter is instant and the counts
 * beside the chips cannot disagree with the list beneath them. If the dataset
 * outgrows that, the filters move into the where clause - the domain functions
 * stay as the specification of what each one means.
 */
export async function loadExploreData(args: {
  viewerId: string
  now?: Date
}): Promise<ExploreData> {
  const now = args.now ?? new Date()

  const [
    events,
    communities,
    opportunities,
    updates,
    savedEvents,
    savedCommunities,
    savedOpportunities,
  ] = await Promise.all([
    listEvents({ viewerId: args.viewerId, now }),
    listCommunitiesForViewer({ viewerId: args.viewerId, limit: 60 }),
    listOpportunities({ limit: 24 }),
    listRecentPosts({ limit: 15 }),
    savedTargetIds({ viewerId: args.viewerId, targetKind: "EVENT" }),
    savedTargetIds({ viewerId: args.viewerId, targetKind: "COMMUNITY" }),
    savedTargetIds({ viewerId: args.viewerId, targetKind: "OPPORTUNITY" }),
  ])

  return {
    now: now.toISOString(),
    events,
    communities,
    opportunities,
    updates,
    savedEventIds: [...savedEvents],
    savedCommunityIds: [...savedCommunities],
    savedOpportunityIds: [...savedOpportunities],
  }
}
