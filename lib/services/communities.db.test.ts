// @vitest-environment node
import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import {
  communities,
  communityProposalSupporters,
  communityProposals,
  interests,
  memberships,
  places,
  users,
} from "@/lib/db/schema"
import {
  joinCommunity,
  leaveCommunity,
  listCommunitiesForViewer,
  proposeCommunity,
  reviewJoinRequest,
  supportProposal,
} from "@/lib/services/communities"

/**
 * The Phase 6 verification matrix.
 *
 * These exercise the real service functions against a real Postgres, because
 * the things most likely to be wrong here are things a mock cannot be wrong
 * about: transactional count arithmetic, unique-constraint behaviour on a
 * second click, left-join nullability, and whether ordering survives a LIMIT.
 *
 * Skipped without DATABASE_URL so `npm run test` stays runnable on a laptop
 * with no database. CI sets it, so the matrix is not optional there.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

const CITY = "vt-place-city"
const CAMPUS = "vt-place-campus"
const OTHER_CAMPUS = "vt-place-other"
const INTEREST = "vt-interest"

const STUDENT = "vt-user-student"
const SECOND = "vt-user-second"
const OWNER = "vt-user-owner"
const CO_OWNER = "vt-user-coowner"

const OPEN_C = "vt-community-open"
const APPROVAL_C = "vt-community-approval"
const INVITE_C = "vt-community-invite"
const CITY_C = "vt-community-city"
const INTEREST_C = "vt-community-interest"
const GLOBAL_C = "vt-community-global"
const FOREIGN_C = "vt-community-foreign"

const ALL_COMMUNITIES = [
  OPEN_C,
  APPROVAL_C,
  INVITE_C,
  CITY_C,
  INTEREST_C,
  GLOBAL_C,
  FOREIGN_C,
]
const ALL_USERS = [STUDENT, SECOND, OWNER, CO_OWNER]

async function memberCountOf(communityId: string): Promise<number> {
  const [row] = await db
    .select({ memberCount: communities.memberCount })
    .from(communities)
    .where(eq(communities.id, communityId))
    .limit(1)
  return row.memberCount
}

async function clearMemberships() {
  await db.delete(memberships).where(inArray(memberships.userId, ALL_USERS))
  await db
    .update(communities)
    .set({ memberCount: 0 })
    .where(inArray(communities.id, ALL_COMMUNITIES))
}

async function cleanup() {
  await db.delete(memberships).where(inArray(memberships.userId, ALL_USERS))
  await db
    .delete(communityProposalSupporters)
    .where(inArray(communityProposalSupporters.userId, ALL_USERS))
  await db
    .delete(communityProposals)
    .where(inArray(communityProposals.proposedById, ALL_USERS))
  await db.delete(communities).where(inArray(communities.id, ALL_COMMUNITIES))
  await db.delete(users).where(inArray(users.id, ALL_USERS))
  await db.delete(interests).where(eq(interests.id, INTEREST))
  // Campuses before the city they point at.
  await db.delete(places).where(inArray(places.id, [CAMPUS, OTHER_CAMPUS]))
  await db.delete(places).where(eq(places.id, CITY))
}

describe.skipIf(!hasDatabase)("community service, against Postgres", () => {
  beforeAll(async () => {
    await cleanup()

    await db.insert(places).values([
      {
        id: CITY,
        kind: "CITY",
        name: "Test City",
        slug: "vt-city",
        status: "ACTIVE",
      },
    ])
    await db.insert(places).values([
      {
        id: CAMPUS,
        kind: "UNIVERSITY",
        name: "Test Campus",
        slug: "vt-campus",
        status: "ACTIVE",
        parentPlaceId: CITY,
        emailDomain: "vt.test",
      },
      {
        id: OTHER_CAMPUS,
        kind: "UNIVERSITY",
        name: "Other Campus",
        slug: "vt-other-campus",
        status: "ACTIVE",
      },
    ])

    await db
      .insert(interests)
      .values({ id: INTEREST, slug: "vt-sports", label: "Sports", sortOrder: 1 })

    await db.insert(users).values([
      {
        id: STUDENT,
        name: "Student",
        email: "student@vt.test",
        universityId: CAMPUS,
      },
      {
        id: SECOND,
        name: "Second",
        email: "second@vt.test",
        universityId: CAMPUS,
      },
      { id: OWNER, name: "Owner", email: "owner@vt.test", universityId: CAMPUS },
      {
        id: CO_OWNER,
        name: "Co-owner",
        email: "coowner@vt.test",
        universityId: CAMPUS,
      },
    ])

    const base = { interestId: INTEREST, kind: "STUDENT" as const, tagline: "t" }

    await db.insert(communities).values([
      {
        ...base,
        id: OPEN_C,
        slug: "vt-badminton",
        name: "Badminton",
        scope: "UNIVERSITY",
        placeId: CAMPUS,
        joinPolicy: "OPEN",
      },
      {
        ...base,
        id: APPROVAL_C,
        slug: "vt-ecell",
        name: "Entrepreneurship",
        scope: "UNIVERSITY",
        placeId: CAMPUS,
        joinPolicy: "APPROVAL",
      },
      {
        ...base,
        id: INVITE_C,
        slug: "vt-leadership",
        name: "Leadership",
        scope: "UNIVERSITY",
        placeId: CAMPUS,
        joinPolicy: "INVITE",
      },
      {
        ...base,
        id: CITY_C,
        slug: "vt-runners",
        name: "Runners",
        scope: "CITY",
        placeId: CITY,
        joinPolicy: "OPEN",
      },
      {
        ...base,
        id: INTEREST_C,
        slug: "vt-sports-community",
        name: "Sports Community",
        scope: "INTEREST",
        joinPolicy: "OPEN",
      },
      {
        ...base,
        id: GLOBAL_C,
        slug: "vt-everywhere",
        name: "Everywhere",
        scope: "GLOBAL",
        joinPolicy: "OPEN",
      },
      {
        ...base,
        id: FOREIGN_C,
        slug: "vt-foreign",
        name: "Foreign Campus Club",
        scope: "UNIVERSITY",
        placeId: OTHER_CAMPUS,
        joinPolicy: "OPEN",
      },
    ])
  })

  afterAll(cleanup)

  describe("join, by policy", () => {
    beforeAll(clearMemberships)

    it("OPEN: joins immediately and counts +1", async () => {
      const result = await joinCommunity({
        userId: STUDENT,
        communityId: OPEN_C,
      })

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toBe("MEMBER")
      expect(await memberCountOf(OPEN_C)).toBe(1)
    })

    it("joining twice is a success and counts +0", async () => {
      const result = await joinCommunity({
        userId: STUDENT,
        communityId: OPEN_C,
      })

      expect(result.ok).toBe(true)
      expect(await memberCountOf(OPEN_C)).toBe(1)
    })

    it("leaving counts -1", async () => {
      await leaveCommunity({ userId: STUDENT, communityId: OPEN_C })
      expect(await memberCountOf(OPEN_C)).toBe(0)
    })

    it("leaving twice counts +0 and does not go negative", async () => {
      const result = await leaveCommunity({
        userId: STUDENT,
        communityId: OPEN_C,
      })

      expect(result.ok).toBe(true)
      expect(await memberCountOf(OPEN_C)).toBe(0)
    })

    it("APPROVAL: records a request without counting a member", async () => {
      const result = await joinCommunity({
        userId: STUDENT,
        communityId: APPROVAL_C,
      })

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toBe("PENDING")
      expect(await memberCountOf(APPROVAL_C)).toBe(0)
    })

    it("APPROVAL: requesting twice stays pending", async () => {
      const result = await joinCommunity({
        userId: STUDENT,
        communityId: APPROVAL_C,
      })

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toBe("PENDING")
      expect(await memberCountOf(APPROVAL_C)).toBe(0)
    })

    it("INVITE: refuses self-service entry", async () => {
      const result = await joinCommunity({
        userId: STUDENT,
        communityId: INVITE_C,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("FORBIDDEN")
      expect(await memberCountOf(INVITE_C)).toBe(0)
    })

    it("INVITE: an invited student can accept, and counts +1", async () => {
      await db.insert(memberships).values({
        communityId: INVITE_C,
        userId: SECOND,
        state: "INVITED",
      })

      const result = await joinCommunity({
        userId: SECOND,
        communityId: INVITE_C,
      })

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toBe("MEMBER")
      expect(await memberCountOf(INVITE_C)).toBe(1)
    })
  })

  describe("moderation", () => {
    beforeAll(async () => {
      await clearMemberships()
      await db.insert(memberships).values([
        {
          communityId: APPROVAL_C,
          userId: OWNER,
          state: "OWNER",
          joinedAt: new Date(),
        },
      ])
      await joinCommunity({ userId: STUDENT, communityId: APPROVAL_C })
    })

    it("refuses a non-moderator", async () => {
      const result = await reviewJoinRequest({
        moderatorId: SECOND,
        communityId: APPROVAL_C,
        applicantId: STUDENT,
        decision: "APPROVE",
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("FORBIDDEN")
    })

    it("lets an owner approve, and counts +1", async () => {
      const before = await memberCountOf(APPROVAL_C)

      const result = await reviewJoinRequest({
        moderatorId: OWNER,
        communityId: APPROVAL_C,
        applicantId: STUDENT,
        decision: "APPROVE",
      })

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toBe("MEMBER")
      expect(await memberCountOf(APPROVAL_C)).toBe(before + 1)
    })

    it("refuses to decide the same request twice", async () => {
      const result = await reviewJoinRequest({
        moderatorId: OWNER,
        communityId: APPROVAL_C,
        applicantId: STUDENT,
        decision: "APPROVE",
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("NOT_FOUND")
    })
  })

  describe("the last owner", () => {
    beforeAll(async () => {
      await clearMemberships()
      await db.insert(memberships).values({
        communityId: OPEN_C,
        userId: OWNER,
        state: "OWNER",
        joinedAt: new Date(),
      })
    })

    it("cannot leave while they are the only one", async () => {
      const result = await leaveCommunity({ userId: OWNER, communityId: OPEN_C })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("CONFLICT")
    })

    it("can leave once someone else owns it too", async () => {
      await db.insert(memberships).values({
        communityId: OPEN_C,
        userId: CO_OWNER,
        state: "OWNER",
        joinedAt: new Date(),
      })

      const result = await leaveCommunity({ userId: OWNER, communityId: OPEN_C })
      expect(result.ok).toBe(true)
    })
  })

  describe("scoping: campus, city, interest, everywhere", () => {
    beforeAll(clearMemberships)

    it("returns the student's campus, their city, and placeless communities", async () => {
      const list = await listCommunitiesForViewer({ viewerId: STUDENT })
      const ids = list.map((community) => community.id)

      expect(ids).toEqual(
        expect.arrayContaining([OPEN_C, CITY_C, INTEREST_C, GLOBAL_C]),
      )
      // Another university's community is not discovery, it is noise.
      expect(ids).not.toContain(FOREIGN_C)
    })

    it("orders by scope: UNIVERSITY, CITY, INTEREST, GLOBAL", async () => {
      const rank = { UNIVERSITY: 0, CITY: 1, INTEREST: 2, GLOBAL: 3 } as const
      const list = await listCommunitiesForViewer({ viewerId: STUDENT })
      const ranks = list.map((community) => rank[community.scope])

      expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    })

    it("orders in SQL, not after the fact: a LIMIT 1 still returns the campus", async () => {
      // If the sort happened in JS after fetching, a limited query would return
      // an arbitrary row. This is the assertion that pins where ordering runs.
      const [first] = await listCommunitiesForViewer({
        viewerId: STUDENT,
        limit: 1,
      })

      expect(first.scope).toBe("UNIVERSITY")
      expect(first.place?.id).toBe(CAMPUS)
    })

    it("shows a signed-out visitor only placeless communities", async () => {
      const list = await listCommunitiesForViewer({ viewerId: null })
      const ids = list.map((community) => community.id)

      expect(ids).toEqual(expect.arrayContaining([INTEREST_C, GLOBAL_C]))
      expect(ids).not.toContain(OPEN_C)
    })

    it("reports the viewer's own membership state, not a null", async () => {
      await joinCommunity({ userId: STUDENT, communityId: OPEN_C })

      const list = await listCommunitiesForViewer({ viewerId: STUDENT })
      const joined = list.find((community) => community.id === OPEN_C)
      const notJoined = list.find((community) => community.id === GLOBAL_C)

      expect(joined?.viewerMembership).toBe("MEMBER")
      expect(notJoined?.viewerMembership).toBe("NONE")
    })
  })

  describe("proposals", () => {
    const validInput = {
      tagline: "A place for people who like this thing",
      reason:
        "There is no community for this yet and several of us keep organising it over WhatsApp instead.",
      interestId: INTEREST,
      scope: "UNIVERSITY" as const,
      placeId: CAMPUS,
    }

    beforeAll(clearMemberships)

    it("rejects a proposal that fails validation", async () => {
      const result = await proposeCommunity({
        userId: STUDENT,
        input: { ...validInput, name: "Chess Society", reason: "because" },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("INVALID")
    })

    it("catches a near-duplicate of an existing campus community", async () => {
      // "Badminton" already exists on this campus; the noise words are stripped.
      const result = await proposeCommunity({
        userId: STUDENT,
        input: { ...validInput, name: "Badminton Lovers Club" },
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.status).toBe("DUPLICATE_SUSPECTED")
        if (result.data.status === "DUPLICATE_SUSPECTED") {
          expect(result.data.matches.map((match) => match.id)).toContain(OPEN_C)
        }
      }
    })

    it("submits once the student has acknowledged the duplicates", async () => {
      const result = await proposeCommunity({
        userId: STUDENT,
        input: {
          ...validInput,
          name: "Badminton Lovers Club",
          acknowledgedDuplicates: true,
        },
      })

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.status).toBe("SUBMITTED")
    })

    it("submits a genuinely new name without complaint", async () => {
      const result = await proposeCommunity({
        userId: STUDENT,
        input: { ...validInput, name: "Underwater Basket Weaving" },
      })

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.status).toBe("SUBMITTED")
    })

    it("counts the proposer as the first supporter, then +1 per new supporter, +0 on a repeat", async () => {
      const created = await proposeCommunity({
        userId: STUDENT,
        input: { ...validInput, name: "Kabaddi" },
      })

      expect(created.ok).toBe(true)
      if (!created.ok || created.data.status !== "SUBMITTED") return

      const proposalId = created.data.proposalId

      const first = await supportProposal({ userId: SECOND, proposalId })
      expect(first.ok).toBe(true)
      if (first.ok) expect(first.data.supporterCount).toBe(2)

      // Refreshing and clicking again is not demand.
      const again = await supportProposal({ userId: SECOND, proposalId })
      expect(again.ok).toBe(true)
      if (again.ok) expect(again.data.supporterCount).toBe(2)

      // Nor is the proposer supporting their own proposal a second time.
      const self = await supportProposal({ userId: STUDENT, proposalId })
      expect(self.ok).toBe(true)
      if (self.ok) expect(self.data.supporterCount).toBe(2)
    })
  })
})
