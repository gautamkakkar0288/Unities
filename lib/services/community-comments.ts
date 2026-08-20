import { and, asc, eq, inArray, isNull } from "drizzle-orm"

import { db } from "@/lib/db"
import { postComments, users } from "@/lib/db/schema"
import { COMMENT_PAGE_LIMIT } from "@/lib/domain/activity"
import type { ActivityComment } from "@/lib/services/community-activity"

/**
 * Comments for a page of posts, in one query.
 *
 * This exists because the alternative is `listPostComments` called in a loop -
 * twenty announcements on a community page becoming twenty round trips before
 * anything renders. One `in (...)` and a group in memory is one trip.
 *
 * Kept in its own file rather than added to `community-activity.ts` because
 * that module is the write path and its authorization rules; this is a read
 * projection with no rules of its own, and it imports the type from there
 * rather than redefining it.
 */
export async function commentsForPosts(args: {
  postIds: string[]
  viewerId: string | null
  /** Per post, not in total. */
  limitPerPost?: number
}): Promise<Map<string, ActivityComment[]>> {
  const grouped = new Map<string, ActivityComment[]>()
  if (args.postIds.length === 0) return grouped

  const rows = await db
    .select({
      id: postComments.id,
      postId: postComments.postId,
      body: postComments.body,
      createdAt: postComments.createdAt,
      editedAt: postComments.editedAt,
      authorId: postComments.authorId,
      authorName: users.name,
    })
    .from(postComments)
    .leftJoin(users, eq(users.id, postComments.authorId))
    .where(
      and(
        inArray(postComments.postId, args.postIds),
        isNull(postComments.removedAt),
      ),
    )
    .orderBy(asc(postComments.createdAt), asc(postComments.id))

  const limit = args.limitPerPost ?? COMMENT_PAGE_LIMIT

  for (const row of rows) {
    const existing = grouped.get(row.postId) ?? []
    // Bounded per post. A single argumentative announcement must not decide how
    // much HTML the whole page ships.
    if (existing.length >= limit) continue

    existing.push({
      id: row.id,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      edited: row.editedAt !== null,
      authorName: row.authorName,
      viewerIsAuthor: args.viewerId !== null && row.authorId === args.viewerId,
    })

    grouped.set(row.postId, existing)
  }

  return grouped
}
