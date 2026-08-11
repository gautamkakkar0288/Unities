import { describe, expect, it } from "vitest"

import { MINIMUM_INTERESTS, normaliseInterestLabel } from "@/lib/domain/interest"
import { setInterestsSchema } from "@/lib/schemas/community"

/**
 * The interest-selection boundary, exhaustively.
 *
 * Onboarding is the one screen every student passes through exactly once, and
 * the failure mode here is silent: an under-filled interest set produces an
 * empty home feed rather than an error, which looks like "the app is dead"
 * rather than "pick more interests".
 */

function ids(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `interest-${index}`)
}

describe("how many interests are enough", () => {
  it.each([0, 1, 2])("rejects %i interests", (count) => {
    expect(setInterestsSchema.safeParse({ interestIds: ids(count) }).success).toBe(
      false,
    )
  })

  it.each([3, 4, 8, 17])("accepts %i interests", (count) => {
    expect(setInterestsSchema.safeParse({ interestIds: ids(count) }).success).toBe(
      true,
    )
  })

  it("rejects more than the taxonomy contains", () => {
    expect(setInterestsSchema.safeParse({ interestIds: ids(18) }).success).toBe(
      false,
    )
  })

  it("counts distinct interests, not repeated ones", () => {
    // The same interest three times is one interest. Validating raw length here
    // would let a student through onboarding with an empty feed.
    const repeated = { interestIds: ["coding", "coding", "coding"] }
    expect(setInterestsSchema.safeParse(repeated).success).toBe(false)

    const mixed = { interestIds: ["coding", "coding", "music", "travel"] }
    expect(setInterestsSchema.safeParse(mixed).success).toBe(false)

    const distinct = { interestIds: ["coding", "music", "travel"] }
    expect(setInterestsSchema.safeParse(distinct).success).toBe(true)
  })

  it("states the minimum in one place", () => {
    expect(
      setInterestsSchema.safeParse({ interestIds: ids(MINIMUM_INTERESTS) })
        .success,
    ).toBe(true)
    expect(
      setInterestsSchema.safeParse({ interestIds: ids(MINIMUM_INTERESTS - 1) })
        .success,
    ).toBe(false)
  })
})

describe("case and spacing collapse to one interest", () => {
  it("treats Coding, coding, and CODING as the same thing", () => {
    const forms = ["Coding", "coding", "CODING", "  Coding  "]
    const normalised = new Set(forms.map(normaliseInterestLabel))

    expect(normalised.size).toBe(1)
  })

  it("does not mangle words that end in double s", () => {
    expect(normaliseInterestLabel("Chess")).toBe("chess")
    expect(normaliseInterestLabel("Fitness")).toBe("fitness")
  })
})
