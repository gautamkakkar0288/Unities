/**
 * Request parameter parsing for the mobile API.
 *
 * Hand-rolled rather than Zod-piped because these are three primitives read off
 * a URL, and the refusal messages need to name the parameter. Bodies still go
 * through the existing Zod schemas in `lib/schemas/*` - those are shared with
 * the web forms and must not be restated here.
 *
 * `limit` is capped. An uncapped limit is an invitation to ask for every row in
 * the table, and the cap belongs at the edge rather than in each service.
 */

export const MOBILE_DEFAULT_LIMIT = 20
export const MOBILE_MAX_LIMIT = 50

export type Parsed<T> = { ok: true; value: T } | { ok: false; message: string }

export type ListQuery = {
  limit: number
  /** ISO-8601. Meaning is per-endpoint; only timestamp cursors exist today. */
  cursor: string | null
  search: string | null
}

const SEARCH_MAX_LENGTH = 80

export function parseListQuery(url: URL): Parsed<ListQuery> {
  const rawLimit = url.searchParams.get("limit")
  let limit = MOBILE_DEFAULT_LIMIT

  if (rawLimit !== null && rawLimit !== "") {
    const parsed = Number(rawLimit)

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MOBILE_MAX_LIMIT) {
      return {
        ok: false,
        message: `limit must be a whole number between 1 and ${MOBILE_MAX_LIMIT}.`,
      }
    }

    limit = parsed
  }

  const rawCursor = url.searchParams.get("cursor")
  let cursor: string | null = null

  if (rawCursor !== null && rawCursor !== "") {
    // Cursors are opaque to the client but must be a timestamp here, because
    // that is what the notification service paginates by. Rejecting a
    // malformed one is better than silently returning page one again.
    if (Number.isNaN(Date.parse(rawCursor))) {
      return { ok: false, message: "cursor is not a valid pagination cursor." }
    }

    cursor = rawCursor
  }

  const rawSearch = url.searchParams.get("search")
  const trimmed = rawSearch?.trim() ?? ""

  if (trimmed.length > SEARCH_MAX_LENGTH) {
    return {
      ok: false,
      message: `search must be ${SEARCH_MAX_LENGTH} characters or fewer.`,
    }
  }

  return {
    ok: true,
    value: { limit, cursor, search: trimmed.length > 0 ? trimmed : null },
  }
}

/**
 * Slugs address public pages, so they are checked against the shape
 * `slugifyTitle` produces rather than being passed to the database as-is.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function parseSlug(raw: string): Parsed<string> {
  const slug = raw.trim().toLowerCase()

  if (slug.length === 0 || slug.length > 128 || !SLUG_PATTERN.test(slug)) {
    return { ok: false, message: "That address is not valid." }
  }

  return { ok: true, value: slug }
}

/**
 * Identifiers are `crypto.randomUUID()` in production and short readable
 * strings in the database tests, so this checks for something id-shaped rather
 * than for a UUID specifically. Ownership is still proved in the service's
 * WHERE clause - this only rejects obvious rubbish before a query runs.
 */
export function parseId(raw: string): Parsed<string> {
  const id = raw.trim()

  if (id.length === 0 || id.length > 64 || /\s/.test(id)) {
    return { ok: false, message: "That identifier is not valid." }
  }

  return { ok: true, value: id }
}
