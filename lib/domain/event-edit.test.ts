import { describe, expect, it } from "vitest"

import { refuseEventEdit, seatsAvailableAfter } from "@/lib/domain/event-edit"

const NOW = "2026-05-01T10:00:00.000Z"
const FUTURE = "2026-05-10T10:00:00.000Z"
const PAST = "2026-04-20T10:00:00.000Z"

function edit(overrides: Partial<Parameters<typeof refuseEventEdit>[0]> = {}) {
  return refuseEventEdit({
    status: "PUBLISHED",
    startsAt: FUTURE,
    registeredCount: 10,
    nextCapacity: 40,
    now: NOW,
    ...overrides,
  })
}

describe("refuseEventEdit", () => {
  it("allows an edit to a published event that has not started", () => {
    expect(edit()).toBeNull()
  })

  it("refuses a cancelled event", () => {
    expect(edit({ status: "CANCELLED" })).toBe("ALREADY_CANCELLED")
  })

  it("refuses an event that has started", () => {
    expect(edit({ startsAt: PAST })).toBe("ALREADY_STARTED")
  })

  it("treats an event starting exactly now as started", () => {
    // The boundary belongs on the refusing side: a workshop opening its doors
    // this second is not a plan any more.
    expect(edit({ startsAt: NOW })).toBe("ALREADY_STARTED")
  })

  it("reports the cancellation first when both apply", () => {
    // An organiser told "this already started" would try again next term and
    // hit the same wall. The cancellation is the fact that explains it.
    expect(edit({ status: "CANCELLED", startsAt: PAST })).toBe(
      "ALREADY_CANCELLED",
    )
  })

  it("refuses capacity below the confirmed count", () => {
    expect(edit({ registeredCount: 30, nextCapacity: 20 })).toBe(
      "CAPACITY_BELOW_CONFIRMED",
    )
  })

  it("allows capacity exactly equal to the confirmed count", () => {
    // A full event is a valid state. This is how an organiser closes the door
    // without cancelling.
    expect(edit({ registeredCount: 30, nextCapacity: 30 })).toBeNull()
  })

  it("allows the limit to be removed even when full", () => {
    expect(edit({ registeredCount: 30, nextCapacity: null })).toBeNull()
  })
})

describe("seatsAvailableAfter", () => {
  it("counts the seats a raise opens up", () => {
    expect(seatsAvailableAfter({ nextCapacity: 40, registeredCount: 30 })).toBe(
      10,
    )
  })

  it("returns null when the limit is removed", () => {
    // Null means unlimited, not none. A caller that reads this as zero would
    // promote nobody at the moment the organiser made room for everybody.
    expect(
      seatsAvailableAfter({ nextCapacity: null, registeredCount: 30 }),
    ).toBeNull()
  })

  it("returns zero when the event is exactly full", () => {
    expect(seatsAvailableAfter({ nextCapacity: 30, registeredCount: 30 })).toBe(
      0,
    )
  })

  it("never returns a negative number of seats", () => {
    // Over-subscription should not read as negative free seats, which would
    // turn into a promotion loop running backwards.
    expect(seatsAvailableAfter({ nextCapacity: 20, registeredCount: 30 })).toBe(
      0,
    )
  })
})
