// @vitest-environment node

import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import { communities, interests, memberships, users } from "@/lib/db/schema"
import { listPendingRequests } from "@/lib/services/community-members"

/**
 * The moderator queue, against a real database.
 *
 * Separate file from `community-members.db.test.ts` so the two read as what they
 * are: one is a public projection, this one is an authorization boundary. The
 * refusal is the point. A mock cannot be wrong about which membership row the
 * viewer actually has, and that is exactly the fact standing between a private
 * list of rejected applicants and everybody.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

const INTEREST = "pr-interest"
const COMMUNITY = "pr-community"
const QUIET_COMMUNITY = "pr-quiet-community"

const OWNER = "pr-owner"
const MODERATOR = "pr-moderator"
const PLAIN_MEMBER = "pr-member"
const EARLY_APPLICANT = "pr-early"
const LATE_APPLICANT = "pr-late"
const INVITEE = "pr-invitee"
const STRANGER = "pr-stranger"

const USER_IDS = [
  OWNER,
  MODERATOR,
  PLAIN_MEMBER,
  EARLY_APPLICANT,
  LATE_APPLICANT,
  INVITEE,
  STRANGER,
]

async function cleanup() {
  await db.delete(memberships).where(inArray(memberships.userId, USER_IDS))
  await db
    .delete(communities)
    .where(inArray(communities.id, [COMMUNITY, QUIET_COMMUNITY]))
  await db.delete(users).where(inArray(users.id, USER_IDS))
  await db.delete(interests).where(eq(interests.id, INTEREST))
}

/** Narrows the result and fails loudly, rather than asserting on `undefined`. */
function expectOk<T>(result: Awaited<ReturnType<typeof listPendingRequests>>) {
  if (!result.ok) {
    throw new Error(`expected success, got ${result.code}: ${result.message}`)
  }
  return result.data
}

describe.skipIf(!hasDatabase)("listPendingRequests", () => {
  beforeAll(async () => {
    await cleanup()

    await db.insert(interests).values({
      id: INTEREST,
      slug: "pr-testing",
      label: "Testing",
    })

    // Placeless and global, so this fixture needs no place hierarchy.
    await db.insert(communities).values([
      {
        id: COMMUNITY,
        slug: "pr-robotics",
        name: "Robotics",
        kind: "STUDENT",
        scope: "GLOBAL",
        joinPolicy: "APPROVAL",
        interestId: INTEREST,
      },
      {
        id: QUIET_COMMUNITY,
        slug: "pr-chess",
        name: "Chess",
        kind: "STUDENT",
        scope: "GLOBAL",
        joinPolicy: "APPROVAL",
        interestId: INTEREST,
      },
    ])

    await db.insert(users).values([
      {
        id: OWNER,
        name: "Owner",
        email: "pr-owner@vo.test",
        role: "ORGANIZER",
        passwordHash: "not-a-real-hash",
      },
      {
        id: MODERATOR,
        name: "Moderator",
        email: "pr-moderator@vo.test",
        role: "COMMUNITY_MODERATOR",
        passwordHash: "not-a-real-hash",
      },
      {
        id: PLAIN_MEMBER,
        name: "Plain Member",
        email: "pr-member@vo.test",
        passwordHash: "not-a-real-hash",
      },
      {
        id: EARLY_APPLICANT,
        name: "Waited Longest",
        email: "pr-early@vo.test",
        passwordHash: "not-a-real-hash",
      },
      {
        id: LATE_APPLICANT,
        name: "Asked Yesterday",
        email: "pr-late@vo.test",
        passwordHash: "not-a-real-hash",
      },
      {
        id: INVITEE,
        name: "Invited Person",
        email: "pr-invitee@vo.test",
        passwordHash: "not-a-real-hash",
      },
      {
        id: STRANGER,
        name: "Passing Stranger",
        email: "pr-stranger@vo.test",
        passwordHash: "not-a-real-hash",
      },
    ])

    await db.insert(memberships).values([
      { communityId: COMMUNITY, userId: OWNER, state: "OWNER" },
      { communityId: COMMUNITY, userId: MODERATOR, state: "MODERATOR" },
      { communityId: COMMUNITY, userId: PLAIN_MEMBER, state: "MEMBER" },
      { communityId: COMMUNITY, userId: INVITEE, state: "INVITED" },
      {
        communityId: COMMUNITY,
        userId: LATE_APPLICANT,
        state: "PENDING",
        requestedAt: new Date("2026-02-02T00:00:00.000Z"),
      },
      {
        communityId: COMMUNITY,
        userId: EARLY_APPLICANT,
        state: "PENDING",
        requestedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      // The same moderator runs a community with nobody waiting.
      { communityId: QUIET_COMMUNITY, userId: MODERATOR, state: "MODERATOR" },
    ])
  })

  afterAll(cleanup)

  it("refuses an ordinary member of the community", async () => {
    const result = await listPendingRequests({
      moderatorId: PLAIN_MEMBER,
      communityId: COMMUNITY,
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe("FORBIDDEN")
  })

  it("refuses somebody with no membership at all", async () => {
    const result = await listPendingRequests({
      moderatorId: STRANGER,
      communityId: COMMUNITY,
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe("FORBIDDEN")
  })

  it("refuses an applicant asking about their own queue", async () => {
    // A PENDING row is not a membership. Otherwise asking to join a selective
    // society would reveal everyone else who asked.
    const result = await listPendingRequests({
      moderatorId: EARLY_APPLICANT,
      communityId: COMMUNITY,
    })

    expect(result.ok).toBe(false)
  })

  it("gives the owner the pending requests, oldest first", async () => {
    const requests = expectOk(
      await listPendingRequests({
        moderatorId: OWNER,
        communityId: COMMUNITY,
      }),
    )

    // Inserted late-then-early, so insertion order would fail this.
    expect(requests.map((request) => request.userId)).toEqual([
      EARLY_APPLICANT,
      LATE_APPLICANT,
    ])
  })

  it("gives a moderator the same queue as the owner", async () => {
    const requests = expectOk(
      await listPendingRequests({
        moderatorId: MODERATOR,
        communityId: COMMUNITY,
      }),
    )

    expect(requests).toHaveLength(2)
  })

  it("lists only PENDING - not members, invitees, or leads", async () => {
    const requests = expectOk(
      await listPendingRequests({
        moderatorId: OWNER,
        communityId: COMMUNITY,
      }),
    )

    const ids = requests.map((request) => request.userId)
    expect(ids).not.toContain(PLAIN_MEMBER)
    expect(ids).not.toContain(INVITEE)
    expect(ids).not.toContain(OWNER)
  })

  it("returns an empty queue rather than a failure when nobody is waiting", async () => {
    // An empty queue and a refusal are very different messages to show.
    const requests = expectOk(
      await listPendingRequests({
        moderatorId: MODERATOR,
        communityId: QUIET_COMMUNITY,
      }),
    )

    expect(requests).toEqual([])
  })

  it("returns no private user columns", async () => {
    const [request] = expectOk(
      await listPendingRequests({
        moderatorId: OWNER,
        communityId: COMMUNITY,
      }),
    )

    expect(Object.keys(request).sort()).toEqual([
      "avatarUrl",
      "name",
      "requestedAt",
      "role",
      "userId",
    ])
    expect(JSON.stringify(request)).not.toContain("@vo.test")
  })

  it("reports timestamps as ISO strings", async () => {
    const [request] = expectOk(
      await listPendingRequests({
        moderatorId: OWNER,
        communityId: COMMUNITY,
      }),
    )

    expect(request.requestedAt).toBe("2026-01-01T00:00:00.000Z")
  })

  it("refuses a community that does not exist", async () => {
    // No membership row can exist for it, so this is a refusal and not a crash.
    const result = await listPendingRequests({
      moderatorId: OWNER,
      communityId: "pr-nope",
    })

    expect(result.ok).toBe(false)
  })
})
