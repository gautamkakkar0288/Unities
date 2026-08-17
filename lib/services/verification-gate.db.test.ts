// @vitest-environment node
import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import { interests, userInterests, users } from "@/lib/db/schema"
import { MINIMUM_INTERESTS } from "@/lib/domain/interest"
import { hasVerifiedEmail } from "@/lib/services/account"
import { setUserInterests } from "@/lib/services/interests"

/**
 * The verification gate, against a real Postgres.
 *
 * Two things are being checked, and the second is the one worth having a
 * database for: that a refused save writes nothing. A service that returned a
 * failure and still inserted the rows would satisfy any test that only looked
 * at the return value, and it would look exactly like working code until a
 * student's unverified account turned out to be fully onboarded.
 *
 * Rows are written directly rather than through the service, because the state
 * under test - an unverified account - is one the service now refuses to move
 * out of. The gate has to be right about a database it did not write.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

const VERIFIED = "vgate-user-verified"
const UNVERIFIED = "vgate-user-unverified"
const ACCOUNTS = [VERIFIED, UNVERIFIED]

/** Outside the seeded taxonomy, so CI's seed cannot collide with these. */
const INTEREST_IDS = [
  "vgate-one",
  "vgate-two",
  "vgate-three",
  "vgate-four",
  "vgate-five",
]

/** Enough to satisfy the picker's minimum, whatever that minimum currently is. */
const PICKED = INTEREST_IDS.slice(0, MINIMUM_INTERESTS)

async function cleanup() {
  await db.delete(userInterests).where(inArray(userInterests.userId, ACCOUNTS))
  await db.delete(users).where(inArray(users.id, ACCOUNTS))
  await db.delete(interests).where(inArray(interests.id, INTEREST_IDS))
}

async function storedInterestCount(userId: string): Promise<number> {
  const rows = await db
    .select({ interestId: userInterests.interestId })
    .from(userInterests)
    .where(eq(userInterests.userId, userId))

  return rows.length
}

describe.skipIf(!hasDatabase)("the verification gate", () => {
  beforeAll(async () => {
    await cleanup()

    await db.insert(interests).values(
      INTEREST_IDS.map((id, index) => ({
        id,
        slug: id,
        label: `Gate Interest ${index + 1}`,
        sortOrder: index,
      })),
    )

    await db.insert(users).values([
      {
        id: VERIFIED,
        name: "Verified Student",
        email: "verified@vgate.test",
        emailVerified: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: UNVERIFIED,
        name: "Unverified Student",
        email: "unverified@vgate.test",
      },
    ])
  })

  afterAll(cleanup)

  describe("hasVerifiedEmail", () => {
    it("is true for an account with a confirmation timestamp", async () => {
      expect(await hasVerifiedEmail(VERIFIED)).toBe(true)
    })

    it("is false for an account that never confirmed", async () => {
      expect(await hasVerifiedEmail(UNVERIFIED)).toBe(false)
    })

    it("is false for an account that does not exist", async () => {
      // The gate refuses what it cannot vouch for rather than throwing, so a
      // stale session cannot produce a 500 on every authenticated render.
      expect(await hasVerifiedEmail("vgate-user-does-not-exist")).toBe(false)
    })
  })

  describe("setUserInterests", () => {
    it("refuses an unverified account", async () => {
      const result = await setUserInterests({
        userId: UNVERIFIED,
        input: { interestIds: PICKED },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toContain("Confirm your university email")
      }
    })

    it("writes nothing when it refuses", async () => {
      await setUserInterests({
        userId: UNVERIFIED,
        input: { interestIds: PICKED },
      })

      // The assertion the rest of this file exists for. A refusal that still
      // saved would leave an unverified account onboarded, and every gate in
      // front of it would then be decoration.
      expect(await storedInterestCount(UNVERIFIED)).toBe(0)
    })

    it("refuses a payload it would otherwise reject as invalid, on authorization grounds", async () => {
      // Authorization is checked before validation, so an unverified account
      // learns that it may not do this - not whether its input was acceptable.
      const result = await setUserInterests({
        userId: UNVERIFIED,
        input: { interestIds: [] },
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toContain("Confirm your university email")
      }
    })

    it("accepts a verified account", async () => {
      const result = await setUserInterests({
        userId: VERIFIED,
        input: { interestIds: PICKED },
      })

      expect(result.ok).toBe(true)
      expect(await storedInterestCount(VERIFIED)).toBe(PICKED.length)
    })
  })
})
