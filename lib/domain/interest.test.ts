import { describe, expect, it } from "vitest"

import { normaliseInterestLabel } from "./interest"

describe("normaliseInterestLabel", () => {
  it("collapses casing, padding, and punctuation into one key", () => {
    const variants = ["Padel", "padel", "  PADEL  ", "Padel!", "Padels"]
    const keys = new Set(variants.map(normaliseInterestLabel))
    expect(keys.size).toBe(1)
  })

  it("keeps genuinely different interests apart", () => {
    expect(normaliseInterestLabel("Padel")).not.toBe(
      normaliseInterestLabel("Paddle boarding"),
    )
  })

  it("does not singularise short words that end in s", () => {
    // "Chess" must not become "Ches".
    expect(normaliseInterestLabel("Chess")).toBe("chess")
  })

  it("normalises multi-word labels consistently", () => {
    expect(normaliseInterestLabel("Competitive  Programming")).toBe(
      "competitive programming",
    )
  })
})
