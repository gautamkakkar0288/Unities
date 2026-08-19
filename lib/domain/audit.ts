/**
 * The vocabulary of audited actions.
 *
 * The column is plain text so a new action never needs a migration, which means
 * the only thing stopping `verification.approved` from being written as
 * `verification_approved` in a second place is this object. Typos in an audit
 * log are quiet: nothing fails, the queries just stop finding half the rows.
 *
 * Dotted names so the log can be filtered by prefix later without parsing.
 */
export const AUDIT_ACTIONS = {
  verificationRequested: "verification.requested",
  verificationApproved: "verification.approved",
  verificationRejected: "verification.rejected",
  roleAssigned: "role.assigned",
  /**
   * An organiser changed a published event.
   *
   * Audited for the same reason as a verification decision: students have
   * already committed to the version that was there before, and nothing yet
   * tells them it moved. Until notifications exist this row is the only record
   * that the venue on the poster is no longer the venue in the database.
   */
  eventEdited: "event.edited",
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]
