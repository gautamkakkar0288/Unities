import type { EventSummary, Timestamp } from "@/lib/domain/types"
import { isUpcoming } from "@/lib/domain/time-buckets"

/**
 * What "Trending this week" means, in one place.
 *
 * Ranking by raw registration count alone would hand the section permanently to
 * whichever event has the largest capacity - a 300-seat open mic would always
 * outrank a 40-seat bootcamp that filled in an hour, even though the bootcamp is
 * the one campus is actually excited about. So the score combines four signals:
 *
 * - **Demand** - how many people signed up, on a log scale so 500 does not
 *   drown out 50.
 * - **Fill** - how much of the capacity is gone. This is what captures "filling
 *   fast" for small events, and it is why a 37/40 bootcamp beats a 91/300 gig.
 * - **Imminence** - soon matters more than eventually. A trending section full
 *   of events three weeks out is a listings page.
 * - **Relevance** - a modest nudge for the student's own interests. Deliberately
 *   modest: trending should show what campus is doing, not become a second
 *   personalised feed. That is what "Recommended for you" is for.
 *
 * The weights are a starting point, not a truth. They are constants here so
 * they can be tuned in one place once there is real engagement data, and the
 * function stays pure so tuning is testable rather than guesswork.
 */

const WEIGHT_DEMAND = 0.35
const WEIGHT_FILL = 0.3
const WEIGHT_IMMINENCE = 0.35

/** Small enough that relevance cannot outrank genuine campus-wide demand. */
const RELEVANCE_BONUS = 0.12

/** "Almost gone" is itself a reason to surface something. */
const SCARCITY_BONUS = 0.08
const SCARCITY_THRESHOLD = 5

/** Registrations at which demand is considered maxed out for scoring. */
const DEMAND_SATURATION = 500

const MS_PER_DAY = 86_400_000

export type TrendingContext = {
  now: Timestamp
  /** Interest slugs the viewer follows. */
  viewerInterestSlugs?: string[]
}

function demandScore(registeredCount: number): number {
  if (registeredCount <= 0) return 0
  const ratio =
    Math.log10(1 + registeredCount) / Math.log10(1 + DEMAND_SATURATION)
  return Math.min(1, ratio)
}

function fillScore(event: EventSummary): number {
  if (event.capacity === null || event.capacity <= 0) {
    // Unlimited capacity cannot fill, so it scores on demand alone. Treating
    // it as 0 would bury every online event; treating it as 1 would make
    // "unlimited" the cheapest way to trend.
    return 0.5
  }
  return Math.min(1, event.registeredCount / event.capacity)
}

function imminenceScore(event: EventSummary, now: Timestamp): number {
  const daysAway = (Date.parse(event.startsAt) - Date.parse(now)) / MS_PER_DAY
  if (daysAway <= 1) return 1
  if (daysAway <= 3) return 0.85
  if (daysAway <= 7) return 0.6
  if (daysAway <= 14) return 0.35
  return 0.15
}

export function scoreEvent(
  event: EventSummary,
  context: TrendingContext,
): number {
  const relevant =
    context.viewerInterestSlugs?.includes(event.interest.slug) ?? false

  const seatsLeft =
    event.capacity === null ? null : event.capacity - event.registeredCount
  const scarce =
    seatsLeft !== null && seatsLeft > 0 && seatsLeft <= SCARCITY_THRESHOLD

  return (
    WEIGHT_DEMAND * demandScore(event.registeredCount) +
    WEIGHT_FILL * fillScore(event) +
    WEIGHT_IMMINENCE * imminenceScore(event, context.now) +
    (relevant ? RELEVANCE_BONUS : 0) +
    (scarce ? SCARCITY_BONUS : 0)
  )
}

/**
 * Rank upcoming events for the trending section.
 *
 * Past events are excluded, not down-ranked. Ties break on the earlier start
 * time, then on id, so the order is stable across renders - a trending list that
 * reshuffles on every request makes the product feel broken.
 */
export function rankTrending(
  events: EventSummary[],
  context: TrendingContext,
  limit = 4,
): EventSummary[] {
  return events
    .filter((event) => isUpcoming(event, context.now))
    .map((event) => ({ event, score: scoreEvent(event, context) }))
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
 * Events matching the viewer's interests that they have not registered for.
 *
 * "Recommended for you" answers a different question from trending, so it is a
 * different function rather than the same one with a flag: relevance is the
 * filter, not a bonus, and anything already registered is removed because
 * recommending what someone has already committed to is noise.
 */
export function recommendFor(
  events: EventSummary[],
  context: TrendingContext,
  limit = 3,
): EventSummary[] {
  const slugs = context.viewerInterestSlugs ?? []

  return events
    .filter(
      (event) =>
        isUpcoming(event, context.now) &&
        event.viewerRegistration === "NONE" &&
        slugs.includes(event.interest.slug),
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .slice(0, limit)
}
