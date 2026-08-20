import { describe, expect, it } from "vitest"

import {
  ALL_TAB_LIMIT,
  groupResultsByKind,
  isEmptyResultSet,
  MIN_QUERY_LENGTH,
  normaliseQuery,
  parseSearchParams,
  rankSearchResults,
  scoreFieldMatch,
  scoreSearchResult,
  searchHref,
  searchResultKindOrder,
  type SearchCandidate,
} from "@/lib/domain/search"

const now = new Date("2026-05-10T09:00:00.000Z")

function candidate(
  overrides: Partial<SearchCandidate> & { id: string; title: string },
): SearchCandidate {
  return { secondary: null, taxonomy: [], timelyAt: null, ...overrides }
}

function score(input: Partial<SearchCandidate> & { id: string; title: string }, query: string) {
  return scoreSearchResult(candidate(input), query.split(" "), { now })
}

describe("parseSearchParams", () => {
  it("reads a query and defaults to the All tab", () => {
    const request = parseSearchParams({ q: "hackathon" })

    expect(request.rawQuery).toBe("hackathon")
    expect(request.query).toBe("hackathon")
    expect(request.terms).toEqual(["hackathon"])
    expect(request.tab).toBe("ALL")
    expect(request.shouldSearch).toBe(true)
  })

  it("treats a missing query as the landing state rather than a search", () => {
    const request = parseSearchParams({})

    expect(request.isEmpty).toBe(true)
    expect(request.isTooShort).toBe(false)
    expect(request.shouldSearch).toBe(false)
    expect(request.terms).toEqual([])
  })

  it("treats whitespace as no query at all", () => {
    const request = parseSearchParams({ q: "   " })

    expect(request.isEmpty).toBe(true)
    expect(request.shouldSearch).toBe(false)
  })

  it("refuses a query below the minimum length without calling it empty", () => {
    const request = parseSearchParams({ q: "a" })

    expect(request.isEmpty).toBe(false)
    expect(request.isTooShort).toBe(true)
    expect(request.shouldSearch).toBe(false)
  })

  it("accepts a query at exactly the minimum length", () => {
    const request = parseSearchParams({ q: "a".repeat(MIN_QUERY_LENGTH) })

    expect(request.shouldSearch).toBe(true)
  })

  it("reads a known tab from the type parameter", () => {
    expect(parseSearchParams({ q: "ai", type: "events" }).tab).toBe("EVENTS")
    expect(parseSearchParams({ q: "ai", type: "updates" }).tab).toBe("UPDATES")
  })

  it("falls back to All for an unknown or hostile tab instead of throwing", () => {
    expect(parseSearchParams({ q: "ai", type: "people" }).tab).toBe("ALL")
    expect(parseSearchParams({ q: "ai", type: "<script>" }).tab).toBe("ALL")
    expect(parseSearchParams({ q: "ai", type: "" }).tab).toBe("ALL")
  })

  it("takes the first value when a parameter is repeated", () => {
    const request = parseSearchParams({
      q: ["robotics", "ignored"],
      type: ["communities", "events"],
    })

    expect(request.query).toBe("robotics")
    expect(request.tab).toBe("COMMUNITIES")
  })

  it("caps an absurdly long query", () => {
    const request = parseSearchParams({ q: "x".repeat(5000) })

    expect(request.rawQuery.length).toBeLessThanOrEqual(120)
  })

  it("splits multiple terms and collapses repeated whitespace", () => {
    expect(parseSearchParams({ q: "  AI   Workshop " }).terms).toEqual([
      "ai",
      "workshop",
    ])
  })
})

describe("normaliseQuery", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normaliseQuery("  Coding   CLUB ")).toBe("coding club")
  })
})

describe("searchHref", () => {
  it("preserves the query when switching tab, which is what View all relies on", () => {
    expect(searchHref({ query: "hackathon", tab: "EVENTS" })).toBe(
      "/search?q=hackathon&type=events",
    )
  })

  it("omits the default tab", () => {
    expect(searchHref({ query: "hackathon", tab: "ALL" })).toBe(
      "/search?q=hackathon",
    )
  })

  it("encodes queries that contain URL syntax", () => {
    expect(searchHref({ query: "c++ & rust", tab: "ALL" })).toBe(
      "/search?q=c%2B%2B+%26+rust",
    )
  })

  it("returns the bare route with no query", () => {
    expect(searchHref({ query: "", tab: "ALL" })).toBe("/search")
  })
})

describe("scoreFieldMatch", () => {
  it("ranks exact above prefix above word start above mid-word", () => {
    const exact = scoreFieldMatch("club", "club")
    const prefix = scoreFieldMatch("club night", "club")
    const wordStart = scoreFieldMatch("coding club", "club")
    const midWord = scoreFieldMatch("nightclub", "club")

    expect(exact).toBeGreaterThan(prefix)
    expect(prefix).toBeGreaterThan(wordStart)
    expect(wordStart).toBeGreaterThan(midWord)
    expect(midWord).toBeGreaterThan(0)
  })

  it("is case-insensitive in both directions", () => {
    expect(scoreFieldMatch("Coding Club", "coding club")).toBe(1)
    expect(scoreFieldMatch("ROBOTICS", "robotics")).toBe(1)
  })

  it("ignores surrounding whitespace in the field", () => {
    expect(scoreFieldMatch("  Robotics  ", "robotics")).toBe(1)
  })

  it("scores zero for a miss, an empty field, and an empty term", () => {
    expect(scoreFieldMatch("robotics", "poetry")).toBe(0)
    expect(scoreFieldMatch("", "robotics")).toBe(0)
    expect(scoreFieldMatch(null, "robotics")).toBe(0)
    expect(scoreFieldMatch("robotics", "")).toBe(0)
  })

  it("treats regex metacharacters as literal text", () => {
    // A RegExp-based matcher either throws or matches everything here.
    expect(scoreFieldMatch("C++ Workshop", "c++")).toBeGreaterThan(0)
    expect(scoreFieldMatch("Robotics (Beginners)", "(beginners)")).toBeGreaterThan(0)
    expect(scoreFieldMatch("robotics", ".*")).toBe(0)
    expect(scoreFieldMatch("robotics", "[a-z")).toBe(0)
  })
})

describe("scoreSearchResult", () => {
  it("puts an exact name match above a prefix match", () => {
    expect(score({ id: "a", title: "Hackathon" }, "hackathon")).toBeGreaterThan(
      score({ id: "b", title: "Hackathon Kickoff" }, "hackathon"),
    )
  })

  it("puts a name match above a description match", () => {
    const byName = score({ id: "a", title: "Hackathon Kickoff" }, "hackathon")
    const byDescription = score(
      { id: "b", title: "Poetry Night", secondary: "Between the hackathon rounds" },
      "hackathon",
    )

    expect(byName).toBeGreaterThan(byDescription)
  })

  it("puts a description match above a taxonomy-only match", () => {
    const byDescription = score(
      { id: "a", title: "Poetry Night", secondary: "A workshop for beginners" },
      "workshop",
    )
    const byTaxonomy = score(
      { id: "b", title: "Poetry Night", taxonomy: ["WORKSHOP"] },
      "workshop",
    )

    expect(byDescription).toBeGreaterThan(byTaxonomy)
    expect(byTaxonomy).toBeGreaterThan(0)
  })

  it("scores zero when nothing matches", () => {
    expect(score({ id: "a", title: "Poetry Night" }, "robotics")).toBe(0)
  })

  it("scores zero for an empty term list", () => {
    expect(
      scoreSearchResult(candidate({ id: "a", title: "Anything" }), [], { now }),
    ).toBe(0)
  })

  it("rewards matching both terms over matching one", () => {
    const both = score({ id: "a", title: "AI Workshop" }, "ai workshop")
    const one = score({ id: "b", title: "AI Showcase" }, "ai workshop")

    expect(both).toBeGreaterThan(one)
  })

  it("lets timeliness separate two otherwise identical rows", () => {
    const soon = score(
      { id: "a", title: "Hackathon", timelyAt: "2026-05-12T09:00:00.000Z" },
      "hackathon",
    )
    const distant = score(
      { id: "b", title: "Hackathon", timelyAt: "2026-11-12T09:00:00.000Z" },
      "hackathon",
    )

    expect(soon).toBeGreaterThan(distant)
  })

  it("never lets timeliness overturn a name match", () => {
    const namedButDistant = score(
      { id: "a", title: "Hackathon", timelyAt: "2027-01-01T00:00:00.000Z" },
      "hackathon",
    )
    const imminentDescriptionMatch = score(
      {
        id: "b",
        title: "Poetry Night",
        secondary: "After the hackathon",
        timelyAt: "2026-05-10T10:00:00.000Z",
      },
      "hackathon",
    )

    expect(namedButDistant).toBeGreaterThan(imminentDescriptionMatch)
  })

  it("ignores an unparseable timestamp instead of producing NaN", () => {
    expect(
      score({ id: "a", title: "Hackathon", timelyAt: "not-a-date" }, "hackathon"),
    ).toBe(1)
  })

  it("is deterministic across repeated calls", () => {
    const input = { id: "a", title: "AI Workshop", secondary: "Build things" }

    expect(score(input, "ai")).toBe(score(input, "ai"))
  })
})

describe("rankSearchResults", () => {
  it("orders by relevance and drops non-matches", () => {
    const ranked = rankSearchResults(
      [
        candidate({ id: "3", title: "Poetry Night" }),
        candidate({ id: "2", title: "Hackathon Kickoff" }),
        candidate({ id: "1", title: "Hackathon" }),
      ],
      ["hackathon"],
      { now },
    )

    expect(ranked.map((entry) => entry.id)).toEqual(["1", "2"])
  })

  it("breaks ties by title then id, so ordering is stable", () => {
    const ranked = rankSearchResults(
      [
        candidate({ id: "c", title: "Hackathon" }),
        candidate({ id: "a", title: "Hackathon" }),
        candidate({ id: "b", title: "Hackathon" }),
      ],
      ["hackathon"],
      { now },
    )

    expect(ranked.map((entry) => entry.id)).toEqual(["a", "b", "c"])
  })

  it("produces the same order regardless of input order", () => {
    const rows = [
      candidate({ id: "1", title: "Hackathon" }),
      candidate({ id: "2", title: "Hackathon Kickoff" }),
      candidate({ id: "3", title: "Startup Hackathon" }),
    ]

    const forward = rankSearchResults(rows, ["hackathon"], { now })
    const reversed = rankSearchResults([...rows].reverse(), ["hackathon"], { now })

    expect(forward.map((entry) => entry.id)).toEqual(
      reversed.map((entry) => entry.id),
    )
  })

  it("applies a limit after ranking, not before", () => {
    const ranked = rankSearchResults(
      [
        candidate({ id: "weak", title: "Talk", secondary: "about hackathons" }),
        candidate({ id: "strong", title: "Hackathon" }),
      ],
      ["hackathon"],
      { now, limit: 1 },
    )

    expect(ranked.map((entry) => entry.id)).toEqual(["strong"])
  })

  it("returns everything matching when no limit is given", () => {
    const rows = Array.from({ length: ALL_TAB_LIMIT + 4 }, (_, index) =>
      candidate({ id: `e${index}`, title: `Hackathon ${index}` }),
    )

    expect(rankSearchResults(rows, ["hackathon"], { now })).toHaveLength(
      rows.length,
    )
  })

  it("returns nothing for an empty term list", () => {
    expect(
      rankSearchResults([candidate({ id: "a", title: "Hackathon" })], [], { now }),
    ).toEqual([])
  })

  it("handles an empty candidate list", () => {
    expect(rankSearchResults([], ["hackathon"], { now })).toEqual([])
  })
})

describe("isEmptyResultSet", () => {
  it("is true only when every category is empty", () => {
    expect(isEmptyResultSet({ events: 0, communities: 0 })).toBe(true)
    expect(isEmptyResultSet({ events: 0, communities: 1 })).toBe(false)
  })
})

describe("existing grouping helpers", () => {
  it("still groups by kind in the documented order", () => {
    const grouped = groupResultsByKind([
      { id: "p", kind: "POST", title: "Post", subtitle: "", href: "#", meta: "" },
      { id: "e", kind: "EVENT", title: "Event", subtitle: "", href: "#", meta: "" },
    ])

    expect(grouped.map((group) => group.kind)).toEqual(["EVENT", "POST"])
    expect(searchResultKindOrder[0]).toBe("EVENT")
  })
})
