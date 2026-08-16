// @vitest-environment node
import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import {
  auditLog,
  communities,
  interests,
  memberships,
  places,
  users,
  verificationRequests,
} from "@/lib/db/schema"
import {
  listAuditEntries,
  listVerificationRequests,
  requestOrganizerVerification,
  reviewVerificationRequest,
} from "@/lib/services/organizer-verification"

/**
 * Organiser verification against a real Postgres.
 *
 * The interesting failures here are all relational, so a fake database would
 * test nothing worth testing: approval has to flip a column on another table,
 * promote a row in a third, and write a fourth - atomically. The partial unique
 * index that prevents two open requests only exists in Postgres at all.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

/** Fictional slugs and domains, so a real seed can never collide. */
const PLACE_ID = "ov-place-university"
const INTEREST_ID = "ov-interest"
const CLUB = "ov-community-club"
const CLUB_SLUG = "ov-club"
const ADMIN_CLUB = "ov-community-admin-club"
const ADMIN_CLUB_SLUG = "ov-admin-club"

const OWNER = "ov-user-owner"
const MEMBER = "ov-user-member"
const OUTSIDER = "ov-user-outsider"
const ADMIN = "ov-user-admin"
const OTHER_ADMIN = "ov-user-other-admin"

const STUDENT_IDS = [OWNER, MEMBER, OUTSIDER]
const ADMIN_IDS = [ADMIN, OTHER_ADMIN]
const USER_IDS = [...STUDENT_IDS, ...ADMIN_IDS]
const COMMUNITY_IDS = [CLUB, ADMIN_CLUB]

/** Comfortably over MINIMUM_EVIDENCE_LENGTH, and the shape of a real answer. */
const EVIDENCE =
  "Registered student society since 2019. Faculty advisor Dr Rao, " +
  "registration number CU-SOC-114."

async function cleanup() {
  await db.delete(auditLog).where(inArray(auditLog.actorId, USER_IDS))
  await db
    .delete(verificationRequests)
    .where(inArray(verificationRequests.communityId, COMMUNITY_IDS))
  await db
    .delete(memberships)
    .where(inArray(memberships.communityId, COMMUNITY_IDS))
  await db.delete(communities).where(inArray(communities.id, COMMUNITY_IDS))
  await db.delete(users).where(inArray(users.id, USER_IDS))
  await db.delete(interests).where(eq(interests.id, INTEREST_ID))
  await db.delete(places).where(eq(places.id, PLACE_ID))
}

/** Back to "nothing has been asked yet", without rebuilding the fixtures. */
async function resetState() {
  await db.delete(auditLog).where(inArray(auditLog.actorId, USER_IDS))
  await db
    .delete(verificationRequests)
    .where(inArray(verificationRequests.communityId, COMMUNITY_IDS))
  await db
    .update(communities)
    .set({ verification: "UNVERIFIED" })
    .where(inArray(communities.id, COMMUNITY_IDS))
  await db
    .update(users)
    .set({ role: "STUDENT" })
    .where(inArray(users.id, STUDENT_IDS))
  await db
    .update(users)
    .set({ role: "UNIVERSITY_ADMIN" })
    .where(inArray(users.id, ADMIN_IDS))
}

describe.skipIf(!hasDatabase)("organiser verification", () => {
  beforeAll(async () => {
    await cleanup()

    await db.insert(places).values({
      id: PLACE_ID,
      kind: "UNIVERSITY" as const,
      name: "Organiser Test University",
      slug: "ov-campus",
      status: "ACTIVE" as const,
      emailDomain: "ov-campus.test",
    })

    await db.insert(interests).values({
      id: INTEREST_ID,
      slug: "ov-interest",
      label: "Organiser Test Interest",
    })

    await db.insert(users).values([
      { id: OWNER, name: "Club Owner", email: "owner@ov-campus.test" },
      { id: MEMBER, name: "Plain Member", email: "member@ov-campus.test" },
      { id: OUTSIDER, name: "Outsider", email: "outsider@ov-campus.test" },
      {
        id: ADMIN,
        name: "Campus Admin",
        email: "admin@ov-campus.test",
        role: "UNIVERSITY_ADMIN" as const,
      },
      {
        id: OTHER_ADMIN,
        name: "Second Admin",
        email: "admin2@ov-campus.test",
        role: "UNIVERSITY_ADMIN" as const,
      },
    ])

    await db.insert(communities).values([
      {
        id: CLUB,
        slug: CLUB_SLUG,
        name: "Organiser Test Club",
        kind: "STUDENT" as const,
        interestId: INTEREST_ID,
        placeId: PLACE_ID,
      },
      {
        id: ADMIN_CLUB,
        slug: ADMIN_CLUB_SLUG,
        name: "Admin Owned Club",
        kind: "STUDENT" as const,
        interestId: INTEREST_ID,
        placeId: PLACE_ID,
      },
    ])

    await db.insert(memberships).values([
      { communityId: CLUB, userId: OWNER, state: "OWNER" as const },
      { communityId: CLUB, userId: MEMBER, state: "MEMBER" as const },
      { communityId: ADMIN_CLUB, userId: ADMIN, state: "OWNER" as const },
    ])
  })

  afterAll(cleanup)

  beforeEach(resetState)

  describe("asking for verification", () => {
    it("refuses somebody with no membership at all", async () => {
      const result = await requestOrganizerVerification({
        userId: OUTSIDER,
        input: { communitySlug: CLUB_SLUG, evidence: EVIDENCE },
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("FORBIDDEN")
    })

    it("refuses a plain member of the community", async () => {
      const result = await requestOrganizerVerification({
        userId: MEMBER,
        input: { communitySlug: CLUB_SLUG, evidence: EVIDENCE },
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("FORBIDDEN")
    })

    it("refuses a community that does not exist", async () => {
      const result = await requestOrganizerVerification({
        userId: OWNER,
        input: { communitySlug: "ov-no-such-club", evidence: EVIDENCE },
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("NOT_FOUND")
    })

    it("refuses evidence too thin to judge", async () => {
      const result = await requestOrganizerVerification({
        userId: OWNER,
        input: { communitySlug: CLUB_SLUG, evidence: "please verify us" },
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("INVALID")

      // A refused request must leave no trace on the community.
      const [club] = await db
        .select({ verification: communities.verification })
        .from(communities)
        .where(eq(communities.id, CLUB))
      expect(club.verification).toBe("UNVERIFIED")
    })

    it("accepts the owner, marks the club pending, and records it", async () => {
      const result = await requestOrganizerVerification({
        userId: OWNER,
        input: { communitySlug: CLUB_SLUG, evidence: EVIDENCE },
      })
      expect(result.ok).toBe(true)

      const [club] = await db
        .select({ verification: communities.verification })
        .from(communities)
        .where(eq(communities.id, CLUB))
      expect(club.verification).toBe("PENDING")

      const trail = await db
        .select({ action: auditLog.action })
        .from(auditLog)
        .where(eq(auditLog.actorId, OWNER))
      expect(trail).toHaveLength(1)
      expect(trail[0].action).toBe("verification.requested")
    })

    it("refuses a second open request for the same club", async () => {
      await requestOrganizerVerification({
        userId: OWNER,
        input: { communitySlug: CLUB_SLUG, evidence: EVIDENCE },
      })

      const second = await requestOrganizerVerification({
        userId: OWNER,
        input: { communitySlug: CLUB_SLUG, evidence: EVIDENCE },
      })
      expect(second.ok).toBe(false)
      if (!second.ok) expect(second.code).toBe("CONFLICT")
    })
  })

  describe("the reviewer's queue", () => {
    it("refuses a student", async () => {
      const result = await listVerificationRequests({ reviewerId: OWNER })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("FORBIDDEN")
    })

    it("shows an admin the pending request with its evidence", async () => {
      await requestOrganizerVerification({
        userId: OWNER,
        input: { communitySlug: CLUB_SLUG, evidence: EVIDENCE },
      })

      const result = await listVerificationRequests({
        reviewerId: ADMIN,
        status: "PENDING",
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return

      const mine = result.data.find((row) => row.community.id === CLUB)
      expect(mine).toBeDefined()
      expect(mine?.evidence).toBe(EVIDENCE)
      expect(mine?.requestedBy?.id).toBe(OWNER)
      expect(mine?.status).toBe("PENDING")
    })
  })

  describe("deciding", () => {
    async function openRequest(): Promise<string> {
      const result = await requestOrganizerVerification({
        userId: OWNER,
        input: { communitySlug: CLUB_SLUG, evidence: EVIDENCE },
      })
      if (!result.ok) throw new Error(result.message)
      return result.data.requestId
    }

    it("refuses a student reviewer", async () => {
      const requestId = await openRequest()
      const result = await reviewVerificationRequest({
        reviewerId: MEMBER,
        input: { requestId, decision: "APPROVED" },
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("FORBIDDEN")
    })

    it("refuses an admin reviewing their own club", async () => {
      const asked = await requestOrganizerVerification({
        userId: ADMIN,
        input: { communitySlug: ADMIN_CLUB_SLUG, evidence: EVIDENCE },
      })
      expect(asked.ok).toBe(true)
      if (!asked.ok) return

      const result = await reviewVerificationRequest({
        reviewerId: ADMIN,
        input: { requestId: asked.data.requestId, decision: "APPROVED" },
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("FORBIDDEN")

      // And another admin can, which is what makes the rule workable.
      const byOther = await reviewVerificationRequest({
        reviewerId: OTHER_ADMIN,
        input: { requestId: asked.data.requestId, decision: "APPROVED" },
      })
      expect(byOther.ok).toBe(true)
    })

    it("verifies the club and promotes its owner to organiser", async () => {
      const requestId = await openRequest()

      const result = await reviewVerificationRequest({
        reviewerId: ADMIN,
        input: { requestId, decision: "APPROVED", note: "Checked the register." },
      })
      expect(result.ok).toBe(true)

      const [club] = await db
        .select({ verification: communities.verification })
        .from(communities)
        .where(eq(communities.id, CLUB))
      expect(club.verification).toBe("VERIFIED")

      const [owner] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, OWNER))
      // This is the fact Phase 3 will check before letting anyone post events.
      expect(owner.role).toBe("ORGANIZER")

      const [row] = await db
        .select({
          status: verificationRequests.status,
          reviewedById: verificationRequests.reviewedById,
          reviewerNote: verificationRequests.reviewerNote,
          decidedAt: verificationRequests.decidedAt,
        })
        .from(verificationRequests)
        .where(eq(verificationRequests.id, requestId))
      expect(row.status).toBe("APPROVED")
      expect(row.reviewedById).toBe(ADMIN)
      expect(row.reviewerNote).toBe("Checked the register.")
      expect(row.decidedAt).toBeInstanceOf(Date)
    })

    it("does not promote an admin who owns a club", async () => {
      const asked = await requestOrganizerVerification({
        userId: ADMIN,
        input: { communitySlug: ADMIN_CLUB_SLUG, evidence: EVIDENCE },
      })
      if (!asked.ok) throw new Error(asked.message)

      await reviewVerificationRequest({
        reviewerId: OTHER_ADMIN,
        input: { requestId: asked.data.requestId, decision: "APPROVED" },
      })

      const [admin] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, ADMIN))
      // Verification grants; it must never demote.
      expect(admin.role).toBe("UNIVERSITY_ADMIN")
    })

    it("returns a rejected club to unverified and leaves the role alone", async () => {
      const requestId = await openRequest()

      const result = await reviewVerificationRequest({
        reviewerId: ADMIN,
        input: {
          requestId,
          decision: "REJECTED",
          note: "Not on the register.",
        },
      })
      expect(result.ok).toBe(true)

      const [club] = await db
        .select({ verification: communities.verification })
        .from(communities)
        .where(eq(communities.id, CLUB))
      // Not left as PENDING: the badge must stop claiming a live review.
      expect(club.verification).toBe("UNVERIFIED")

      const [owner] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, OWNER))
      expect(owner.role).toBe("STUDENT")
    })

    it("refuses to decide the same request twice", async () => {
      const requestId = await openRequest()

      const first = await reviewVerificationRequest({
        reviewerId: ADMIN,
        input: { requestId, decision: "APPROVED" },
      })
      expect(first.ok).toBe(true)

      const second = await reviewVerificationRequest({
        reviewerId: ADMIN,
        input: { requestId, decision: "REJECTED" },
      })
      expect(second.ok).toBe(false)
      if (!second.ok) expect(second.code).toBe("CONFLICT")
    })

    it("lets a rejected club ask again", async () => {
      const requestId = await openRequest()
      await reviewVerificationRequest({
        reviewerId: ADMIN,
        input: { requestId, decision: "REJECTED" },
      })

      // The partial index is on PENDING only, so history does not block this.
      const again = await requestOrganizerVerification({
        userId: OWNER,
        input: { communitySlug: CLUB_SLUG, evidence: EVIDENCE },
      })
      expect(again.ok).toBe(true)
    })

    it("refuses to re-verify a club that is already verified", async () => {
      const requestId = await openRequest()
      await reviewVerificationRequest({
        reviewerId: ADMIN,
        input: { requestId, decision: "APPROVED" },
      })

      const again = await requestOrganizerVerification({
        userId: OWNER,
        input: { communitySlug: CLUB_SLUG, evidence: EVIDENCE },
      })
      expect(again.ok).toBe(false)
      if (!again.ok) expect(again.code).toBe("CONFLICT")
    })
  })

  describe("the audit trail", () => {
    it("refuses a student", async () => {
      const result = await listAuditEntries({ viewerId: OWNER })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("FORBIDDEN")
    })

    it("records the request and the decision, newest first", async () => {
      const asked = await requestOrganizerVerification({
        userId: OWNER,
        input: { communitySlug: CLUB_SLUG, evidence: EVIDENCE },
      })
      if (!asked.ok) throw new Error(asked.message)

      await reviewVerificationRequest({
        reviewerId: ADMIN,
        input: { requestId: asked.data.requestId, decision: "APPROVED" },
      })

      const result = await listAuditEntries({ viewerId: ADMIN })
      expect(result.ok).toBe(true)
      if (!result.ok) return

      const mine = result.data.filter((row) => row.targetId === CLUB)
      expect(mine.map((row) => row.action)).toEqual([
        "verification.approved",
        "verification.requested",
      ])
      expect(mine[0].actor?.id).toBe(ADMIN)
      expect(mine[0].summary).toContain("Organiser Test Club")
    })
  })
})
