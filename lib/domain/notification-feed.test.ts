import { describe, expect, it } from "vitest"

import {
  groupNotifications,
  notificationGroup,
  unreadSummary,
} from "@/lib/domain/notification-feed"

/**
 * Grouping is pure and takes `now`, which is what makes these assertions
 * possible at all - a function reading the clock could only be tested by mocking
 * time, and would produce different headings on the server and the client.
 */
describe("notificationGroup", () => {
  const now = "2026-08-19T14:00:00.000Z"

  it("calls something from earlier the same day today", () => {
    expect(notificationGroup("2026-08-19T02:00:00.000Z", now)).toBe("TODAY")
  })

  it("uses calendar days, not the last 24 hours", () => {
    // Twenty hours earlier, but the day before - a student reading this at 2pm
    // does not think of last night as "today".
    expect(notificationGroup("2026-08-18T18:00:00.000Z", now)).toBe("YESTERDAY")
  })

  it("puts anything older under Earlier", () => {
    expect(notificationGroup("2026-08-01T09:00:00.000Z", now)).toBe("EARLIER")
  })

  it("treats a slightly future timestamp as today rather than a fourth bucket", () => {
    expect(notificationGroup("2026-08-19T23:00:00.000Z", now)).toBe("TODAY")
  })
})

describe("groupNotifications", () => {
  const now = "2026-08-19T14:00:00.000Z"

  const items = [
    { id: "a", createdAt: "2026-08-19T13:00:00.000Z" },
    { id: "b", createdAt: "2026-08-19T09:00:00.000Z" },
    { id: "c", createdAt: "2026-08-18T20:00:00.000Z" },
    { id: "d", createdAt: "2026-07-30T20:00:00.000Z" },
  ]

  it("keeps the groups in reading order", () => {
    expect(groupNotifications(items, now).map((group) => group.group)).toEqual([
      "TODAY",
      "YESTERDAY",
      "EARLIER",
    ])
  })

  it("preserves the input order inside a group", () => {
    const [today] = groupNotifications(items, now)
    expect(today.items.map((item) => item.id)).toEqual(["a", "b"])
  })

  it("drops empty groups instead of rendering an empty heading", () => {
    const groups = groupNotifications(
      [{ id: "only", createdAt: "2026-07-01T00:00:00.000Z" }],
      now,
    )

    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe("Earlier")
  })

  it("returns nothing for an empty list", () => {
    expect(groupNotifications([], now)).toEqual([])
  })
})

describe("unreadSummary", () => {
  it("says nothing when there is nothing unread", () => {
    expect(unreadSummary(0)).toBeNull()
    expect(unreadSummary(-1)).toBeNull()
  })

  it("counts what is unread", () => {
    expect(unreadSummary(1)).toBe("1 unread")
    expect(unreadSummary(12)).toBe("12 unread")
  })
})
