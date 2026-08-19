// @vitest-environment node
import { inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import {
  communities,
  events,
  interests,
  opportunities,
  places,
  posts,
  users,
} from "@/lib/db/schema"
import { parseSearchParams } from "@/lib/domain/search"
import {
  searchAll,
  searchCommunities,
  searchEvents,
  searchOpportunities,
  searchPosts,
  searchScopeFor,
} from "@/lib/services/search"

const hasDatabase = Boolean(process.env.DATABASE_URL)

/**
 * Search, against a real database.
 *
 * The fixtures build two universities inside one city, because the single most
 * important property of this feature is not that it finds things - it is that it
 * refuses to find the wrong campus's things. A search that quietly ignores
 * campus scoping looks perfect in a demo and is a data breach in production.
 */

const CITY = "search-test-city"
const HOME = "search-test-home"
const OTHER = "search-test-other"

const INTEREST = "search-test-interest"

const HOME_COMMUNITY = "search-test-community-home"
const OTHER_COMMUNITY = "search-test-community-other"

const VIEWER = "search-test-viewer"
const AUTHOR = "search-test-author"

const HOME_EVENT = "search-test-event-home"
const OTHER_EVENT = "search-test-event-other"
const PREFIX_EVENT = "search-test-event-prefix"
const DESCRIPTION_EVENT = "search-test-event-description"

const HOME_OPPORTUNITY = "search-test-opportunity-home"
const OTHER_OPPORTUNITY = "search-test-opportunity-other"

const HOME_POST = "search-test-post-home"
const OTHER_POST = "search-test-post-other"

const AUTHOR_EMAIL = "search-test-author@chitkara.edu.in"
const PASSWORD_HASH = "not-a-real-hash"

const now = new Date("2026-05-10T09:00:00.000Z")
const soon = new Date("2026-05-20T09:00:00.000Z")
const soonEnd = new Date("2026-05-20T12:00:00.000Z")

const request = (q: string, type?: string) => parseSearchParams({ q, type })

describe.skipIf(!hasDatabase)("search services", () => {
  beforeAll(async () => {
    await db.insert(places).values([
      { id: CITY, kind: "CITY", name: "Search Test City", slug: CITY, status: "ACTIVE" },
      {
        id: HOME,
        kind: "UNIVERSITY",
        name: "Search Test Home University",
        slug: HOME,
        status: "ACTIVE",
        parentPlaceId: CITY,
      },
      {
        id: OTHER,
        kind: "UNIVERSITY",
        name: "Search Test Other University",
        slug: OTHER,
        status: "ACTIVE",
        parentPlaceId: CITY,
      },
    ])

    await db
      .insert(interests)
      .values([{ id: INTEREST, slug: INTEREST, label: "Robotics" }])

    await db.insert(users).values([
      {
        id: VIEWER,
        name: "Search Test Viewer",
        email: "search-test-viewer@chitkara.edu.in",
        passwordHash: PASSWORD_HASH,
        universityId: HOME,
      },
      {
        id: AUTHOR,
        name: "Search Test Author",
        email: AUTHOR_EMAIL,
        passwordHash: PASSWORD_HASH,
        universityId: HOME,
      },
    ])

    await db.insert(communities).values([
      {
        id: HOME_COMMUNITY,
        slug: "search-test-robotics-club",
        name: "Search Test Robotics Club",
        tagline: "We build competition robots",
        kind: "OFFICIAL",
        scope: "UNIVERSITY",
        placeId: HOME,
        interestId: INTEREST,
        verification: "VERIFIED",
        createdById: AUTHOR,
      },
      {
        id: OTHER_COMMUNITY,
        slug: "search-test-secret-robotics",
        name: "Search Test Offcampus Robotics",
        tagline: "Another university's club",
        kind: "OFFICIAL",
        scope: "UNIVERSITY",
        placeId: OTHER,
        interestId: INTEREST,
        verification: "VERIFIED",
        createdById: AUTHOR,
      },
    ])

    await db.insert(events).values([
      {
        id: HOME_EVENT,
        slug: "search-test-hackathon",
        title: "Hackathon",
        description: "A weekend of building",
        kind: "WORKSHOP",
        mode: "IN_PERSON",
        venue: "Innovation Lab",
        status: "PUBLISHED",
        startsAt: soon,
        endsAt: soonEnd,
        communityId: HOME_COMMUNITY,
        interestId: INTEREST,
        createdById: AUTHOR,
      },
      {
        id: PREFIX_EVENT,
        slug: "search-test-hackathon-kickoff",
        title: "Hackathon Kickoff Briefing",
        description: "What to expect",
        kind: "TALK",
        mode: "IN_PERSON",
        venue: "Auditorium",
        status: "PUBLISHED",
        startsAt: soon,
        endsAt: soonEnd,
        communityId: HOME_COMMUNITY,
        interestId: INTEREST,
        createdById: AUTHOR,
      },
      {
        id: DESCRIPTION_EVENT,
        slug: "search-test-poetry",
        title: "Poetry Night",
        description: "Readings between the hackathon rounds",
        kind: "PERFORMANCE",
        mode: "IN_PERSON",
        venue: "Amphitheatre",
        status: "PUBLISHED",
        startsAt: soon,
        endsAt: soonEnd,
        communityId: HOME_COMMUNITY,
        interestId: INTEREST,
        createdById: AUTHOR,
      },
      {
        id: OTHER_EVENT,
        slug: "search-test-offcampus-hackathon",
        title: "Offcampus Hackathon",
        description: "Another university's event",
        kind: "WORKSHOP",
        mode: "IN_PERSON",
        venue: "Elsewhere",
        status: "PUBLISHED",
        startsAt: soon,
        endsAt: soonEnd,
        communityId: OTHER_COMMUNITY,
        interestId: INTEREST,
        createdById: AUTHOR,
      },
    ])

    await db.insert(opportunities).values([
      {
        id: HOME_OPPORTUNITY,
        slug: "search-test-hackathon-team",
        title: "Hackathon Team Recruitment",
        description: "Looking for two more builders",
        kind: "COMPETITION",
        interestId: INTEREST,
        url: "https://example.com/search-test",
        placeId: HOME,
        communityId: HOME_COMMUNITY,
      },
      {
        id: OTHER_OPPORTUNITY,
        slug: "search-test-offcampus-hackathon-team",
        title: "Offcampus Hackathon Crew",
        description: "Another university's listing",
        kind: "COMPETITION",
        interestId: INTEREST,
        url: "https://example.com/search-test-other",
        placeId: OTHER,
        communityId: OTHER_COMMUNITY,
      },
    ])

    await db.insert(posts).values([
      {
        id: HOME_POST,
        communityId: HOME_COMMUNITY,
        authorId: AUTHOR,
        title: "Hackathon registration is open",
        body: "Sign up before Friday. Teams of four.",
        eventId: HOME_EVENT,
        createdAt: new Date("2026-05-09T09:00:00.000Z"),
      },
      {
        id: OTHER_POST,
        communityId: OTHER_COMMUNITY,
        authorId: AUTHOR,
        title: "Offcampus hackathon notice",
        body: "Another university's announcement.",
        createdAt: new Date("2026-05-09T09:00:00.000Z"),
      },
    ])
  })

  afterAll(async () => {
    await db.delete(posts).where(inArray(posts.id, [HOME_POST, OTHER_POST]))
    await db
      .delete(opportunities)
      .where(inArray(opportunities.id, [HOME_OPPORTUNITY, OTHER_OPPORTUNITY]))
    await db
      .delete(events)
      .where(
        inArray(events.id, [
          HOME_EVENT,
          PREFIX_EVENT,
          DESCRIPTION_EVENT,
          OTHER_EVENT,
        ]),
      )
    await db
      .delete(communities)
      .where(inArray(communities.id, [HOME_COMMUNITY, OTHER_COMMUNITY]))
    await db.delete(users).where(inArray(users.id, [VIEWER, AUTHOR]))
    await db.delete(interests).where(inArray(interests.id, [INTEREST]))
    await db.delete(places).where(inArray(places.id, [HOME, OTHER, CITY]))
  })

  async function scope() {
    return searchScopeFor({ viewerId: VIEWER, now })
  }

  describe("searchEvents", () => {
    it("finds an event by title", async () => {
      const results = await searchEvents(request("hackathon"), await scope(), 10)

      expect(results.map((event) => event.id)).toContain(HOME_EVENT)
    })

    it("is case-insensitive", async () => {
      const upper = await searchEvents(request("HACKATHON"), await scope(), 10)

      expect(upper.map((event) => event.id)).toContain(HOME_EVENT)
    })

    it("matches partial words", async () => {
      const results = await searchEvents(request("hack"), await scope(), 10)

      expect(results.map((event) => event.id)).toContain(HOME_EVENT)
    })

    it("ranks the exact title above the prefix match and the description match", async () => {
      const results = await searchEvents(request("hackathon"), await scope(), 10)
      const ids = results.map((event) => event.id)

      expect(ids.indexOf(HOME_EVENT)).toBeLessThan(ids.indexOf(PREFIX_EVENT))
      expect(ids.indexOf(PREFIX_EVENT)).toBeLessThan(
        ids.indexOf(DESCRIPTION_EVENT),
      )
    })

    it("finds an event by venue", async () => {
      const results = await searchEvents(
        request("innovation lab"),
        await scope(),
        10,
      )

      expect(results.map((event) => event.id)).toContain(HOME_EVENT)
    })

    it("never returns another university's event", async () => {
      const results = await searchEvents(request("hackathon"), await scope(), 10)

      expect(results.map((event) => event.id)).not.toContain(OTHER_EVENT)
    })

    it("respects the limit", async () => {
      const results = await searchEvents(request("hackathon"), await scope(), 1)

      expect(results).toHaveLength(1)
    })

    it("returns nothing for a query below the minimum length", async () => {
      expect(await searchEvents(request("h"), await scope(), 10)).toEqual([])
    })
  })

  describe("searchCommunities", () => {
    it("finds a community by name and by slug", async () => {
      const byName = await searchCommunities(
        request("robotics club"),
        await scope(),
        10,
      )
      const bySlug = await searchCommunities(
        request("search-test-robotics-club"),
        await scope(),
        10,
      )

      expect(byName.map((community) => community.id)).toContain(HOME_COMMUNITY)
      expect(bySlug.map((community) => community.id)).toContain(HOME_COMMUNITY)
    })

    it("finds a community by its tagline", async () => {
      const results = await searchCommunities(
        request("competition robots"),
        await scope(),
        10,
      )

      expect(results.map((community) => community.id)).toContain(HOME_COMMUNITY)
    })

    it("never returns another university's community", async () => {
      const results = await searchCommunities(
        request("robotics"),
        await scope(),
        10,
      )

      expect(results.map((community) => community.id)).not.toContain(
        OTHER_COMMUNITY,
      )
    })
  })

  describe("searchOpportunities", () => {
    it("finds an opportunity by title", async () => {
      const results = await searchOpportunities(
        request("hackathon team"),
        await scope(),
        10,
      )

      expect(results.map((opportunity) => opportunity.id)).toContain(
        HOME_OPPORTUNITY,
      )
    })

    it("never returns another university's opportunity", async () => {
      const results = await searchOpportunities(
        request("hackathon"),
        await scope(),
        10,
      )

      expect(results.map((opportunity) => opportunity.id)).not.toContain(
        OTHER_OPPORTUNITY,
      )
    })
  })

  describe("searchPosts", () => {
    it("finds an update by title and carries its linked event", async () => {
      const results = await searchPosts(request("registration"), await scope(), 10)
      const found = results.find((update) => update.id === HOME_POST)

      expect(found).toBeDefined()
      expect(found?.event?.slug).toBe("search-test-hackathon")
      expect(found?.community.name).toBe("Search Test Robotics Club")
      expect(found?.authorName).toBe("Search Test Author")
    })

    it("finds an update by body text", async () => {
      const results = await searchPosts(request("teams of four"), await scope(), 10)

      expect(results.map((update) => update.id)).toContain(HOME_POST)
    })

    it("never returns another university's update", async () => {
      const results = await searchPosts(request("hackathon"), await scope(), 10)

      expect(results.map((update) => update.id)).not.toContain(OTHER_POST)
    })
  })

  describe("searchAll", () => {
    it("returns a mixed result set with counts that match the lists", async () => {
      const results = await searchAll(request("hackathon"), await scope())

      expect(results.counts.events).toBe(results.events.length)
      expect(results.counts.updates).toBe(results.updates.length)
      expect(results.counts.total).toBeGreaterThan(0)
      expect(results.events.length).toBeGreaterThan(0)
      expect(results.opportunities.length).toBeGreaterThan(0)
      expect(results.updates.length).toBeGreaterThan(0)
    })

    it("caps each category on the All tab", async () => {
      const results = await searchAll(request("hackathon"), await scope())

      expect(results.events.length).toBeLessThanOrEqual(5)
      expect(results.communities.length).toBeLessThanOrEqual(5)
      expect(results.opportunities.length).toBeLessThanOrEqual(5)
      expect(results.updates.length).toBeLessThanOrEqual(5)
    })

    it("only searches the requested category on a single-category tab", async () => {
      const results = await searchAll(request("hackathon", "events"), await scope())

      expect(results.events.length).toBeGreaterThan(0)
      expect(results.updates).toEqual([])
      expect(results.opportunities).toEqual([])
    })

    it("returns empty results without searching for a too-short query", async () => {
      const results = await searchAll(request("h"), await scope())

      expect(results.counts.total).toBe(0)
    })

    it("finds nothing for a query that matches nothing", async () => {
      const results = await searchAll(
        request("zzzznotathingoncampus"),
        await scope(),
      )

      expect(results.counts.total).toBe(0)
    })

    it("treats wildcard characters as literal text rather than matching everything", async () => {
      const results = await searchAll(request("%%"), await scope())

      expect(results.counts.total).toBe(0)
    })

    it("leaks no email address or password hash into a result set", async () => {
      const results = await searchAll(request("hackathon"), await scope())
      const serialised = JSON.stringify({
        events: results.events,
        communities: results.communities,
        opportunities: results.opportunities,
        updates: results.updates,
      })

      expect(serialised).not.toContain(AUTHOR_EMAIL)
      expect(serialised).not.toContain(PASSWORD_HASH)
      expect(serialised).not.toContain("@chitkara.edu.in")
    })
  })
})
