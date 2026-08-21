import { describe, expect, it } from "vitest"

import {
  MOBILE_DEFAULT_LIMIT,
  MOBILE_MAX_LIMIT,
  parseId,
  parseListQuery,
  parseSlug,
} from "./query"

function query(search: string) {
  return parseListQuery(new URL(`http://localhost/api/mobile/x${search}`))
}

describe("parseListQuery", () => {
  it("defaults a request that asks for nothing", () => {
    const result = query("")

    expect(result).toEqual({
      ok: true,
      value: { limit: MOBILE_DEFAULT_LIMIT, cursor: null, search: null },
    })
  })

  it("refuses a limit above the cap", () => {
    // The cap is the whole point: without it this parameter is a request for
    // every row in the table.
    const result = query(`?limit=${MOBILE_MAX_LIMIT + 1}`)

    expect(result.ok).toBe(false)
  })

  it("refuses a limit of zero and a limit that is not a number", () => {
    expect(query("?limit=0").ok).toBe(false)
    expect(query("?limit=-5").ok).toBe(false)
    expect(query("?limit=1.5").ok).toBe(false)
    expect(query("?limit=all").ok).toBe(false)
  })

  it("accepts the cap itself", () => {
    expect(query(`?limit=${MOBILE_MAX_LIMIT}`).ok).toBe(true)
  })

  it("refuses a cursor that is not a timestamp", () => {
    // Silently ignoring it would hand the client page one again forever, which
    // looks like a working infinite scroll that never advances.
    expect(query("?cursor=abc").ok).toBe(false)
  })

  it("accepts an ISO cursor", () => {
    const result = query("?cursor=2026-01-01T00%3A00%3A00.000Z")

    expect(result.ok && result.value.cursor).toBe("2026-01-01T00:00:00.000Z")
  })

  it("treats an empty parameter as absent", () => {
    const result = query("?limit=&cursor=&search=")

    expect(result).toEqual({
      ok: true,
      value: { limit: MOBILE_DEFAULT_LIMIT, cursor: null, search: null },
    })
  })

  it("trims a search term and refuses an essay", () => {
    const trimmed = query("?search=%20%20football%20%20")

    expect(trimmed.ok && trimmed.value.search).toBe("football")
    expect(query(`?search=${"x".repeat(81)}`).ok).toBe(false)
  })
})

describe("parseSlug", () => {
  it("accepts what slugifyTitle produces", () => {
    expect(parseSlug("open-mic-night-2026")).toEqual({
      ok: true,
      value: "open-mic-night-2026",
    })
  })

  it("lowercases before matching", () => {
    expect(parseSlug("Open-Mic")).toEqual({ ok: true, value: "open-mic" })
  })

  it("refuses anything that is not a slug", () => {
    expect(parseSlug("").ok).toBe(false)
    expect(parseSlug("has spaces").ok).toBe(false)
    expect(parseSlug("trailing-").ok).toBe(false)
    expect(parseSlug("double--dash").ok).toBe(false)
    expect(parseSlug("../../etc/passwd").ok).toBe(false)
    expect(parseSlug("a".repeat(129)).ok).toBe(false)
  })
})

describe("parseId", () => {
  it("accepts a uuid and the short ids the database tests use", () => {
    expect(parseId(crypto.randomUUID()).ok).toBe(true)
    expect(parseId("ma-notification-one").ok).toBe(true)
  })

  it("refuses blanks and whitespace", () => {
    expect(parseId("").ok).toBe(false)
    expect(parseId("   ").ok).toBe(false)
    expect(parseId("two words").ok).toBe(false)
  })
})
