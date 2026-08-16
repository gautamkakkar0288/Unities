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
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]
