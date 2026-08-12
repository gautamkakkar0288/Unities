import { describe, expect, it } from "vitest"

import {
  filterCommunities,
  groupByScope,
  parseCommunityScope,
} from "@/lib/domain/community"
import type { CommunityScope, CommunitySummary } from "@/lib/domain/types"

function community(
  overrides: Partial<CommunitySummary> & { name: string },
): CommunitySummary {
  return {
    id: `id-${overrides.name}`,
    slug: overrides.name.toLowerCase().replace(/\s+/g, "-"),
    tagline: "A tagline.",
    kind: "STUDENT",
    scope: "UNIVERSITY",
    place: null,
    interest: { id: "i-1", slug: "sports", label: "Sports" },
    memberCount: 10,
    verification: "UNVERIFIED",
    joinPolicy: "OPEN",
    viewerMembership: "NONE",
    ...overrides,
  }
}

describe("parseCommunityScope", () => {
  it("accepts every scope the directory offers", () => {
    const scopes: CommunityScope[] = [
      "UNIVERSITY",
      "CITY",
      "INTEREST",
      "GLOBAL",
    ]
    for (const scope of scopes) {
      expect(parseCommunityScope(scope)).toBe(scope)
    }
  })

  it("treats junk, wrong case, and absence as no filter rather than an error", () => {
    // A stale or hand-edited URL should show the student everything, not a
    // crash - this is the whole reason the parse exists.
    expect(parseCommunityScope("university")).toBeNull()
    expect(parseCommunityScope("'; drop table communities; --")).toBeNull()
    expect(parseCommunityScope("")).toBeNull()
    expect(parseCommunityScope(undefined)).toBeNull()
    expect(parseCommunityScope(null)).toBeNull()
  })
})

describe("filterCommunities", () => {
  const directory = [
    community({ name: "Football", scope: "UNIVERSITY" }),
    community({
      name: "Shutter",
      scope: "CITY",
      tagline: "Weekend photography walks.",
      place: { id: "p-1", slug: "tricity", name: "Tricity", kind: "CITY" },
    }),
    community({
      name: "Open Source",
      scope: "INTEREST",
      interest: { id: "i-2", slug: "technology", label: "Technology" },
    }),
  ]

  it("returns everything when nothing is asked of it", () => {
    expect(filterCommunities(directory, {})).toHaveLength(3)
    expect(filterCommunities(directory, { scope: null, query: "   " })).toHaveLength(3)
  })

  it("keeps only the chosen scope", () => {
    const result = filterCommunities(directory, { scope: "CITY" })
    expect(result.map((c) => c.name)).toEqual(["Shutter"])
  })

  it("matches on name regardless of case", () => {
    expect(filterCommunities(directory, { query: "FOOT" })).toHaveLength(1)
  })

  it("matches on a partial word, which name-similarity scoring would miss", () => {
    // "phot" shares no whole token with "Weekend photography walks", so the
    // duplicate-detection scorer rates it zero. A search box has to find it.
    expect(filterCommunities(directory, { query: "phot" }).map((c) => c.name)).toEqual([
      "Shutter",
    ])
  })

  it("matches on interest and place, not just the name", () => {
    expect(filterCommunities(directory, { query: "technology" }).map((c) => c.name)).toEqual([
      "Open Source",
    ])
    expect(filterCommunities(directory, { query: "tricity" }).map((c) => c.name)).toEqual([
      "Shutter",
    ])
  })

  it("applies scope and query together", () => {
    expect(filterCommunities(directory, { scope: "UNIVERSITY", query: "phot" })).toEqual([])
  })

  it("can only ever narrow what the service returned", () => {
    // The filter must never be a way to see a community the service withheld.
    const result = filterCommunities(directory, { query: "o" })
    for (const found of result) expect(directory).toContain(found)
  })

  it("leaves the caller's array untouched", () => {
    const before = [...directory]
    filterCommunities(directory, { scope: "CITY", query: "shutter" })
    expect(directory).toEqual(before)
  })
})

describe("groupByScope after filtering", () => {
  it("drops scopes the filter emptied instead of rendering a bare heading", () => {
    const directory = [
      community({ name: "Football", scope: "UNIVERSITY" }),
      community({ name: "Shutter", scope: "CITY" }),
    ]

    const groups = groupByScope(filterCommunities(directory, { query: "football" }))

    expect(groups).toHaveLength(1)
    expect(groups[0].scope).toBe("UNIVERSITY")
  })
})
