import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"

import { posts } from "./posts"
import { users } from "./users"

/**
 * One reaction type, deliberately.
 *
 * There is no `kind` column, because the product has one reaction and adding
 * the column now would be inventing a vocabulary nobody has chosen. Six emoji
 * are a different feature with a different question behind it - "how do people
 * feel about this" rather than "did this land" - and the migration to add a
 * kind later is one column with a default, which is cheap. Guessing the six
 * values today is not.
 *
 * Unlike `posts` and `post_comments`, a reaction has no removal state. Removing
 * a like is not a moderation decision and nobody needs to audit it, so unreact
 * deletes the row. The count is then `count(*)`, with no `removed_at is null`
 * that every future query would have to remember.
 */
export const postReactions = pgTable(
  "post_reactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    /**
     * Cascade, unlike `posts.authorId`. A like carries no content and no
     * moderation trail, so a deleted account's likes should disappear with it
     * rather than leave counts nobody can explain.
     */
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    /**
     * One like per person per post, enforced here rather than in the service.
     *
     * A service-level "select then insert" is a race: a double-clicked button
     * fires two requests that both read zero rows and both insert. The
     * constraint is what makes reacting idempotent; the service relies on it
     * instead of re-implementing it.
     */
    unique("post_reactions_once_per_user").on(table.postId, table.userId),
    /** The count, and the viewer's own state, for a page of posts. */
    index("post_reactions_post_idx").on(table.postId),
    /** "What have I liked", when the feed hydrates viewer state. */
    index("post_reactions_user_idx").on(table.userId),
  ],
)
