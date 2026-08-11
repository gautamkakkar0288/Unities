/**
 * Interest taxonomy rules that both the client and the server must agree on.
 *
 * These live in the domain layer because the onboarding picker enforces the
 * minimum in the browser and the service enforces it again on the server. Two
 * copies of the number is how a form ends up accepting three interests while
 * the endpoint demands four.
 */

/**
 * How many interests a student must pick during onboarding.
 *
 * Fewer than three and recommendations have nothing to work with; more than
 * three and onboarding starts to feel like a form. This is a product number,
 * so it is named rather than inlined.
 */
export const MINIMUM_INTERESTS = 3

/**
 * Collapse a suggested interest label to a comparison key.
 *
 * "Padel", "padel", " PADEL ", and "Padels" are one request. Without this the
 * review queue fills with the same word in five casings and the reviewer cannot
 * see that forty students asked for the same thing - the demand signal, which
 * is the entire point of collecting suggestions, is destroyed by punctuation.
 *
 * The plural rule deliberately stops short of a stemmer. Two guards keep it
 * honest: words of three characters or fewer are left alone, and words ending
 * in a double s are left alone. Without the second guard "Chess" becomes
 * "ches" and - more damagingly - the taxonomy's own "Fitness" becomes
 * "fitnes", so a student suggesting "Fitness" would not match the interest that
 * already exists. Anything more ambitious than this belongs in a real stemming
 * library, not in a hand-rolled regex.
 */
export function normaliseInterestLabel(label: string): string {
  const cleaned = label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word.length > 3 && word.endsWith("s") && !word.endsWith("ss")
        ? word.slice(0, -1)
        : word,
    )

  return cleaned.join(" ")
}
