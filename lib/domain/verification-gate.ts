/**
 * Where a signed-in account is allowed to be.
 *
 * Four states, checked in a fixed order, expressed as one pure function so the
 * app shell, onboarding, and any later surface cannot disagree about who is let
 * through. The layouts do the redirecting; this decides.
 *
 * The order is the product decision, not an implementation detail:
 *
 *   signed out  ->  verify email  ->  onboarding  ->  allowed
 *
 * Verification deliberately outranks onboarding. Onboarding is the first thing
 * that writes data attributable to a person, so doing it before the address is
 * proven means storing a student's preferences against an account nobody has
 * shown they can receive mail for. Reversing the two would also put the
 * stricter gate later, which is the wrong way round: the cheapest place to stop
 * an account that should not exist is before it has state.
 *
 * `ALLOWED` is a real member rather than the absence of a gate, so a caller
 * that forgets a case fails to compile instead of falling through to "fine".
 */
export const accountGates = [
  "SIGN_IN",
  "VERIFY_EMAIL",
  "ONBOARDING",
  "ALLOWED",
] as const

export type AccountGate = (typeof accountGates)[number]

export type AccountGateInput = {
  signedIn: boolean
  /**
   * Whether the address is confirmed, as the database currently reports it.
   *
   * Never read this from a session token. Sessions are JWTs here, so a token
   * minted before verification keeps claiming `false` until it expires, and a
   * student who verified in another tab would stay locked out of the product
   * they just proved they belong to.
   */
  emailVerified: boolean
  onboarded: boolean
}

export function accountGate(account: AccountGateInput): AccountGate {
  if (!account.signedIn) return "SIGN_IN"
  if (!account.emailVerified) return "VERIFY_EMAIL"
  if (!account.onboarded) return "ONBOARDING"
  return "ALLOWED"
}

/**
 * Where to send an account that is not allowed through yet.
 *
 * `null` means stay put. Returning the destination from the same module that
 * decides the gate keeps the two in step - a new gate cannot be added without
 * answering where it sends people.
 */
export function gateDestination(gate: AccountGate): string | null {
  switch (gate) {
    case "SIGN_IN":
      return "/sign-in"
    case "VERIFY_EMAIL":
      return "/verify-email"
    case "ONBOARDING":
      return "/onboarding"
    case "ALLOWED":
      return null
  }
}
