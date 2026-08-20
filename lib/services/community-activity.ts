import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  auditLog,
  communities,
  events,
  memberships,
  postComments,
  postReactions,
  posts,
  users,
} from "@/lib/db/schema"
import {
  COMMENT_PAGE_LIMIT,
  COMMUNITY_ACTIVITY_LIMIT,
  canComment,
  canEditPost,
  canPublish,
  canReact,
  canRemoveComment,
  canRemovePost,
  normaliseBody,
  normaliseTitle,
  validateCommentInput,
  validatePostInput,
} from "@/lib/domain/activity"
import type { MembershipState, VerificationState } from "@/lib/domain/types"
import { createNotifications, hasNotification } from "@/lib/services/notifications"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Community activity: publishing announcements, and the reactions and comments
 * on them.
 *
 * **Authorization is here, not in the page.** Every function takes the actor's
 * id as a parameter that its caller reads from `auth()`, looks up that person's
 * membership itself, and asks `lib/domain/activity.ts` whether the action is
 * allowed. Hiding a button is a courtesy to the person who cannot use it; it is
 * not a control, because the server action behind it is reachable directly.
 *
 * **Nothing trusts the client about identity or ownership.** `authorId`,
 * `communityId` and timestamps are derived server-side. The community is
 * resolved from the post, never accepted alongside it, so a forged
 * `communityId` cannot move someone else's post or grant posting rights
 * somewhere the actor is not a member.
 *
 * **Removal is a state.** Nothing here deletes a post or a comment. That is the
 * existing convention - a cancelled event keeps its registrations - and it is
 * what lets a moderator answer what was removed and why. Reactions are the one
 * exception, and the table explains why.
 */

/** Membership state as the database sees it, with absence meaning NONE. */
async function membershipStateFor(args: {
  userId: string
  communityId: string
}): Promise<MembershipState> {
  const [row] = await db
    .select({ state: memberships.state })
    .from(memberships)
    .where(
      and(
        eq(memberships.communityId, args.communityId),
        eq(memberships.userId, args.userId),
      ),
    )
    .limit(1)

  // No row *is* NONE, per the memberships schema note.
  return row?.state ?? "NONE"
}

export type ActivityComment = {
  id: string
  body: string
  /** ISO-8601, per the domain's timestamp convention. */
  createdAt: string
  edited: boolean
  /** Display name only. Never the email - the projection is the protection. */
  authorName: string | null
  /** Whether the viewer wrote this, so the UI can offer delete. */
  viewerIsAuthor: boolean
}

export type ActivityPost = {
  id: string
  title: string
  body: string
  createdAt: string
  community: {
    id: string
    slug: string
    name: string
    verification: VerificationState
  }
  authorName: string | null
  event: { slug: string; title: string } | null
  /** Real counts from real rows. Nothing here is fabricated. */
  reactionCount: number
  commentCount: number
  viewerHasReacted: boolean
  /** What this viewer may do, decided by the same rules the services enforce. */
  viewerCanEdit: boolean
  viewerCanRemove: boolean
  viewerIsAuthor: boolean
}

type PostRow = {
  id: string
  title: string
  body: string
  createdAt: Date
  authorId: string | null
  communityId: string
  communitySlug: string
  communityName: string
  communityVerification: VerificationState
  authorName: string | null
  eventSlug: string | null
  eventTitle: string | null
}

/**
 * Counts and viewer state for a set of posts, in three queries.
 *
 * Not one query per post. Twenty announcements with a count query each is
 * sixty round trips for a single page, and the community page renders all of
 * them on first paint. Grouped aggregates return the whole page at once.
 */
async function hydrateActivity(args: {
  postIds: string[]
  viewerId: string | null
}): Promise<{
  reactionCounts: Map<string, number>
  commentCounts: Map<string, number>
  viewerReacted: Set<string>
}> {
  if (args.postIds.length === 0) {
    return {
      reactionCounts: new Map(),
      commentCounts: new Map(),
      viewerReacted: new Set(),
    }
  }

  const [reactionRows, commentRows, viewerRows] = await Promise.all([
    db
      .select({
        postId: postReactions.postId,
        count: sql<number>`count(*)::int`,
      })
      .from(postReactions)
      .where(inArray(postReactions.postId, args.postIds))
      .groupBy(postReactions.postId),
    db
      .select({
        postId: postComments.postId,
        count: sql<number>`count(*)::int`,
      })
      .from(postComments)
      .where(
        and(
          inArray(postComments.postId, args.postIds),
          // Removed comments are not counted. A count that includes content
          // nobody can see sends students looking for a comment that is gone.
          isNull(postComments.removedAt),
        ),
      )
      .groupBy(postComments.postId),
    args.viewerId
      ? db
          .select({ postId: postReactions.postId })
          .from(postReactions)
          .where(
            and(
              inArray(postReactions.postId, args.postIds),
              eq(postReactions.userId, args.viewerId),
            ),
          )
      : Promise.resolve([]),
  ])

  return {
    reactionCounts: new Map(reactionRows.map((row) => [row.postId, row.count])),
    commentCounts: new Map(commentRows.map((row) => [row.postId, row.count])),
    viewerReacted: new Set(viewerRows.map((row) => row.postId)),
  }
}

function toActivityPost(args: {
  row: PostRow
  viewerId: string | null
  viewerState: MembershipState
  reactionCount: number
  commentCount: number
  viewerHasReacted: boolean
}): ActivityPost {
  const { row, viewerId } = args
  const viewerIsAuthor = viewerId !== null && row.authorId === viewerId

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    community: {
      id: row.communityId,
      slug: row.communitySlug,
      name: row.communityName,
      verification: row.communityVerification,
    },
    authorName: row.authorName,
    event:
      row.eventSlug && row.eventTitle
        ? { slug: row.eventSlug, title: row.eventTitle }
        : null,
    reactionCount: args.reactionCount,
    commentCount: args.commentCount,
    viewerHasReacted: args.viewerHasReacted,
    // Computed from the same domain functions the services enforce, so a
    // rendered control and the endpoint behind it cannot disagree.
    viewerCanEdit: viewerId
      ? canEditPost({ authorId: row.authorId, viewerId, removed: false })
      : false,
    viewerCanRemove: viewerId
      ? canRemovePost({
          authorId: row.authorId,
          viewerId,
          viewerState: args.viewerState,
          removed: false,
        })
      : false,
    viewerIsAuthor,
  }
}

const postSelection = {
  id: posts.id,
  title: posts.title,
  body: posts.body,
  createdAt: posts.createdAt,
  authorId: posts.authorId,
  communityId: communities.id,
  communitySlug: communities.slug,
  communityName: communities.name,
  communityVerification: communities.verification,
  authorName: users.name,
  eventSlug: events.slug,
  eventTitle: events.title,
}

/**
 * The activity feed for one community, newest first.
 *
 * One joined query for the posts, then three batched queries for counts and
 * viewer state - four in total regardless of how many announcements there are.
 *
 * Ties on `createdAt` break on id, matching `listRecentPosts`: the demo seed
 * writes several posts at the same instant, and an order that changes between
 * two renders of identical data reads as a bug.
 */
export async function listCommunityActivity(args: {
  communityId: string
  viewerId: string | null
  limit?: number
}): Promise<ActivityPost[]> {
  const limit = Math.min(args.limit ?? COMMUNITY_ACTIVITY_LIMIT, 50)

  const rows = (await db
    .select(postSelection)
    .from(posts)
    .innerJoin(communities, eq(communities.id, posts.communityId))
    .leftJoin(users, eq(users.id, posts.authorId))
    .leftJoin(events, eq(events.id, posts.eventId))
    .where(
      and(eq(posts.communityId, args.communityId), isNull(posts.removedAt)),
    )
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit)) as PostRow[]

  if (rows.length === 0) return []

  const [hydrated, viewerState] = await Promise.all([
    hydrateActivity({ postIds: rows.map((row) => row.id), viewerId: args.viewerId }),
    args.viewerId
      ? membershipStateFor({
          userId: args.viewerId,
          communityId: args.communityId,
        })
      : Promise.resolve<MembershipState>("NONE"),
  ])

  return rows.map((row) =>
    toActivityPost({
      row,
      viewerId: args.viewerId,
      viewerState,
      reactionCount: hydrated.reactionCounts.get(row.id) ?? 0,
      commentCount: hydrated.commentCounts.get(row.id) ?? 0,
      viewerHasReacted: hydrated.viewerReacted.has(row.id),
    }),
  )
}

/**
 * Counts and viewer reaction state for posts the caller already has.
 *
 * Exported for the Home feed, which builds its own `PostSummary` rows through
 * `listRecentPosts` and needs activity state attached without a second read of
 * the posts themselves. This is why the feed does not need rewriting: it keeps
 * its query and gains three batched lookups.
 */
export async function activityStateFor(args: {
  postIds: string[]
  viewerId: string | null
}): Promise<
  Map<string, { reactionCount: number; commentCount: number; viewerHasReacted: boolean }>
> {
  const hydrated = await hydrateActivity(args)

  return new Map(
    args.postIds.map((id) => [
      id,
      {
        reactionCount: hydrated.reactionCounts.get(id) ?? 0,
        commentCount: hydrated.commentCounts.get(id) ?? 0,
        viewerHasReacted: hydrated.viewerReacted.has(id),
      },
    ]),
  )
}

/**
 * Publish an announcement.
 *
 * The author is `args.authorId`, which the caller reads from the session; the
 * community is resolved and checked here. A linked event must belong to this
 * same community and must not be a draft - "visible to the community" is a
 * rule the service applies, not a claim the form makes.
 *
 * The member fan-out is written in the same transaction as the post. A post
 * that exists while its notifications silently failed is a club believing it
 * told its members something it did not.
 */
export async function publishPost(args: {
  authorId: string
  communityId: string
  input: { title: string; body: string; eventId?: string | null }
  now?: Date
}): Promise<ServiceResult<{ id: string; notified: number }>> {
  const errors = validatePostInput(args.input)
  if (errors.length > 0) {
    return fail("INVALID", errors[0]!.message)
  }

  const [community] = await db
    .select({ id: communities.id, name: communities.name, archivedAt: communities.archivedAt })
    .from(communities)
    .where(eq(communities.id, args.communityId))
    .limit(1)

  if (!community || community.archivedAt) {
    return fail("NOT_FOUND", "That community no longer exists.")
  }

  const state = await membershipStateFor({
    userId: args.authorId,
    communityId: args.communityId,
  })

  if (!canPublish(state)) {
    return fail("FORBIDDEN", "Only members can post in this community.")
  }

  let eventId: string | null = null

  if (args.input.eventId) {
    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(
        and(
          eq(events.id, args.input.eventId),
          // Same community, and not a draft. Both checks are here rather than
          // in the form, because the form's <select> is a suggestion.
          eq(events.communityId, args.communityId),
          sql`${events.status} <> 'DRAFT'`,
        ),
      )
      .limit(1)

    if (!event) {
      return fail("INVALID", "That event cannot be linked to this update.")
    }

    eventId = event.id
  }

  const now = args.now ?? new Date()
  const title = normaliseTitle(args.input.title)
  const body = normaliseBody(args.input.body)

  // Recipients: everyone participating in the community except the author.
  // Read outside the transaction because it is a read, and inside it would
  // hold row locks for the length of the fan-out.
  const recipients = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(
      and(
        eq(memberships.communityId, args.communityId),
        inArray(memberships.state, ["MEMBER", "MODERATOR", "OWNER"]),
        ne(memberships.userId, args.authorId),
      ),
    )

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(posts)
      .values({
        communityId: args.communityId,
        authorId: args.authorId,
        title,
        body,
        eventId,
        createdAt: now,
      })
      .returning({ id: posts.id })

    const postId = row!.id

    await createNotifications({
      notifications: recipients.map((recipient) => ({
        userId: recipient.userId,
        kind: "COMMUNITY_POST" as const,
        title: `${community.name}: ${title}`,
        // The body is deliberately not copied. A notification is a pointer,
        // and a four-thousand-character announcement in an inbox row is not.
        body: "",
        targetKind: "POST" as const,
        targetId: postId,
        createdAt: now,
      })),
      writer: tx,
    })

    return postId
  })

  return ok({ id: created, notified: recipients.length })
}

/**
 * Edit an announcement.
 *
 * Only the title, the body and the linked event can change. Author, community,
 * `createdAt` and every moderation field are absent from the update statement
 * rather than filtered from an input object, so there is no path by which a
 * crafted request reassigns a post or backdates it.
 *
 * Moderators are not permitted here - see `canEditPost`. They remove instead,
 * which is attributable.
 */
export async function editPost(args: {
  actorId: string
  postId: string
  input: { title: string; body: string; eventId?: string | null }
}): Promise<ServiceResult<{ id: string }>> {
  const errors = validatePostInput(args.input)
  if (errors.length > 0) {
    return fail("INVALID", errors[0]!.message)
  }

  const [post] = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      communityId: posts.communityId,
      removedAt: posts.removedAt,
    })
    .from(posts)
    .where(eq(posts.id, args.postId))
    .limit(1)

  // Not found and removed are both "no longer there" to a caller who may not
  // act on it, which is also the safe answer for a post that never existed.
  if (!post || post.removedAt) {
    return fail("NOT_FOUND", "That update no longer exists.")
  }

  if (
    !canEditPost({
      authorId: post.authorId,
      viewerId: args.actorId,
      removed: false,
    })
  ) {
    return fail("FORBIDDEN", "Only the author can edit this update.")
  }

  let eventId: string | null = null

  if (args.input.eventId) {
    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(
        and(
          eq(events.id, args.input.eventId),
          eq(events.communityId, post.communityId),
          sql`${events.status} <> 'DRAFT'`,
        ),
      )
      .limit(1)

    if (!event) {
      return fail("INVALID", "That event cannot be linked to this update.")
    }

    eventId = event.id
  }

  await db
    .update(posts)
    .set({
      title: normaliseTitle(args.input.title),
      body: normaliseBody(args.input.body),
      eventId,
    })
    .where(eq(posts.id, args.postId))

  return ok({ id: args.postId })
}

/**
 * Take an announcement down.
 *
 * One function for both routes, because they are the same state change:
 * `removedAt` set, `removedById` recording who. What differs is the audit
 * trail - a moderator removing someone else's post is a privileged action and
 * gets an audit row; an author withdrawing their own is not.
 *
 * The post disappears from Home, Explore and Search immediately without those
 * services changing, because all three already filter `removedAt is null`.
 */
export async function removePost(args: {
  actorId: string
  postId: string
  reason?: string
  now?: Date
}): Promise<ServiceResult<{ id: string; moderated: boolean }>> {
  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      authorId: posts.authorId,
      communityId: posts.communityId,
      removedAt: posts.removedAt,
    })
    .from(posts)
    .where(eq(posts.id, args.postId))
    .limit(1)

  if (!post || post.removedAt) {
    return fail("NOT_FOUND", "That update no longer exists.")
  }

  const state = await membershipStateFor({
    userId: args.actorId,
    communityId: post.communityId,
  })

  if (
    !canRemovePost({
      authorId: post.authorId,
      viewerId: args.actorId,
      viewerState: state,
      removed: false,
    })
  ) {
    return fail("FORBIDDEN", "You cannot remove this update.")
  }

  const isAuthor = post.authorId === args.actorId
  const now = args.now ?? new Date()

  await db.transaction(async (tx) => {
    await tx
      .update(posts)
      .set({
        removedAt: now,
        removedById: args.actorId,
        removalReason: args.reason ?? (isAuthor ? "Removed by author" : ""),
      })
      .where(eq(posts.id, args.postId))

    if (!isAuthor) {
      // In the same transaction as the removal, per the audit-log note: an
      // audit row that can fail on its own leaves silent gaps.
      await tx.insert(auditLog).values({
        actorId: args.actorId,
        action: "post.removed",
        targetKind: "POST",
        targetId: args.postId,
        summary: `Removed "${post.title}"${args.reason ? `: ${args.reason}` : ""}`,
        createdAt: now,
      })
    }
  })

  return ok({ id: args.postId, moderated: !isAuthor })
}

/**
 * Like a post, or remove a like.
 *
 * Idempotent in both directions, and it relies on the unique constraint rather
 * than checking first: a double-clicked button sends two requests that would
 * both read zero rows and both insert. `onConflictDoNothing` makes the second
 * a no-op at the database rather than a duplicate.
 *
 * The author is told once per post, not once per like. Twelve likes producing
 * twelve inbox rows is how a student turns notifications off, so
 * `hasNotification` gates the fan-out on whether they have already been told
 * about this post.
 */
export async function setPostReaction(args: {
  actorId: string
  postId: string
  reacted: boolean
  now?: Date
}): Promise<ServiceResult<{ reacted: boolean; count: number }>> {
  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      authorId: posts.authorId,
      communityId: posts.communityId,
      removedAt: posts.removedAt,
    })
    .from(posts)
    .where(eq(posts.id, args.postId))
    .limit(1)

  if (!post || post.removedAt) {
    return fail("NOT_FOUND", "That update no longer exists.")
  }

  const state = await membershipStateFor({
    userId: args.actorId,
    communityId: post.communityId,
  })

  if (!canReact(state)) {
    return fail("FORBIDDEN", "Only members can react in this community.")
  }

  const now = args.now ?? new Date()

  if (args.reacted) {
    await db
      .insert(postReactions)
      .values({ postId: args.postId, userId: args.actorId, createdAt: now })
      .onConflictDoNothing()

    // Only when there is somebody else to tell, and only the first time.
    if (post.authorId && post.authorId !== args.actorId) {
      const alreadyTold = await hasNotification({
        userId: post.authorId,
        kind: "ACTIVITY",
        targetKind: "POST",
        targetId: args.postId,
      })

      if (!alreadyTold) {
        await createNotifications({
          notifications: [
            {
              userId: post.authorId,
              kind: "ACTIVITY",
              title: `Your update "${post.title}" is getting likes`,
              targetKind: "POST",
              targetId: args.postId,
              createdAt: now,
            },
          ],
        })
      }
    }
  } else {
    await db
      .delete(postReactions)
      .where(
        and(
          eq(postReactions.postId, args.postId),
          eq(postReactions.userId, args.actorId),
        ),
      )
  }

  const [count] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postReactions)
    .where(eq(postReactions.postId, args.postId))

  return ok({ reacted: args.reacted, count: count?.count ?? 0 })
}

/**
 * The comments on one post, oldest first - a conversation reads downward.
 *
 * `viewerIsAuthor` rather than an author id, so the UI can offer delete
 * without the page carrying user identifiers it has no other use for.
 */
export async function listPostComments(args: {
  postId: string
  viewerId: string | null
  limit?: number
}): Promise<ActivityComment[]> {
  const rows = await db
    .select({
      id: postComments.id,
      body: postComments.body,
      createdAt: postComments.createdAt,
      editedAt: postComments.editedAt,
      authorId: postComments.authorId,
      authorName: users.name,
    })
    .from(postComments)
    .leftJoin(users, eq(users.id, postComments.authorId))
    .where(
      and(eq(postComments.postId, args.postId), isNull(postComments.removedAt)),
    )
    .orderBy(asc(postComments.createdAt), asc(postComments.id))
    .limit(Math.min(args.limit ?? COMMENT_PAGE_LIMIT, 100))

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    edited: row.editedAt !== null,
    authorName: row.authorName,
    viewerIsAuthor: args.viewerId !== null && row.authorId === args.viewerId,
  }))
}

/**
 * Comment on a post.
 *
 * The post author is notified unless they are the commenter. Written in the
 * same transaction as the comment, for the same reason as the post fan-out.
 */
export async function addComment(args: {
  actorId: string
  postId: string
  input: { body: string }
  now?: Date
}): Promise<ServiceResult<{ id: string }>> {
  const errors = validateCommentInput(args.input)
  if (errors.length > 0) {
    return fail("INVALID", errors[0]!.message)
  }

  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      authorId: posts.authorId,
      communityId: posts.communityId,
      removedAt: posts.removedAt,
    })
    .from(posts)
    .where(eq(posts.id, args.postId))
    .limit(1)

  if (!post || post.removedAt) {
    return fail("NOT_FOUND", "That update no longer exists.")
  }

  const state = await membershipStateFor({
    userId: args.actorId,
    communityId: post.communityId,
  })

  if (!canComment(state)) {
    return fail("FORBIDDEN", "Only members can comment in this community.")
  }

  const now = args.now ?? new Date()
  const body = normaliseBody(args.input.body)

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(postComments)
      .values({
        postId: args.postId,
        authorId: args.actorId,
        body,
        createdAt: now,
      })
      .returning({ id: postComments.id })

    if (post.authorId && post.authorId !== args.actorId) {
      await createNotifications({
        notifications: [
          {
            userId: post.authorId,
            kind: "ACTIVITY",
            title: `New comment on "${post.title}"`,
            targetKind: "POST",
            targetId: args.postId,
            createdAt: now,
          },
        ],
        writer: tx,
      })
    }

    return row!.id
  })

  return ok({ id: created })
}

/**
 * Remove a comment: its author, or a moderator of the community it sits in.
 *
 * The community is reached through the post rather than accepted from the
 * caller, so moderator rights cannot be claimed against a community the
 * comment is not in.
 */
export async function removeComment(args: {
  actorId: string
  commentId: string
  reason?: string
  now?: Date
}): Promise<ServiceResult<{ id: string; moderated: boolean }>> {
  const [comment] = await db
    .select({
      id: postComments.id,
      authorId: postComments.authorId,
      removedAt: postComments.removedAt,
      communityId: posts.communityId,
    })
    .from(postComments)
    .innerJoin(posts, eq(posts.id, postComments.postId))
    .where(eq(postComments.id, args.commentId))
    .limit(1)

  if (!comment || comment.removedAt) {
    return fail("NOT_FOUND", "That comment no longer exists.")
  }

  const state = await membershipStateFor({
    userId: args.actorId,
    communityId: comment.communityId,
  })

  if (
    !canRemoveComment({
      authorId: comment.authorId,
      viewerId: args.actorId,
      viewerState: state,
      removed: false,
    })
  ) {
    return fail("FORBIDDEN", "You cannot remove this comment.")
  }

  const isAuthor = comment.authorId === args.actorId
  const now = args.now ?? new Date()

  await db.transaction(async (tx) => {
    await tx
      .update(postComments)
      .set({
        removedAt: now,
        removedById: args.actorId,
        removalReason: args.reason ?? (isAuthor ? "Deleted by author" : ""),
      })
      .where(eq(postComments.id, args.commentId))

    if (!isAuthor) {
      await tx.insert(auditLog).values({
        actorId: args.actorId,
        action: "comment.removed",
        targetKind: "COMMENT",
        targetId: args.commentId,
        summary: `Removed a comment${args.reason ? `: ${args.reason}` : ""}`,
        createdAt: now,
      })
    }
  })

  return ok({ id: args.commentId, moderated: !isAuthor })
}

/**
 * Events this community could link an update to, for the composer's dropdown.
 *
 * Published only, soonest first, bounded. The composer offering an event the
 * service would then refuse is a form that lies about what it accepts.
 */
export async function linkableEvents(args: {
  communityId: string
  limit?: number
}): Promise<Array<{ id: string; title: string }>> {
  return db
    .select({ id: events.id, title: events.title })
    .from(events)
    .where(
      and(
        eq(events.communityId, args.communityId),
        sql`${events.status} <> 'DRAFT'`,
      ),
    )
    .orderBy(asc(events.startsAt))
    .limit(args.limit ?? 20)
}
