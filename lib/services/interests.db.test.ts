// @vitest-environment node
import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import {
  interestSuggestionSupporters,
  interestSuggestions,
  interests,
  userInterests,
  users,
} from "@/lib/db/schema"
import { normaliseInterestLabel } from "@/lib/domain/interest"
import {
  getUserInterests,
  setUserInterests,
  suggestInterest,
} from "@/lib/services/interests"

/**
 * The interests half of the Phase 6 matrix, against a real Postgres.
 *
 * The pure boundary cases live in `lib/schemas/interests-matrix.test.ts`. What
 * needs a database is everything the schema cannot see: that a retired
 * interest is refused, that replacing a selection actually removes the old
 * rows, and that the unique index on `normalised_label` is what makes repeat
 * suggestions aggregate rather than pile up.
 *
 * Both students carry a confirmed email, because this file is about what the
 * picker accepts from someone who has reached onboarding - and reaching
 * onboarding now requires confirming an address. The refusal codes asserted
 * below are only reachable by an account permitted to make the request; an
 * unverified one is stopped earlier and for a different reason, which is what
 * `verification-gate.db.test.ts` covers.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

const STUDENT = "vi-user-student"
const SECOND = "vi-user-second"
const ALL_USERS = [STUDENT, SECOND]

const ACTIVE = ["vi-one", "vi-two", "vi-three", "vi-four", "vi-five"]
const RETIRED = "vi-retired"
/** Deliberately outside the seeded taxonomy, so CI's seed cannot collide. */
const QUIZZING = "vi-quizzing"
const ALL_INTERESTS = [...ACTIVE, RETIRED, QUIZZING]

/** Also outside the taxonomy, so it is genuinely a new suggestion. */
const NEW_LABEL = "Sepak Takraw"

async function cleanup() {
  await db.delete(userInterests).where(inArray(userInterests.userId, ALL_USERS))
  await db
    .delete(interestSuggestionSupporters)
    .where(inArray(interestSuggestionSupporters.userId, ALL_USERS))
  await db
    .delete(interestSuggestions)
    .where(
      inArray(interestSuggestions.normalisedLabel, [
        normaliseInterestLabel(NEW_LABEL),
      ]),
    )
  await db.delete(users).where(inArray(users.id, ALL_USERS))
  await db.delete(interests).where(inArray(interests.id, ALL_INTERESTS))
}

describe.skipIf(!hasDatabase)("interest service, against Postgres", () => {
  beforeAll(async () => {
    await cleanup()

    await db.insert(interests).values([
      ...ACTIVE.map((id, index) => ({
        id,
        slug: id,
        label: `Test Interest ${index + 1}`,
        sortOrder: index,
      })),
      {
        id: RETIRED,
        slug: "vi-retired",
        label: "Retired Interest",
        status: "RETIRED" as const,
      },
      { id: QUIZZING, slug: "vi-quizzing", label: "Quizzing", sortOrder: 90 },
    ])

    await db.insert(users).values([
      {
        id: STUDENT,
        name: "Student",
        email: "interests-student@vi.test",
        emailVerified: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: SECOND,
        name: "Second",
        email: "interests-second@vi.test",
        emailVerified: new Date("2026-01-01T00:00:00.000Z"),
      },
    ])
  })

  afterAll(cleanup)

  describe("setting a selection", () => {
    it.each([0, 1, 2])("refuses %i interests", async (count) => {
      const result = await setUserInterests({
        userId: STUDENT,
        input: { interestIds: ACTIVE.slice(0, count) },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("INVALID")
    })

    it("accepts three", async () => {
      const result = await setUserInterests({
        userId: STUDENT,
        input: { interestIds: ACTIVE.slice(0, 3) },
      })

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toHaveLength(3)
    })

    it("accepts more than three", async () => {
      const result = await setUserInterests({
        userId: STUDENT,
        input: { interestIds: ACTIVE.slice(0, 5) },
      })

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toHaveLength(5)
    })

    it("replaces rather than accumulates", async () => {
      await setUserInterests({
        userId: STUDENT,
        input: { interestIds: ACTIVE.slice(0, 3) },
      })

      // Five were stored a moment ago. If this returned eight, the delete half
      // of delete-then-insert is not happening.
      expect(await getUserInterests(STUDENT)).toHaveLength(3)
    })

    it("refuses a repeated interest padding out the minimum", async () => {
      const result = await setUserInterests({
        userId: STUDENT,
        input: { interestIds: [ACTIVE[0], ACTIVE[0], ACTIVE[0]] },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("INVALID")
    })

    it("refuses an interest that does not exist", async () => {
      const result = await setUserInterests({
        userId: STUDENT,
        input: { interestIds: [ACTIVE[0], ACTIVE[1], "vi-does-not-exist"] },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("INVALID")
    })

    it("refuses a retired interest", async () => {
      const result = await setUserInterests({
        userId: STUDENT,
        input: { interestIds: [ACTIVE[0], ACTIVE[1], RETIRED] },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("INVALID")
    })

    it("leaves the previous selection intact when a set is refused", async () => {
      // The transaction matters here: a failed set must not empty the student's
      // interests on the way to rejecting the new ones.
      expect(await getUserInterests(STUDENT)).toHaveLength(3)
    })
  })

  describe("suggesting an interest", () => {
    it.each(["Quizzing", "quizzing", "QUIZZING"])(
      "tells a student that %s already exists, whatever the casing",
      async (label) => {
        const result = await suggestInterest({
          userId: STUDENT,
          input: { label },
        })

        expect(result.ok).toBe(true)
        if (result.ok) {
          expect(result.data.status).toBe("ALREADY_EXISTS")
          if (result.data.status === "ALREADY_EXISTS") {
            expect(result.data.interest.id).toBe(QUIZZING)
          }
        }
      },
    )

    it("records a genuinely new suggestion with a demand of one", async () => {
      const result = await suggestInterest({
        userId: STUDENT,
        input: { label: NEW_LABEL },
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.status).toBe("RECORDED")
        if (result.data.status === "RECORDED") {
          expect(result.data.demandCount).toBe(1)
        }
      }
    })

    it("does not let one student inflate demand by asking twice", async () => {
      const result = await suggestInterest({
        userId: STUDENT,
        input: { label: NEW_LABEL.toUpperCase() },
      })

      expect(result.ok).toBe(true)
      if (result.ok && result.data.status === "RECORDED") {
        expect(result.data.demandCount).toBe(1)
      }
    })

    it("aggregates a second student onto the same row", async () => {
      const result = await suggestInterest({
        userId: SECOND,
        input: { label: NEW_LABEL.toLowerCase() },
      })

      expect(result.ok).toBe(true)
      if (result.ok && result.data.status === "RECORDED") {
        expect(result.data.demandCount).toBe(2)
      }

      const rows = await db
        .select({ id: interestSuggestions.id })
        .from(interestSuggestions)
        .where(
          eq(
            interestSuggestions.normalisedLabel,
            normaliseInterestLabel(NEW_LABEL),
          ),
        )

      // Three asks, three casings, one row. That is the whole point of the
      // unique index on normalised_label.
      expect(rows).toHaveLength(1)
    })

    it("refuses something that is not a name", async () => {
      const result = await suggestInterest({
        userId: STUDENT,
        input: { label: "?!" },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("INVALID")
    })
  })
})
