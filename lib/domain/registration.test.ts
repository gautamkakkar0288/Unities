import { describe, expect, it } from "vitest"

import { describeRegistration } from "@/lib/domain/registration"

const NOW = "2026-08-07T09:00:00+05:30"

const baseEvent = {
  title: "Line Follower Bootcamp",
  startsAt: "2026-08-08T16:00:00+05:30",
  capacity: 40,
  registeredCount: 10,
  feeInPaise: null,
  viewerRegistration: "NONE",
} as const

describe("describeRegistration", () => {
  it("offers registration when seats remain", () => {
    const result = describeRegistration(baseEvent, NOW)
    expect(result.seatsLeft).toBe(30)
    expect(result.isFull).toBe(false)
    expect(result.ctaDisabled).toBe(false)
    expect(result.ctaLabel).toBe("Register")
  })

  it("shows the fee in the call to action for paid events", () => {
    const result = describeRegistration(
      { ...baseEvent, feeInPaise: 25_000 },
      NOW,
    )
    expect(result.feeLabel).toBe("\u20b9250")
    expect(result.ctaLabel).toContain("\u20b9250")
  })

  it("offers the waitlist rather than blocking a full event", () => {
    const result = describeRegistration(
      { ...baseEvent, registeredCount: 40 },
      NOW,
    )
    expect(result.isFull).toBe(true)
    expect(result.isClosed).toBe(false)
    expect(result.ctaDisabled).toBe(false)
    expect(result.ctaLabel).toBe("Join the waitlist")
  })

  it("never reports negative seats when a capacity is lowered after signups", () => {
    const result = describeRegistration(
      { ...baseEvent, capacity: 10, registeredCount: 25 },
      NOW,
    )
    expect(result.seatsLeft).toBe(0)
  })

  it("closes registration once the event has started", () => {
    const result = describeRegistration(
      { ...baseEvent, startsAt: "2026-08-06T15:00:00+05:30" },
      NOW,
    )
    expect(result.isClosed).toBe(true)
    expect(result.ctaDisabled).toBe(true)
  })

  it("keeps a registered viewer actionable so they can cancel", () => {
    const result = describeRegistration(
      { ...baseEvent, viewerRegistration: "REGISTERED" },
      NOW,
    )
    expect(result.ctaDisabled).toBe(false)
    expect(result.status).toEqual({ label: "Registered", tone: "success" })
  })

  it("flags scarcity only when seats are genuinely scarce", () => {
    expect(
      describeRegistration({ ...baseEvent, registeredCount: 37 }, NOW)
        .isNearlyFull,
    ).toBe(true)
    expect(
      describeRegistration({ ...baseEvent, registeredCount: 20 }, NOW)
        .isNearlyFull,
    ).toBe(false)
  })

  it("treats unlimited capacity as never full", () => {
    const result = describeRegistration(
      { ...baseEvent, capacity: null, registeredCount: 264 },
      NOW,
    )
    expect(result.seatsLeft).toBeNull()
    expect(result.isFull).toBe(false)
    expect(result.capacityLabel).toBe("264 going")
  })
})
