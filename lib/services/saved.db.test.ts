// @vitest-environment node

import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import {
  communities,
  events,
  interests,
  savedItems,
  users,
} from "@/lib/db/schema"
import {
  isSaved,
  listSavedItems,
  saveItem,
  savedTargetIds,
  saveCountsFor,
  unsaveItem,
} from "@/lib/services/saved"

const hasDatabase = Boolean(process.env.DATABASE_URL)

const INTEREST = "sv-interest"
const COMMUNITY = "sv-community"
const OTHER_COMMUNITY = "sv-community-other"
const EVENT = "sv-event"
const SECOND_EVENT = "sv-event-second"

const STUDENT = "sv-student"
const OTHER_STUDENT = "sv-student-other"

const USER_IDS = [STUDENT, OTHER_STUDENT]
const COMMUNITY_IDS = [COMMUNITY, OTHER_COMMUNITY]

const NOW = new Date("2026-05-01T00:00:00.000Z")
const STARTS = new Date("2026-05-10T10:00:00.000Z")
const ENDS = new Date("2026-05-10T12:00:00.000Z")

async function cleanup() {
  await db.delete(savedItems).where(inArray(savedItems.userId, USER_IDS))
  await db.delete(events).where(inArray(events.communityId, COMMUNITY_IDS))
  await db.delete(communities).where(inArray(communities.id, COMMUNITY_IDS))
  await db.delete(users).where(inArray(users.id, USER_IDS))
  await db.delete(interests).where(eq(interests.id, INTEREST))
}

describe.skipIf(!hasDatabase)("saved items service", () => {
  beforeAll(async () => {
    await cleanup()

    await db
      .insert(interests)
      .values({ id: INTEREST, slug: "sv-testing", label: "Testing" })

    await db.insert(communities).values([
      {
        id: COMMUNITY,
        slug: "sv-coding-club",
        name: "Coding Club",
        kind: "OFFICIAL",
        scope: "GLOBAL",
        interestId: INTEREST,
        verification: "VERIFIED",
      },
      {
        id: OTHER_COMMUNITY,
        slug: "sv-ai-society",
        name: "AI Society",
        kind: "OFFICIAL",
        scope: "GLOBAL",
        interestId: INTEREST,
        verification: "VERIFIED",
      },
    ])

    await db.insert(users).values(
      USER_IDS.map((id) => ({
        id,
        name: `Person ${id}`,
        email: `${id}@sv-campus.test`,
        passwordHash: "not-a-real-hash",
      })),
    )

    await db.insert(events).values([
      {
        id: EVENT,
        slug: "sv-ai-workshop",
        title: "AI Workshop",
        kind: "WORKSHOP",
        status: "PUBLISHED",
        startsAt: STARTS,
        endsAt: ENDS,
        communityId: COMMUNITY,
        interestId: INTEREST,
      },
      {
        id: SECOND_EVENT,
        slug: "sv-hack-night",
        title: "Hack Night",
        kind: "MEETUP",
        status: "PUBLISHED",
        startsAt: STARTS,
        endsAt: ENDS,
        communityId: COMMUNITY,
        interestId: INTEREST,
      },
    ])
  })

  afterAll(cleanup)

  beforeEach(async () => {
    await db.delete(savedItems).where(inArray(savedItems.userId, USER_IDS))
  })

  describe("saveItem", () => {
    it("saves an event and reports it saved", async () => {
      const result = await saveItem({
        userId: STUDENT,
        targetKind: "EVENT",
        targetId: EVENT,
      })

      expect(result).toEqual({ ok: true, data: { saved: true } })
      expect(
        await isSaved({
          viewerId: STUDENT,
          targetKind: "EVENT",
          targetId: EVENT,
        }),
      ).toBe(true)
    })

    it("saves a community", async () => {
      const result = await saveItem({
        userId: STUDENT,
        targetKind: "COMMUNITY",
        targetId: COMMUNITY,
      })

      expect(result.ok).toBe(true)
    })

    /**
     * The interesting half of idempotency is the row count, not the return
     * value. Two taps must leave one bookmark.
     */
    it("is idempotent, and leaves exactly one row", async () => {
      await saveItem({ userId: STUDENT, targetKind: "EVENT", targetId: EVENT })
      const again = await saveItem({
        userId: STUDENT,
        targetKind: "EVENT",
        targetId: EVENT,
      })

      expect(again.ok).toBe(true)

      const rows = await db
        .select({ id: savedItems.id })
        .from(savedItems)
        .where(eq(savedItems.userId, STUDENT))

      expect(rows).toHaveLength(1)
    })

    it("refuses a kind Cirqles cannot save", async () => {
      const result = await saveItem({
        userId: STUDENT,
        targetKind: "USER",
        targetId: OTHER_STUDENT,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("INVALID")
    })

    it("refuses a target that does not exist", async () => {
      const result = await saveItem({
        userId: STUDENT,
        targetKind: "EVENT",
        targetId: "sv-no-such-event",
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("NOT_FOUND")
    })

    it("refuses an empty identifier", async () => {
      const result = await saveItem({
        userId: STUDENT,
        targetKind: "EVENT",
        targetId: "   ",
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("INVALID")
    })
  })

  describe("unsaveItem", () => {
    it("removes the bookmark", async () => {
      await saveItem({ userId: STUDENT, targetKind: "EVENT", targetId: EVENT })

      const result = await unsaveItem({
        userId: STUDENT,
        targetKind: "EVENT",
        targetId: EVENT,
      })

      expect(result).toEqual({ ok: true, data: { saved: false } })
      expect(
        await isSaved({
          viewerId: STUDENT,
          targetKind: "EVENT",
          targetId: EVENT,
        }),
      ).toBe(false)
    })

    it("unsaving something that was never saved is a success", async () => {
      const result = await unsaveItem({
        userId: STUDENT,
        targetKind: "EVENT",
        targetId: EVENT,
      })

      expect(result.ok).toBe(true)
    })

    /** The `userId` predicate is the whole authorization story. */
    it("cannot remove another student's bookmark", async () => {
      await saveItem({
        userId: OTHER_STUDENT,
        targetKind: "EVENT",
        targetId: EVENT,
      })

      await unsaveItem({
        userId: STUDENT,
        targetKind: "EVENT",
        targetId: EVENT,
      })

      expect(
        await isSaved({
          viewerId: OTHER_STUDENT,
          targetKind: "EVENT",
          targetId: EVENT,
        }),
      ).toBe(true)
    })
  })

  describe("reading saved items", () => {
    it("persists across calls, which is what a reload does", async () => {
      await saveItem({ userId: STUDENT, targetKind: "EVENT", targetId: EVENT })

      const items = await listSavedItems({ viewerId: STUDENT, now: NOW })

      expect(items).toHaveLength(1)
      expect(items[0].kind).toBe("EVENT")
      expect(items[0].href).toBe("/events/sv-ai-workshop")
    })

    it("returns newest saved first", async () => {
      await saveItem({ userId: STUDENT, targetKind: "EVENT", targetId: EVENT })
      await new Promise((resolve) => setTimeout(resolve, 5))
      await saveItem({
        userId: STUDENT,
        targetKind: "EVENT",
        targetId: SECOND_EVENT,
      })

      const items = await listSavedItems({ viewerId: STUDENT, now: NOW })
      const savedAt = items.map((item) => Date.parse(item.savedAt))

      expect([...savedAt].sort((a, b) => b - a)).toEqual(savedAt)
    })

    it("filters by kind", async () => {
      await saveItem({ userId: STUDENT, targetKind: "EVENT", targetId: EVENT })
      await saveItem({
        userId: STUDENT,
        targetKind: "COMMUNITY",
        targetId: COMMUNITY,
      })

      const communitiesOnly = await listSavedItems({
        viewerId: STUDENT,
        kind: "COMMUNITY",
        now: NOW,
      })

      expect(communitiesOnly).toHaveLength(1)
      expect(communitiesOnly[0].kind).toBe("COMMUNITY")
    })

    it("never returns another student's saves", async () => {
      await saveItem({
        userId: OTHER_STUDENT,
        targetKind: "EVENT",
        targetId: EVENT,
      })

      expect(await listSavedItems({ viewerId: STUDENT, now: NOW })).toEqual([])
    })

    it("projects rather than leaking rows - a saved event carries its registration state", async () => {
      await saveItem({ userId: STUDENT, targetKind: "EVENT", targetId: EVENT })

      const [item] = await listSavedItems({ viewerId: STUDENT, now: NOW })

      expect(item.kind).toBe("EVENT")
      if (item.kind !== "EVENT") return
      expect(item.event.viewerRegistration).toBe("NONE")
      expect(JSON.stringify(item)).not.toContain("@sv-campus.test")
    })

    it("gives a signed-out viewer no saved ids", async () => {
      const ids = await savedTargetIds({
        viewerId: null,
        targetKind: "EVENT",
      })

      expect(ids.size).toBe(0)
    })

    it("reports the ids of one kind for a card list", async () => {
      await saveItem({ userId: STUDENT, targetKind: "EVENT", targetId: EVENT })
      await saveItem({
        userId: STUDENT,
        targetKind: "COMMUNITY",
        targetId: COMMUNITY,
      })

      const ids = await savedTargetIds({
        viewerId: STUDENT,
        targetKind: "EVENT",
      })

      expect([...ids]).toEqual([EVENT])
    })

    it("counts saves per target across students", async () => {
      await saveItem({ userId: STUDENT, targetKind: "EVENT", targetId: EVENT })
      await saveItem({
        userId: OTHER_STUDENT,
        targetKind: "EVENT",
        targetId: EVENT,
      })

      const counts = await saveCountsFor({
        targetKind: "EVENT",
        targetIds: [EVENT, SECOND_EVENT],
      })

      expect(counts.get(EVENT)).toBe(2)
      expect(counts.get(SECOND_EVENT)).toBeUndefined()
    })
  })
})
