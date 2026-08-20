import { bucketFor, isUpcoming } from "@/lib/domain/time-buckets"
import type { EventKind, EventSummary, Timestamp } from "@/lib/domain/types"

/**
 * Explore's tabs and filters, as data rather than as conditionals in a page.
 *
 * Two rules shaped this file.
 *
 * **Only filters the schema can actually answer.** The brief asked for
 * "Technical", "Cultural" and "Sports" alongside "Workshops" and "Hackathons".
 * The first three are interest taxonomy, not event columns, and the last two are
 * `EventKind` values - mixing them into one row of chips would imply they are
 * the same kind of thing and would need a filter the events table cannot
 * express. So kind chips come from the real enum, and interest filtering is left
 * to the interest pages that already exist. A filter that silently matches
 * nothing is worse than an absent one.
 *
 * **Everything survives a reload.** Every choice is a URL parameter, parsed
 * here with an explicit fallback, so a shared link reproduces the screen and the
 * back button behaves. Unknown or hostile values fall back rather than throw;
 * this input arrives straight from a query string.
 */

export const exploreTabs = [
  "EVENTS",
  "COMMUNITIES",
  "OPPORTUNITIES",
  "UPDATES",
] as const

export type ExploreTab = (typeof exploreTabs)[number]

export const exploreTabLabel: Record<ExploreTab, string> = {
  EVENTS: "Events",
  COMMUNITIES: "Communities",
  OPPORTUNITIES: "Opportunities",
  UPDATES: "Updates",
}

/** The lowercase form used in `?type=`, so the URL reads like a URL. */
export const exploreTabSlug: Record<ExploreTab, string> = {
  EVENTS: "events",
  COMMUNITIES: "communities",
  OPPORTUNITIES: "opportunities",
  UPDATES: "updates",
}

export function readExploreTab(raw: string | undefined): ExploreTab {
  const candidate = (raw ?? "").trim().toUpperCase()
  return (exploreTabs as readonly string[]).includes(candidate)
    ? (candidate as ExploreTab)
    : "EVENTS"
}

export const eventWhenFilters = [
  "UPCOMING",
  "TODAY",
  "THIS_WEEK",
] as const

export type EventWhenFilter = (typeof eventWhenFilters)[number]

export const eventWhenLabel: Record<EventWhenFilter, string> = {
  UPCOMING: "All upcoming",
  TODAY: "Today",
  THIS_WEEK: "This week",
}

export function readWhenFilter(raw: string | undefined): EventWhenFilter {
  const candidate = (raw ?? "").trim().toUpperCase()
  return (eventWhenFilters as readonly string[]).includes(candidate)
    ? (candidate as EventWhenFilter)
    : "UPCOMING"
}

/**
 * Kind chips. Trips are omitted deliberately - the events service refuses to
 * create them, so offering the filter would advertise a category that cannot
 * have any rows.
 */
export const filterableEventKinds = [
  "WORKSHOP",
  "TALK",
  "TOURNAMENT",
  "PERFORMANCE",
  "MEETUP",
  "DRIVE",
] as const satisfies readonly EventKind[]

export const eventKindLabel: Record<
  (typeof filterableEventKinds)[number],
  string
> = {
  WORKSHOP: "Workshops",
  TALK: "Talks",
  TOURNAMENT: "Tournaments",
  PERFORMANCE: "Performances",
  MEETUP: "Meetups",
  DRIVE: "Drives",
}

export function readEventKind(raw: string | undefined): EventKind | null {
  const candidate = (raw ?? "").trim().toUpperCase()
  return (filterableEventKinds as readonly string[]).includes(candidate)
    ? (candidate as EventKind)
    : null
}

export type EventFilters = {
  when: EventWhenFilter
  /** Free means no fee at all, including an explicit zero. */
  free: boolean
  /** Online includes hybrid: a student who cannot travel can still attend. */
  online: boolean
  kind: EventKind | null
}

export function readEventFilters(params: {
  when?: string
  free?: string
  online?: string
  kind?: string
}): EventFilters {
  return {
    when: readWhenFilter(params.when),
    free: params.free === "1",
    online: params.online === "1",
    kind: readEventKind(params.kind),
  }
}

export function hasActiveEventFilters(filters: EventFilters): boolean {
  return (
    filters.when !== "UPCOMING" ||
    filters.free ||
    filters.online ||
    filters.kind !== null
  )
}

const THIS_WEEK_BUCKETS = [
  "TODAY",
  "TOMORROW",
  "THIS_WEEKEND",
  "THIS_WEEK",
] as const

/**
 * Apply the filters, in the order a student would read them.
 *
 * Past events are dropped first in every case. Explore is a discovery surface,
 * and "what can I still go to" is the only question it is answering.
 */
export function applyEventFilters(
  events: EventSummary[],
  filters: EventFilters,
  now: Timestamp,
): EventSummary[] {
  return events.filter((event) => {
    if (!isUpcoming(event, now)) return false

    if (filters.when === "TODAY" && bucketFor(event, now) !== "TODAY") {
      return false
    }

    if (
      filters.when === "THIS_WEEK" &&
      !(THIS_WEEK_BUCKETS as readonly string[]).includes(bucketFor(event, now))
    ) {
      return false
    }

    if (
      filters.free &&
      !(event.feeInPaise === null || event.feeInPaise === 0)
    ) {
      return false
    }

    if (filters.online && event.mode === "IN_PERSON") return false

    if (filters.kind && event.kind !== filters.kind) return false

    return true
  })
}

/**
 * Free-text narrowing over rows the page already loaded.
 *
 * Not a search engine, and deliberately not the beginning of one. The global
 * search page is a later phase with its own service; adding a second query path
 * here would be the second search architecture that phase then has to unpick.
 * This is a substring match over fields already in memory, which is honest about
 * what it is and costs no extra query.
 */
export function matchesQuery(fields: Array<string | null>, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true

  return fields.some((field) => (field ?? "").toLowerCase().includes(needle))
}
