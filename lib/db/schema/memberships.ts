import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

import { communities } from "./communities"
import { users } from "./users"

/**
 * Membership is a state machine, not a boolean.
 *
 * Note what is missing: `NONE`. The domain model has it because a screen must
 * render something for a non-member, but in the database the absence of a row
 * *is* `NONE`. Storing it would mean writing a row for every user who ever
 * looked at a community, and would make "is this person a member" a
 * two-condition question forever after.
 *
 * `PENDING` and `INVITED` exist from the first migration rather than when the
 * first approval-gated community appears. Adding states to an enum is free;
 * adding them to a table that already has rows, indexes, and queries written
 * against a boolean is not (D29).
 */
export const membershipStates = [
  "INVITED",
  "PENDING",
  "MEMBER",
  "MODERATOR",
  "OWNER",
] as const

export type MembershipState = (typeof membershipStates)[number]

export const memberships = pgTable(
  "memberships",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    communityId: text("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    state: text("state", { enum: membershipStates }).notNull().default("MEMBER"),
    /** When they asked. Set for `PENDING`, kept afterwards for the audit. */
    requestedAt: timestamp("requested_at", { mode: "date" }),
    /** When they actually got in. Null while pending or invited. */
    joinedAt: timestamp("joined_at", { mode: "date" }),
    invitedById: text("invited_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedById: text("decided_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedAt: timestamp("decided_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    /** One row per person per community, whatever state it is in. */
    uniqueIndex("memberships_community_user_idx").on(
      table.communityId,
      table.userId,
    ),
    /** "My communities", on every page load. */
    index("memberships_user_state_idx").on(table.userId, table.state),
    /** The moderator's pending-requests queue. */
    index("memberships_community_state_idx").on(table.communityId, table.state),
  ],
)
