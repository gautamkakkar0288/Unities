import { isUpcoming } from "@/lib/domain/time-buckets"
import type {
  CommunitySummary,
  EventSummary,
  Timestamp,
} from "@/lib/domain/types"

/**
 * What the home feed decides to show, and why.
 *
 * All of it is pure functions over projections the services already return.
 * That is not architectural neatness for its own sake: ranking is the part of a
 * feed most likely to be wrong, and the only way to find out it is wrong is to
 * be able to run it against fixed inputs. Ranking written inside a server
 * component can only be tested by rendering a page against a database.
 *
 * There is no model here and no scoring service to call. "Personalised" means
 * four facts the student already gave us - their interests, the communities they
 * joined, what they saved, what they registered for - combined with fixed
 * weights. Deterministic, explainable, and the same on every render, which is
 * what makes a demo trustworthy: the ordering can be justified out loud.
 */

const MS_PER_MINUTE = 60_000
const MS_PER_DAY = 86_400_000

/**
 * IST is UTC+05:30 with no daylight saving. Duplicated from `time-buckets.ts`
 * rather than exported from it, because that module deliberately exposes
 * calendar-day buckets and not clock arithmetic - and "good morning" needs the
 * hour, which is a different question from "is this today".
 */
const IST_OFFSET_MINUTES = 330

/**
 * Everything the ranking knows about the viewer.
 *
 * Ids rather than objects, because the caller already holds the sets and this
 * keeps the domain layer free of any service type.
 */
export type FeedSignals = {
  /** Interest slugs from onboarding. */
  viewerInterestSlugs: string[]
  /** Communities the student is actually inside. */
  joinedCommunityIds: string[]
  /** Communities they bookmarked without joining - real intent, no commitment. */
  savedCommunityIds: string[]
  savedEventIds: string[]
}

export const noSignals: FeedSignals = {
  viewerInterestSlugs: [],
  joinedCommunityIds: [],
  savedCommunityIds: [],
  savedEventIds: [],
}

/**
 * Weights, in one place so they can be argued about in one place.
 *
 * Interest is the strongest signal because it is the only one the student chose
 * explicitly for this purpose. Membership is next: joining a club is a stronger
 * statement than bookmarking one. Imminence is deliberately below both - "soon"
 * is what `Happening soon` is for, and letting it dominate here would make the
 * two sections show the same events in the same order.
 */
const WEIGHT_INTEREST = 0.4
const WEIGHT_JOINED_COMMUNITY = 0.3
const WEIGHT_SAVED_COMMUNITY = 0.2
const WEIGHT_IMMINENCE = 0.22

/** A bookmarked event is already in Saved, so this is a nudge, not a promotion. */
const WEIGHT_SAVED_EVENT = 0.06

/** An event nobody can get into is not a recommendation. */
const WEIGHT_SEATS_AVAILABLE = 0.08

function imminence(event: EventSummary, now: Timestamp): number {
  const daysAway = (Date.parse(event.startsAt) - Date.parse(now)) / MS_PER_DAY
  if (daysAway <= 1) return 1
  if (daysAway <= 3) return 0.8
  if (daysAway <= 7) return 0.55
  if (daysAway <= 14) return 0.3
  return 0.1
}

function hasSeats(event: EventSummary): boolean {
  if (event.capacity === null) return true
  return event.registeredCount < event.capacity
}

/**
 * How relevant one event is to one student, in the range roughly 0 to 1.2.
 *
 * Exported because a score that cannot be inspected cannot be explained, and
 * the tests assert on the ordering it produces rather than on the number.
 */
export function relevanceScore(
  event: EventSummary,
  signals: FeedSignals,
  now: Timestamp,
): number {
  const interestMatch = signals.viewerInterestSlugs.includes(event.interest.slug)
  const joined = signals.joinedCommunityIds.includes(event.community.id)
  const savedCommunity = signals.savedCommunityIds.includes(event.community.id)
  const savedEvent = signals.savedEventIds.includes(event.id)

  return (
    (interestMatch ? WEIGHT_INTEREST : 0) +
    (joined ? WEIGHT_JOINED_COMMUNITY : 0) +
    (savedCommunity ? WEIGHT_SAVED_COMMUNITY : 0) +
    (savedEvent ? WEIGHT_SAVED_EVENT : 0) +
    (hasSeats(event) ? WEIGHT_SEATS_AVAILABLE : 0) +
    WEIGHT_IMMINENCE * imminence(event, now)
  )
}

/**
 * "For you" - upcoming events the student has not already committed to.
 *
 * Anything they hold a place in is excluded rather than down-ranked, because it
 * has its own section: recommending an event back to the person who already
 * registered for it is the clearest possible signal that a feed is not paying
 * attention. Ties break on start time then id, so the order is stable across
 * renders.
 */
export function rankForYou(
  events: EventSummary[],
  signals: FeedSignals,
  now: Timestamp,
  limit = 6,
): EventSummary[] {
  return events
    .filter(
      (event) =>
        isUpcoming(event, now) &&
        event.viewerRegistration !== "REGISTERED" &&
        event.viewerRegistration !== "WAITLISTED",
    )
    .map((event) => ({ event, score: relevanceScore(event, signals, now) }))
    .sort((a, b) => {
      const byScore = b.score - a.score
      if (Math.abs(byScore) > 1e-9) return byScore

      const byStart =
        Date.parse(a.event.startsAt) - Date.parse(b.event.startsAt)
      if (byStart !== 0) return byStart

      return a.event.id.localeCompare(b.event.id)
    })
    .slice(0, limit)
    .map((item) => item.event)
}

/**
 * The student's own upcoming commitments, soonest first.
 *
 * Waitlisted places are included. Somebody holding position 3 for Friday needs
 * to see it in exactly the same way as a confirmed seat - the card already says
 * which it is.
 */
export function viewerUpcoming(
  events: EventSummary[],
  now: Timestamp,
  limit = 3,
): EventSummary[] {
  return events
    .filter(
      (event) =>
        isUpcoming(event, now) &&
        (event.viewerRegistration === "REGISTERED" ||
          event.viewerRegistration === "WAITLISTED"),
    )
    .sort((a, b) => {
      const byStart = Date.parse(a.startsAt) - Date.parse(b.startsAt)
      return byStart !== 0 ? byStart : a.id.localeCompare(b.id)
    })
    .slice(0, limit)
}

const COMMUNITY_WEIGHT_INTEREST = 0.5
const COMMUNITY_WEIGHT_SAVED = 0.2
const COMMUNITY_WEIGHT_SIZE = 0.3
const COMMUNITY_WEIGHT_VERIFIED = 0.05

/** Members at which size stops earning more score. */
const SIZE_SATURATION = 400

function sizeScore(memberCount: number): number {
  if (memberCount <= 0) return 0
  return Math.min(
    1,
    Math.log10(1 + memberCount) / Math.log10(1 + SIZE_SATURATION),
  )
}

/**
 * "Communities you might like" - places the student is not already in.
 *
 * Membership is a filter, not a penalty: a suggestion the student cannot act on
 * wastes the slot. `PENDING` is filtered too, because they have already asked
 * and are waiting on a moderator. `INVITED` survives, since an unaccepted
 * invitation is the most actionable card on the page.
 *
 * Size is on a log scale for the same reason trending uses one - otherwise the
 * four biggest clubs on campus would be the permanent answer for every student,
 * which is a directory, not a recommendation.
 */
export function rankCommunitySuggestions(
  communities: CommunitySummary[],
  signals: FeedSignals,
  limit = 3,
): CommunitySummary[] {
  return communities
    .filter(
      (community) =>
        community.viewerMembership === "NONE" ||
        community.viewerMembership === "INVITED",
    )
    .map((community) => {
      const interestMatch = signals.viewerInterestSlugs.includes(
        community.interest.slug,
      )
      const saved = signals.savedCommunityIds.includes(community.id)

      return {
        community,
        score:
          (interestMatch ? COMMUNITY_WEIGHT_INTEREST : 0) +
          (saved ? COMMUNITY_WEIGHT_SAVED : 0) +
          COMMUNITY_WEIGHT_SIZE * sizeScore(community.memberCount) +
          (community.verification === "VERIFIED"
            ? COMMUNITY_WEIGHT_VERIFIED
            : 0),
      }
    })
    .sort((a, b) => {
      const byScore = b.score - a.score
      if (Math.abs(byScore) > 1e-9) return byScore

      const bySize = b.community.memberCount - a.community.memberCount
      if (bySize !== 0) return bySize

      return a.community.id.localeCompare(b.community.id)
    })
    .slice(0, limit)
    .map((item) => item.community)
}

export type GreetingPhrase = "Good morning" | "Good afternoon" | "Good evening"

/**
 * The greeting, in campus time.
 *
 * Computed from the timestamp the page already has rather than in the browser,
 * so the server-rendered text and the hydrated text agree. Reading the clock in
 * a client component is the classic way to earn a hydration mismatch on a
 * greeting - and "Good evening" flickering to "Good afternoon" is exactly the
 * kind of detail that makes a showcase feel unfinished.
 */
export function greetingFor(now: Timestamp): GreetingPhrase {
  const epoch = Date.parse(now)
  if (Number.isNaN(epoch)) throw new Error(`Invalid timestamp: ${now}`)

  const istMs = epoch + IST_OFFSET_MINUTES * MS_PER_MINUTE
  const hour = Math.floor((istMs % MS_PER_DAY) / (60 * MS_PER_MINUTE))

  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

/**
 * The name to greet somebody by.
 *
 * First word only, and it tolerates the empty and single-name cases rather than
 * indexing blindly - a greeting is the first thing on the page and must never be
 * the thing that throws.
 */
export function firstNameOf(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim()
  if (!trimmed) return "there"
  return trimmed.split(/\s+/)[0] as string
}
