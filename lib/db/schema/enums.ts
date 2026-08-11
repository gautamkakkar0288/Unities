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
