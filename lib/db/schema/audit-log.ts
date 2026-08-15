import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { auditTargetKinds } from "./enums"
import { users } from "./users"

/**
 * Every privileged action, recorded (domain `AuditEntry`).
 *
 * Moderation without an audit trail is indistinguishable from abuse of
 * moderation. The people this protects are both the student who was refused and
 * the admin who refused them: one can ask why, and the other can show what they
 * actually did rather than what someone remembers them doing.
 *
 * Written in the same transaction as the change it describes, never afterwards.
 * An audit row that can fail independently of the action is worse than none,
 * because the gaps are silent and nobody knows which entries are missing.
 *
 * `actorId` is `set null` rather than `cascade`: deleting an account must not
 * be a way to erase what that account did. `summary` carries the human sentence
 * so the log stays readable after the target row is gone.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /**
     * A dotted action name such as `verification.approved`, deliberately text
     * rather than an enum. Every feature from here to launch adds actions, and
     * an enum column would mean a migration for each one - so the pressure
     * would be to reuse an inaccurate existing value instead. The vocabulary is
     * kept honest in lib/domain/audit.ts, where it can be typed without a
     * schema change.
     */
    action: text("action").notNull(),
    targetKind: text("target_kind", { enum: auditTargetKinds }).notNull(),
    /** Not a foreign key: the target may be any of six tables. */
    targetId: text("target_id").notNull(),
    /** The sentence a human reads, written at the time of the action. */
    summary: text("summary").notNull().default(""),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    /** The log itself, newest first. */
    index("audit_log_created_idx").on(table.createdAt),
    /** "What has happened to this community?" */
    index("audit_log_target_idx").on(table.targetKind, table.targetId),
    /** "What has this admin been doing?" */
    index("audit_log_actor_idx").on(table.actorId),
  ],
)
