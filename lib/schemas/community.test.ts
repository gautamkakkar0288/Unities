import { describe, expect, it } from "vitest"

import {
  proposeCommunitySchema,
  setInterestsSchema,
  suggestInterestSchema,
} from "./community"

const validProposal = {
  name: "Badminton",
  tagline: "Doubles most evenings at the sports complex.",
  reason:
    "There are courts free every evening and no way to find a fourth player.",
  interestId: "interest-sports",
  scope: "UNIVERSITY" as const,
  placeId: "place-chitkara",
}

describe("proposeCommunitySchema", () => {
  it("accepts a considered proposal", () => {
    const parsed = proposeCommunitySchema.safeParse(validProposal)
    expect(parsed.success).toBe(true)
  })

  it("defaults acknowledgedDuplicates to false, so the warning cannot be skipped", () => {
    const parsed = proposeCommunitySchema.parse(validProposal)
    expect(parsed.acknowledgedDuplicates).toBe(false)
  })

  it("rejects a proposal with no stated reason", () => {
    const parsed = proposeCommunitySchema.safeParse({
      ...validProposal,
      reason: "because",
    })
    expect(parsed.success).toBe(false)
  })

  it("trims whitespace rather than counting it as content", () => {
    const parsed = proposeCommunitySchema.safeParse({
      ...validProposal,
      name: "  a  ",
    })
    expect(parsed.success).toBe(false)
  })
})

describe("setInterestsSchema", () => {
  it("requires the onboarding minimum", () => {
    expect(setInterestsSchema.safeParse({ interestIds: ["a", "b"] }).success).toBe(
      false,
    )
    expect(
      setInterestsSchema.safeParse({ interestIds: ["a", "b", "c"] }).success,
    ).toBe(true)
  })
})

describe("suggestInterestSchema", () => {
  it("keeps suggestions short enough to be a category", () => {
    expect(
      suggestInterestSchema.safeParse({
        label: "Competitive programming and algorithmic problem solving club",
      }).success,
    ).toBe(false)
  })
})
