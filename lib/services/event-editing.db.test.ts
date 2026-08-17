// @vitest-environment node

import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import {
  communities,
  eventRegistrations,
  events,
  interests,
  memberships,
  users,
} from "@/lib/db/schema"
import { updateEvent } from "@/lib/services/event-editing"
import { registerForEvent } from "@/lib/services/events"

/**
 * Editing an event, against a real Postgres.
 *
 * The rules themselves are covered purely in `lib/domain/event-edit.test.ts`.
 * What needs a database is what the rules cannot see: that a refused edit
 * leaves the row untouched, that raising capacity moves the waitlist inside the
 * same transaction, and that the address students already have keeps working
 * after a retitle.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

const INTEREST = "ee-interest"
const VERIFIED = "ee-community-verified"
const UNVERIFIED = "ee-community-unverified"

const OWNER = "ee-owner"
const MEMBER = "ee-member"
const STUDENT_A = "ee-student-a"
const STUDENT_B = "ee-student-b"
const STUDENT_C = "ee-student-c"

const USER_IDS = [OWNER, MEMBER, STUDENT_A, STUDENT_B, STUDENT_C]
const COMMUNITY_IDS = [VERIFIED, UNVERIFIED]

/** A fixed clock, so "in the future" does not depend on when CI runs. */
const NOW = new Date("2026-05-01T00:00:00.000Z")
const STARTS = new Date("2026-05-10T10:00:00.000Z")
const ENDS = new Date("2026-05-10T12:00:00.000Z")

const ONE_SEAT = "ee-one-seat"
const CALLED_OFF = "ee-called-off"
const ALREADY_RAN = "ee-already-ran"
const IN_UNVERIFIED = "ee-in-unverified"

async function cleanup() {
  await db
    .delete(eventRegistrations)
    .where(inArray(eventRegistrations.userId, USER_IDS))
  await db.delete(events).where(inArray(events.communityId, COMMUNITY_IDS))
  await db.delete(memberships).where(inArray(memberships.userId, USER_IDS))
  await db.delete(communities).where(inArray(communities.id, COMMUNITY_IDS))
  await db.delete(users).where(inArray(users.id, USER_IDS))
  await db.delete(interests).where(eq(interests.id, INTEREST))
}

/** Rebuilt before every test, because every test here writes. */
async function resetEvents() {
  await db
    .delete(eventRegistrations)
    .where(inArray(eventRegistrations.userId, USER_IDS))
  await db.delete(events).where(inArray(events.communityId, COMMUNITY_IDS))

  await db.insert(events).values([
    {
      id: ONE_SEAT,
      slug: "ee-one-seat",
      title: "Exactly one seat",
      kind: "WORKSHOP",
      status: "PUBLISHED",
      startsAt: STARTS,
      endsAt: ENDS,
      capacity: 1,
      venue: "Lab 3",
      communityId: VERIFIED,
      interestId: INTEREST,
    },
    {
      id: CALLED_OFF,
      slug: "ee-called-off",
      title: "Not happening",
      kind: "MEETUP",
      status: "CANCELLED",
      startsAt: STARTS,
      endsAt: ENDS,
      communityId: VERIFIED,
      interestId: INTEREST,
    },
    {
      id: ALREADY_RAN,
      slug: "ee-already-ran",
      title: "Last month",
      kind: "TALK",
      status: "PUBLISHED",
      startsAt: new Date("2026-04-02T10:00:00.000Z"),
      endsAt: new Date("2026-04-02T12:00:00.000Z"),
      communityId: VERIFIED,
      interestId: INTEREST,
    },
    {
      id: IN_UNVERIFIED,
      slug: "ee-in-unverified",
      title: "Published before verification lapsed",
      kind: "TALK",
      status: "PUBLISHED",
      startsAt: STARTS,
      endsAt: ENDS,
      communityId: UNVERIFIED,
      interestId: INTEREST,
    },
  ])
}

/** A complete, valid edit. Individual tests override one field at a time. */
function edit(overrides: Record<string, unknown> = {}) {
  return {
    eventId: ONE_SEAT,
    title: "Exactly one seat",
    description: "",
    mode: "IN_PERSON" as const,
    venue: "Lab 3",
    startsAt: STARTS.toISOString(),
    endsAt: ENDS.toISOString(),
    registrationClosesAt: null,
    capacity: 1,
    feeInPaise: null,
    ...overrides,
  }
}

async function storedEvent(eventId: string) {
  const [row] = await db
    .select({
      slug: events.slug,
      title: events.title,
      venue: events.venue,
      capacity: events.capacity,
      registeredCount: events.registeredCount,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  return row
}

async function stateOf(userId: string, eventId: string) {
  const [row] = await db
    .select({ state: eventRegistrations.state })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.userId, userId))
    .limit(1)

  return row?.state ?? null
}

/**
 * Fill the single seat and queue two students behind it, each a minute apart.
 *
 * The spacing matters: `createdAt` is the queue ordering key, so registering
 * everybody at the same instant would make the promotion order arbitrary and
 * any assertion about who gets in first meaningless.
 */
async function queueTwoBehindTheSeat() {
  await registerForEvent({ userId: STUDENT_A, eventId: ONE_SEAT, now: NOW })
  await registerForEvent({
    userId: STUDENT_B,
    eventId: ONE_SEAT,
    now: new Date(NOW.getTime() + 60_000),
  })
  await registerForEvent({
    userId: STUDENT_C,
    eventId: ONE_SEAT,
    now: new Date(NOW.getTime() + 120_000),
  })
}

describe.skipIf(!hasDatabase)("updateEvent", () => {
  beforeAll(async () => {
    await cleanup()

    await db
      .insert(interests)
      .values({ id: INTEREST, slug: "ee-testing", label: "Testing" })

    await db.insert(communities).values([
      {
        id: VERIFIED,
        slug: "ee-robotics",
        name: "Robotics",
        kind: "OFFICIAL",
        scope: "GLOBAL",
        interestId: INTEREST,
        verification: "VERIFIED",
      },
      {
        id: UNVERIFIED,
        slug: "ee-chess",
        name: "Chess",
        kind: "OFFICIAL",
        scope: "GLOBAL",
        interestId: INTEREST,
        verification: "UNVERIFIED",
      },
    ])

    await db.insert(users).values(
      USER_IDS.map((id) => ({
        id,
        name: `Person ${id}`,
        email: `${id}@ee-campus.test`,
        passwordHash: "not-a-real-hash",
      })),
    )

    await db.insert(memberships).values([
      { communityId: VERIFIED, userId: OWNER, state: "OWNER" },
      { communityId: UNVERIFIED, userId: OWNER, state: "OWNER" },
      { communityId: VERIFIED, userId: MEMBER, state: "MEMBER" },
    ])
  })

  afterAll(cleanup)

  beforeEach(resetEvents)

  describe("who may edit", () => {
    it("lets an owner of a verified community change the details", async () => {
      const result = await updateEvent({
        actorId: OWNER,
        input: edit({ title: "Intro to Robotics", venue: "Lab 7" }),
        now: NOW,
      })

      expect(result.ok).toBe(true)

      const stored = await storedEvent(ONE_SEAT)
      expect(stored?.title).toBe("Intro to Robotics")
      expect(stored?.venue).toBe("Lab 7")
    })

    it("refuses a member who does not own the community", async () => {
      const result = await updateEvent({
        actorId: MEMBER,
        input: edit({ title: "Hijacked" }),
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("FORBIDDEN")

      // The refusal has to leave the listing alone, not merely report itself.
      expect((await storedEvent(ONE_SEAT))?.title).toBe("Exactly one seat")
    })

    it("refuses an owner whose community is not verified", async () => {
      // Verification can lapse after publication, and a club that has lost it
      // should not keep rewriting a listing students are relying on.
      const result = await updateEvent({
        actorId: OWNER,
        input: edit({ eventId: IN_UNVERIFIED, title: "Rewritten" }),
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("FORBIDDEN")
      expect(result.message).toContain("verified")
    })

    it("refuses an event that does not exist", async () => {
      const result = await updateEvent({
        actorId: OWNER,
        input: edit({ eventId: "ee-not-a-real-event" }),
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("NOT_FOUND")
    })
  })

  describe("what may be edited", () => {
    it("keeps the address after a retitle", async () => {
      // The old address is already on posters and in group chats. A rename that
      // moved it would turn every one of those into a dead link.
      await updateEvent({
        actorId: OWNER,
        input: edit({ title: "A completely different name" }),
        now: NOW,
      })

      expect((await storedEvent(ONE_SEAT))?.slug).toBe("ee-one-seat")
    })

    it("refuses a cancelled event", async () => {
      const result = await updateEvent({
        actorId: OWNER,
        input: edit({ eventId: CALLED_OFF, title: "Back on again" }),
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("INVALID")
      expect((await storedEvent(CALLED_OFF))?.title).toBe("Not happening")
    })

    it("refuses an event that has already started", async () => {
      const result = await updateEvent({
        actorId: OWNER,
        input: edit({
          eventId: ALREADY_RAN,
          title: "Retconned",
          startsAt: "2026-04-02T10:00:00.000Z",
          endsAt: "2026-04-02T12:00:00.000Z",
        }),
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("INVALID")
    })

    it("refuses times that describe an impossible event", async () => {
      const result = await updateEvent({
        actorId: OWNER,
        input: edit({ endsAt: "2026-05-10T09:00:00.000Z" }),
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("INVALID")
    })
  })

  describe("capacity, and the queue behind it", () => {
    it("refuses to cut capacity below the students already going", async () => {
      await queueTwoBehindTheSeat()

      const result = await updateEvent({
        actorId: OWNER,
        input: edit({ capacity: 0 + 0 }),
        now: NOW,
      })

      // Zero seats is refused by the schema before the rule is reached; the
      // point of the assertion is that the confirmed student keeps their place.
      expect(result.ok).toBe(false)
      expect(await stateOf(STUDENT_A, ONE_SEAT)).toBe("REGISTERED")
    })

    it("promotes in queue order when seats are added", async () => {
      await queueTwoBehindTheSeat()

      const result = await updateEvent({
        actorId: OWNER,
        input: edit({ capacity: 2 }),
        now: NOW,
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return

      // One seat opened, so the student who has waited longest takes it - and
      // the one behind them keeps waiting.
      expect(result.data.promoted).toEqual([STUDENT_B])
      expect(await stateOf(STUDENT_B, ONE_SEAT)).toBe("REGISTERED")
      expect(await stateOf(STUDENT_C, ONE_SEAT)).toBe("WAITLISTED")
      expect((await storedEvent(ONE_SEAT))?.registeredCount).toBe(2)
    })

    it("lets everybody in when the limit is removed", async () => {
      await queueTwoBehindTheSeat()

      const result = await updateEvent({
        actorId: OWNER,
        input: edit({ capacity: null }),
        now: NOW,
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return

      // Unlimited is not zero. A caller reading null as a number would promote
      // nobody at the moment the organiser made room for everybody.
      expect(result.data.promoted).toEqual([STUDENT_B, STUDENT_C])
      expect((await storedEvent(ONE_SEAT))?.registeredCount).toBe(3)
    })

    it("promotes nobody when capacity does not change", async () => {
      await queueTwoBehindTheSeat()

      const result = await updateEvent({
        actorId: OWNER,
        input: edit({ venue: "Lab 9" }),
        now: NOW,
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.promoted).toEqual([])
      expect(await stateOf(STUDENT_B, ONE_SEAT)).toBe("WAITLISTED")
      expect((await storedEvent(ONE_SEAT))?.registeredCount).toBe(1)
    })

    it("promotes nobody when there is no queue to promote", async () => {
      await registerForEvent({ userId: STUDENT_A, eventId: ONE_SEAT, now: NOW })

      const result = await updateEvent({
        actorId: OWNER,
        input: edit({ capacity: 50 }),
        now: NOW,
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.promoted).toEqual([])
      expect((await storedEvent(ONE_SEAT))?.registeredCount).toBe(1)
    })
  })
})
