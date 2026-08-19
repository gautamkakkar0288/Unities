// @vitest-environment node

import { and, eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import {
  communities,
  eventRegistrations,
  events,
  interests,
  memberships,
  notifications,
  users,
} from "@/lib/db/schema"
import {
  cancelEvent,
  cancelRegistration,
  registerForEvent,
} from "@/lib/services/events"
import {
  countUnreadNotifications,
  createNotification,
  createNotifications,
  hasNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notifications"

const hasDatabase = Boolean(process.env.DATABASE_URL)

const INTEREST = "nt-interest"
const COMMUNITY = "nt-community"

const OWNER = "nt-owner"
const STUDENT = "nt-student"
const OTHER_STUDENT = "nt-student-other"

const USER_IDS = [OWNER, STUDENT, OTHER_STUDENT]
const COMMUNITY_IDS = [COMMUNITY]

const ONE_SEAT = "nt-one-seat"
const UNLIMITED = "nt-unlimited"

const NOW = new Date("2026-05-01T00:00:00.000Z")
const STARTS = new Date("2026-05-10T10:00:00.000Z")
const ENDS = new Date("2026-05-10T12:00:00.000Z")

async function cleanup() {
  await db
    .delete(notifications)
    .where(inArray(notifications.userId, USER_IDS))
  await db
    .delete(eventRegistrations)
    .where(inArray(eventRegistrations.userId, USER_IDS))
  await db.delete(events).where(inArray(events.communityId, COMMUNITY_IDS))
  await db.delete(memberships).where(inArray(memberships.userId, USER_IDS))
  await db.delete(communities).where(inArray(communities.id, COMMUNITY_IDS))
  await db.delete(users).where(inArray(users.id, USER_IDS))
  await db.delete(interests).where(eq(interests.id, INTEREST))
}

async function resetEvents() {
  await db.delete(events).where(inArray(events.communityId, COMMUNITY_IDS))

  await db.insert(events).values([
    {
      id: ONE_SEAT,
      slug: "nt-one-seat",
      title: "Startup Office Hours",
      kind: "WORKSHOP",
      status: "PUBLISHED",
      startsAt: STARTS,
      endsAt: ENDS,
      capacity: 1,
      communityId: COMMUNITY,
      interestId: INTEREST,
    },
    {
      id: UNLIMITED,
      slug: "nt-unlimited",
      title: "AI Workshop",
      kind: "TALK",
      status: "PUBLISHED",
      startsAt: STARTS,
      endsAt: ENDS,
      capacity: null,
      communityId: COMMUNITY,
      interestId: INTEREST,
    },
  ])
}

async function notificationsFor(userId: string) {
  return db
    .select({
      id: notifications.id,
      title: notifications.title,
      kind: notifications.kind,
      targetId: notifications.targetId,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
}

describe.skipIf(!hasDatabase)("notifications service", () => {
  beforeAll(async () => {
    await cleanup()

    await db
      .insert(interests)
      .values({ id: INTEREST, slug: "nt-testing", label: "Testing" })

    await db.insert(communities).values({
      id: COMMUNITY,
      slug: "nt-coding-club",
      name: "Coding Club",
      kind: "OFFICIAL",
      scope: "GLOBAL",
      interestId: INTEREST,
      verification: "VERIFIED",
    })

    await db.insert(users).values(
      USER_IDS.map((id) => ({
        id,
        name: `Person ${id}`,
        email: `${id}@nt-campus.test`,
        passwordHash: "not-a-real-hash",
      })),
    )

    await db
      .insert(memberships)
      .values([{ communityId: COMMUNITY, userId: OWNER, state: "OWNER" }])
  })

  afterAll(cleanup)

  beforeEach(async () => {
    await db
      .delete(notifications)
      .where(inArray(notifications.userId, USER_IDS))
    await db
      .delete(eventRegistrations)
      .where(inArray(eventRegistrations.userId, USER_IDS))
    await resetEvents()
  })

  describe("creating and reading", () => {
    it("writes one and reads it back projected", async () => {
      await createNotification({
        notification: {
          userId: STUDENT,
          kind: "EVENT_REMINDER",
          title: "You're registered for AI Workshop",
          body: "Your seat is confirmed.",
          targetKind: "EVENT",
          targetId: UNLIMITED,
          createdAt: NOW,
        },
      })

      const [item] = await listNotifications({ viewerId: STUDENT })

      expect(item.title).toBe("You're registered for AI Workshop")
      expect(item.read).toBe(false)
      // Resolved from the events table, not stored - and not a fake URL.
      expect(item.href).toBe("/events/nt-unlimited")
      expect(item.createdAt).toBe(NOW.toISOString())
    })

    it("writes many in one statement", async () => {
      await createNotifications({
        notifications: [STUDENT, OTHER_STUDENT].map((userId) => ({
          userId,
          kind: "EVENT_REMINDER" as const,
          title: "AI Workshop has been cancelled",
          targetKind: "EVENT" as const,
          targetId: UNLIMITED,
          createdAt: NOW,
        })),
      })

      expect(await notificationsFor(STUDENT)).toHaveLength(1)
      expect(await notificationsFor(OTHER_STUDENT)).toHaveLength(1)
    })

    it("writing an empty list does nothing rather than failing", async () => {
      await createNotifications({ notifications: [] })
      expect(await notificationsFor(STUDENT)).toHaveLength(0)
    })

    it("leaves the link off when the target has been deleted", async () => {
      await createNotification({
        notification: {
          userId: STUDENT,
          kind: "EVENT_REMINDER",
          title: "Something that is gone",
          targetKind: "EVENT",
          targetId: "nt-deleted-event",
          createdAt: NOW,
        },
      })

      const [item] = await listNotifications({ viewerId: STUDENT })

      // The text still says something true; only the dead link is dropped.
      expect(item.title).toBe("Something that is gone")
      expect(item.href).toBeNull()
    })

    it("orders newest first", async () => {
      await createNotifications({
        notifications: [
          {
            userId: STUDENT,
            kind: "ACTIVITY",
            title: "Older",
            createdAt: new Date("2026-04-01T00:00:00.000Z"),
          },
          {
            userId: STUDENT,
            kind: "ACTIVITY",
            title: "Newer",
            createdAt: new Date("2026-04-30T00:00:00.000Z"),
          },
        ],
      })

      const items = await listNotifications({ viewerId: STUDENT })
      expect(items.map((item) => item.title)).toEqual(["Newer", "Older"])
    })

    it("paginates by cursor rather than offset", async () => {
      await createNotifications({
        notifications: [
          {
            userId: STUDENT,
            kind: "ACTIVITY",
            title: "First",
            createdAt: new Date("2026-04-01T00:00:00.000Z"),
          },
          {
            userId: STUDENT,
            kind: "ACTIVITY",
            title: "Second",
            createdAt: new Date("2026-04-02T00:00:00.000Z"),
          },
        ],
      })

      const page = await listNotifications({
        viewerId: STUDENT,
        before: "2026-04-02T00:00:00.000Z",
      })

      expect(page.map((item) => item.title)).toEqual(["First"])
    })

    it("can return only what is unread", async () => {
      await createNotifications({
        notifications: [
          { userId: STUDENT, kind: "ACTIVITY", title: "One", createdAt: NOW },
          { userId: STUDENT, kind: "ACTIVITY", title: "Two", createdAt: NOW },
        ],
      })

      const [first] = await notificationsFor(STUDENT)
      await markNotificationRead({
        viewerId: STUDENT,
        notificationId: first.id,
      })

      const unread = await listNotifications({
        viewerId: STUDENT,
        unreadOnly: true,
      })

      expect(unread).toHaveLength(1)
      expect(unread[0].read).toBe(false)
    })

    it("never returns another student's notifications", async () => {
      await createNotification({
        notification: {
          userId: OTHER_STUDENT,
          kind: "ACTIVITY",
          title: "Not yours",
          createdAt: NOW,
        },
      })

      expect(await listNotifications({ viewerId: STUDENT })).toEqual([])
    })
  })

  describe("read state and the badge", () => {
    it("counts only this student's unread", async () => {
      await createNotifications({
        notifications: [
          { userId: STUDENT, kind: "ACTIVITY", title: "A", createdAt: NOW },
          { userId: STUDENT, kind: "ACTIVITY", title: "B", createdAt: NOW },
          {
            userId: OTHER_STUDENT,
            kind: "ACTIVITY",
            title: "Theirs",
            createdAt: NOW,
          },
        ],
      })

      expect(await countUnreadNotifications(STUDENT)).toBe(2)
      expect(await countUnreadNotifications(OTHER_STUDENT)).toBe(1)
    })

    it("marking one read drops the count by exactly one", async () => {
      await createNotifications({
        notifications: [
          { userId: STUDENT, kind: "ACTIVITY", title: "A", createdAt: NOW },
          { userId: STUDENT, kind: "ACTIVITY", title: "B", createdAt: NOW },
        ],
      })

      const [first] = await notificationsFor(STUDENT)
      const result = await markNotificationRead({
        viewerId: STUDENT,
        notificationId: first.id,
      })

      expect(result.ok).toBe(true)
      expect(await countUnreadNotifications(STUDENT)).toBe(1)
    })

    it("marking the same one twice is a success, not an error", async () => {
      await createNotification({
        notification: {
          userId: STUDENT,
          kind: "ACTIVITY",
          title: "A",
          createdAt: NOW,
        },
      })

      const [only] = await notificationsFor(STUDENT)
      await markNotificationRead({ viewerId: STUDENT, notificationId: only.id })
      const again = await markNotificationRead({
        viewerId: STUDENT,
        notificationId: only.id,
      })

      expect(again.ok).toBe(true)
    })

    /**
     * The important half: not just that it fails, but that the other student's
     * notification is still unread afterwards.
     */
    it("cannot mark another student's notification read", async () => {
      await createNotification({
        notification: {
          userId: OTHER_STUDENT,
          kind: "ACTIVITY",
          title: "Not yours",
          createdAt: NOW,
        },
      })

      const [theirs] = await notificationsFor(OTHER_STUDENT)
      const result = await markNotificationRead({
        viewerId: STUDENT,
        notificationId: theirs.id,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("NOT_FOUND")
      expect(await countUnreadNotifications(OTHER_STUDENT)).toBe(1)
    })

    it("refuses an empty identifier", async () => {
      const result = await markNotificationRead({
        viewerId: STUDENT,
        notificationId: "  ",
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("INVALID")
    })

    it("marks all read, and only this student's", async () => {
      await createNotifications({
        notifications: [
          { userId: STUDENT, kind: "ACTIVITY", title: "A", createdAt: NOW },
          { userId: STUDENT, kind: "ACTIVITY", title: "B", createdAt: NOW },
          {
            userId: OTHER_STUDENT,
            kind: "ACTIVITY",
            title: "Theirs",
            createdAt: NOW,
          },
        ],
      })

      const result = await markAllNotificationsRead({ viewerId: STUDENT })

      expect(result).toEqual({ ok: true, data: { marked: 2 } })
      expect(await countUnreadNotifications(STUDENT)).toBe(0)
      expect(await countUnreadNotifications(OTHER_STUDENT)).toBe(1)
    })

    it("marking all read with nothing unread marks nothing", async () => {
      const result = await markAllNotificationsRead({ viewerId: STUDENT })
      expect(result).toEqual({ ok: true, data: { marked: 0 } })
    })
  })

  describe("hasNotification", () => {
    it("reports whether this person has already been told", async () => {
      await createNotification({
        notification: {
          userId: STUDENT,
          kind: "EVENT_REMINDER",
          title: "Told once",
          targetKind: "EVENT",
          targetId: UNLIMITED,
          createdAt: NOW,
        },
      })

      expect(
        await hasNotification({
          userId: STUDENT,
          kind: "EVENT_REMINDER",
          targetKind: "EVENT",
          targetId: UNLIMITED,
        }),
      ).toBe(true)

      expect(
        await hasNotification({
          userId: OTHER_STUDENT,
          kind: "EVENT_REMINDER",
          targetKind: "EVENT",
          targetId: UNLIMITED,
        }),
      ).toBe(false)
    })
  })

  /**
   * These are the cases that matter most: they assert that notifications come
   * from real state changes rather than from seed data or a component.
   */
  describe("generated by real actions", () => {
    it("registering leaves a confirmation", async () => {
      await registerForEvent({ userId: STUDENT, eventId: UNLIMITED, now: NOW })

      const rows = await notificationsFor(STUDENT)

      expect(rows).toHaveLength(1)
      expect(rows[0].title).toContain("You're registered for AI Workshop")
      expect(rows[0].targetId).toBe(UNLIMITED)
    })

    it("registering twice does not send a second confirmation", async () => {
      await registerForEvent({ userId: STUDENT, eventId: UNLIMITED, now: NOW })
      await registerForEvent({ userId: STUDENT, eventId: UNLIMITED, now: NOW })

      expect(await notificationsFor(STUDENT)).toHaveLength(1)
    })

    it("being waitlisted says so, with a position", async () => {
      await registerForEvent({ userId: OWNER, eventId: ONE_SEAT, now: NOW })
      await registerForEvent({ userId: STUDENT, eventId: ONE_SEAT, now: NOW })

      const rows = await notificationsFor(STUDENT)

      expect(rows).toHaveLength(1)
      expect(rows[0].title).toContain("#1 on the waitlist")
    })

    it("promotion notifies the promoted student, not the one who left", async () => {
      await registerForEvent({ userId: OWNER, eventId: ONE_SEAT, now: NOW })
      await registerForEvent({ userId: STUDENT, eventId: ONE_SEAT, now: NOW })

      await db
        .delete(notifications)
        .where(inArray(notifications.userId, USER_IDS))

      const result = await cancelRegistration({
        userId: OWNER,
        eventId: ONE_SEAT,
        now: NOW,
      })

      expect(result).toEqual({ ok: true, data: { promoted: STUDENT } })

      const promoted = await notificationsFor(STUDENT)
      expect(promoted).toHaveLength(1)
      expect(promoted[0].title).toContain("off the waitlist")

      // The student who gave up the seat is told nothing; they did it on purpose.
      expect(await notificationsFor(OWNER)).toHaveLength(0)
    })

    it("cancelling an event tells everyone holding a place or waiting for one", async () => {
      await registerForEvent({ userId: STUDENT, eventId: ONE_SEAT, now: NOW })
      await registerForEvent({
        userId: OTHER_STUDENT,
        eventId: ONE_SEAT,
        now: NOW,
      })

      await db
        .delete(notifications)
        .where(inArray(notifications.userId, USER_IDS))

      const result = await cancelEvent({
        actorId: OWNER,
        eventId: ONE_SEAT,
        now: NOW,
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.notified).toBe(2)

      for (const userId of [STUDENT, OTHER_STUDENT]) {
        const rows = await db
          .select({ title: notifications.title })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, userId),
              eq(notifications.targetId, ONE_SEAT),
            ),
          )

        expect(rows).toHaveLength(1)
        expect(rows[0].title).toContain("has been cancelled")
      }
    })

    it("a refused registration writes no notification", async () => {
      await cancelEvent({ actorId: OWNER, eventId: UNLIMITED, now: NOW })
      await db
        .delete(notifications)
        .where(inArray(notifications.userId, USER_IDS))

      const result = await registerForEvent({
        userId: STUDENT,
        eventId: UNLIMITED,
        now: NOW,
      })

      expect(result.ok).toBe(false)
      expect(await notificationsFor(STUDENT)).toHaveLength(0)
    })
  })
})
