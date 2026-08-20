import { describe, expect, it } from "vitest"

import {
  applyEventFilters,
  hasActiveEventFilters,
  matchesQuery,
  readEventFilters,
  readEventKind,
  readExploreTab,
  readWhenFilter,
} from "@/lib/domain/explore"
import type { EventSummary } from "@/lib/domain/types"

/**
 * Explore's URL contract.
 *
 * Every one of these values arrives from a query string, so the parsing tests
 * matter as much as the filtering ones: the failure mode for an unrecognised
 * parameter must be a sensible default, never a thrown error on a page a student
 * reached from a shared link.
 *
 * `NOW` is a Sunday 11:30 IST, chosen so "today", "tomorrow" and "this week" are
 * genuinely different days.
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
    startsAt: hoursFromNow(4),
    endsAt: hoursFromNow(6),
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

describe("readExploreTab", () => {
  it("reads the lowercase form used in links", () => {
    expect(readExploreTab("communities")).toBe("COMMUNITIES")
    expect(readExploreTab("opportunities")).toBe("OPPORTUNITIES")
    expect(readExploreTab("updates")).toBe("UPDATES")
  })

  it("defaults to events for anything it does not recognise", () => {
    expect(readExploreTab(undefined)).toBe("EVENTS")
    expect(readExploreTab("")).toBe("EVENTS")
    expect(readExploreTab("people")).toBe("EVENTS")
    expect(readExploreTab("<script>")).toBe("EVENTS")
  })
})

describe("readWhenFilter and readEventKind", () => {
  it("reads valid values", () => {
    expect(readWhenFilter("today")).toBe("TODAY")
    expect(readWhenFilter("this_week")).toBe("THIS_WEEK")
    expect(readEventKind("workshop")).toBe("WORKSHOP")
    expect(readEventKind("tournament")).toBe("TOURNAMENT")
  })

  it("defaults when the value is missing or unknown", () => {
    expect(readWhenFilter("next-year")).toBe("UPCOMING")
    expect(readEventKind("party")).toBeNull()
  })

  it("does not offer trips, which cannot be created", () => {
    expect(readEventKind("trip")).toBeNull()
  })
})

describe("readEventFilters", () => {
  it("reads a full set of parameters", () => {
    expect(
      readEventFilters({
        when: "today",
        free: "1",
        online: "1",
        kind: "talk",
      }),
    ).toEqual({ when: "TODAY", free: true, online: true, kind: "TALK" })
  })

  it("treats anything other than 1 as off", () => {
    const filters = readEventFilters({ free: "true", online: "yes" })

    expect(filters.free).toBe(false)
    expect(filters.online).toBe(false)
  })

  it("reports whether anything is actually filtered", () => {
    expect(hasActiveEventFilters(readEventFilters({}))).toBe(false)
    expect(hasActiveEventFilters(readEventFilters({ free: "1" }))).toBe(true)
    expect(hasActiveEventFilters(readEventFilters({ when: "today" }))).toBe(true)
  })
})

describe("applyEventFilters", () => {
  const base = readEventFilters({})

  it("drops events that have already finished", () => {
    const past = event({
      id: "past",
      startsAt: hoursFromNow(-5),
      endsAt: hoursFromNow(-3),
    })
    const upcoming = event({ id: "upcoming" })

    expect(
      applyEventFilters([past, upcoming], base, NOW).map((item) => item.id),
    ).toEqual(["upcoming"])
  })

  it("keeps only today when asked for today", () => {
    const today = event({ id: "today" })
    const nextMonth = event({
      id: "later",
      startsAt: hoursFromNow(24 * 30),
      endsAt: hoursFromNow(24 * 30 + 2),
    })

    expect(
      applyEventFilters(
        [today, nextMonth],
        { ...base, when: "TODAY" },
        NOW,
      ).map((item) => item.id),
    ).toEqual(["today"])
  })

  it("excludes far-future events from this week", () => {
    const nextMonth = event({
      id: "later",
      startsAt: hoursFromNow(24 * 30),
      endsAt: hoursFromNow(24 * 30 + 2),
    })

    expect(
      applyEventFilters([nextMonth], { ...base, when: "THIS_WEEK" }, NOW),
    ).toEqual([])
  })

  it("treats a null fee and a zero fee as free", () => {
    const noFee = event({ id: "null-fee", feeInPaise: null })
    const zeroFee = event({ id: "zero-fee", feeInPaise: 0 })
    const paid = event({ id: "paid", feeInPaise: 20000 })

    expect(
      applyEventFilters(
        [noFee, zeroFee, paid],
        { ...base, free: true },
        NOW,
      ).map((item) => item.id),
    ).toEqual(["null-fee", "zero-fee"])
  })

  it("counts hybrid as online, because a student can still attend", () => {
    const online = event({ id: "online", mode: "ONLINE" })
    const hybrid = event({ id: "hybrid", mode: "HYBRID" })
    const inPerson = event({ id: "in-person", mode: "IN_PERSON" })

    expect(
      applyEventFilters(
        [online, hybrid, inPerson],
        { ...base, online: true },
        NOW,
      ).map((item) => item.id),
    ).toEqual(["online", "hybrid"])
  })

  it("filters by kind", () => {
    const workshop = event({ id: "workshop", kind: "WORKSHOP" })
    const talk = event({ id: "talk", kind: "TALK" })

    expect(
      applyEventFilters(
        [workshop, talk],
        { ...base, kind: "TALK" },
        NOW,
      ).map((item) => item.id),
    ).toEqual(["talk"])
  })

  it("combines filters conjunctively", () => {
    const match = event({ id: "match", mode: "ONLINE", feeInPaise: 0 })
    const paidOnline = event({ id: "paid", mode: "ONLINE", feeInPaise: 5000 })
    const freeInPerson = event({ id: "free", mode: "IN_PERSON", feeInPaise: 0 })

    expect(
      applyEventFilters(
        [match, paidOnline, freeInPerson],
        { ...base, free: true, online: true },
        NOW,
      ).map((item) => item.id),
    ).toEqual(["match"])
  })

  it("can legitimately return nothing", () => {
    const paid = event({ id: "paid", feeInPaise: 5000 })

    expect(applyEventFilters([paid], { ...base, free: true }, NOW)).toEqual([])
  })
})

describe("matchesQuery", () => {
  it("matches everything when the query is blank", () => {
    expect(matchesQuery(["Hackathon"], "")).toBe(true)
    expect(matchesQuery(["Hackathon"], "   ")).toBe(true)
  })

  it("matches case-insensitively on a substring", () => {
    expect(matchesQuery(["Winter Hackathon"], "hack")).toBe(true)
    expect(matchesQuery(["Winter Hackathon"], "HACK")).toBe(true)
  })

  it("matches on any of the supplied fields", () => {
    expect(matchesQuery(["Open Mic", "Music Club"], "music")).toBe(true)
  })

  it("tolerates null fields", () => {
    expect(matchesQuery([null, "Coding Club"], "coding")).toBe(true)
    expect(matchesQuery([null], "coding")).toBe(false)
  })

  it("rejects a term that is not present", () => {
    expect(matchesQuery(["Open Mic", "Music Club"], "robotics")).toBe(false)
  })
})
