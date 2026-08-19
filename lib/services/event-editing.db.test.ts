// @vitest-environment node

import { and, eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import {
  auditLog,
  communities,
  eventRegistrations,
  events,
  interests,
  memberships,
  users,
} from "@/lib/db/schema"
import { AUDIT_ACTIONS } from "@/lib/domain/audit"
import { updateEvent } from "@/lib/services/event-editing"
import { registerForEvent } from "@/lib/services/events"

/**
 * Editing an event, against a real Postgres.
 *
 * The rules themselves are covered purely in `lib/domain/event-edit.test.ts`.
 * What needs a database is what the rules cannot see: that a refused edit
 * leaves the row untouched, that raising capacity moves the waitlist inside the
 * same transaction, that the address students already have keeps working after
 * a retitle, and that the queue ordering survives a promotion.
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
/** Three seats, so a cut below the confirmed count is expressible. */
const ROOMY = "ee-roomy"
const CALLED_OFF = "ee-called-off"
const ALREADY_RAN = "ee-already-ran"
const IN_UNVERIFIED = "ee-in-unverified"

const EVENT_IDS = [ONE_SEAT, ROOMY, CALLED_OFF, ALREADY_RAN, IN_UNVERIFIED]

/**
 * Audit rows are deleted by target, not by actor.
 *
 * `auditLog.actorId` is `set null` on purpose - deleting an account must not be
 * a way to erase what it did - so removing the fixture users would leave these
 * rows behind with a null actor, and the next run would count them.
 */
async function clearAuditRows() {
  await db.delete(auditLog).where(inArray(auditLog.targetId, EVENT_IDS))
}

async function cleanup() {
  await clearAuditRows()
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
  await clearAuditRows()
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
      id: ROOMY,
      slug: "ee-roomy",
      title: "Three seats",
      kind: "WORKSHOP",
      status: "PUBLISHED",
      startsAt: STARTS,
      endsAt: ENDS,
      capacity: 3,
      venue: "Hall A",
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
    .where(
      and(
        eq(eventRegistrations.userId, userId),
        eq(eventRegistrations.eventId, eventId),
      ),
    )
    .limit(1)

  return row?.state ?? null
}

/** The whole queue entry, for the assertions that care about its ordering. */
async function queueEntry(userId: string, eventId: string) {
  const [row] = await db
    .select({
      state: eventRegistrations.state,
      createdAt: eventRegistrations.createdAt,
      promotedAt: eventRegistrations.promotedAt,
    })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.userId, userId),
        eq(eventRegistrations.eventId, eventId),
      ),
    )
    .limit(1)

  return row ?? null
}

async function auditRowsFor(eventId: string) {
  return db
    .select({
      action: auditLog.action,
      actorId: auditLog.actorId,
      targetKind: auditLog.targetKind,
      summary: auditLog.summary,
    })
    .from(auditLog)
    .where(eq(auditLog.targetId, eventId))
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

    it("preserves the registrations through an ordinary edit", async () => {
      // The reason editing exists at all instead of cancel-and-recreate: a
      // moved room must not cost an organiser the students who already said
      // they are coming.
      await queueTwoBehindTheSeat()
      const before = await queueEntry(STUDENT_A, ONE_SEAT)

      const result = await updateEvent({
        actorId: OWNER,
        input: edit({ title: "Renamed and moved", venue: "Lab 9" }),
        now: NOW,
      })

      expect(result.ok).toBe(true)

      const after = await queueEntry(STUDENT_A, ONE_SEAT)
      expect(after?.state).toBe("REGISTERED")
      expect(after?.createdAt.toISOString()).toBe(
        before?.createdAt.toISOString(),
      )
      expect(await stateOf(STUDENT_B, ONE_SEAT)).toBe("WAITLISTED")
      expect(await stateOf(STUDENT_C, ONE_SEAT)).toBe("WAITLISTED")
      expect((await storedEvent(ONE_SEAT))?.registeredCount).toBe(1)
    })
  })

  describe("capacity, and the queue behind it", () => {
    it("refuses to cut capacity below the students already going", async () => {
      // Two of three seats taken, cut to one. A room change makes this a
      // request an organiser really does make, and honouring it would mean
      // throwing out a student who is already going.
      await registerForEvent({ userId: STUDENT_A, eventId: ROOMY, now: NOW })
      await registerForEvent({
        userId: STUDENT_B,
        eventId: ROOMY,
        now: new Date(NOW.getTime() + 60_000),
      })

      const result = await updateEvent({
        actorId: OWNER,
        input: edit({
          eventId: ROOMY,
          title: "Three seats",
          venue: "Hall A",
          capacity: 1,
        }),
        now: NOW,
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe("INVALID")
      expect(result.message).toContain("already going")

      expect(await stateOf(STUDENT_A, ROOMY)).toBe("REGISTERED")
      expect(await stateOf(STUDENT_B, ROOMY)).toBe("REGISTERED")
      expect((await storedEvent(ROOMY))?.capacity).toBe(3)
    })

    it("allows a cut down to exactly the confirmed count", async () => {
      // Closing the door without cancelling is a legitimate move.
      await registerForEvent({ userId: STUDENT_A, eventId: ROOMY, now: NOW })

      const result = await updateEvent({
        actorId: OWNER,
        input: edit({
          eventId: ROOMY,
          title: "Three seats",
          venue: "Hall A",
          capacity: 1,
        }),
        now: NOW,
      })

      expect(result.ok).toBe(true)
      expect((await storedEvent(ROOMY))?.capacity).toBe(1)
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

    it("leaves the queue timestamp alone when it promotes", async () => {
      // `createdAt` is the queue key, and it is the student's place in line.
      // Stamping it with the promotion time would look right on their own
      // screen and silently move them behind everybody still waiting, so the
      // next freed seat would go to the wrong person.
      await queueTwoBehindTheSeat()
      const before = await queueEntry(STUDENT_B, ONE_SEAT)
      expect(before?.state).toBe("WAITLISTED")
      expect(before?.promotedAt).toBeNull()

      await updateEvent({
        actorId: OWNER,
        input: edit({ capacity: 2 }),
        now: NOW,
      })

      const after = await queueEntry(STUDENT_B, ONE_SEAT)
      expect(after?.state).toBe("REGISTERED")
      expect(after?.createdAt.toISOString()).toBe(
        before?.createdAt.toISOString(),
      )
      // Set, so the promotion is distinguishable from an ordinary registration.
      expect(after?.promotedAt?.toISOString()).toBe(NOW.toISOString())

      // And untouched for the student who did not move.
      const stayed = await queueEntry(STUDENT_C, ONE_SEAT)
      expect(stayed?.promotedAt).toBeNull()
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

    it("promotes nobody when no seats were freed", async () => {
      /**
       * Named for what is actually guaranteed. `seatsAvailableAfter` compares
       * the new capacity against the registered count and never against the old
       * capacity, so "the capacity did not change" is not the condition being
       * tested here - "there is no room" is. On a full event the two coincide,
       * which is why this reads as though it checked the former.
       *
       * The distinction is not academic: an event with a free seat and somebody
       * waiting would promote on a venue-only edit. Nothing can currently reach
       * that state, because both `registerForEvent` and `cancelRegistration`
       * keep the queue empty while seats remain - so this is a note for
       * whoever adds a third way to free a seat, not a live bug.
       */
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

  /**
   * The trail.
   *
   * `events` has `created_at` and `cancelled_at` and no `updated_at`, so this
   * row is the only record that a listing students committed to has changed.
   * Until notifications exist it is also the only way to answer "was the venue
   * always Lab 9?", which is a question an organiser will eventually be asked.
   */
  describe("the record of the edit", () => {
    it("writes one audit row naming the actor and the event", async () => {
      await updateEvent({
        actorId: OWNER,
        input: edit({ title: "Intro to Robotics", venue: "Lab 7" }),
        now: NOW,
      })

      const rows = await auditRowsFor(ONE_SEAT)
      expect(rows).toHaveLength(1)
      expect(rows[0]?.action).toBe(AUDIT_ACTIONS.eventEdited)
      expect(rows[0]?.actorId).toBe(OWNER)
      expect(rows[0]?.targetKind).toBe("EVENT")
      // Readable on its own, after the event row is gone.
      expect(rows[0]?.summary).toContain("Intro to Robotics")
      expect(rows[0]?.summary).toContain("Robotics")
    })

    it("says so when the edit let the waitlist in", async () => {
      // The consequence that is invisible afterwards: the event row cannot show
      // that two students came in because seats were added rather than because
      // they registered.
      await queueTwoBehindTheSeat()

      await updateEvent({
        actorId: OWNER,
        input: edit({ capacity: null }),
        now: NOW,
      })

      const rows = await auditRowsFor(ONE_SEAT)
      expect(rows).toHaveLength(1)
      expect(rows[0]?.summary).toContain("2 students")
      expect(rows[0]?.summary).toContain("waitlist")
    })

    it("records nothing when the edit was refused", async () => {
      // A log that records attempts as though they happened is worse than no
      // log, because it cannot be trusted to answer what actually changed. The
      // insert is inside the transaction, so a refusal has to leave no trace.
      const forbidden = await updateEvent({
        actorId: MEMBER,
        input: edit({ title: "Hijacked" }),
        now: NOW,
      })
      expect(forbidden.ok).toBe(false)
      expect(await auditRowsFor(ONE_SEAT)).toHaveLength(0)

      const cancelled = await updateEvent({
        actorId: OWNER,
        input: edit({ eventId: CALLED_OFF, title: "Back on again" }),
        now: NOW,
      })
      expect(cancelled.ok).toBe(false)
      expect(await auditRowsFor(CALLED_OFF)).toHaveLength(0)

      const unverified = await updateEvent({
        actorId: OWNER,
        input: edit({ eventId: IN_UNVERIFIED, title: "Rewritten" }),
        now: NOW,
      })
      expect(unverified.ok).toBe(false)
      expect(await auditRowsFor(IN_UNVERIFIED)).toHaveLength(0)
    })

    it("records each edit separately", async () => {
      // Two corrections are two facts. Collapsing them would lose the order the
      // venue moved in, which is the only thing that makes the trail useful.
      await updateEvent({
        actorId: OWNER,
        input: edit({ venue: "Lab 7" }),
        now: NOW,
      })
      await updateEvent({
        actorId: OWNER,
        input: edit({ venue: "Lab 9" }),
        now: new Date(NOW.getTime() + 60_000),
      })

      expect(await auditRowsFor(ONE_SEAT)).toHaveLength(2)
    })
  })
})
