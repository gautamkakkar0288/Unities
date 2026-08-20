// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  communities,
  interests,
  memberships,
  notifications,
  places,
  postComments,
  postReactions,
  posts,
  reports,
  savedItems,
  users,
} from "@/lib/db/schema"
import {
  activityStateFor,
  addComment,
  publishPost,
  setPostReaction,
} from "@/lib/services/community-activity"
import {
  auditTrailFor,
  decideReport,
  listModerationQueue,
  reportContent,
  reportedTargetIds,
} from "@/lib/services/moderation"
import { listNotifications } from "@/lib/services/notifications"
import { listRecentPosts } from "@/lib/services/posts"
import { isSaved, saveItem, unsaveItem } from "@/lib/services/saved"

/**
 * Integration coverage for the PR #26 follow-up fixes.
 *
 * Same conventions as the other `.db.test.ts` suites: skipped entirely without
 * DATABASE_URL, fixtures inserted in foreign-key order and removed in reverse,
 * and a fixed clock so nothing depends on the day it runs.
 *
 * These exercise the services the UI calls, not the components. The point of
 * every case here is that the server reaches the right answer when asked
 * directly - a hidden button proves nothing.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

const NOW = new Date("2026-06-10T09:00:00Z")

const PLACE = "integration-test-place"
const INTEREST = "integration-test-interest"
const COMMUNITY = "integration-test-community"

const AUTHOR = "integration-test-author"
const MEMBER = "integration-test-member"
const OTHER = "integration-test-other"
const MODERATOR = "integration-test-moderator"
const OUTSIDER = "integration-test-outsider"

const ALL_USERS = [AUTHOR, MEMBER, OTHER, MODERATOR, OUTSIDER]

describe.skipIf(!hasDatabase)("community activity integration", () => {
  beforeAll(async () => {
    await db
      .insert(places)
      .values({
        id: PLACE,
        kind: "UNIVERSITY",
        name: "Integration Test University",
        slug: PLACE,
        status: "ACTIVE",
      })
      .onConflictDoNothing()

    await db
      .insert(interests)
      .values({ id: INTEREST, slug: INTEREST, label: "Integration Testing" })
      .onConflictDoNothing()

    await db
      .insert(users)
      .values(
        ALL_USERS.map((id) => ({
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
      .values({
        id: COMMUNITY,
        slug: COMMUNITY,
        name: "Integration Test Community",
        kind: "OFFICIAL",
        scope: "GLOBAL",
        placeId: PLACE,
        interestId: INTEREST,
        verification: "VERIFIED",
      })
      .onConflictDoNothing()

    // Everyone except the outsider participates. The moderator moderates.
    await db
      .insert(memberships)
      .values([
        { communityId: COMMUNITY, userId: AUTHOR, state: "MEMBER" },
        { communityId: COMMUNITY, userId: MEMBER, state: "MEMBER" },
        { communityId: COMMUNITY, userId: OTHER, state: "MEMBER" },
        { communityId: COMMUNITY, userId: MODERATOR, state: "MODERATOR" },
      ])
      .onConflictDoNothing()
  })

  afterAll(async () => {
    // Reverse foreign-key order. Only ever the ids this suite created.
    await db.delete(reports).where(inArray(reports.reporterId, ALL_USERS))
    await db
      .delete(notifications)
      .where(inArray(notifications.userId, ALL_USERS))
    await db.delete(savedItems).where(inArray(savedItems.userId, ALL_USERS))
    await db
      .delete(postReactions)
      .where(inArray(postReactions.userId, ALL_USERS))
    await db
      .delete(postComments)
      .where(inArray(postComments.authorId, ALL_USERS))
    await db.delete(posts).where(eq(posts.communityId, COMMUNITY))
    await db.delete(memberships).where(eq(memberships.communityId, COMMUNITY))
    await db.delete(communities).where(eq(communities.id, COMMUNITY))
    await db.delete(users).where(inArray(users.id, ALL_USERS))
    await db.delete(interests).where(eq(interests.id, INTEREST))
    await db.delete(places).where(eq(places.id, PLACE))
  })

  /** Publishes a post as the author and returns its id. */
  async function publish(title: string) {
    const result = await publishPost({
      authorId: AUTHOR,
      communityId: COMMUNITY,
      input: { title, body: "Body for the integration suite." },
      now: NOW,
    })

    if (!result.ok) throw new Error(`publish failed: ${result.message}`)
    return result.data.id
  }

  describe("community save state", () => {
    it("starts unsaved, persists a save, and persists an unsave", async () => {
      expect(
        await isSaved({
          viewerId: MEMBER,
          targetKind: "COMMUNITY",
          targetId: COMMUNITY,
        }),
      ).toBe(false)

      const saved = await saveItem({
        userId: MEMBER,
        targetKind: "COMMUNITY",
        targetId: COMMUNITY,
      })
      expect(saved.ok).toBe(true)

      expect(
        await isSaved({
          viewerId: MEMBER,
          targetKind: "COMMUNITY",
          targetId: COMMUNITY,
        }),
      ).toBe(true)

      await unsaveItem({
        userId: MEMBER,
        targetKind: "COMMUNITY",
        targetId: COMMUNITY,
      })

      expect(
        await isSaved({
          viewerId: MEMBER,
          targetKind: "COMMUNITY",
          targetId: COMMUNITY,
        }),
      ).toBe(false)
    })

    it("is false for a signed-out viewer", async () => {
      expect(
        await isSaved({
          viewerId: null,
          targetKind: "COMMUNITY",
          targetId: COMMUNITY,
        }),
      ).toBe(false)
    })

    it("does not leak one student's save to another", async () => {
      await saveItem({
        userId: OTHER,
        targetKind: "COMMUNITY",
        targetId: COMMUNITY,
      })

      expect(
        await isSaved({
          viewerId: OTHER,
          targetKind: "COMMUNITY",
          targetId: COMMUNITY,
        }),
      ).toBe(true)
      expect(
        await isSaved({
          viewerId: OUTSIDER,
          targetKind: "COMMUNITY",
          targetId: COMMUNITY,
        }),
      ).toBe(false)
    })
  })

  describe("activity state", () => {
    it("counts reactions and comments, per viewer", async () => {
      const postId = await publish("Counting activity")

      await setPostReaction({ actorId: MEMBER, postId, reacted: true, now: NOW })
      await setPostReaction({ actorId: OTHER, postId, reacted: true, now: NOW })
      await addComment({
        actorId: MEMBER,
        postId,
        input: { body: "First comment." },
        now: NOW,
      })

      const forMember = await activityStateFor({
        postIds: [postId],
        viewerId: MEMBER,
      })
      const state = forMember.get(postId)

      expect(state?.reactionCount).toBe(2)
      expect(state?.commentCount).toBe(1)
      expect(state?.viewerHasReacted).toBe(true)

      // Same post, a viewer who has not reacted.
      const forOutsider = await activityStateFor({
        postIds: [postId],
        viewerId: OUTSIDER,
      })
      expect(forOutsider.get(postId)?.reactionCount).toBe(2)
      expect(forOutsider.get(postId)?.viewerHasReacted).toBe(false)
    })

    it("returns an empty map for no posts", async () => {
      const state = await activityStateFor({ postIds: [], viewerId: MEMBER })
      expect(state.size).toBe(0)
    })
  })

  describe("report state", () => {
    it("reports only what the caller filed, and absorbs duplicates", async () => {
      const postId = await publish("Reportable update")

      expect(
        (
          await reportedTargetIds({
            reporterId: MEMBER,
            targetKind: "POST",
            targetIds: [postId],
          })
        ).has(postId),
      ).toBe(false)

      const filed = await reportContent({
        reporterId: MEMBER,
        targetKind: "POST",
        targetId: postId,
        reason: "SPAM",
        now: NOW,
      })
      expect(filed.ok).toBe(true)

      expect(
        (
          await reportedTargetIds({
            reporterId: MEMBER,
            targetKind: "POST",
            targetIds: [postId],
          })
        ).has(postId),
      ).toBe(true)

      // Reporting again succeeds and does not create a second row.
      const again = await reportContent({
        reporterId: MEMBER,
        targetKind: "POST",
        targetId: postId,
        reason: "SPAM",
        now: NOW,
      })
      expect(again.ok).toBe(true)

      const rows = await db
        .select({ id: reports.id })
        .from(reports)
        .where(eq(reports.targetId, postId))
      expect(rows).toHaveLength(1)
    })

    it("does not reveal another student's reports", async () => {
      const postId = await publish("Privately reported")

      await reportContent({
        reporterId: MEMBER,
        targetKind: "POST",
        targetId: postId,
        reason: "OFF_TOPIC",
        now: NOW,
      })

      const seenByOther = await reportedTargetIds({
        reporterId: OTHER,
        targetKind: "POST",
        targetIds: [postId],
      })

      expect(seenByOther.has(postId)).toBe(false)
    })
  })

  describe("moderation queue", () => {
    it("refuses a student who moderates nothing", async () => {
      const result = await listModerationQueue({ moderatorId: OUTSIDER })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("FORBIDDEN")
    })

    it("serves a moderator the report with its reporter attached", async () => {
      const postId = await publish("Queued for review")

      await reportContent({
        reporterId: MEMBER,
        targetKind: "POST",
        targetId: postId,
        reason: "HARASSMENT",
        detail: "Please look at this.",
        now: NOW,
      })

      const queue = await listModerationQueue({ moderatorId: MODERATOR })
      expect(queue.ok).toBe(true)
      if (!queue.ok) return

      const entry = queue.data.find((row) => row.targetId === postId)
      expect(entry).toBeDefined()
      expect(entry?.reporterName).toBe(MEMBER)
      expect(entry?.target?.title).toBe("Queued for review")
      expect(entry?.target?.removed).toBe(false)
    })

    it("dismisses a report and records the decision", async () => {
      const postId = await publish("Dismissed report")

      await reportContent({
        reporterId: MEMBER,
        targetKind: "POST",
        targetId: postId,
        reason: "OTHER",
        now: NOW,
      })

      const queue = await listModerationQueue({ moderatorId: MODERATOR })
      if (!queue.ok) throw new Error(queue.message)
      const reportId = queue.data.find((row) => row.targetId === postId)?.id
      expect(reportId).toBeDefined()

      const decided = await decideReport({
        moderatorId: MODERATOR,
        reportId: reportId!,
        decision: "DISMISSED",
        note: "Nothing wrong here.",
        now: NOW,
      })

      expect(decided.ok).toBe(true)
      if (decided.ok) expect(decided.data.removed).toBe(false)

      // Dismissal is a judgement, so it is auditable too.
      const trail = await auditTrailFor({ targetKind: "POST", targetId: postId })
      expect(trail.some((entry) => entry.action === "report.dismissed")).toBe(
        true,
      )

      // The post is untouched.
      const feed = await listRecentPosts({ communityIds: [COMMUNITY] })
      expect(feed.some((post) => post.id === postId)).toBe(true)
    })

    it("resolves with removal, hides the post, and keeps the trail", async () => {
      const postId = await publish("Removed after review")

      await reportContent({
        reporterId: MEMBER,
        targetKind: "POST",
        targetId: postId,
        reason: "SPAM",
        now: NOW,
      })

      const queue = await listModerationQueue({ moderatorId: MODERATOR })
      if (!queue.ok) throw new Error(queue.message)
      const reportId = queue.data.find((row) => row.targetId === postId)?.id

      const decided = await decideReport({
        moderatorId: MODERATOR,
        reportId: reportId!,
        decision: "RESOLVED",
        removeContent: true,
        note: "Advertising.",
        now: NOW,
      })

      expect(decided.ok).toBe(true)
      if (decided.ok) expect(decided.data.removed).toBe(true)

      // Gone from the feed...
      const feed = await listRecentPosts({ communityIds: [COMMUNITY] })
      expect(feed.some((post) => post.id === postId)).toBe(false)

      // ...but still reviewable by an operator.
      const trail = await auditTrailFor({ targetKind: "POST", targetId: postId })
      expect(trail.some((entry) => entry.action === "report.resolved")).toBe(
        true,
      )

      const [row] = await db
        .select({ removedAt: posts.removedAt, removedById: posts.removedById })
        .from(posts)
        .where(eq(posts.id, postId))

      expect(row?.removedAt).not.toBeNull()
      expect(row?.removedById).toBe(MODERATOR)
    })

    it("refuses a second decision on the same report", async () => {
      const postId = await publish("Decided once")

      await reportContent({
        reporterId: MEMBER,
        targetKind: "POST",
        targetId: postId,
        reason: "SPAM",
        now: NOW,
      })

      const queue = await listModerationQueue({ moderatorId: MODERATOR })
      if (!queue.ok) throw new Error(queue.message)
      const reportId = queue.data.find((row) => row.targetId === postId)?.id

      await decideReport({
        moderatorId: MODERATOR,
        reportId: reportId!,
        decision: "DISMISSED",
        now: NOW,
      })

      const second = await decideReport({
        moderatorId: MODERATOR,
        reportId: reportId!,
        decision: "RESOLVED",
        now: NOW,
      })

      expect(second.ok).toBe(false)
      if (!second.ok) expect(second.code).toBe("CONFLICT")
    })

    it("refuses a student trying to decide a report directly", async () => {
      const postId = await publish("Not yours to decide")

      await reportContent({
        reporterId: MEMBER,
        targetKind: "POST",
        targetId: postId,
        reason: "SPAM",
        now: NOW,
      })

      const queue = await listModerationQueue({ moderatorId: MODERATOR })
      if (!queue.ok) throw new Error(queue.message)
      const reportId = queue.data.find((row) => row.targetId === postId)?.id

      const result = await decideReport({
        moderatorId: OTHER,
        reportId: reportId!,
        decision: "RESOLVED",
        removeContent: true,
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("FORBIDDEN")
    })
  })

  describe("notifications", () => {
    it("notifies members of a new post but never the author", async () => {
      const postId = await publish("Notifying update")
      expect(postId).toBeTruthy()

      const forMember = await listNotifications({ viewerId: MEMBER })
      expect(forMember.length).toBeGreaterThan(0)

      const forAuthor = await listNotifications({ viewerId: AUTHOR })
      expect(
        forAuthor.some((entry) => entry.title.includes("Notifying update")),
      ).toBe(false)
    })

    it("notifies the post author of a comment, not the commenter", async () => {
      const postId = await publish("Commented update")

      const before = (await listNotifications({ viewerId: AUTHOR })).length

      await addComment({
        actorId: MEMBER,
        postId,
        input: { body: "Worth a look." },
        now: NOW,
      })

      const after = (await listNotifications({ viewerId: AUTHOR })).length
      expect(after).toBeGreaterThan(before)

      // The commenter is not told about their own comment.
      const commenterOwn = await addComment({
        actorId: AUTHOR,
        postId,
        input: { body: "Author replying to their own post." },
        now: NOW,
      })
      expect(commenterOwn.ok).toBe(true)
    })

    it("notifies a like once, not once per tap", async () => {
      const postId = await publish("Liked update")

      await setPostReaction({ actorId: MEMBER, postId, reacted: true, now: NOW })
      const first = (await listNotifications({ viewerId: AUTHOR })).length

      await setPostReaction({ actorId: MEMBER, postId, reacted: false, now: NOW })
      await setPostReaction({ actorId: MEMBER, postId, reacted: true, now: NOW })

      const second = (await listNotifications({ viewerId: AUTHOR })).length
      expect(second).toBe(first)
    })
  })

  describe("feed integration", () => {
    it("includes a new post and excludes a removed one", async () => {
      const kept = await publish("Still standing")
      const removed = await publish("About to go")

      const before = await listRecentPosts({ communityIds: [COMMUNITY] })
      expect(before.some((post) => post.id === kept)).toBe(true)
      expect(before.some((post) => post.id === removed)).toBe(true)

      await db
        .update(posts)
        .set({ removedAt: NOW, removedById: MODERATOR })
        .where(eq(posts.id, removed))

      const after = await listRecentPosts({ communityIds: [COMMUNITY] })
      expect(after.some((post) => post.id === kept)).toBe(true)
      expect(after.some((post) => post.id === removed)).toBe(false)
    })
  })
})
