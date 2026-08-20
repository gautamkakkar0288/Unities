// @vitest-environment node

import { inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import {
  communities,
  eventRegistrations,
  events,
  interests,
  memberships,
  savedItems,
  userInterests,
  users,
} from "@/lib/db/schema"
import { db } from "@/lib/db"
import { loadExploreData, loadHomeFeed } from "@/lib/services/feed"

const hasDatabase = Boolean(process.env.DATABASE_URL)

/**
 * The home feed against a real database.
 *
 * The isolation test is the important one. Everything else here would still pass
 * if the queries quietly ignored the viewer - a feed that shows one student's
 * registrations to another is a privacy failure that looks exactly like a working
 * feed from the inside.
 */

const INTEREST_IDS = ["feed-test-interest", "feed-test-other-interest"]
const COMMUNITY_IDS = ["feed-test-joined", "feed-test-open"]
const USER_IDS = ["feed-test-viewer", "feed-test-stranger"]
const EVENT_IDS = ["feed-test-registered", "feed-test-relevant", "feed-test-past"]

const NOW = new Date("2026-03-01T06:00:00.000Z")

function hoursFromNow(hours: number): Date {
  return new Date(NOW.getTime() + hours * 3_600_000)
}

async function cleanup() {
  await db
    .delete(eventRegistrations)
    .where(inArray(eventRegistrations.eventId, EVENT_IDS))
  await db.delete(savedItems).where(inArray(savedItems.userId, USER_IDS))
  await db.delete(events).where(inArray(events.id, EVENT_IDS))
  await db.delete(memberships).where(inArray(memberships.userId, USER_IDS))
  await db.delete(userInterests).where(inArray(userInterests.userId, USER_IDS))
  await db.delete(communities).where(inArray(communities.id, COMMUNITY_IDS))
  await db.delete(users).where(inArray(users.id, USER_IDS))
  await db.delete(interests).where(inArray(interests.id, INTEREST_IDS))
}

describe.skipIf(!hasDatabase)("loadHomeFeed", () => {
  beforeAll(async () => {
    await cleanup()

    await db.insert(interests).values([
      { id: INTEREST_IDS[0] as string, slug: "feed-test", label: "Feed Test" },
      {
        id: INTEREST_IDS[1] as string,
        slug: "feed-test-other",
        label: "Feed Test Other",
      },
    ])

    await db.insert(users).values([
      {
        id: USER_IDS[0] as string,
        name: "Gautam Feedtest",
        email: "feed-test-viewer@example.test",
        passwordHash: "not-a-real-hash",
      },
      {
        id: USER_IDS[1] as string,
        name: "Someone Else",
        email: "feed-test-stranger@example.test",
        passwordHash: "not-a-real-hash",
      },
    ])

    await db
      .insert(userInterests)
      .values({ userId: USER_IDS[0] as string, interestId: INTEREST_IDS[0] as string })

    await db.insert(communities).values([
      {
        id: COMMUNITY_IDS[0] as string,
        slug: "feed-test-joined",
        name: "Joined Club",
        kind: "STUDENT",
        scope: "UNIVERSITY",
        interestId: INTEREST_IDS[0] as string,
        verification: "VERIFIED",
        memberCount: 12,
      },
      {
        id: COMMUNITY_IDS[1] as string,
        slug: "feed-test-open",
        name: "Open Club",
        kind: "STUDENT",
        scope: "UNIVERSITY",
        interestId: INTEREST_IDS[0] as string,
        verification: "VERIFIED",
        memberCount: 40,
      },
    ])

    await db.insert(memberships).values({
      communityId: COMMUNITY_IDS[0] as string,
      userId: USER_IDS[0] as string,
      state: "MEMBER",
    })

    await db.insert(events).values([
      {
        id: EVENT_IDS[0] as string,
        slug: "feed-test-registered",
        title: "Event The Viewer Registered For",
        description: "Already holding a seat.",
        kind: "WORKSHOP",
        mode: "IN_PERSON",
        venue: "Block A",
        status: "PUBLISHED",
        startsAt: hoursFromNow(30),
        endsAt: hoursFromNow(32),
        capacity: 40,
        registeredCount: 1,
        communityId: COMMUNITY_IDS[0] as string,
        interestId: INTEREST_IDS[0] as string,
        createdById: USER_IDS[0] as string,
      },
      {
        id: EVENT_IDS[1] as string,
        slug: "feed-test-relevant",
        title: "Relevant Upcoming Event",
        description: "Matches the viewer's interest.",
        kind: "TALK",
        mode: "ONLINE",
        venue: "Online",
        status: "PUBLISHED",
        startsAt: hoursFromNow(50),
        endsAt: hoursFromNow(52),
        capacity: 100,
        communityId: COMMUNITY_IDS[1] as string,
        interestId: INTEREST_IDS[0] as string,
        createdById: USER_IDS[1] as string,
      },
      {
        id: EVENT_IDS[2] as string,
        slug: "feed-test-past",
        title: "Event That Already Happened",
        description: "In the past.",
        kind: "MEETUP",
        mode: "IN_PERSON",
        venue: "Block B",
        status: "PUBLISHED",
        startsAt: hoursFromNow(-30),
        endsAt: hoursFromNow(-28),
        capacity: 40,
        communityId: COMMUNITY_IDS[0] as string,
        interestId: INTEREST_IDS[0] as string,
        createdById: USER_IDS[0] as string,
      },
    ])

    await db.insert(eventRegistrations).values({
      eventId: EVENT_IDS[0] as string,
      userId: USER_IDS[0] as string,
      state: "REGISTERED",
      createdAt: hoursFromNow(-2),
    })

    // The stranger saves something. None of it may reach the viewer's feed.
    await db.insert(savedItems).values({
      userId: USER_IDS[1] as string,
      targetKind: "EVENT",
      targetId: EVENT_IDS[1] as string,
    })
  })

  afterAll(cleanup)

  it("greets the student by their first name", async () => {
    const feed = await loadHomeFeed({
      viewerId: USER_IDS[0] as string,
      viewerName: "Gautam Feedtest",
      now: NOW,
    })

    expect(feed.firstName).toBe("Gautam")
    expect(feed.greeting).toBe("Good afternoon")
  })

  it("lists the student's own registration under their upcoming events", async () => {
    const feed = await loadHomeFeed({
      viewerId: USER_IDS[0] as string,
      viewerName: "Gautam Feedtest",
      now: NOW,
    })

    expect(feed.yourUpcoming.map((event) => event.id)).toContain(
      EVENT_IDS[0] as string,
    )
  })

  it("does not recommend an event the student already holds a place in", async () => {
    const feed = await loadHomeFeed({
      viewerId: USER_IDS[0] as string,
      viewerName: "Gautam Feedtest",
      now: NOW,
    })

    expect(feed.forYou.map((event) => event.id)).not.toContain(
      EVENT_IDS[0] as string,
    )
  })

  it("surfaces a relevant upcoming event", async () => {
    const feed = await loadHomeFeed({
      viewerId: USER_IDS[0] as string,
      viewerName: "Gautam Feedtest",
      now: NOW,
    })

    expect(feed.forYou.map((event) => event.id)).toContain(
      EVENT_IDS[1] as string,
    )
  })

  it("never puts a finished event in a forward-looking section", async () => {
    const feed = await loadHomeFeed({
      viewerId: USER_IDS[0] as string,
      viewerName: "Gautam Feedtest",
      now: NOW,
    })

    const forwardLooking = [
      ...feed.forYou,
      ...feed.trending,
      ...feed.yourUpcoming,
      ...feed.happeningSoon.flatMap((group) => group.events),
    ].map((event) => event.id)

    expect(forwardLooking).not.toContain(EVENT_IDS[2] as string)
  })

  it("does not suggest a community the student is already in", async () => {
    const feed = await loadHomeFeed({
      viewerId: USER_IDS[0] as string,
      viewerName: "Gautam Feedtest",
      now: NOW,
    })

    expect(feed.suggestedCommunities.map((c) => c.id)).not.toContain(
      COMMUNITY_IDS[0] as string,
    )
  })

  it("keeps one student's saves and registrations out of another's feed", async () => {
    const stranger = await loadHomeFeed({
      viewerId: USER_IDS[1] as string,
      viewerName: "Someone Else",
      now: NOW,
    })
    const viewer = await loadHomeFeed({
      viewerId: USER_IDS[0] as string,
      viewerName: "Gautam Feedtest",
      now: NOW,
    })

    // The stranger saved the relevant event; the viewer did not.
    expect(stranger.savedEventIds).toContain(EVENT_IDS[1] as string)
    expect(viewer.savedEventIds).not.toContain(EVENT_IDS[1] as string)

    // The viewer registered for an event; the stranger holds no places.
    expect(stranger.yourUpcoming.map((event) => event.id)).not.toContain(
      EVENT_IDS[0] as string,
    )
  })

  it("counts only from rows it actually loaded", async () => {
    const feed = await loadHomeFeed({
      viewerId: USER_IDS[0] as string,
      viewerName: "Gautam Feedtest",
      now: NOW,
    })

    expect(feed.counts.joinedCommunities).toBeGreaterThanOrEqual(1)
    expect(feed.counts.upcomingEvents).toBeGreaterThanOrEqual(2)
    expect(Number.isInteger(feed.counts.savedItems)).toBe(true)
  })

  it("never projects an email address into the feed", async () => {
    const feed = await loadHomeFeed({
      viewerId: USER_IDS[0] as string,
      viewerName: "Gautam Feedtest",
      now: NOW,
    })

    expect(JSON.stringify(feed)).not.toContain("@example.test")
  })
})

describe.skipIf(!hasDatabase)("loadExploreData", () => {
  it("returns the viewer's own saved sets", async () => {
    const data = await loadExploreData({
      viewerId: USER_IDS[0] as string,
      now: NOW,
    })

    expect(Array.isArray(data.events)).toBe(true)
    expect(Array.isArray(data.savedEventIds)).toBe(true)
    expect(data.now).toBe(NOW.toISOString())
  })
})
