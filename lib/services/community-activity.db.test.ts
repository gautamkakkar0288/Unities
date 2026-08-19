// @vitest-environment node
import { and, eq, inArray, isNull } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import {
  auditLog,
  communities,
  events,
  interests,
  memberships,
  notifications,
  places,
  postComments,
  postReactions,
  posts,
  reports,
  users,
} from "@/lib/db/schema"
import {
  addComment,
  editPost,
  listCommunityActivity,
  listPostComments,
  publishPost,
  removeComment,
  removePost,
  setPostReaction,
} from "@/lib/services/community-activity"
import {
  decideReport,
  listModerationQueue,
  reportContent,
} from "@/lib/services/moderation"

/**
 * Community activity against a real database.
 *
 * Skipped without DATABASE_URL, matching every other suite here, so the unit
 * tests still run on a machine with no database.
 *
 * The security block is the important half. Every case in it calls the service
 * directly with a hostile actor id - which is exactly what a crafted request to
 * a server action is - because a test that drives the UI only proves the button
 * was hidden, and a hidden button is not authorization.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

const PLACE = "activity-test-place"
const INTEREST = "activity-test-interest"
const COMMUNITY = "activity-test-community"
const OTHER_COMMUNITY = "activity-test-other-community"
const EVENT = "activity-test-event"
const OTHER_EVENT = "activity-test-other-event"

const AUTHOR = "activity-test-author"
const OTHER_MEMBER = "activity-test-member"
const OUTSIDER = "activity-test-outsider"
const MODERATOR = "activity-test-moderator"

const USER_IDS = [AUTHOR, OTHER_MEMBER, OUTSIDER, MODERATOR]

/** A fixed clock, so ordering assertions do not depend on execution speed. */
const NOW = new Date("2026-05-20T10:00:00Z")

describe.skipIf(!hasDatabase)("community activity", () => {
  beforeAll(async () => {
    await db
      .insert(places)
      .values({
        id: PLACE,
        kind: "UNIVERSITY",
        name: "Activity Test University",
        slug: PLACE,
        status: "ACTIVE",
      })
      .onConflictDoNothing()

    await db
      .insert(interests)
      .values({ id: INTEREST, slug: INTEREST, label: "Activity Testing" })
      .onConflictDoNothing()

    await db
      .insert(users)
      .values(
        USER_IDS.map((id) => ({
          id,
          name: id,
          email: `${id}@example.test`,
          passwordHash: "not-a-real-hash",
          universityId: PLACE,
        })),
      )
      .onConflictDoNothing()

    await db
      .insert(communities)
      .values([
        {
          id: COMMUNITY,
          slug: COMMUNITY,
          name: "Activity Test Community",
          kind: "OFFICIAL",
          scope: "GLOBAL",
          interestId: INTEREST,
          verification: "VERIFIED",
        },
        {
          id: OTHER_COMMUNITY,
          slug: OTHER_COMMUNITY,
          name: "Another Community",
          kind: "OFFICIAL",
          scope: "GLOBAL",
          interestId: INTEREST,
          verification: "UNVERIFIED",
        },
      ])
      .onConflictDoNothing()

    await db
      .insert(memberships)
      .values([
        { communityId: COMMUNITY, userId: AUTHOR, state: "MEMBER" },
        { communityId: COMMUNITY, userId: OTHER_MEMBER, state: "MEMBER" },
        { communityId: COMMUNITY, userId: MODERATOR, state: "MODERATOR" },
        // OUTSIDER is deliberately not a member of anything.
      ])
      .onConflictDoNothing()

    await db
      .insert(events)
      .values([
        {
          id: EVENT,
          slug: EVENT,
          title: "Activity Test Event",
          description: "For linking.",
          kind: "WORKSHOP",
          mode: "IN_PERSON",
          status: "PUBLISHED",
          startsAt: new Date("2026-06-01T10:00:00Z"),
          endsAt: new Date("2026-06-01T12:00:00Z"),
          communityId: COMMUNITY,
          interestId: INTEREST,
          createdById: MODERATOR,
        },
        {
          id: OTHER_EVENT,
          slug: OTHER_EVENT,
          title: "Event Elsewhere",
          description: "Belongs to another community.",
          kind: "TALK",
          mode: "ONLINE",
          status: "PUBLISHED",
          startsAt: new Date("2026-06-02T10:00:00Z"),
          endsAt: new Date("2026-06-02T11:00:00Z"),
          communityId: OTHER_COMMUNITY,
          interestId: INTEREST,
          createdById: MODERATOR,
        },
      ])
      .onConflictDoNothing()
  })

  afterAll(async () => {
    // Reverse order, so foreign keys never block the teardown.
    const postRows = await db
      .select({ id: posts.id })
      .from(posts)
      .where(inArray(posts.communityId, [COMMUNITY, OTHER_COMMUNITY]))

    const postIds = postRows.map((row) => row.id)

    if (postIds.length > 0) {
      await db.delete(postReactions).where(inArray(postReactions.postId, postIds))
      await db.delete(postComments).where(inArray(postComments.postId, postIds))
    }

    await db.delete(reports).where(inArray(reports.reporterId, USER_IDS))
    await db.delete(auditLog).where(inArray(auditLog.actorId, USER_IDS))
    await db.delete(notifications).where(inArray(notifications.userId, USER_IDS))

    if (postIds.length > 0) {
      await db.delete(posts).where(inArray(posts.id, postIds))
    }

    await db.delete(events).where(inArray(events.id, [EVENT, OTHER_EVENT]))
    await db
      .delete(memberships)
      .where(inArray(memberships.communityId, [COMMUNITY, OTHER_COMMUNITY]))
    await db
      .delete(communities)
      .where(inArray(communities.id, [COMMUNITY, OTHER_COMMUNITY]))
    await db.delete(users).where(inArray(users.id, USER_IDS))
    await db.delete(interests).where(eq(interests.id, INTEREST))
    await db.delete(places).where(eq(places.id, PLACE))
  })

  async function publish(overrides?: { title?: string; eventId?: string | null }) {
    const result = await publishPost({
      authorId: AUTHOR,
      communityId: COMMUNITY,
      input: {
        title: overrides?.title ?? "Registrations close Friday",
        body: "Details inside.",
        eventId: overrides?.eventId ?? null,
      },
      now: NOW,
    })

    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  describe("publishing", () => {
    it("stores a post and notifies the other members, not the author", async () => {
      const { id, notified } = await publish({ title: "Fan-out test" })

      // Two other participating members: OTHER_MEMBER and MODERATOR.
      expect(notified).toBe(2)

      const rows = await db
        .select({ userId: notifications.userId, kind: notifications.kind })
        .from(notifications)
        .where(
          and(
            eq(notifications.targetKind, "POST"),
            eq(notifications.targetId, id),
          ),
        )

      const recipients = rows.map((row) => row.userId).sort()
      expect(recipients).toEqual([MODERATOR, OTHER_MEMBER].sort())
      expect(recipients).not.toContain(AUTHOR)
      // The existing taxonomy, not a new kind.
      expect(rows.every((row) => row.kind === "COMMUNITY_POST")).toBe(true)
    })

    it("derives the author and timestamp rather than trusting input", async () => {
      const { id } = await publish({ title: "Derived fields" })

      const [row] = await db
        .select({ authorId: posts.authorId, createdAt: posts.createdAt })
        .from(posts)
        .where(eq(posts.id, id))

      expect(row?.authorId).toBe(AUTHOR)
      expect(row?.createdAt.toISOString()).toBe(NOW.toISOString())
    })

    it("refuses an empty title", async () => {
      const result = await publishPost({
        authorId: AUTHOR,
        communityId: COMMUNITY,
        input: { title: "   ", body: "Body" },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe("INVALID")
    })

    it("links an event that belongs to this community", async () => {
      const { id } = await publish({ title: "Linked", eventId: EVENT })

      const [row] = await db
        .select({ eventId: posts.eventId })
        .from(posts)
        .where(eq(posts.id, id))

      expect(row?.eventId).toBe(EVENT)
    })

    it("refuses an event from another community", async () => {
      const result = await publishPost({
        authorId: AUTHOR,
        communityId: COMMUNITY,
        input: { title: "Cross-linked", body: "", eventId: OTHER_EVENT },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe("INVALID")
    })

    it("refuses an event id that does not exist", async () => {
      const result = await publishPost({
        authorId: AUTHOR,
        communityId: COMMUNITY,
        input: { title: "Ghost event", body: "", eventId: "no-such-event" },
      })

      expect(result.ok).toBe(false)
    })
  })

  describe("editing", () => {
    it("lets the author change the title and body", async () => {
      const { id } = await publish({ title: "Before" })

      const result = await editPost({
        actorId: AUTHOR,
        postId: id,
        input: { title: "After", body: "Updated body." },
      })

      expect(result.ok).toBe(true)

      const [row] = await db
        .select({ title: posts.title, body: posts.body })
        .from(posts)
        .where(eq(posts.id, id))

      expect(row?.title).toBe("After")
      expect(row?.body).toBe("Updated body.")
    })

    it("cannot move a post to another community or change its author", async () => {
      const { id } = await publish({ title: "Immutable fields" })

      await editPost({
        actorId: AUTHOR,
        postId: id,
        input: { title: "Still here", body: "" },
      })

      const [row] = await db
        .select({ communityId: posts.communityId, authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, id))

      expect(row?.communityId).toBe(COMMUNITY)
      expect(row?.authorId).toBe(AUTHOR)
    })

    it("returns NOT_FOUND for a post that never existed", async () => {
      const result = await editPost({
        actorId: AUTHOR,
        postId: "no-such-post",
        input: { title: "Hello", body: "" },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe("NOT_FOUND")
    })

    it("refuses to edit a removed post", async () => {
      const { id } = await publish({ title: "To be removed" })
      await removePost({ actorId: AUTHOR, postId: id, now: NOW })

      const result = await editPost({
        actorId: AUTHOR,
        postId: id,
        input: { title: "Resurrected", body: "" },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe("NOT_FOUND")
    })
  })

  describe("removal", () => {
    it("soft-removes rather than deleting, and records who", async () => {
      const { id } = await publish({ title: "Author removal" })

      const result = await removePost({ actorId: AUTHOR, postId: id, now: NOW })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.moderated).toBe(false)

      const [row] = await db
        .select({
          removedAt: posts.removedAt,
          removedById: posts.removedById,
        })
        .from(posts)
        .where(eq(posts.id, id))

      // The row survives, which is what keeps reports reviewable.
      expect(row?.removedAt).not.toBeNull()
      expect(row?.removedById).toBe(AUTHOR)
    })

    it("writes an audit row for a moderator removal but not an author's own", async () => {
      const authorRemoved = await publish({ title: "Self removal" })
      await removePost({ actorId: AUTHOR, postId: authorRemoved.id, now: NOW })

      const moderated = await publish({ title: "Moderated removal" })
      await removePost({
        actorId: MODERATOR,
        postId: moderated.id,
        reason: "Off topic",
        now: NOW,
      })

      const rows = await db
        .select({ targetId: auditLog.targetId, action: auditLog.action })
        .from(auditLog)
        .where(eq(auditLog.targetKind, "POST"))

      const targets = rows.map((row) => row.targetId)
      expect(targets).toContain(moderated.id)
      expect(targets).not.toContain(authorRemoved.id)
      expect(rows.some((row) => row.action === "post.removed")).toBe(true)
    })

    it("disappears from the community activity list once removed", async () => {
      const { id } = await publish({ title: "Vanishing act" })

      const before = await listCommunityActivity({
        communityId: COMMUNITY,
        viewerId: AUTHOR,
      })
      expect(before.map((post) => post.id)).toContain(id)

      await removePost({ actorId: AUTHOR, postId: id, now: NOW })

      const after = await listCommunityActivity({
        communityId: COMMUNITY,
        viewerId: AUTHOR,
      })
      expect(after.map((post) => post.id)).not.toContain(id)
    })
  })

  describe("reactions", () => {
    it("records a like and counts it", async () => {
      const { id } = await publish({ title: "Likeable" })

      const result = await setPostReaction({
        actorId: OTHER_MEMBER,
        postId: id,
        reacted: true,
      })

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.count).toBe(1)
    })

    it("is idempotent - reacting twice is still one like", async () => {
      const { id } = await publish({ title: "Double click" })

      await setPostReaction({ actorId: OTHER_MEMBER, postId: id, reacted: true })
      const second = await setPostReaction({
        actorId: OTHER_MEMBER,
        postId: id,
        reacted: true,
      })

      expect(second.ok).toBe(true)
      if (second.ok) expect(second.data.count).toBe(1)
    })

    it("unreacts back to zero", async () => {
      const { id } = await publish({ title: "Unreact" })

      await setPostReaction({ actorId: OTHER_MEMBER, postId: id, reacted: true })
      const removed = await setPostReaction({
        actorId: OTHER_MEMBER,
        postId: id,
        reacted: false,
      })

      expect(removed.ok).toBe(true)
      if (removed.ok) expect(removed.data.count).toBe(0)
    })

    it("keeps one person's like separate from another's", async () => {
      const { id } = await publish({ title: "Two likers" })

      await setPostReaction({ actorId: OTHER_MEMBER, postId: id, reacted: true })
      await setPostReaction({ actorId: MODERATOR, postId: id, reacted: true })
      // One person unreacting must not remove the other's like.
      await setPostReaction({ actorId: OTHER_MEMBER, postId: id, reacted: false })

      const [activity] = await listCommunityActivity({
        communityId: COMMUNITY,
        viewerId: MODERATOR,
        limit: 50,
      }).then((rows) => rows.filter((row) => row.id === id))

      expect(activity?.reactionCount).toBe(1)
      expect(activity?.viewerHasReacted).toBe(true)
    })

    it("tells the author once, not once per like", async () => {
      const { id } = await publish({ title: "Notify once" })

      await setPostReaction({ actorId: OTHER_MEMBER, postId: id, reacted: true })
      await setPostReaction({ actorId: MODERATOR, postId: id, reacted: true })

      const rows = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, AUTHOR),
            eq(notifications.kind, "ACTIVITY"),
            eq(notifications.targetId, id),
          ),
        )

      expect(rows).toHaveLength(1)
    })
  })

  describe("comments", () => {
    it("stores a comment and notifies the post author", async () => {
      const { id } = await publish({ title: "Commentable" })

      const result = await addComment({
        actorId: OTHER_MEMBER,
        postId: id,
        input: { body: "Is there a waitlist?" },
        now: NOW,
      })

      expect(result.ok).toBe(true)

      const comments = await listPostComments({ postId: id, viewerId: OTHER_MEMBER })
      expect(comments).toHaveLength(1)
      expect(comments[0]?.viewerIsAuthor).toBe(true)

      const notified = await db
        .select({ userId: notifications.userId })
        .from(notifications)
        .where(
          and(
            eq(notifications.kind, "ACTIVITY"),
            eq(notifications.targetId, id),
            eq(notifications.userId, AUTHOR),
          ),
        )

      expect(notified.length).toBeGreaterThan(0)
    })

    it("does not notify a post author commenting on their own post", async () => {
      const { id } = await publish({ title: "Self comment" })

      await addComment({
        actorId: AUTHOR,
        postId: id,
        input: { body: "Adding a detail." },
        now: NOW,
      })

      const rows = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, AUTHOR),
            eq(notifications.targetId, id),
            eq(notifications.kind, "ACTIVITY"),
          ),
        )

      expect(rows).toHaveLength(0)
    })

    it("refuses an empty comment", async () => {
      const { id } = await publish({ title: "Empty comment" })

      const result = await addComment({
        actorId: OTHER_MEMBER,
        postId: id,
        input: { body: "   " },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe("INVALID")
    })

    it("lets the author delete their own comment, and hides it from the count", async () => {
      const { id } = await publish({ title: "Delete comment" })

      const created = await addComment({
        actorId: OTHER_MEMBER,
        postId: id,
        input: { body: "Removing this shortly." },
        now: NOW,
      })

      if (!created.ok) throw new Error(created.error.message)

      const removed = await removeComment({
        actorId: OTHER_MEMBER,
        commentId: created.data.id,
        now: NOW,
      })

      expect(removed.ok).toBe(true)

      const remaining = await listPostComments({ postId: id, viewerId: AUTHOR })
      expect(remaining).toHaveLength(0)

      // Soft removal: the row is still there for moderation history.
      const [row] = await db
        .select({ removedAt: postComments.removedAt })
        .from(postComments)
        .where(eq(postComments.id, created.data.id))

      expect(row?.removedAt).not.toBeNull()
    })
  })

  describe("reports and moderation", () => {
    it("files a report with an allowed reason", async () => {
      const { id } = await publish({ title: "Reportable" })

      const result = await reportContent({
        reporterId: OTHER_MEMBER,
        targetKind: "POST",
        targetId: id,
        reason: "SPAM",
        detail: "Posted everywhere.",
        now: NOW,
      })

      expect(result.ok).toBe(true)

      const rows = await db
        .select({ reason: reports.reason, status: reports.status })
        .from(reports)
        .where(eq(reports.targetId, id))

      expect(rows[0]?.reason).toBe("SPAM")
      expect(rows[0]?.status).toBe("OPEN")
    })

    it("absorbs a duplicate report from the same person", async () => {
      const { id } = await publish({ title: "Duplicate report" })

      await reportContent({
        reporterId: OTHER_MEMBER,
        targetKind: "POST",
        targetId: id,
        reason: "SPAM",
        now: NOW,
      })
      const second = await reportContent({
        reporterId: OTHER_MEMBER,
        targetKind: "POST",
        targetId: id,
        reason: "OFF_TOPIC",
        now: NOW,
      })

      expect(second.ok).toBe(true)

      const rows = await db
        .select({ id: reports.id })
        .from(reports)
        .where(eq(reports.targetId, id))

      expect(rows).toHaveLength(1)
    })

    it("rejects a reason outside the taxonomy", async () => {
      const { id } = await publish({ title: "Bad reason" })

      const result = await reportContent({
        reporterId: OTHER_MEMBER,
        targetKind: "POST",
        targetId: id,
        // A crafted request, which is why the service checks rather than trusts.
        reason: "BECAUSE_I_SAID_SO" as never,
      })

      expect(result.ok).toBe(false)
    })

    it("refuses a self-report", async () => {
      const { id } = await publish({ title: "Self report" })

      const result = await reportContent({
        reporterId: AUTHOR,
        targetKind: "POST",
        targetId: id,
        reason: "SPAM",
      })

      expect(result.ok).toBe(false)
    })

    it("resolves a report, removes the content and audits the decision", async () => {
      const { id } = await publish({ title: "Resolve me" })

      await reportContent({
        reporterId: OTHER_MEMBER,
        targetKind: "POST",
        targetId: id,
        reason: "HARASSMENT",
        now: NOW,
      })

      const [report] = await db
        .select({ id: reports.id })
        .from(reports)
        .where(eq(reports.targetId, id))

      const decision = await decideReport({
        moderatorId: MODERATOR,
        reportId: report!.id,
        decision: "RESOLVED",
        removeContent: true,
        note: "Removed after review",
        now: NOW,
      })

      expect(decision.ok).toBe(true)

      const [post] = await db
        .select({ removedAt: posts.removedAt })
        .from(posts)
        .where(eq(posts.id, id))

      expect(post?.removedAt).not.toBeNull()

      const audit = await db
        .select({ action: auditLog.action })
        .from(auditLog)
        .where(eq(auditLog.targetId, id))

      expect(audit.some((row) => row.action === "report.resolved")).toBe(true)
    })

    it("refuses to decide an already-decided report", async () => {
      const { id } = await publish({ title: "Decide twice" })

      await reportContent({
        reporterId: OTHER_MEMBER,
        targetKind: "POST",
        targetId: id,
        reason: "SPAM",
        now: NOW,
      })

      const [report] = await db
        .select({ id: reports.id })
        .from(reports)
        .where(eq(reports.targetId, id))

      await decideReport({
        moderatorId: MODERATOR,
        reportId: report!.id,
        decision: "DISMISSED",
        now: NOW,
      })

      const again = await decideReport({
        moderatorId: MODERATOR,
        reportId: report!.id,
        decision: "RESOLVED",
        now: NOW,
      })

      expect(again.ok).toBe(false)
      if (!again.ok) expect(again.error.code).toBe("CONFLICT")
    })

    it("keeps removed content visible to the moderation queue", async () => {
      const { id } = await publish({ title: "Still reviewable" })

      await reportContent({
        reporterId: OTHER_MEMBER,
        targetKind: "POST",
        targetId: id,
        reason: "SPAM",
        now: NOW,
      })
      await removePost({ actorId: MODERATOR, postId: id, now: NOW })

      const queue = await listModerationQueue({ moderatorId: MODERATOR })
      expect(queue.ok).toBe(true)

      if (queue.ok) {
        const entry = queue.data.find((row) => row.targetId === id)
        // Removed, but still reviewable - auditability survives removal.
        expect(entry?.target?.removed).toBe(true)
      }
    })
  })

  /**
   * The cases that matter most: hostile actors calling the services directly.
   *
   * None of these go through a component, because the component is not the
   * control. Each one is the request a crafted fetch to a server action would
   * make.
   */
  describe("security", () => {
    it("refuses a non-member publishing into the community", async () => {
      const result = await publishPost({
        authorId: OUTSIDER,
        communityId: COMMUNITY,
        input: { title: "I do not belong here", body: "" },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe("FORBIDDEN")
    })

    it("refuses a pending member publishing", async () => {
      await db
        .insert(memberships)
        .values({ communityId: COMMUNITY, userId: OUTSIDER, state: "PENDING" })
        .onConflictDoNothing()

      const result = await publishPost({
        authorId: OUTSIDER,
        communityId: COMMUNITY,
        input: { title: "Still waiting", body: "" },
      })

      expect(result.ok).toBe(false)

      await db
        .delete(memberships)
        .where(
          and(
            eq(memberships.communityId, COMMUNITY),
            eq(memberships.userId, OUTSIDER),
          ),
        )
    })

    it("refuses another student editing someone else's post", async () => {
      const { id } = await publish({ title: "Not yours" })

      const result = await editPost({
        actorId: OTHER_MEMBER,
        postId: id,
        input: { title: "Hijacked", body: "" },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe("FORBIDDEN")
    })

    it("refuses even a moderator editing someone else's words", async () => {
      const { id } = await publish({ title: "Moderator edit" })

      const result = await editPost({
        actorId: MODERATOR,
        postId: id,
        input: { title: "Rewritten by a moderator", body: "" },
      })

      // Moderators remove, which is attributable. They do not rewrite.
      expect(result.ok).toBe(false)
    })

    it("refuses an ordinary member removing someone else's post", async () => {
      const { id } = await publish({ title: "Not yours to delete" })

      const result = await removePost({ actorId: OTHER_MEMBER, postId: id })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe("FORBIDDEN")
    })

    it("refuses one user deleting another user's comment", async () => {
      const { id } = await publish({ title: "Comment ownership" })

      const created = await addComment({
        actorId: OTHER_MEMBER,
        postId: id,
        input: { body: "Mine." },
        now: NOW,
      })

      if (!created.ok) throw new Error(created.error.message)

      const result = await removeComment({
        actorId: AUTHOR,
        commentId: created.data.id,
      })

      // The post's author is not the comment's owner, and owning the post does
      // not confer moderation rights over replies to it.
      expect(result.ok).toBe(false)
    })

    it("cannot remove another user's like", async () => {
      const { id } = await publish({ title: "Someone else's like" })

      await setPostReaction({ actorId: OTHER_MEMBER, postId: id, reacted: true })

      // The only reaction anyone can delete is their own: the statement is
      // scoped by the actor's id, so this is a no-op rather than a removal.
      const result = await setPostReaction({
        actorId: MODERATOR,
        postId: id,
        reacted: false,
      })

      expect(result.ok).toBe(true)

      const rows = await db
        .select({ userId: postReactions.userId })
        .from(postReactions)
        .where(eq(postReactions.postId, id))

      expect(rows.map((row) => row.userId)).toEqual([OTHER_MEMBER])
    })

    it("refuses a non-member reacting", async () => {
      const { id } = await publish({ title: "Outsider like" })

      const result = await setPostReaction({
        actorId: OUTSIDER,
        postId: id,
        reacted: true,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe("FORBIDDEN")
    })

    it("refuses a non-member commenting", async () => {
      const { id } = await publish({ title: "Outsider comment" })

      const result = await addComment({
        actorId: OUTSIDER,
        postId: id,
        input: { body: "Let me in." },
      })

      expect(result.ok).toBe(false)
    })

    it("refuses an ordinary member deciding a report", async () => {
      const { id } = await publish({ title: "Not a moderator" })

      await reportContent({
        reporterId: OTHER_MEMBER,
        targetKind: "POST",
        targetId: id,
        reason: "SPAM",
        now: NOW,
      })

      const [report] = await db
        .select({ id: reports.id })
        .from(reports)
        .where(eq(reports.targetId, id))

      const result = await decideReport({
        moderatorId: OTHER_MEMBER,
        reportId: report!.id,
        decision: "DISMISSED",
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe("FORBIDDEN")
    })

    it("refuses a normal student the report queue", async () => {
      const result = await listModerationQueue({ moderatorId: OUTSIDER })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe("FORBIDDEN")
    })

    it("does not leak posts from another community into this one's activity", async () => {
      await db
        .insert(posts)
        .values({
          id: "activity-test-foreign-post",
          communityId: OTHER_COMMUNITY,
          authorId: MODERATOR,
          title: "Elsewhere",
          body: "",
          createdAt: NOW,
        })
        .onConflictDoNothing()

      const activity = await listCommunityActivity({
        communityId: COMMUNITY,
        viewerId: AUTHOR,
        limit: 50,
      })

      expect(activity.map((post) => post.id)).not.toContain(
        "activity-test-foreign-post",
      )
    })

    it("never exposes an email address in an activity projection", async () => {
      await publish({ title: "Projection check" })

      const activity = await listCommunityActivity({
        communityId: COMMUNITY,
        viewerId: AUTHOR,
        limit: 5,
      })

      // The projection is the protection: there is no field to leak.
      expect(JSON.stringify(activity)).not.toContain("@example.test")
    })
  })

  describe("activity listing", () => {
    it("counts only comments that are still visible", async () => {
      const { id } = await publish({ title: "Count check" })

      const first = await addComment({
        actorId: OTHER_MEMBER,
        postId: id,
        input: { body: "One." },
        now: NOW,
      })
      await addComment({
        actorId: MODERATOR,
        postId: id,
        input: { body: "Two." },
        now: NOW,
      })

      if (!first.ok) throw new Error(first.error.message)
      await removeComment({
        actorId: OTHER_MEMBER,
        commentId: first.data.id,
        now: NOW,
      })

      const activity = await listCommunityActivity({
        communityId: COMMUNITY,
        viewerId: AUTHOR,
        limit: 50,
      })

      const post = activity.find((row) => row.id === id)
      expect(post?.commentCount).toBe(1)
    })

    it("reports what the viewer may do, matching what the services enforce", async () => {
      const { id } = await publish({ title: "Permissions projection" })

      const asAuthor = await listCommunityActivity({
        communityId: COMMUNITY,
        viewerId: AUTHOR,
        limit: 50,
      })
      const asOther = await listCommunityActivity({
        communityId: COMMUNITY,
        viewerId: OTHER_MEMBER,
        limit: 50,
      })

      expect(asAuthor.find((row) => row.id === id)?.viewerCanEdit).toBe(true)
      expect(asOther.find((row) => row.id === id)?.viewerCanEdit).toBe(false)
      expect(asOther.find((row) => row.id === id)?.viewerCanRemove).toBe(false)
    })

    it("excludes removed posts from the count of what is visible", async () => {
      const visible = await db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.communityId, COMMUNITY), isNull(posts.removedAt)))

      const activity = await listCommunityActivity({
        communityId: COMMUNITY,
        viewerId: AUTHOR,
        limit: 50,
      })

      expect(activity.length).toBeLessThanOrEqual(visible.length)
    })
  })
})
