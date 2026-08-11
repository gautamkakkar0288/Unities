import { describe, expect, it } from "vitest"

import { bucketFor, groupByBucket } from "@/lib/domain/time-buckets"
import type { EventSummary } from "@/lib/domain/types"

/** Friday 7 August 2026, 9am IST. */
const now = "2026-08-07T09:00:00+05:30"

const at = (startsAt: string, endsAt: string) => ({ startsAt, endsAt })

describe("bucketFor", () => {
  it("buckets an event later today as TODAY", () => {
    expect(
      bucketFor(at("2026-08-07T18:00:00+05:30", "2026-08-07T20:00:00+05:30"), now),
    ).toBe("TODAY")
  })

  it("treats an event in progress as TODAY, not PAST", () => {
    expect(
      bucketFor(at("2026-08-07T08:00:00+05:30", "2026-08-07T11:00:00+05:30"), now),
    ).toBe("TODAY")
  })

  it("separates 11pm tonight from 1am tomorrow", () => {
    expect(
      bucketFor(at("2026-08-07T23:00:00+05:30", "2026-08-07T23:59:00+05:30"), now),
    ).toBe("TODAY")
    expect(
      bucketFor(at("2026-08-08T01:00:00+05:30", "2026-08-08T02:00:00+05:30"), now),
    ).toBe("TOMORROW")
  })

  it("labels the coming Saturday as THIS_WEEKEND rather than THIS_WEEK", () => {
    // Saturday 8 August is tomorrow, so tomorrow wins - it is more specific.
    expect(
      bucketFor(at("2026-08-08T16:00:00+05:30", "2026-08-08T19:00:00+05:30"), now),
    ).toBe("TOMORROW")
    // Sunday 9 August is two days out and a weekend day.
    expect(
      bucketFor(at("2026-08-09T18:00:00+05:30", "2026-08-09T20:00:00+05:30"), now),
    ).toBe("THIS_WEEKEND")
  })

  it("labels a midweek event within seven days as THIS_WEEK", () => {
    expect(
      bucketFor(at("2026-08-11T10:00:00+05:30", "2026-08-11T13:00:00+05:30"), now),
    ).toBe("THIS_WEEK")
  })

  it("labels anything beyond a week as LATER", () => {
    expect(
      bucketFor(at("2026-08-22T10:00:00+05:30", "2026-08-22T13:00:00+05:30"), now),
    ).toBe("LATER")
  })

  it("labels a finished event as PAST", () => {
    expect(
      bucketFor(at("2026-08-06T15:00:00+05:30", "2026-08-06T18:00:00+05:30"), now),
    ).toBe("PAST")
  })

  it("uses IST rather than the server timezone", () => {
    // 2026-08-07T20:00Z is 1:30am on 8 August in IST, so it is tomorrow even
    // though it is still 7 August in UTC.
    expect(
      bucketFor(at("2026-08-07T20:00:00Z", "2026-08-07T21:00:00Z"), now),
    ).toBe("TOMORROW")
  })

  it("rejects an unparseable timestamp instead of silently bucketing it", () => {
    expect(() => bucketFor(at("not-a-date", "not-a-date"), now)).toThrow()
  })
})

describe("groupByBucket", () => {
  const event = (id: string, startsAt: string, endsAt: string) =>
    ({ id, startsAt, endsAt }) as EventSummary

  it("drops empty buckets and orders each bucket by start time", () => {
    const groups = groupByBucket(
      [
        event("late-today", "2026-08-07T20:00:00+05:30", "2026-08-07T22:00:00+05:30"),
        event("early-today", "2026-08-07T11:00:00+05:30", "2026-08-07T12:00:00+05:30"),
        event("past", "2026-08-01T11:00:00+05:30", "2026-08-01T12:00:00+05:30"),
      ],
      now,
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.bucket).toBe("TODAY")
    expect(groups[0]?.events.map((item) => item.id)).toEqual([
      "early-today",
      "late-today",
    ])
  })

  it("excludes past events from the planning surface", () => {
    const groups = groupByBucket(
      [event("past", "2026-08-01T11:00:00+05:30", "2026-08-01T12:00:00+05:30")],
      now,
    )
    expect(groups).toEqual([])
  })
})
