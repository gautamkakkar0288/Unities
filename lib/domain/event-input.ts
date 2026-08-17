/**
 * Turning what an organiser typed into what the service stores, and back.
 *
 * These live in the domain layer rather than inside the form because they are
 * lossy conversions with real failure modes - a browser gives you
 * "2026-05-10T10:00" with no timezone, and a fee typed in rupees has to become
 * an integer in paise without picking up a floating-point tail. Both are worth
 * testing without a browser.
 *
 * The reverse direction exists for the same reason: an edit form opens with the
 * event already in it, and a stored instant rendered in the wrong zone would
 * invite an organiser to "correct" a time that was right.
 */

/**
 * A `datetime-local` value to an absolute instant.
 *
 * The input has no timezone, so it is read in the browser's zone - which for
 * this platform is the organiser standing on the campus the event happens on.
 * Converting here rather than on the server matters: the server runs in UTC,
 * and parsing "10:00" there would move every event five and a half hours.
 */
export function localDateTimeToIso(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Date.parse(trimmed)
  if (Number.isNaN(parsed)) return null

  return new Date(parsed).toISOString()
}

/**
 * An absolute instant back to a `datetime-local` value.
 *
 * The inverse of `localDateTimeToIso`, and it has to be built from the local
 * getters rather than by slicing `toISOString()`. Slicing the ISO string would
 * put UTC into a control the browser reads as local time, so an event at 10:00
 * in Chandigarh would open its own edit form showing 04:30.
 *
 * Returns an empty string for a missing or unreadable value, because that is
 * what an empty `datetime-local` input holds - and both of the optional times
 * here mean something specific when blank.
 */
export function isoToLocalDateTime(value: string | null | undefined): string {
  if (!value) return ""

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return ""

  const date = new Date(parsed)
  const pad = (part: number) => String(part).padStart(2, "0")

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/**
 * An optional whole number, where empty means "not set".
 *
 * Capacity uses this: blank is unlimited, which is a different thing from zero.
 */
export function wholeNumberOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed < 0) return null

  return parsed
}

/**
 * An optional whole number back to what the organiser would have typed.
 *
 * Null renders as blank rather than "0", because the two mean opposite things
 * here: no limit at all, versus an event nobody can attend.
 */
export function wholeNumberToString(value: number | null | undefined): string {
  if (value === null || value === undefined) return ""
  if (!Number.isFinite(value)) return ""

  return String(value)
}

/**
 * Rupees as typed, to integer paise.
 *
 * Rounded rather than truncated because `12.35 * 100` is 1234.9999999999998 in
 * floating point, and truncating would quietly charge a paise less on prices
 * that look exact.
 */
export function rupeesToPaise(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const amount = Number(trimmed)
  if (!Number.isFinite(amount) || amount < 0) return null

  return Math.round(amount * 100)
}

/**
 * Integer paise back to rupees as an organiser would type them.
 *
 * A whole amount comes back whole - "150", not "150.00" - because the second
 * reads like a system that thinks in cents rather than a fee somebody wrote on
 * a poster. Anything with paise in it keeps both digits.
 *
 * Null is free, and renders blank.
 */
export function paiseToRupees(value: number | null | undefined): string {
  if (value === null || value === undefined) return ""
  if (!Number.isFinite(value) || value < 0) return ""

  const rupees = value / 100

  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2)
}
