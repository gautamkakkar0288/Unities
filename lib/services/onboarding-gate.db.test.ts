// @vitest-environment node
import { inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import { interests, userInterests, users } from "@/lib/db/schema"
import { MINIMUM_INTERESTS } from "@/lib/domain/interest"
import { hasCompletedOnboarding } from "@/lib/services/interests"

/**
 * The onboarding gate, against a real Postgres.
 *
 * This is the predicate the app shell redirects on, so getting it wrong is not
 * a cosmetic bug: too strict and every student is trapped in a loop, too loose
 * and they land on an empty feed. The retired case is the one worth having a
 * database for - the join is the only thing that sees it, and no amount of
 * schema validation would.
 *
 * Rows are written directly rather than through setUserInterests, because the
 * states being checked are ones the service refuses to create. That is the
 * point: the gate has to be right about a database it did not write.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

const STUDENT = "vg-user-student"

/** Outside the seeded taxonomy, so CI's seed cannot collide with these. */
const ACTIVE = ["vg-one", "vg-two", "vg-three", "vg-four", "vg-five"]
const RETIRED = "vg-retired"
const ALL_INTERESTS = [...ACTIVE, RETIRED]

async function cleanup() {
  await db.delete(userInterests).where(inArray(userInterests.userId, [STUDENT]))
  await db.delete(users).where(inArray(users.id, [STUDENT]))
  await db.delete(interests).where(inArray(interests.id, ALL_INTERESTS))
}

/** Replace the student's rows without going through the service. */
async function store(interestIds: string[]) {
  await db.delete(userInterests).where(inArray(userInterests.userId, [STUDENT]))

  if (interestIds.length > 0) {
    await db
      .insert(userInterests)
      .values(interestIds.map((interestId) => ({ userId: STUDENT, interestId })))
  }
}

describe.skipIf(!hasDatabase)("the onboarding gate", () => {
  beforeAll(async () => {
    await cleanup()

    await db.insert(interests).values([
      ...ACTIVE.map((id, index) => ({
        id,
        slug: id,
        label: `Gate Interest ${index + 1}`,
        sortOrder: index,
      })),
      {
        id: RETIRED,
        slug: RETIRED,
        label: "Gate Retired Interest",
        status: "RETIRED" as const,
      },
    ])

    await db
      .insert(users)
      .values({ id: STUDENT, name: "Gate Student", email: "gate@vg.test" })
  })

  afterAll(cleanup)

  it("a student who has picked nothing has not onboarded", async () => {
    await store([])
    expect(await hasCompletedOnboarding(STUDENT)).toBe(false)
  })

  it("one short of the minimum is not onboarded", async () => {
    await store(ACTIVE.slice(0, MINIMUM_INTERESTS - 1))
    expect(await hasCompletedOnboarding(STUDENT)).toBe(false)
  })

  it("exactly the minimum is onboarded", async () => {
    await store(ACTIVE.slice(0, MINIMUM_INTERESTS))
    expect(await hasCompletedOnboarding(STUDENT)).toBe(true)
  })

  it("more than the minimum is onboarded", async () => {
    await store(ACTIVE.slice(0, MINIMUM_INTERESTS + 1))
    expect(await hasCompletedOnboarding(STUDENT)).toBe(true)
  })

  it("a retired interest does not count towards the minimum", async () => {
    // Enough rows to pass a naive count, one of which no longer exists as far
    // as the picker or recommendations are concerned.
    await store([...ACTIVE.slice(0, MINIMUM_INTERESTS - 1), RETIRED])
    expect(await hasCompletedOnboarding(STUDENT)).toBe(false)
  })

  it("an unknown user has not onboarded", async () => {
    expect(await hasCompletedOnboarding("vg-user-does-not-exist")).toBe(false)
  })
})
