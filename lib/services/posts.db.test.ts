// @vitest-environment node

import { inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import { communities, events, interests, posts, users } from "@/lib/db/schema"
import { listRecentPosts } from "@/lib/services/posts"

const hasDatabase = Boolean(process.env.DATABASE_URL)

const INTEREST_ID = "posts-test-interest"
const COMMUNITY_IDS = ["posts-test-community", "posts-test-archived"]
const USER_ID = "posts-test-author"
const EVENT_ID = "posts-test-event"
const POST_IDS = [
  "posts-test-oldest",
  "posts-test-newest",
  "posts-test-removed",
  "posts-test-archived-community",
  "posts-test-with-event",
]

async function cleanup() {
  await db.delete(posts).where(inArray(posts.id, POST_IDS))
  await db.delete(events).where(inArray(events.id, [EVENT_ID]))
  await db.delete(communities).where(inArray(communities.id, COMMUNITY_IDS))
  await db.delete(users).where(inArray(users.id, [USER_ID]))
  await db.delete(interests).where(inArray(interests.id, [INTEREST_ID]))
}

describe.skipIf(!hasDatabase)("listRecentPosts", () => {
  beforeAll(async () => {
    await cleanup()

    await db
      .insert(interests)
      .values({ id: INTEREST_ID, slug: "posts-test", label: "Posts Test" })

    await db.insert(users).values({
      id: USER_ID,
      name: "Priya Announcer",
      email: "posts-test-author@example.test",
      passwordHash: "not-a-real-hash",
    })

    await db.insert(communities).values([
      {
        id: COMMUNITY_IDS[0] as string,
        slug: "posts-test-community",
        name: "Posts Test Club",
        kind: "STUDENT",
        scope: "UNIVERSITY",
        interestId: INTEREST_ID,
        verification: "VERIFIED",
      },
      {
        id: COMMUNITY_IDS[1] as string,
        slug: "posts-test-archived",
        name: "Archived Club",
        kind: "STUDENT",
        scope: "UNIVERSITY",
        interestId: INTEREST_ID,
        archivedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ])

    await db.insert(events).values({
      id: EVENT_ID,
      slug: "posts-test-event",
      title: "Posts Test Event",
      description: "An event referenced by an announcement.",
      kind: "WORKSHOP",
      mode: "IN_PERSON",
      venue: "Block A",
      status: "PUBLISHED",
      startsAt: new Date("2026-04-01T10:00:00.000Z"),
      endsAt: new Date("2026-04-01T12:00:00.000Z"),
      capacity: 40,
      communityId: COMMUNITY_IDS[0] as string,
      interestId: INTEREST_ID,
      createdById: USER_ID,
    })

    await db.insert(posts).values([
      {
        id: "posts-test-oldest",
        communityId: COMMUNITY_IDS[0] as string,
        authorId: USER_ID,
        title: "Older announcement",
        body: "Posted first.",
        createdAt: new Date("2026-02-01T10:00:00.000Z"),
      },
      {
        id: "posts-test-newest",
        communityId: COMMUNITY_IDS[0] as string,
        authorId: USER_ID,
        title: "Newer announcement",
        body: "Posted second.",
        createdAt: new Date("2026-02-05T10:00:00.000Z"),
      },
      {
        id: "posts-test-removed",
        communityId: COMMUNITY_IDS[0] as string,
        authorId: USER_ID,
        title: "Removed announcement",
        body: "Taken down by a moderator.",
        createdAt: new Date("2026-02-06T10:00:00.000Z"),
        removedAt: new Date("2026-02-07T10:00:00.000Z"),
        removalReason: "Spam",
      },
      {
        id: "posts-test-archived-community",
        communityId: COMMUNITY_IDS[1] as string,
        authorId: USER_ID,
        title: "From an archived club",
        body: "Should not appear.",
        createdAt: new Date("2026-02-08T10:00:00.000Z"),
      },
      {
        id: "posts-test-with-event",
        communityId: COMMUNITY_IDS[0] as string,
        authorId: USER_ID,
        title: "About an event",
        body: "Come along.",
        eventId: EVENT_ID,
        createdAt: new Date("2026-02-04T10:00:00.000Z"),
      },
    ])
  })

  afterAll(cleanup)

  it("returns announcements newest first", async () => {
    const result = await listRecentPosts({
      communityIds: [COMMUNITY_IDS[0] as string],
    })

    expect(result.map((post) => post.id)).toEqual([
      "posts-test-newest",
      "posts-test-with-event",
      "posts-test-oldest",
    ])
  })

  it("hides removed announcements", async () => {
    const result = await listRecentPosts({
      communityIds: [COMMUNITY_IDS[0] as string],
    })

    expect(result.map((post) => post.id)).not.toContain("posts-test-removed")
  })

  it("hides announcements from archived communities", async () => {
    const result = await listRecentPosts({ communityIds: COMMUNITY_IDS })

    expect(result.map((post) => post.id)).not.toContain(
      "posts-test-archived-community",
    )
  })

  it("projects the community, the author's name, and a link", async () => {
    const [newest] = await listRecentPosts({
      communityIds: [COMMUNITY_IDS[0] as string],
      limit: 1,
    })

    expect(newest?.community.name).toBe("Posts Test Club")
    expect(newest?.community.verification).toBe("VERIFIED")
    expect(newest?.authorName).toBe("Priya Announcer")
    expect(newest?.href).toBe("/communities/posts-test-community")
  })

  it("never projects the author's email address", async () => {
    const result = await listRecentPosts({
      communityIds: [COMMUNITY_IDS[0] as string],
    })

    expect(JSON.stringify(result)).not.toContain("@example.test")
  })

  it("resolves the linked event when there is one", async () => {
    const result = await listRecentPosts({
      communityIds: [COMMUNITY_IDS[0] as string],
    })
    const withEvent = result.find((post) => post.id === "posts-test-with-event")

    expect(withEvent?.event).toEqual({
      slug: "posts-test-event",
      title: "Posts Test Event",
    })
  })

  it("leaves the event null on a plain announcement", async () => {
    const result = await listRecentPosts({
      communityIds: [COMMUNITY_IDS[0] as string],
    })
    const plain = result.find((post) => post.id === "posts-test-oldest")

    expect(plain?.event).toBeNull()
  })

  it("honours the limit", async () => {
    const result = await listRecentPosts({
      communityIds: [COMMUNITY_IDS[0] as string],
      limit: 2,
    })

    expect(result).toHaveLength(2)
  })

  it("returns nothing for an empty community list rather than everything", async () => {
    expect(await listRecentPosts({ communityIds: [] })).toEqual([])
  })
})
