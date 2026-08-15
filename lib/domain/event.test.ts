import { describe, expect, it } from "vitest"

import {
  hasSeatAvailable,
  isCreatableKind,
  isRegistrationOpen,
  refuseEventTiming,
  registrationDeadline,
  slugifyTitle,
} from "./event"

describe("slugifyTitle", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyTitle("Intro to React")).toBe("intro-to-react")
  })

  it("strips punctuation rather than encoding it", () => {
    expect(slugifyTitle("C++ & Rust: a talk!")).toBe("c-rust-a-talk")
  })

  it("caps the length, because titles run long", () => {
    const slug = slugifyTitle(
      "one two three four five six seven eight nine ten",
    )
    expect(slug).toBe("one-two-three-four-five-six-seven-eight")
  })

  it("never returns an empty path segment", () => {
    expect(slugifyTitle("!!!")).toBe("event")
  })
})

describe("refuseEventTiming", () => {
  const now = "2026-03-01T00:00:00+05:30"

  it("accepts a well-formed future event", () => {
    expect(
      refuseEventTiming({
        startsAt: "2026-03-10T10:00:00+05:30",
        endsAt: "2026-03-10T12:00:00+05:30",
        registrationClosesAt: null,
        now,
      }),
    ).toBeNull()
  })

  it("refuses an end before a start", () => {
    expect(
      refuseEventTiming({
        startsAt: "2026-03-10T12:00:00+05:30",
        endsAt: "2026-03-10T10:00:00+05:30",
        registrationClosesAt: null,
        now,
      }),
    ).toBe("ENDS_BEFORE_IT_STARTS")
  })

  it("refuses a zero-length event", () => {
    expect(
      refuseEventTiming({
        startsAt: "2026-03-10T10:00:00+05:30",
        endsAt: "2026-03-10T10:00:00+05:30",
        registrationClosesAt: null,
        now,
      }),
    ).toBe("ENDS_BEFORE_IT_STARTS")
  })

  it("refuses a start in the past", () => {
    expect(
      refuseEventTiming({
        startsAt: "2026-02-01T10:00:00+05:30",
        endsAt: "2026-02-01T12:00:00+05:30",
        registrationClosesAt: null,
        now,
      }),
    ).toBe("STARTS_IN_THE_PAST")
  })

  it("refuses a deadline after the event has begun", () => {
    expect(
      refuseEventTiming({
        startsAt: "2026-03-10T10:00:00+05:30",
        endsAt: "2026-03-10T12:00:00+05:30",
        registrationClosesAt: "2026-03-10T11:00:00+05:30",
        now,
      }),
    ).toBe("CLOSES_AFTER_IT_STARTS")
  })

  it("allows a deadline exactly at the start", () => {
    expect(
      refuseEventTiming({
        startsAt: "2026-03-10T10:00:00+05:30",
        endsAt: "2026-03-10T12:00:00+05:30",
        registrationClosesAt: "2026-03-10T10:00:00+05:30",
        now,
      }),
    ).toBeNull()
  })
})

describe("registrationDeadline", () => {
  it("falls back to the start time", () => {
    expect(
      registrationDeadline({
        startsAt: "2026-03-10T10:00:00+05:30",
        registrationClosesAt: null,
      }),
    ).toBe("2026-03-10T10:00:00+05:30")
  })

  it("prefers an explicit deadline", () => {
    expect(
      registrationDeadline({
        startsAt: "2026-03-10T10:00:00+05:30",
        registrationClosesAt: "2026-03-09T10:00:00+05:30",
      }),
    ).toBe("2026-03-09T10:00:00+05:30")
  })
})

describe("isRegistrationOpen", () => {
  const event = {
    startsAt: "2026-03-10T10:00:00+05:30",
    registrationClosesAt: "2026-03-09T10:00:00+05:30",
  }

  it("is open before the deadline", () => {
    expect(isRegistrationOpen(event, "2026-03-08T10:00:00+05:30")).toBe(true)
  })

  it("is closed after the deadline even though the event has not started", () => {
    expect(isRegistrationOpen(event, "2026-03-09T18:00:00+05:30")).toBe(false)
  })

  it("is closed exactly on the deadline", () => {
    expect(isRegistrationOpen(event, "2026-03-09T10:00:00+05:30")).toBe(false)
  })
})

describe("hasSeatAvailable", () => {
  it("treats a null capacity as unlimited", () => {
    expect(hasSeatAvailable({ capacity: null, registeredCount: 9999 })).toBe(
      true,
    )
  })

  it("is false once the last seat is taken", () => {
    expect(hasSeatAvailable({ capacity: 40, registeredCount: 40 })).toBe(false)
  })

  it("is true on the last seat", () => {
    expect(hasSeatAvailable({ capacity: 40, registeredCount: 39 })).toBe(true)
  })
})

describe("isCreatableKind", () => {
  it("allows a workshop", () => {
    expect(isCreatableKind("WORKSHOP")).toBe(true)
  })

  it("refuses a trip until trips carry their obligations", () => {
    expect(isCreatableKind("TRIP")).toBe(false)
  })
})
