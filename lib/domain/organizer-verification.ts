import type {
  UserRole,
  VerificationRequestStatus,
  VerificationState,
} from "@/lib/db/schema"

/**
 * The rules of organiser verification, with no I/O.
 *
 * These are here rather than inside the service because two of them are
 * decisions the UI also has to know: how much evidence is enough to enable the
 * submit button, and what the request being approved will actually do to the
 * person who made it. A rule duplicated between a form and a service is a rule
 * that eventually disagrees with itself.
 */

/**
 * Enough evidence to judge. Short enough that a real club with a registration
 * number and a faculty contact clears it in one sentence, long enough that
 * "please verify us" does not.
 */
export const MINIMUM_EVIDENCE_LENGTH = 40

/** A bound, so the column cannot be used as free storage. */
export const MAXIMUM_EVIDENCE_LENGTH = 2000

/**
 * What the requester's role becomes when their club is verified.
 *
 * A student who runs a recognised club is an organiser, which is the role the
 * event-creation rules in Phase 3 will check. Anything above `STUDENT` is left
 * exactly as it is: this function grants, it never takes away, so verifying a
 * club run by a university admin cannot quietly demote them to organiser.
 */
export function roleAfterVerification(current: UserRole): UserRole {
  return current === "STUDENT" ? "ORGANIZER" : current
}

/**
 * What the decision does to the community's verification state.
 *
 * Rejection returns the community to `UNVERIFIED` rather than leaving it
 * `PENDING`, so the badge stops claiming a review is in progress when it is
 * over. The request row keeps the history; the column only ever describes now.
 */
export function communityVerificationForDecision(
  decision: Exclude<VerificationRequestStatus, "PENDING">,
): VerificationState {
  return decision === "APPROVED" ? "VERIFIED" : "UNVERIFIED"
}
