import { describe, expect, it } from "vitest"

import {
  firstNameOf,
  greetingFor,
  noSignals,
  rankCommunitySuggestions,
  rankForYou,
  relevanceScore,
  viewerUpcoming,
  type FeedSignals,
} from "@/lib/domain/feed"
import type { CommunitySummary, EventSummary } from "@/lib/domain/types"

/**
 * The feed's ordering rules.
 *
 * These assert on ordering and membership rather than on score values. The
 * weights are a judgement call and will be tuned; "an event in a club you joined
 * outranks one you have no connection to" is the actual promise, and a test that
 * pinned the number would fail on every tuning pass while telling us nothing
 * about whether the promise still holds.
 */

const NOW = "2026-03-01T06:00:00.000Z"

function hoursFromNow(hours: number): string {
  return new Date(Date.parse(NOW) + hours * 3_600_000).toISOString()
}

function event(overrides: Partial<EventSummary> & { id: string }): EventSummary {
  return {
    slug: `event-${overrides.id}`,
    title: `Event ${overrides.id}`,
    kind: "WORKSHOP",
    startsAt: hoursFromNow(48),
    endsAt: hoursFromNow(50),
    mode: "IN_PERSON",
    venue: "Block A",
    community: {
      id: "community-1",
      slug: "coding-club",
      name: "Coding Club",
      verification: "VERIFIED",
    },
    interest: { id: "interest-1", slug: "coding", label: "Coding" },
    capacity: 40,
    registeredCount: 10,
    feeInPaise: null,
    viewerRegistration: "NONE",
    ...overrides,
  }
}

function community(
  overrides: Partial<CommunitySummary> & { id: string },
): CommunitySummary {
  return {
    slug: `community-${overrides.id}`,
    name: `Community ${overrides.id}`,
    tagline: "A club",
    kind: "STUDENT",
    scope: "UNIVERSITY",
    place: null,
    interest: { id: "interest-1", slug: "coding", label: "Coding" },
    memberCount: 20,
    verification: "VERIFIED",
    joinPolicy: "OPEN",
    viewerMembership: "NONE",
    ...overrides,
  }
}

const signals: FeedSignals = {
  viewerInterestSlugs: ["coding"],
  joinedCommunityIds: ["community-joined"],
  savedCommunityIds: ["community-saved"],
  savedEventIds: ["event-saved"],
}

describe("relevanceScore", () => {
  it("scores an interest match above an unrelated event", () => {
    const matching = event({ id: "a" })
    const unrelated = event({
      id: "b",
      interest: { id: "interest-2", slug: "dance", label: "Dance" },
    })

    expect(relevanceScore(matching, signals, NOW)).toBeGreaterThan(
      relevanceScore(unrelated, signals, NOW),
    )
  })

  it("scores a joined community above a saved one", () => {
    const joined = event({
      id: "a",
      community: {
        id: "community-joined",
        slug: "joined",
        name: "Joined",
        verification: "VERIFIED",
      },
    })
    const saved = event({
      id: "b",
      community: {
        id: "community-saved",
        slug: "saved",
        name: "Saved",
        verification: "VERIFIED",
      },
    })

    expect(relevanceScore(joined, signals, NOW)).toBeGreaterThan(
      relevanceScore(saved, signals, NOW),
    )
  })

  it("prefers an event with seats to a full one", () => {
    const open = event({ id: "a", capacity: 40, registeredCount: 10 })
    const full = event({ id: "b", capacity: 40, registeredCount: 40 })

    expect(relevanceScore(open, signals, NOW)).toBeGreaterThan(
      relevanceScore(full, signals, NOW),
    )
  })

  it("treats unlimited capacity as having seats", () => {
    const unlimited = event({ id: "a", capacity: null, registeredCount: 900 })
    const full = event({ id: "b", capacity: 40, registeredCount: 40 })

    expect(relevanceScore(unlimited, signals, NOW)).toBeGreaterThan(
      relevanceScore(full, signals, NOW),
    )
  })

  it("prefers the sooner of two otherwise identical events", () => {
    const soon = event({ id: "a", startsAt: hoursFromNow(12), endsAt: hoursFromNow(14) })
    const later = event({ id: "b", startsAt: hoursFromNow(400), endsAt: hoursFromNow(402) })

    expect(relevanceScore(soon, signals, NOW)).toBeGreaterThan(
      relevanceScore(later, signals, NOW),
    )
  })
})

describe("rankForYou", () => {
  it("excludes events the student already holds a place in", () => {
    const registered = event({ id: "a", viewerRegistration: "REGISTERED" })
    const waitlisted = event({ id: "b", viewerRegistration: "WAITLISTED" })
    const open = event({ id: "c" })

    const ranked = rankForYou([registered, waitlisted, open], signals, NOW)

    expect(ranked.map((item) => item.id)).toEqual(["c"])
  })

  it("excludes events that have already finished", () => {
    const past = event({
      id: "a",
      startsAt: hoursFromNow(-10),
      endsAt: hoursFromNow(-8),
    })

    expect(rankForYou([past, event({ id: "b" })], signals, NOW)).toHaveLength(1)
  })

  it("puts the most relevant event first", () => {
    const unrelated = event({
      id: "a",
      interest: { id: "interest-2", slug: "dance", label: "Dance" },
      community: {
        id: "community-other",
        slug: "other",
        name: "Other",
        verification: "UNVERIFIED",
      },
    })
    const relevant = event({
      id: "b",
      community: {
        id: "community-joined",
        slug: "joined",
        name: "Joined",
        verification: "VERIFIED",
      },
    })

    expect(rankForYou([unrelated, relevant], signals, NOW)[0]?.id).toBe("b")
  })

  it("breaks ties deterministically, soonest then by id", () => {
    const first = event({ id: "aaa" })
    const second = event({ id: "bbb" })

    const forwards = rankForYou([first, second], noSignals, NOW)
    const backwards = rankForYou([second, first], noSignals, NOW)

    expect(forwards.map((item) => item.id)).toEqual(["aaa", "bbb"])
    expect(backwards.map((item) => item.id)).toEqual(["aaa", "bbb"])
  })

  it("respects the limit", () => {
    const events = Array.from({ length: 10 }, (_, index) =>
      event({ id: `event-${index}` }),
    )

    expect(rankForYou(events, signals, NOW, 4)).toHaveLength(4)
  })

  it("returns nothing when there are no events", () => {
    expect(rankForYou([], signals, NOW)).toEqual([])
  })
})

describe("viewerUpcoming", () => {
  it("keeps only the student's own places, soonest first", () => {
    const later = event({
      id: "later",
      viewerRegistration: "REGISTERED",
      startsAt: hoursFromNow(72),
      endsAt: hoursFromNow(74),
    })
    const sooner = event({
      id: "sooner",
      viewerRegistration: "WAITLISTED",
      startsAt: hoursFromNow(10),
      endsAt: hoursFromNow(12),
    })
    const notMine = event({ id: "other" })

    expect(
      viewerUpcoming([later, sooner, notMine], NOW).map((item) => item.id),
    ).toEqual(["sooner", "later"])
  })

  it("drops events that have finished even when registered", () => {
    const past = event({
      id: "past",
      viewerRegistration: "REGISTERED",
      startsAt: hoursFromNow(-5),
      endsAt: hoursFromNow(-3),
    })

    expect(viewerUpcoming([past], NOW)).toEqual([])
  })

  it("ignores a closed registration window the student never used", () => {
    expect(viewerUpcoming([event({ id: "a", viewerRegistration: "CLOSED" })], NOW)).toEqual(
      [],
    )
  })
})

describe("rankCommunitySuggestions", () => {
  it("never suggests a community the student is already inside", () => {
    const member = community({ id: "a", viewerMembership: "MEMBER" })
    const owner = community({ id: "b", viewerMembership: "OWNER" })
    const moderator = community({ id: "c", viewerMembership: "MODERATOR" })
    const pending = community({ id: "d", viewerMembership: "PENDING" })
    const open = community({ id: "e" })

    const ranked = rankCommunitySuggestions(
      [member, owner, moderator, pending, open],
      signals,
    )

    expect(ranked.map((item) => item.id)).toEqual(["e"])
  })

  it("keeps an unaccepted invitation, which is actionable", () => {
    const invited = community({ id: "a", viewerMembership: "INVITED" })

    expect(rankCommunitySuggestions([invited], signals)).toHaveLength(1)
  })

  it("ranks an interest match above a larger unrelated community", () => {
    const matching = community({ id: "match", memberCount: 5 })
    const bigger = community({
      id: "big",
      memberCount: 400,
      interest: { id: "interest-2", slug: "dance", label: "Dance" },
    })

    expect(
      rankCommunitySuggestions([bigger, matching], signals)[0]?.id,
    ).toBe("match")
  })

  it("uses size to separate two equally relevant communities", () => {
    const small = community({ id: "small", memberCount: 5 })
    const large = community({ id: "large", memberCount: 300 })

    expect(
      rankCommunitySuggestions([small, large], signals).map((item) => item.id),
    ).toEqual(["large", "small"])
  })

  it("returns nothing when the student has joined everything", () => {
    const joined = community({ id: "a", viewerMembership: "MEMBER" })

    expect(rankCommunitySuggestions([joined], signals)).toEqual([])
  })
})

describe("greetingFor", () => {
  it("greets by campus time, not UTC", () => {
    // 03:00 UTC is 08:30 in Chitkara. Reading this as UTC would say morning by
    // luck; the case that matters is the one below.
    expect(greetingFor("2026-03-01T03:00:00.000Z")).toBe("Good morning")
  })

  it("says good evening late in the Indian evening", () => {
    // 18:00 UTC is 23:30 IST - still the same evening for the student, even
    // though UTC has not yet rolled over.
    expect(greetingFor("2026-03-01T18:00:00.000Z")).toBe("Good evening")
  })

  it("switches to afternoon at noon IST", () => {
    expect(greetingFor("2026-03-01T06:29:00.000Z")).toBe("Good morning")
    expect(greetingFor("2026-03-01T06:30:00.000Z")).toBe("Good afternoon")
  })

  it("switches to evening at 17:00 IST", () => {
    expect(greetingFor("2026-03-01T11:29:00.000Z")).toBe("Good afternoon")
    expect(greetingFor("2026-03-01T11:30:00.000Z")).toBe("Good evening")
  })

  it("handles the small hours after midnight IST", () => {
    // 20:00 UTC is 01:30 IST the next day.
    expect(greetingFor("2026-02-28T20:00:00.000Z")).toBe("Good morning")
  })

  it("refuses a timestamp it cannot read", () => {
    expect(() => greetingFor("not a date")).toThrow()
  })
})

describe("firstNameOf", () => {
  it("takes the first word", () => {
    expect(firstNameOf("Gautam Kakkar")).toBe("Gautam")
  })

  it("handles a single name", () => {
    expect(firstNameOf("Gautam")).toBe("Gautam")
  })

  it("falls back rather than throwing on missing names", () => {
    expect(firstNameOf(null)).toBe("there")
    expect(firstNameOf(undefined)).toBe("there")
    expect(firstNameOf("   ")).toBe("there")
  })
})
