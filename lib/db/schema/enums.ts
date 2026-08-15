/**
 * Enum vocabularies shared by more than one table.
 *
 * These live in their own module because the alternative - importing
 * `reviewStatuses` from `community-proposals.ts` into `interests.ts`, which
 * `community-proposals.ts` already imports for its interest foreign key -
 * creates a circular module import at runtime. A leaf module with no table
 * definitions cannot participate in a cycle.
 */

/**
 * The lifecycle of anything a human reviews: community proposals and interest
 * suggestions today, verification requests when Phase 13 lands.
 *
 * `MERGED` is distinct from `REJECTED` on purpose. "This already exists as
 * Football" and "no" are different answers, and a student who proposed a
 * duplicate should be sent to the existing community rather than turned away.
 */
export const reviewStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "MERGED",
] as const

export type ReviewStatus = (typeof reviewStatuses)[number]

/** Trust is a product feature (PRD section 3), so it is a column, not a flag. */
export const verificationStates = [
  "UNVERIFIED",
  "PENDING",
  "VERIFIED",
] as const

export type VerificationState = (typeof verificationStates)[number]

/**
 * The lifecycle of an organiser verification request.
 *
 * A deliberate subset of `reviewStatuses` rather than a reuse of it. `MERGED`
 * answers a question a proposal can ask - "this already exists as Football" -
 * and no question a verification request can: a club either proved it is real
 * or it did not. Borrowing the wider vocabulary would put a fourth status on
 * this table that no code path can ever produce, and every future switch over
 * it would still have to handle that impossible case.
 *
 * Matches `VerificationRequest["status"]` in lib/domain/types.ts, which the
 * prototype was written against. parity.test.ts enforces the agreement.
 */
export const verificationRequestStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const

export type VerificationRequestStatus =
  (typeof verificationRequestStatuses)[number]

/**
 * What an audited action was performed on.
 *
 * Shares its vocabulary with `ModerationTargetKind` in the domain model rather
 * than inventing a second list, because the moderation queue and the audit log
 * are two views of the same set of things. Reports arrive in Phase 5 and will
 * point at exactly these kinds; a separate enum here would guarantee they
 * disagree by one member within a month.
 */
export const auditTargetKinds = [
  "POST",
  "COMMENT",
  "EVENT",
  "COMMUNITY",
  "ACTIVITY",
  "USER",
] as const

export type AuditTargetKind = (typeof auditTargetKinds)[number]
