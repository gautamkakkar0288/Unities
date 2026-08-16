import { describe, expect, it } from "vitest"

import {
  localDateTimeToIso,
  rupeesToPaise,
  wholeNumberOrNull,
} from "./event-input"

describe("localDateTimeToIso", () => {
  it("treats an empty value as not set", () => {
    expect(localDateTimeToIso("")).toBeNull()
    expect(localDateTimeToIso("   ")).toBeNull()
  })

  it("rejects something that is not a date", () => {
    expect(localDateTimeToIso("next tuesday")).toBeNull()
  })

  it("produces an absolute instant", () => {
    const iso = localDateTimeToIso("2026-05-10T10:00")
    expect(iso).not.toBeNull()
    expect(Number.isNaN(Date.parse(iso as string))).toBe(false)
  })

  it("keeps an explicit offset rather than reinterpreting it", () => {
    expect(localDateTimeToIso("2026-05-10T10:00:00+05:30")).toBe(
      "2026-05-10T04:30:00.000Z",
    )
  })
})

describe("wholeNumberOrNull", () => {
  it("treats empty as unlimited", () => {
    expect(wholeNumberOrNull("")).toBeNull()
  })

  it("reads a whole number", () => {
    expect(wholeNumberOrNull("40")).toBe(40)
  })

  it("refuses a fraction, because half a seat is not a seat", () => {
    expect(wholeNumberOrNull("4.5")).toBeNull()
  })

  it("refuses nonsense", () => {
    expect(wholeNumberOrNull("lots")).toBeNull()
  })

  it("keeps zero distinct from empty", () => {
    // Zero is refused later by the schema as a mistake, but it is a number the
    // organiser typed and must not be silently read as "unlimited".
    expect(wholeNumberOrNull("0")).toBe(0)
  })
})

describe("rupeesToPaise", () => {
  it("treats empty as free", () => {
    expect(rupeesToPaise("")).toBeNull()
  })

  it("converts whole rupees", () => {
    expect(rupeesToPaise("150")).toBe(15000)
  })

  it("survives floating point", () => {
    // 12.35 * 100 is 1234.9999999999998, which truncation would turn into 1234.
    expect(rupeesToPaise("12.35")).toBe(1235)
  })

  it("refuses a negative fee", () => {
    expect(rupeesToPaise("-10")).toBeNull()
  })
})
