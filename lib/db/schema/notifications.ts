import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

import { auditTargetKinds } from "./enums"
import { users } from "./users"

/**
 * Notifications.
 *
 * Kinds are the domain's, not new vocabulary - `lib/domain/notifications.ts`
 * already labels and tones each one, and `requiredNotificationKinds` already
 * says which two a student may not switch off. `parity.test.ts` holds the two
 * lists together.
 */
export const notificationKinds = [
  "EVENT_REMINDER",
  "COMMUNITY_POST",
  "MENTION",
  "MEMBERSHIP",
  "MODERATION",
  "ACTIVITY",
] as const

export type NotificationKindValue = (typeof notificationKinds)[number]

export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: notificationKinds }).notNull(),
    /**
     * Written at creation rather than rendered from a template at read time.
     *
     * "Two students came off the waitlist" has to keep saying that even after
     * the capacity changes again. A notification is a record of something that
     * happened, so it cannot be recomputed from current state without
     * occasionally lying about the past.
     */
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    /**
     * What to open. Nullable because not every notification has somewhere to
     * go - an approved organiser verification is a fact about you, not a page.
     *
     * No foreign key, because this points at several different tables. The
     * consequence is honest: a deleted target leaves a notification whose link
     * 404s, so the read path resolves targets and drops the ones that no longer
     * exist rather than trusting this column.
     */
    targetKind: text("target_kind", { enum: auditTargetKinds }),
    targetId: text("target_id"),
    /** Null is unread. A timestamp answers "when" for free. */
    readAt: timestamp("read_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    /** The notification centre: newest first, for one person. */
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    /**
     * The unread badge, which renders on every page for every signed-in
     * student and so is the most frequent query in the product.
     */
    index("notifications_user_unread_idx").on(table.userId, table.readAt),
    /**
     * One notification per person per thing per kind.
     *
     * Without this, an organiser correcting a typo three times sends three
     * identical "the venue changed" notifications, and the fix would otherwise
     * have to live in every calling service.
     */
    uniqueIndex("notifications_no_duplicates_idx").on(
      table.userId,
      table.kind,
      table.targetKind,
      table.targetId,
      table.createdAt,
    ),
  ],
)
