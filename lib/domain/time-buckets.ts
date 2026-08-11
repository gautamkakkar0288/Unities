import type { EventSummary, EventTimeBucket, Timestamp } from "@/lib/domain/types"

/**
 * "Today", "Tomorrow", "This weekend" - in campus time, not the server's.
 *
 * Two things make this harder than it looks:
 *
 * 1. **Calendar days, not elapsed hours.** An event at 11pm tonight and one at
 *    1am tomorrow are two hours apart but belong in different buckets, because
 *    a student reads "today" as a date, not a 24-hour window.
 * 2. **One fixed timezone.** Buckets are computed in `Asia/Kolkata` regardless
 *    of where the server runs, so a deploy in a US region cannot shift what
 *    "today" means for a student in Punjab. When the platform reaches a second
 *    timezone this becomes a per-university setting; until then, pinning it is
 *    correct and a UTC-based implementation would be silently wrong for five
 *    and a half hours of every day.
 *
 * Implemented with offset arithmetic rather than `Intl` or a date library:
 * `Date.parse` handles the offset in the ISO string, and shifting the epoch
 * gives the IST calendar day with no dependency and no locale surprises.
 */

const MS_PER_MINUTE = 60_000
const MS_PER_DAY = 86_400_000

/** IST is UTC+05:30 and has no daylight saving, which is why this is safe. */
const IST_OFFSET_MINUTES = 330

/** Days counted from the epoch, in IST. */
function istDayNumber(iso: Timestamp): number {
  const epoch = Date.parse(iso)
  if (Number.isNaN(epoch)) {
    throw new Error(`Invalid timestamp: ${iso}`)
  }
  return Math.floor((epoch + IST_OFFSET_MINUTES * MS_PER_MINUTE) / MS_PER_DAY)
}

/** 0 is Sunday, 6 is Saturday, in IST. */
function istWeekday(iso: Timestamp): number {
  // 1970-01-01 was a Thursday, which is index 4.
  return (istDayNumber(iso) + 4) % 7
}

function isWeekend(iso: Timestamp): boolean {
  const day = istWeekday(iso)
  return day === 0 || day === 6
}

export function bucketFor(
  event: Pick<EventSummary, "startsAt" | "endsAt">,
  now: Timestamp,
): EventTimeBucket {
  if (Date.parse(event.endsAt) < Date.parse(now)) return "PAST"

  const daysAway = istDayNumber(event.startsAt) - istDayNumber(now)

  // A past-dated start with a future end is in progress, so it is still today.
  if (daysAway <= 0) return "TODAY"
  if (daysAway === 1) return "TOMORROW"

  // Weekend wins over "this week" because it is the more useful label - a
  // student plans around Saturday, not around "in four days".
  if (daysAway <= 7 && isWeekend(event.startsAt)) return "THIS_WEEKEND"
  if (daysAway <= 7) return "THIS_WEEK"
  return "LATER"
}

export const bucketLabel: Record<EventTimeBucket, string> = {
  PAST: "Already happened",
  TODAY: "Today",
  TOMORROW: "Tomorrow",
  THIS_WEEKEND: "This weekend",
  THIS_WEEK: "This week",
  LATER: "Later",
}

/** Display order for the "Happening soon" section. */
export const bucketOrder: EventTimeBucket[] = [
  "TODAY",
  "TOMORROW",
  "THIS_WEEKEND",
  "THIS_WEEK",
  "LATER",
]

/**
 * Group upcoming events into buckets, dropping empty ones.
 *
 * `PAST` is excluded here on purpose - "Happening soon" is a planning surface,
 * and past events belong in their own section on the events screen.
 */
export function groupByBucket(
  events: EventSummary[],
  now: Timestamp,
  buckets: EventTimeBucket[] = bucketOrder,
): Array<{ bucket: EventTimeBucket; events: EventSummary[] }> {
  const withBuckets = events.map((event) => ({
    event,
    bucket: bucketFor(event, now),
  }))

  return buckets
    .map((bucket) => ({
      bucket,
      events: withBuckets
        .filter((item) => item.bucket === bucket)
        .map((item) => item.event)
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)),
    }))
    .filter((group) => group.events.length > 0)
}

export function isUpcoming(
  event: Pick<EventSummary, "startsAt" | "endsAt">,
  now: Timestamp,
): boolean {
  return bucketFor(event, now) !== "PAST"
}
