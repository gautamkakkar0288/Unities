/**
 * University membership rules.
 *
 * Pure by design. Which campus an address belongs to is a database question -
 * `places.email_domain` answers it - but *how you read a domain off an address*
 * and *when a token has gone stale* are rules, and rules that touch the network
 * cannot be tested cheaply or reasoned about in isolation.
 *
 * Nothing here knows the word "Chitkara". That is deliberate and it is the
 * whole architectural point: the launch campus is a row, so admitting a second
 * university is an INSERT rather than a deploy. The moment a domain literal
 * appears in this file, that property is gone.
 */

/**
 * How long a verification link stays good.
 *
 * An hour is long enough to survive a student checking mail on the walk back to
 * their hostel, and short enough that a link sitting in an abandoned inbox is
 * not a standing key to an account.
 */
export const VERIFICATION_TOKEN_TTL_MINUTES = 60

/**
 * The domain part of an address, lowercased, or null if this is not one.
 *
 * Deliberately strict. It rejects anything with more or fewer than two parts,
 * because "a@b@c" and "nodomain" must not quietly become a domain string that
 * then fails to match any place row - a silent miss looks identical to "your
 * university is not on Cirqles yet", which is the wrong thing to tell someone
 * who typed their address wrong.
 */
export function emailDomainOf(email: string): string | null {
  const parts = email.trim().toLowerCase().split("@")
  if (parts.length !== 2) return null

  const [local, domain] = parts
  if (!local || !domain) return null
  // A bare "user@localhost" is not a campus and never will be.
  if (!domain.includes(".")) return null
  if (domain.startsWith(".") || domain.endsWith(".")) return null

  return domain
}

/** When a token minted at `now` stops working. */
export function verificationExpiresAt(now: Date): Date {
  return new Date(now.getTime() + VERIFICATION_TOKEN_TTL_MINUTES * 60_000)
}

/**
 * Has this token expired?
 *
 * Expiry is exclusive: a token is dead at its expiry instant, not after it.
 * The boundary is arbitrary but it has to be decided somewhere, and deciding it
 * here means the service and the tests cannot disagree about it.
 */
export function isVerificationTokenExpired(expires: Date, now: Date): boolean {
  return expires.getTime() <= now.getTime()
}
