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
import {
  cancelEvent,
  cancelRegistration,
  createEvent,
  getEventBySlug,
  listEvents,
  listRegistrations,
  registerForEvent,
} from "@/lib/services/events"

const hasDatabase = Boolean(process.env.DATABASE_URL)

const INTEREST = "ev-interest"
const VERIFIED = "ev-community-verified"
const UNVERIFIED = "ev-community-unverified"

const OWNER = "ev-owner"
const MEMBER = "ev-member"
const STUDENT_A = "ev-student-a"
const STUDENT_B = "ev-student-b"
const STUDENT_C = "ev-student-c"

const USER_IDS = [OWNER, MEMBER, STUDENT_A, STUDENT_B, STUDENT_C]
const COMMUNITY_IDS = [VERIFIED, UNVERIFIED]

/** A fixed clock, so "in the future" does not depend on when CI runs. */
const NOW = new Date("2026-05-01T00:00:00.000Z")
const STARTS = new Date("2026-05-10T10:00:00.000Z")
const ENDS = new Date("2026-05-10T12:00:00.000Z")

const ONE_SEAT = "ev-one-seat"
const UNLIMITED = "ev-unlimited"
const CLOSED = "ev-closed"
const CALLED_OFF = "ev-called-off"

const EVENT_IDS = [ONE_SEAT, UNLIMITED, CLOSED, CALLED_OFF]

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

/** Rebuilt before every test, because most of these tests write. */
async function resetEvents() {
  await db.delete(events).where(inArray(events.communityId, COMMUNITY_IDS))

  await db.insert(events).values([
    {
      id: ONE_SEAT,
      slug: "ev-one-seat",
      title: "Exactly one seat",
      kind: "WORKSHOP",
      status: "PUBLISHED",
      startsAt: STARTS,
      endsAt: ENDS,
      capacity: 1,
      communityId: VERIFIED,
      interestId: INTEREST,
    },
    {
      id: UNLIMITED,
      slug: "ev-unlimited",
      title: "Room for everyone",
      kind: "TALK",
      status: "PUBLISHED",
      startsAt: STARTS,
      endsAt: ENDS,
      capacity: null,
      communityId: VERIFIED,
      interestId: INTEREST,
    },
    {
      id: CLOSED,
      slug: "ev-closed",
      title: "Registration already shut",
      kind: "TALK",
      status: "PUBLISHED",
      startsAt: STARTS,
      endsAt: ENDS,
      // Closes well before NOW, while the event itself is still in the future.
      registrationClosesAt: new Date("2026-04-01T00:00:00.000Z"),
      communityId: VERIFIED,
      interestId: INTEREST,
    },
    {
      id: CALLED_OFF,
      slug: "ev-called-off",
      title: "Not happening",
      kind: "MEETUP",
      status: "CANCELLED",
      startsAt: STARTS,
      endsAt: ENDS,
      communityId: VERIFIED,
      interestId: INTEREST,
    },
  ])
}

async function seatCount(eventId: string): Promise<number> {
  const [row] = await db
    .select({ registeredCount: events.registeredCount })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  return row?.registeredCount ?? -1
}

const validEvent = {
  communitySlug: "ev-robotics",
  title: "Intro to Robotics",
  description: "A first session.",
  kind: "WORKSHOP" as const,
  mode: "IN_PERSON" as const,
  venue: "Lab 3",
  startsAt: STARTS.toISOString(),
  endsAt: ENDS.toISOString(),
  registrationClosesAt: null,
  capacity: 40,
  feeInPaise: null,
}

describe.skipIf(!hasDatabase)("events service", () => {
  beforeAll(async () => {
    await cleanup()

    await db
      .insert(interests)
      .values({ id: INTEREST, slug: "ev-testing", label: "Testing" })

    await db.insert(communities).values([
      {
        id: VERIFIED,
        slug: "ev-robotics",
        name: "Robotics",
        kind: "OFFICIAL",
        scope: "GLOBAL",
        interestId: INTEREST,
        verification: "VERIFIED",
      },
      {
        id: UNVERIFIED,
        slug: "ev-chess",
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
        email: `${id}@ev-campus.test`,
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

  beforeEach(async () => {
    await db
      .delete(eventRegistrations)
      .where(inArray(eventRegistrations.userId, USER_IDS))
    await resetEvents()
  })

  describe("createEvent", () => {
    it("lets an owner of a verified community publish", async () => {
      const result = await createEvent({
        organiserId: OWNER,
        input: validEvent,
        now: NOW,
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.slug).toBe("intro-to-robotics")
    })

    it("refuses an unverified community", async () => {
      const result = await createEvent({
        organiserId: OWNER,
        input: { ...validEvent, communitySlug: "ev-chess" },
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("FORBIDDEN")
      expect(result.message).toContain("verified")
    })

    it("refuses a member who does not own the community", async () => {
      const result = await createEvent({
        organiserId: MEMBER,
        input: validEvent,
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("FORBIDDEN")
    })

    it("refuses a trip, because trips carry obligations nothing collects yet", async () => {
      const result = await createEvent({
        organiserId: OWNER,
        input: { ...validEvent, kind: "TRIP" },
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("INVALID")
    })

    it("refuses an event that ends before it starts", async () => {
      const result = await createEvent({
        organiserId: OWNER,
        input: { ...validEvent, endsAt: "2026-05-10T09:00:00.000Z" },
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("INVALID")
    })

    it("gives two events with the same title different addresses", async () => {
      const first = await createEvent({
        organiserId: OWNER,
        input: validEvent,
        now: NOW,
      })
      const second = await createEvent({
        organiserId: OWNER,
        input: validEvent,
        now: NOW,
      })

      expect(first.ok && second.ok).toBe(true)
      if (!first.ok || !second.ok) return
      expect(second.data.slug).not.toBe(first.data.slug)
      expect(second.data.slug.startsWith("intro-to-robotics")).toBe(true)
    })
  })

  describe("registerForEvent", () => {
    it("gives the first student the seat", async () => {
      const result = await registerForEvent({
        userId: STUDENT_A,
        eventId: ONE_SEAT,
        now: NOW,
      })

      expect(result).toEqual({ ok: true, data: "REGISTERED" })
      expect(await seatCount(ONE_SEAT)).toBe(1)
    })

    it("waitlists the second, and does not count them as attending", async () => {
      await registerForEvent({ userId: STUDENT_A, eventId: ONE_SEAT, now: NOW })
      const result = await registerForEvent({
        userId: STUDENT_B,
        eventId: ONE_SEAT,
        now: NOW,
      })

      expect(result).toEqual({ ok: true, data: "WAITLISTED" })
      // The count is seats taken, not people interested.
      expect(await seatCount(ONE_SEAT)).toBe(1)
    })

    it("is idempotent, because students double-tap", async () => {
      await registerForEvent({ userId: STUDENT_A, eventId: ONE_SEAT, now: NOW })
      await registerForEvent({ userId: STUDENT_A, eventId: ONE_SEAT, now: NOW })

      expect(await seatCount(ONE_SEAT)).toBe(1)
    })

    it("never fills up when capacity is null", async () => {
      for (const id of [STUDENT_A, STUDENT_B, STUDENT_C]) {
        const result = await registerForEvent({
          userId: id,
          eventId: UNLIMITED,
          now: NOW,
        })
        expect(result).toEqual({ ok: true, data: "REGISTERED" })
      }

      expect(await seatCount(UNLIMITED)).toBe(3)
    })

    it("refuses once the deadline has passed, before the event starts", async () => {
      const result = await registerForEvent({
        userId: STUDENT_A,
        eventId: CLOSED,
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("CONFLICT")
    })

    it("refuses a cancelled event", async () => {
      const result = await registerForEvent({
        userId: STUDENT_A,
        eventId: CALLED_OFF,
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("CONFLICT")
    })
  })

  describe("cancelRegistration", () => {
    it("promotes the oldest waitlister into the freed seat", async () => {
      await registerForEvent({ userId: STUDENT_A, eventId: ONE_SEAT, now: NOW })
      await registerForEvent({ userId: STUDENT_B, eventId: ONE_SEAT, now: NOW })
      await registerForEvent({ userId: STUDENT_C, eventId: ONE_SEAT, now: NOW })

      const result = await cancelRegistration({
        userId: STUDENT_A,
        eventId: ONE_SEAT,
        now: NOW,
      })

      expect(result).toEqual({ ok: true, data: { promoted: STUDENT_B } })
      // One student left and one arrived, so the room is still full.
      expect(await seatCount(ONE_SEAT)).toBe(1)

      const event = await getEventBySlug({
        slug: "ev-one-seat",
        viewerId: STUDENT_B,
        now: NOW,
      })
      expect(event?.viewerRegistration).toBe("REGISTERED")
    })

    it("frees the seat when nobody is waiting", async () => {
      await registerForEvent({ userId: STUDENT_A, eventId: ONE_SEAT, now: NOW })

      const result = await cancelRegistration({
        userId: STUDENT_A,
        eventId: ONE_SEAT,
        now: NOW,
      })

      expect(result).toEqual({ ok: true, data: { promoted: null } })
      expect(await seatCount(ONE_SEAT)).toBe(0)
    })

    it("leaving the waitlist promotes nobody and frees nothing", async () => {
      await registerForEvent({ userId: STUDENT_A, eventId: ONE_SEAT, now: NOW })
      await registerForEvent({ userId: STUDENT_B, eventId: ONE_SEAT, now: NOW })

      await cancelRegistration({
        userId: STUDENT_B,
        eventId: ONE_SEAT,
        now: NOW,
      })

      expect(await seatCount(ONE_SEAT)).toBe(1)
    })

    it("cancelling nothing is a success, not an error", async () => {
      const result = await cancelRegistration({
        userId: STUDENT_C,
        eventId: ONE_SEAT,
        now: NOW,
      })

      expect(result).toEqual({ ok: true, data: { promoted: null } })
    })

    it("lets a student who dropped out sign up again", async () => {
      await registerForEvent({ userId: STUDENT_A, eventId: ONE_SEAT, now: NOW })
      await cancelRegistration({
        userId: STUDENT_A,
        eventId: ONE_SEAT,
        now: NOW,
      })

      // The unique constraint means this has to reuse the existing row.
      const again = await registerForEvent({
        userId: STUDENT_A,
        eventId: ONE_SEAT,
        now: NOW,
      })

      expect(again).toEqual({ ok: true, data: "REGISTERED" })
      expect(await seatCount(ONE_SEAT)).toBe(1)
    })
  })

  describe("reading events", () => {
    it("reports CLOSED to a student holding no place", async () => {
      const event = await getEventBySlug({
        slug: "ev-closed",
        viewerId: STUDENT_A,
        now: NOW,
      })

      expect(event?.viewerRegistration).toBe("CLOSED")
    })

    it("still tells a registered student they are registered", async () => {
      await registerForEvent({ userId: STUDENT_A, eventId: UNLIMITED, now: NOW })

      const event = await getEventBySlug({
        slug: "ev-unlimited",
        viewerId: STUDENT_A,
        now: NOW,
      })

      expect(event?.viewerRegistration).toBe("REGISTERED")
    })

    it("shows a signed-out visitor no registration state", async () => {
      const event = await getEventBySlug({
        slug: "ev-unlimited",
        viewerId: null,
        now: NOW,
      })

      expect(event?.viewerRegistration).toBe("NONE")
    })

    it("counts the waitlist separately from the seats", async () => {
      await registerForEvent({ userId: STUDENT_A, eventId: ONE_SEAT, now: NOW })
      await registerForEvent({ userId: STUDENT_B, eventId: ONE_SEAT, now: NOW })

      const event = await getEventBySlug({
        slug: "ev-one-seat",
        viewerId: STUDENT_A,
        now: NOW,
      })

      expect(event?.registeredCount).toBe(1)
      expect(event?.waitlistCount).toBe(1)
    })

    it("keeps a cancelled event visible to the people who signed up", async () => {
      const listed = await listEvents({
        viewerId: STUDENT_A,
        communityId: VERIFIED,
        now: NOW,
      })

      expect(listed.map((event) => event.slug)).toContain("ev-called-off")
    })

    it("orders events soonest first", async () => {
      const listed = await listEvents({
        viewerId: null,
        communityId: VERIFIED,
        now: NOW,
      })

      const times = listed.map((event) => Date.parse(event.startsAt))
      expect([...times].sort((a, b) => a - b)).toEqual(times)
    })
  })

  describe("cancelEvent", () => {
    it("lets an owner call it off and keeps the registrations", async () => {
      await registerForEvent({ userId: STUDENT_A, eventId: UNLIMITED, now: NOW })

      const result = await cancelEvent({ actorId: OWNER, eventId: UNLIMITED })
      expect(result.ok).toBe(true)

      const rows = await db
        .select({ id: eventRegistrations.id })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, UNLIMITED))

      // The people who signed up are exactly the people who need telling.
      expect(rows).toHaveLength(1)
    })

    it("refuses a plain member", async () => {
      const result = await cancelEvent({ actorId: MEMBER, eventId: UNLIMITED })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("FORBIDDEN")
    })

    it("refuses to cancel twice", async () => {
      const result = await cancelEvent({ actorId: OWNER, eventId: CALLED_OFF })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("CONFLICT")
    })
  })

  describe("listRegistrations", () => {
    it("shows the owner who is coming, without any email addresses", async () => {
      await registerForEvent({ userId: STUDENT_A, eventId: UNLIMITED, now: NOW })

      const result = await listRegistrations({
        organiserId: OWNER,
        eventId: UNLIMITED,
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data).toHaveLength(1)
      expect(JSON.stringify(result.data)).not.toContain("@ev-campus.test")
    })

    it("refuses a plain member the attendee list", async () => {
      const result = await listRegistrations({
        organiserId: MEMBER,
        eventId: UNLIMITED,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("FORBIDDEN")
    })
  })
})
