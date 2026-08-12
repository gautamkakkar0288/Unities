import { describe, expect, it } from "vitest"

import { rankTrending, recommendFor, scoreEvent } from "@/lib/domain/trending"
import type { EventSummary } from "@/lib/domain/types"

const now = "2026-08-07T09:00:00+05:30"

const makeEvent = (
  overrides: Partial<EventSummary> & Pick<EventSummary, "id">,
): EventSummary => ({
  slug: overrides.id,
  title: overrides.id,
  kind: "WORKSHOP",
  startsAt: "2026-08-10T16:00:00+05:30",
  endsAt: "2026-08-10T18:00:00+05:30",
  mode: "IN_PERSON",
  venue: "Somewhere",
  community: {
    id: "c",
    slug: "c",
    name: "C",
    verification: "VERIFIED",
  },
  interest: { id: "i", slug: "technology", label: "Technology" },
  capacity: 100,
  registeredCount: 10,
  feeInPaise: null,
  viewerRegistration: "NONE",
  ...overrides,
})

describe("scoreEvent", () => {
  it("ranks a nearly full small event above a sparsely booked large one", () => {
    const bootcamp = makeEvent({
      id: "bootcamp",
      capacity: 40,
      registeredCount: 37,
    })
    const openMic = makeEvent({
      id: "open-mic",
      capacity: 300,
      registeredCount: 91,
    })

    expect(scoreEvent(bootcamp, { now })).toBeGreaterThan(
      scoreEvent(openMic, { now }),
    )
  })

  it("ranks sooner above later, all else equal", () => {
    const soon = makeEvent({
      id: "soon",
      startsAt: "2026-08-08T16:00:00+05:30",
      endsAt: "2026-08-08T18:00:00+05:30",
    })
    const later = makeEvent({
      id: "later",
      startsAt: "2026-08-30T16:00:00+05:30",
      endsAt: "2026-08-30T18:00:00+05:30",
    })

    expect(scoreEvent(soon, { now })).toBeGreaterThan(scoreEvent(later, { now }))
  })

  it("gives interest relevance a nudge, not a veto", () => {
    const relevant = makeEvent({ id: "relevant", registeredCount: 10 })
    const popular = makeEvent({
      id: "popular",
      registeredCount: 400,
      capacity: 500,
      interest: { id: "i2", slug: "music", label: "Music" },
    })

    const context = { now, viewerInterestSlugs: ["technology"] }

    // Relevance helps the matching event...
    expect(scoreEvent(relevant, context)).toBeGreaterThan(
      scoreEvent(relevant, { now }),
    )
    // ...but does not let it beat something campus is genuinely turning up to.
    expect(scoreEvent(popular, context)).toBeGreaterThan(
      scoreEvent(relevant, context),
    )
  })

  it("does not let unlimited capacity be the cheapest way to trend", () => {
    const unlimited = makeEvent({
      id: "unlimited",
      capacity: null,
      registeredCount: 20,
    })
    const filling = makeEvent({
      id: "filling",
      capacity: 25,
      registeredCount: 24,
    })

    expect(scoreEvent(filling, { now })).toBeGreaterThan(
      scoreEvent(unlimited, { now }),
    )
  })
})

describe("rankTrending", () => {
  it("excludes finished events", () => {
    const past = makeEvent({
      id: "past",
      startsAt: "2026-08-01T16:00:00+05:30",
      endsAt: "2026-08-01T18:00:00+05:30",
      registeredCount: 999,
    })
    const upcoming = makeEvent({ id: "upcoming" })

    const ranked = rankTrending([past, upcoming], { now })

    expect(ranked.map((event) => event.id)).toEqual(["upcoming"])
  })

  it("respects the limit", () => {
    const events = [1, 2, 3, 4, 5, 6].map((index) =>
      makeEvent({ id: `e-${index}`, registeredCount: index * 10 }),
    )

    expect(rankTrending(events, { now })).toHaveLength(4)
    expect(rankTrending(events, { now }, 2)).toHaveLength(2)
  })

  it("is stable for identical events", () => {
    const a = makeEvent({ id: "a" })
    const b = makeEvent({ id: "b" })

    expect(rankTrending([b, a], { now }).map((event) => event.id)).toEqual([
      "a",
      "b",
    ])
  })
})

describe("recommendFor", () => {
  it("only returns matching interests the viewer has not registered for", () => {
    const match = makeEvent({ id: "match" })
    const alreadyIn = makeEvent({
      id: "already-in",
      viewerRegistration: "REGISTERED",
    })
    const otherInterest = makeEvent({
      id: "other",
      interest: { id: "i2", slug: "music", label: "Music" },
    })

    const recommended = recommendFor([match, alreadyIn, otherInterest], {
      now,
      viewerInterestSlugs: ["technology"],
    })

    expect(recommended.map((event) => event.id)).toEqual(["match"])
  })

  it("returns nothing when the viewer has no interests yet", () => {
    expect(recommendFor([makeEvent({ id: "a" })], { now })).toEqual([])
  })
})
