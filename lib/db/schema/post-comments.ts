import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { posts } from "./posts"
import { users } from "./users"

/**
 * Flat comments on an announcement.
 *
 * Note what is absent: `parentId`. Threading is not a missing column, it is a
 * different product - it needs collapse states, depth limits, "continue this
 * thread", and a moderation story for a subtree whose root was removed. A club
 * telling its members something and members replying is served by a flat list,
 * and the flat list is what the moderation burden here can honestly support.
 *
 * Removal mirrors `posts` exactly, for the same reason and with the same
 * fields: a moderator has to be able to answer what was removed and why, and a
 * deleted row answers nothing. Every read path filters `removed_at is null`.
 *
 * The distinction the fields preserve: an author deleting their own comment and
 * a moderator removing it are both `removed_at`, but `removed_by_id` says which
 * happened, so "I deleted this myself" is never confused with "a moderator took
 * this down".
 */
export const postComments = pgTable(
  "post_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    /**
     * Set null, matching `posts.authorId`. A deleted account must not erase a
     * comment that a moderation decision was made about.
     */
    authorId: text("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    /**
     * Set when the comment was edited, null when it never was. A comment that
     * silently changes under a reply is how a conversation is misrepresented,
     * so the UI can say "edited".
     */
    editedAt: timestamp("edited_at", { mode: "date" }),
    removedAt: timestamp("removed_at", { mode: "date" }),
    removedById: text("removed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    removalReason: text("removal_reason").notNull().default(""),
  },
  (table) => [
    /** A post's comments, oldest first - a conversation reads downward. */
    index("post_comments_post_created_idx").on(table.postId, table.createdAt),
    /** Comment counts for a page of posts, and the viewer's own comments. */
    index("post_comments_author_idx").on(table.authorId),
  ],
)
