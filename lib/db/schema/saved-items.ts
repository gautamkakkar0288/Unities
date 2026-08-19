import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"

import { users } from "./users"

/**
 * Saved items - a student's own bookmarks.
 *
 * One table for every saveable kind rather than `saved_events` plus
 * `saved_communities`, because the Saved page shows them interleaved with an
 * "All" tab. Two tables would mean a union query that grows every time a kind
 * is added.
 *
 * The cost is the polymorphic `targetId`, which cannot have a foreign key. That
 * is a real tradeoff, not a free one: deleting an event leaves rows pointing at
 * nothing, so the read path resolves saves against the target tables with an
 * inner join and a save whose target is gone simply stops appearing.
 */
export const savedTargetKinds = ["EVENT", "COMMUNITY", "OPPORTUNITY"] as const

export type SavedTargetKind = (typeof savedTargetKinds)[number]

export const savedItems = pgTable(
  "saved_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetKind: text("target_kind", { enum: savedTargetKinds }).notNull(),
    targetId: text("target_id").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    /**
     * Saving twice is not an error and must not create two rows. A double
     * click, or a save on two open tabs, has to be the same single save - so
     * the service inserts with `onConflictDoNothing` against this constraint
     * and is idempotent because of it, not because it checked first.
     */
    unique("saved_items_once_per_target").on(
      table.userId,
      table.targetKind,
      table.targetId,
    ),
    /** The Saved page: most recently saved first. */
    index("saved_items_user_created_idx").on(table.userId, table.createdAt),
    /**
     * The other direction: "is this saved?" on an event card, and "how many
     * people saved this" as a ranking signal for the feed.
     */
    index("saved_items_target_idx").on(table.targetKind, table.targetId),
  ],
)
