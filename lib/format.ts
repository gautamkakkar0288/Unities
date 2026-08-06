/**
 * Display formatting helpers.
 *
 * Locale and time zone are pinned rather than inferred from the runtime. An
 * `Intl` formatter that resolves differently on the server and the client
 * produces text that does not match during hydration, which React reports as a
 * mismatch and repairs by re-rendering. Pinning removes the whole class of bug,
 * and Cirqles launches at a single Indian university, so the values are also
 * simply correct. When the platform goes multi-region these become per-user
 * preferences read from the profile.
 */

const LOCALE = "en-IN"
const TIME_ZONE = "Asia/Kolkata"

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
})

const dayFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
})

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TIME_ZONE,
})

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, {
  numeric: "auto",
})

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

/** "Fri, 14 Aug" - the shape used on event cards. */
export function formatDay(iso: string): string {
  return dayFormatter.format(new Date(iso))
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

/** "Fri, 14 Aug, 4:00 pm - 7:00 pm", collapsing the date when it repeats. */
export function formatTimeRange(startIso: string, endIso: string): string {
  const sameDay = formatDay(startIso) === formatDay(endIso)
  const start = `${formatDay(startIso)}, ${formatTime(startIso)}`
  return sameDay
    ? `${start} - ${formatTime(endIso)}`
    : `${start} - ${formatDay(endIso)}, ${formatTime(endIso)}`
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

/**
 * Relative time against an explicit `now`.
 *
 * `now` is a required argument rather than `Date.now()` on purpose: a component
 * that reads the clock during render is not deterministic, so the server and
 * client can disagree and the output silently goes stale. The caller decides
 * what "now" means, which also makes this trivially testable.
 */
export function formatRelativeTime(iso: string, now: string): string {
  const deltaMs = new Date(iso).getTime() - new Date(now).getTime()
  const magnitude = Math.abs(deltaMs)

  if (magnitude < MINUTE) return "just now"
  if (magnitude < HOUR) {
    return relativeFormatter.format(Math.round(deltaMs / MINUTE), "minute")
  }
  if (magnitude < DAY) {
    return relativeFormatter.format(Math.round(deltaMs / HOUR), "hour")
  }
  if (magnitude < WEEK) {
    return relativeFormatter.format(Math.round(deltaMs / DAY), "day")
  }
  return formatDate(iso)
}

/** Compact counts, because "1,248 members" is wider than a card allows. */
export function formatCount(value: number): string {
  if (value < 1000) return String(value)
  const thousands = value / 1000
  const rounded = thousands < 10 ? Math.round(thousands * 10) / 10 : Math.round(thousands)
  return `${rounded}k`
}

/** Integer paise to rupees. `null` is free, and free is worth saying loudly. */
export function formatFee(feeInPaise: number | null): string {
  if (feeInPaise === null || feeInPaise === 0) return "Free"
  const rupees = feeInPaise / 100
  return `\u20b9${rupees.toLocaleString(LOCALE, {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/** "12 of 40 seats" / "Full" / "Unlimited". */
export function formatCapacity(
  registeredCount: number,
  capacity: number | null,
): string {
  if (capacity === null) return `${formatCount(registeredCount)} going`
  if (registeredCount >= capacity) return "Full"
  return `${registeredCount} of ${capacity} seats`
}
