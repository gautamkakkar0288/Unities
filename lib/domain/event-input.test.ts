import { describe, expect, it } from "vitest"

import {
  isoToLocalDateTime,
  localDateTimeToIso,
  paiseToRupees,
  rupeesToPaise,
  wholeNumberOrNull,
  wholeNumberToString,
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

describe("isoToLocalDateTime", () => {
  it("treats a missing value as an empty control", () => {
    expect(isoToLocalDateTime(null)).toBe("")
    expect(isoToLocalDateTime(undefined)).toBe("")
    expect(isoToLocalDateTime("")).toBe("")
  })

  it("treats an unreadable value as an empty control", () => {
    expect(isoToLocalDateTime("sometime in May")).toBe("")
  })

  it("produces the shape a datetime-local input accepts", () => {
    // Minute precision, no seconds, no zone marker - anything else and the
    // browser silently renders the control blank.
    expect(isoToLocalDateTime("2026-05-10T10:00:00.000Z")).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    )
  })

  it("survives a round trip, so an unrelated edit cannot move the time", () => {
    // The reason this matters: an organiser fixing a venue typo submits every
    // field, including the times they never touched. If the pair of
    // conversions did not agree, saving a venue would move the event.
    const iso = "2026-05-10T10:00:00.000Z"

    expect(localDateTimeToIso(isoToLocalDateTime(iso))).toBe(iso)
  })

  it("reads back in local time rather than slicing the ISO string", () => {
    // Whatever zone the test runs in, the hour shown has to be the local hour.
    const iso = "2026-05-10T10:00:00.000Z"
    const local = isoToLocalDateTime(iso)

    expect(local.slice(11, 13)).toBe(
      String(new Date(iso).getHours()).padStart(2, "0"),
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

describe("wholeNumberToString", () => {
  it("renders no limit as blank, not as zero", () => {
    // Blank means unlimited and "0" means nobody may come. Confusing the two in
    // a prefilled form would cap a popular event at nothing.
    expect(wholeNumberToString(null)).toBe("")
    expect(wholeNumberToString(undefined)).toBe("")
  })

  it("renders a limit", () => {
    expect(wholeNumberToString(40)).toBe("40")
  })

  it("round trips", () => {
    expect(wholeNumberOrNull(wholeNumberToString(40))).toBe(40)
    expect(wholeNumberOrNull(wholeNumberToString(null))).toBeNull()
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

describe("paiseToRupees", () => {
  it("renders free as blank", () => {
    expect(paiseToRupees(null)).toBe("")
    expect(paiseToRupees(undefined)).toBe("")
  })

  it("renders a whole amount without decimals", () => {
    expect(paiseToRupees(15000)).toBe("150")
  })

  it("keeps paise when there are any", () => {
    expect(paiseToRupees(1235)).toBe("12.35")
  })

  it("round trips, so saving an unchanged fee does not alter it", () => {
    expect(rupeesToPaise(paiseToRupees(1235))).toBe(1235)
    expect(rupeesToPaise(paiseToRupees(15000))).toBe(15000)
    expect(rupeesToPaise(paiseToRupees(null))).toBeNull()
  })
})
