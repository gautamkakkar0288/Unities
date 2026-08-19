import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"

import { auditTargetKinds } from "./enums"
import { users } from "./users"

/**
 * Reports, and the moderation queue they form.
 *
 * Both vocabularies below are the domain's. `lib/domain/moderation.ts` already
 * ranks reasons by severity, already knows which statuses are actionable, and
 * already sorts the queue by severity then age - explicitly never by report
 * count, so a pile-on cannot outrank a single credible harassment report. None
 * of that logic is repeated here; this table only has to be able to store what
 * those rules operate on.
 *
 * `targetKind` is `auditTargetKinds` rather than a parallel list, so a report
 * and the audit entry for acting on it can never disagree about what kind of
 * thing was involved.
 */
export const reportReasons = [
  "SPAM",
  "HARASSMENT",
  "MISINFORMATION",
  "OFF_TOPIC",
  "OTHER",
] as const

export type ReportReasonValue = (typeof reportReasons)[number]

export const moderationStatuses = [
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "DISMISSED",
] as const

export type ModerationStatusValue = (typeof moderationStatuses)[number]

export const reports = pgTable(
  "reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * Set null on delete. A resolved report is a record of a decision, and it
     * has to outlive the account that raised it - including when that account
     * is removed *because* of the decision.
     */
    reporterId: text("reporter_id").references(() => users.id, {
      onDelete: "set null",
    }),
    targetKind: text("target_kind", { enum: auditTargetKinds }).notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason", { enum: reportReasons }).notNull(),
    /** The reporter's own words. Empty is fine; a reason is enough. */
    detail: text("detail").notNull().default(""),
    status: text("status", { enum: moderationStatuses })
      .notNull()
      .default("OPEN"),
    reviewedById: text("reviewed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
    /** Why the moderator decided what they decided. */
    resolutionNote: text("resolution_note").notNull().default(""),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    /**
     * One report per person per thing.
     *
     * Not to stop duplicates being filed so much as to stop them being
     * counted: the queue is ordered by severity and age, and a single user
     * clicking report ten times must not look like ten people objecting.
     */
    unique("reports_once_per_reporter").on(
      table.reporterId,
      table.targetKind,
      table.targetId,
    ),
    /** The queue itself: open reports, oldest first. */
    index("reports_status_created_idx").on(table.status, table.createdAt),
    /** Everything filed against one thing, for the review screen. */
    index("reports_target_idx").on(table.targetKind, table.targetId),
  ],
)
