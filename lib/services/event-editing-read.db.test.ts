// @vitest-environment node

import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import {
  communities,
  eventRegistrations,
  events,
  interests,
  memberships,
  users,
} from "@/lib/db/schema"
import { getEventForEdit } from "@/lib/services/event-editing"
import { registerForEvent } from "@/lib/services/events"

/**
 * Loading an event into its own edit form.
 *
 * Small on purpose: the write path has its own suite. What is worth proving
 * here is that the values come back as they are stored - particularly the
 * registration close time, which the student-facing projection resolves to the
 * start time and this one must not.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

const INTEREST = "eer-interest"
const VERIFIED = "eer-community-verified"
const LAPSED = "eer-community-lapsed"

const OWNER = "eer-owner"
const MODERATOR = "eer-moderator"
const MEMBER = "eer-member"
const STUDENT_A = "eer-student-a"
const STUDENT_B = "eer-student-b"

const USER_IDS = [OWNER, MODERATOR, MEMBER, STUDENT_A, STUDENT_B]
const COMMUNITY_IDS = [VERIFIED, LAPSED]

const NOW = new Date("2026-05-01T00:00:00.000Z")
const STARTS = new Date("2026-05-10T10:00:00.000Z")
const ENDS = new Date("2026-05-10T12:00:00.000Z")

const OPEN_UNTIL_START = "eer-open-until-start"
const FIXED_CLOSE = "eer-fixed-close"
const IN_LAPSED = "eer-in-lapsed"

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

describe.skipIf(!hasDatabase)("getEventForEdit", () => {
  beforeAll(async () => {
    await cleanup()

    await db
      .insert(interests)
      .values({ id: INTEREST, slug: "eer-testing", label: "Testing" })

    await db.insert(communities).values([
      {
        id: VERIFIED,
        slug: "eer-robotics",
        name: "Robotics",
        kind: "OFFICIAL",
        scope: "GLOBAL",
        interestId: INTEREST,
        verification: "VERIFIED",
      },
      {
        id: LAPSED,
        slug: "eer-chess",
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
        email: `${id}@eer-campus.test`,
        passwordHash: "not-a-real-hash",
      })),
    )

    await db.insert(memberships).values([
      { communityId: VERIFIED, userId: OWNER, state: "OWNER" },
      { communityId: VERIFIED, userId: MODERATOR, state: "MODERATOR" },
      { communityId: VERIFIED, userId: MEMBER, state: "MEMBER" },
      { communityId: LAPSED, userId: OWNER, state: "OWNER" },
    ])

    await db.insert(events).values([
      {
        id: OPEN_UNTIL_START,
        slug: "eer-open-until-start",
        title: "Open until it starts",
        description: "Bring a laptop.",
        kind: "WORKSHOP",
        mode: "IN_PERSON",
        venue: "Lab 3",
        status: "PUBLISHED",
        startsAt: STARTS,
        endsAt: ENDS,
        // Left unset, which is the case this whole read exists for.
        registrationClosesAt: null,
        capacity: 1,
        feeInPaise: 15000,
        communityId: VERIFIED,
        interestId: INTEREST,
      },
      {
        id: FIXED_CLOSE,
        slug: "eer-fixed-close",
        title: "Closes early",
        kind: "TALK",
        status: "PUBLISHED",
        startsAt: STARTS,
        endsAt: ENDS,
        registrationClosesAt: new Date("2026-05-08T10:00:00.000Z"),
        communityId: VERIFIED,
        interestId: INTEREST,
      },
      {
        id: IN_LAPSED,
        slug: "eer-in-lapsed",
        title: "Published before verification lapsed",
        kind: "TALK",
        status: "PUBLISHED",
        startsAt: STARTS,
        endsAt: ENDS,
        communityId: LAPSED,
        interestId: INTEREST,
      },
    ])

    // One seat, two students: the second one waits.
    await registerForEvent({
      userId: STUDENT_A,
      eventId: OPEN_UNTIL_START,
      now: NOW,
    })
    await registerForEvent({
      userId: STUDENT_B,
      eventId: OPEN_UNTIL_START,
      now: new Date(NOW.getTime() + 60_000),
    })
  })

  afterAll(cleanup)

  it("keeps an unset close time unset", async () => {
    const result = await getEventForEdit({
      actorId: OWNER,
      slug: "eer-open-until-start",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    // The student-facing projection would report the start time here. Feeding
    // that back through the form would pin registration to a timestamp nobody
    // chose, and it would go stale the moment the start moved.
    expect(result.data.registrationClosesAt).toBeNull()
  })

  it("returns a real close time when there is one", async () => {
    const result = await getEventForEdit({
      actorId: OWNER,
      slug: "eer-fixed-close",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.registrationClosesAt).toBe("2026-05-08T10:00:00.000Z")
  })

  it("returns the stored values the form has to show", async () => {
    const result = await getEventForEdit({
      actorId: OWNER,
      slug: "eer-open-until-start",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.data).toMatchObject({
      title: "Open until it starts",
      description: "Bring a laptop.",
      kind: "WORKSHOP",
      mode: "IN_PERSON",
      venue: "Lab 3",
      capacity: 1,
      feeInPaise: 15000,
      status: "PUBLISHED",
      communityVerified: true,
    })
  })

  it("counts the students waiting, not the ones going", async () => {
    const result = await getEventForEdit({
      actorId: OWNER,
      slug: "eer-open-until-start",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    // The form uses this to warn that adding seats admits people immediately.
    expect(result.data.registeredCount).toBe(1)
    expect(result.data.waitlistCount).toBe(1)
  })

  it("refuses a moderator, who may read the list but not rewrite the event", async () => {
    const result = await getEventForEdit({
      actorId: MODERATOR,
      slug: "eer-open-until-start",
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe("FORBIDDEN")
  })

  it("refuses a plain member", async () => {
    const result = await getEventForEdit({
      actorId: MEMBER,
      slug: "eer-open-until-start",
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe("FORBIDDEN")
  })

  it("reports a lapsed community rather than hiding the event", async () => {
    const result = await getEventForEdit({
      actorId: OWNER,
      slug: "eer-in-lapsed",
    })

    // The save is refused either way. Loading lets the screen say why, instead
    // of a 404 that reads as "you have lost access to your own event".
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.communityVerified).toBe(false)
  })

  it("refuses an event that does not exist", async () => {
    const result = await getEventForEdit({
      actorId: OWNER,
      slug: "eer-not-a-real-event",
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe("NOT_FOUND")
  })
})
