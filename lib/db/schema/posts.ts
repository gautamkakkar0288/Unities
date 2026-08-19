import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { communities } from "./communities"
import { events } from "./events"
import { users } from "./users"

/**
 * Community announcements.
 *
 * Deliberately small. No comments, no reactions, no reposts, no threading -
 * this exists so a club can tell its members something, and every one of those
 * additions turns it into a different product with a different moderation
 * burden.
 */
export const posts = pgTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    communityId: text("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    /**
     * Set null, not cascade. A deleted account must not erase an announcement
     * its members are relying on, and the moderation trail has to survive the
     * author leaving.
     */
    authorId: text("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    /**
     * Optional. "Registration for the hackathon closes tonight" is a post
     * about an event, and carrying the reference lets the card link straight
     * to it instead of asking the student to search.
     */
    eventId: text("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    /**
     * Removal is a state, not a delete, for the same reason a cancelled event
     * keeps its registrations: a moderator has to be able to answer what was
     * removed and why, and a deleted row cannot answer anything. Every read
     * path filters on `removedAt is null`.
     */
    removedAt: timestamp("removed_at", { mode: "date" }),
    removedById: text("removed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    removalReason: text("removal_reason").notNull().default(""),
  },
  (table) => [
    /** A community page, newest first. */
    index("posts_community_created_idx").on(table.communityId, table.createdAt),
    /** The feed: recent posts across the communities a student has joined. */
    index("posts_created_idx").on(table.createdAt),
    index("posts_event_idx").on(table.eventId),
  ],
)
