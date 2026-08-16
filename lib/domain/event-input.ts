/**
 * Turning what an organiser typed into what the service stores.
 *
 * These live in the domain layer rather than inside the form because they are
 * lossy conversions with real failure modes - a browser gives you
 * "2026-05-10T10:00" with no timezone, and a fee typed in rupees has to become
 * an integer in paise without picking up a floating-point tail. Both are worth
 * testing without a browser.
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
