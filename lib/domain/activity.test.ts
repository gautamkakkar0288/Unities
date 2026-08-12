import { describe, expect, it } from "vitest"

import { describeActivity, liveActivities } from "@/lib/domain/activity"
import type { Activity } from "@/lib/domain/types"

const now = "2026-08-07T09:00:00+05:30"

const person = {
  id: "u",
  name: "Aarav Menon",
  username: "aarav",
  avatarUrl: null,
  role: "STUDENT" as const,
  programme: "B.E. CSE 2028",
}

const makeActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: "act-1",
  kind: "SPORT",
  title: "Badminton doubles at 6",
  detail: "Need two more. Court 3.",
  author: person,
  interest: { id: "i", slug: "sports", label: "Sports" },
  place: "Sports Complex, Court 3",
  happensAt: "2026-08-07T18:00:00+05:30",
  expiresAt: "2026-08-07T17:30:00+05:30",
  spotsNeeded: 3,
  spotsFilled: 1,
  joiners: [],
  status: "OPEN",
  viewerHasJoined: false,
  community: null,
  ...overrides,
})

describe("describeActivity", () => {
  it("invites a join while spots remain", () => {
    const descriptor = describeActivity(makeActivity(), now)

    expect(descriptor.spotsLeft).toBe(2)
    expect(descriptor.ctaDisabled).toBe(false)
    expect(descriptor.ctaLabel).toBe("I am in")
    expect(descriptor.spotsLabel).toBe("1 of 3 spots taken")
  })

  it("creates urgency on the last spot", () => {
    const descriptor = describeActivity(
      makeActivity({ spotsFilled: 2 }),
      now,
    )

    expect(descriptor.ctaLabel).toBe("Take the last spot")
    expect(descriptor.status?.label).toBe("1 spot left")
  })

  it("keeps a full activity joinable, because people drop out", () => {
    const descriptor = describeActivity(
      makeActivity({ spotsFilled: 3 }),
      now,
    )

    expect(descriptor.isFull).toBe(true)
    expect(descriptor.ctaDisabled).toBe(false)
    expect(descriptor.ctaLabel).toBe("Ask to join anyway")
    expect(descriptor.status?.label).toBe("Full")
  })

  it("closes an expired activity even if its status was never updated", () => {
    const descriptor = describeActivity(
      makeActivity({ expiresAt: "2026-08-07T08:00:00+05:30" }),
      now,
    )

    expect(descriptor.isExpired).toBe(true)
    expect(descriptor.ctaDisabled).toBe(true)
    expect(descriptor.ctaLabel).toBe("Expired")
  })

  it("offers a way out once joined", () => {
    const descriptor = describeActivity(
      makeActivity({ viewerHasJoined: true, spotsFilled: 2 }),
      now,
    )

    expect(descriptor.ctaLabel).toBe("You are in")
    expect(descriptor.accessibleCtaLabel).toContain("Leave")
    expect(descriptor.ctaDisabled).toBe(false)
  })

  it("never shows a negative spot count", () => {
    const descriptor = describeActivity(
      makeActivity({ spotsNeeded: 2, spotsFilled: 5 }),
      now,
    )

    expect(descriptor.spotsLeft).toBe(0)
  })
})

describe("liveActivities", () => {
  it("hides expired and cancelled activities and sorts by when they happen", () => {
    const soon = makeActivity({
      id: "soon",
      happensAt: "2026-08-07T12:00:00+05:30",
      expiresAt: "2026-08-07T11:30:00+05:30",
    })
    const later = makeActivity({
      id: "later",
      happensAt: "2026-08-07T20:00:00+05:30",
      expiresAt: "2026-08-07T19:30:00+05:30",
    })
    const stale = makeActivity({
      id: "stale",
      expiresAt: "2026-08-06T18:00:00+05:30",
    })
    const cancelled = makeActivity({ id: "cancelled", status: "CANCELLED" })

    const live = liveActivities([later, stale, soon, cancelled], now)

    expect(live.map((activity) => activity.id)).toEqual(["soon", "later"])
  })
})
