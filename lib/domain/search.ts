import type { SearchResult, SearchResultKind } from "@/lib/domain/types"
import type { Tone } from "@/lib/ui/tone"

export const searchResultKindLabel: Record<SearchResultKind, string> = {
  COMMUNITY: "Communities",
  EVENT: "Events",
  ACTIVITY: "People looking",
  POST: "Posts",
  PERSON: "People",
}

export const searchResultKindTone: Record<SearchResultKind, Tone> = {
  COMMUNITY: "brand",
  EVENT: "support",
  ACTIVITY: "success",
  POST: "neutral",
  PERSON: "info",
}

/**
 * Result group order.
 *
 * Things you can turn up to come first, because the product's promise is
 * deciding what to do rather than what to read. Posts and people are context
 * once that question is answered.
 */
export const searchResultKindOrder: SearchResultKind[] = [
  "EVENT",
  "ACTIVITY",
  "COMMUNITY",
  "POST",
  "PERSON",
]

export function groupResultsByKind(
  results: SearchResult[],
): Array<{ kind: SearchResultKind; results: SearchResult[] }> {
  return searchResultKindOrder
    .map((kind) => ({
      kind,
      results: results.filter((result) => result.kind === kind),
    }))
    .filter((group) => group.results.length > 0)
}

/* ------------------------------------------------------------------------- *
 * Search request parsing
 * ------------------------------------------------------------------------- */

/**
 * The searchable surfaces.
 *
 * Deliberately four things plus `ALL`, and deliberately not people. A student
 * directory is a different privacy conversation - names, programmes and
 * photographs of a hundred strangers - and it is not answered by adding a tab.
 * `SearchResultKind` still lists `PERSON` and `ACTIVITY` for the older grouped
 * helpers above; this union is what the route actually offers today.
 */
export const searchTabs = [
  "ALL",
  "EVENTS",
  "COMMUNITIES",
  "OPPORTUNITIES",
  "UPDATES",
] as const

export type SearchTab = (typeof searchTabs)[number]

export const searchTabLabel: Record<SearchTab, string> = {
  ALL: "All",
  EVENTS: "Events",
  COMMUNITIES: "Communities",
  OPPORTUNITIES: "Opportunities",
  UPDATES: "Updates",
}

/** URL form. Lowercase because query strings are read by humans. */
export const searchTabSlug: Record<SearchTab, string> = {
  ALL: "all",
  EVENTS: "events",
  COMMUNITIES: "communities",
  OPPORTUNITIES: "opportunities",
  UPDATES: "updates",
}

/**
 * Shortest query worth a round trip.
 *
 * One character matches a meaningful fraction of every table, which is neither
 * useful to read nor cheap to produce - it is the query that scans everything
 * and ranks nothing. Two is enough for "AI", which is a real thing students
 * search for on this campus.
 */
export const MIN_QUERY_LENGTH = 2

/** Longest accepted query. Past this it is not a search, it is a payload. */
export const MAX_QUERY_LENGTH = 120

/** Per-category cap on the All tab, so no one category can bury the others. */
export const ALL_TAB_LIMIT = 5

/** Cap on a single-category tab. */
export const CATEGORY_TAB_LIMIT = 24

export type SearchRequest = {
  /** Exactly what the student typed, trimmed. For echoing back in the UI. */
  rawQuery: string
  /** Normalised for matching: lowercase, collapsed whitespace. */
  query: string
  /** Whitespace-separated terms of `query`. Empty when there is no query. */
  terms: string[]
  tab: SearchTab
  /** True when there is no query at all - the landing state. */
  isEmpty: boolean
  /** True when something was typed but it is too short to run. */
  isTooShort: boolean
  /** The only condition under which a service call should be made. */
  shouldSearch: boolean
}

/** Next's searchParams values, which may arrive repeated. */
type ParamValue = string | string[] | undefined

function firstValue(value: ParamValue): string {
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

/**
 * Collapse for matching.
 *
 * Case and whitespace only. No stemming, no synonym table, no accent folding -
 * each of those is a decision that has to be explained when it misfires, and
 * none of them earn their keep before the search is known to be used.
 */
export function normaliseQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ")
}

/**
 * Read a search request out of URL parameters.
 *
 * Total, by construction. Every unrecognised, repeated, over-long or hostile
 * value resolves to a valid request rather than throwing, because this input
 * arrives straight from a query string that anyone can edit - and a search page
 * that 500s on `?type=<script>` is a worse bug than one that shows the All tab.
 */
export function parseSearchParams(params: {
  q?: ParamValue
  type?: ParamValue
}): SearchRequest {
  const rawQuery = firstValue(params.q).trim().slice(0, MAX_QUERY_LENGTH)
  const query = normaliseQuery(rawQuery)
  const requested = firstValue(params.type).toLowerCase()

  const tab =
    searchTabs.find((candidate) => searchTabSlug[candidate] === requested) ??
    "ALL"

  const isEmpty = query.length === 0
  const isTooShort = !isEmpty && query.length < MIN_QUERY_LENGTH

  return {
    rawQuery,
    query,
    terms: isEmpty ? [] : query.split(" ").filter(Boolean),
    tab,
    isEmpty,
    isTooShort,
    shouldSearch: !isEmpty && !isTooShort,
  }
}

/**
 * Build a URL for the same search on a different tab.
 *
 * Used by the tab strip and by every "View all" link, which is why it lives
 * here: the requirement that those links preserve the query is enforced by
 * there being one function that writes them.
 */
export function searchHref(args: { query: string; tab: SearchTab }): string {
  const params = new URLSearchParams()
  if (args.query) params.set("q", args.query)
  if (args.tab !== "ALL") params.set("type", searchTabSlug[args.tab])
  const search = params.toString()
  return search ? `/search?${search}` : "/search"
}

/* ------------------------------------------------------------------------- *
 * Relevance
 * ------------------------------------------------------------------------- */

/**
 * Field weights.
 *
 * A name match beats a description match by roughly three to one, because a
 * student searching "robotics" wants the Robotics Club before they want the
 * poetry event whose blurb mentions robotics. Taxonomy is weighted lowest and
 * still non-zero: matching on kind or interest is how "workshop" and
 * "internship" return anything at all, but it is a weak signal because it is
 * shared by every row of that type.
 */
const WEIGHT_TITLE = 1
const WEIGHT_SECONDARY = 0.34
const WEIGHT_TAXONOMY = 0.18
const WEIGHT_TIMELINESS = 0.12

/**
 * Match strengths within a single field, in the order the brief asks for.
 *
 * The gaps are wide on purpose. An exact name match must outrank a prefix match
 * even when the prefix candidate also matches on description and taxonomy,
 * otherwise searching an exact club name does not put that club first - the one
 * behaviour every user expects a search box to get right.
 */
const MATCH_EXACT = 1
const MATCH_PREFIX = 0.8
const MATCH_WORD_START = 0.62
const MATCH_SUBSTRING = 0.42

/**
 * How strongly one field matches one term, from 0 to 1.
 *
 * Substring work only - no RegExp is ever constructed from user input. A query
 * of `c++`, `(`, or `.*` is a perfectly ordinary query here, whereas building a
 * pattern from it is either a thrown SyntaxError or a scan that hangs. Word
 * starts are found by walking the string rather than by `\b`, for the same
 * reason.
 */
export function scoreFieldMatch(field: string | null, term: string): number {
  if (!field || !term) return 0

  const haystack = field.trim().toLowerCase()
  if (!haystack) return 0

  if (haystack === term) return MATCH_EXACT
  if (haystack.startsWith(term)) return MATCH_PREFIX

  const at = haystack.indexOf(term)
  if (at < 0) return 0

  // Preceded by a separator, so "club" scores higher against "Coding Club"
  // than against "Nightclub".
  const before = haystack[at - 1] ?? " "
  const isWordStart = !/[\p{L}\p{N}]/u.test(before)

  return isWordStart ? MATCH_WORD_START : MATCH_SUBSTRING
}

/**
 * A row reduced to the only things ranking looks at.
 *
 * Every searchable entity projects into this shape, which is what lets one
 * scoring function serve events, communities, opportunities and posts without
 * four near-identical copies of the same arithmetic. `id` is here purely as the
 * final tie-break - it is never rendered from this structure.
 */
export type SearchCandidate = {
  id: string
  /** Name or title. The field a student is most likely typing. */
  title: string
  /** Description, tagline or body. Long prose. */
  secondary?: string | null
  /** Kind, interest label, venue - short categorical text. */
  taxonomy?: Array<string | null>
  /**
   * The timestamp that makes this row timely: an event's start, a post's
   * creation, an opportunity's deadline. Nearer in either direction scores
   * higher. Omit it for rows where time means nothing, such as a community.
   */
  timelyAt?: string | null
}

/** Beyond this many days away, timeliness contributes nothing. */
const TIMELINESS_HORIZON_DAYS = 45

const DAY_MS = 86_400_000

function timelinessScore(timelyAt: string | null | undefined, now: Date): number {
  if (!timelyAt) return 0

  const at = new Date(timelyAt).getTime()
  if (Number.isNaN(at)) return 0

  const distanceDays = Math.abs(at - now.getTime()) / DAY_MS
  if (distanceDays >= TIMELINESS_HORIZON_DAYS) return 0

  return 1 - distanceDays / TIMELINESS_HORIZON_DAYS
}

/**
 * Relevance of one candidate to one query.
 *
 * Multi-term queries score each term independently and average, so "ai
 * workshop" rewards a row matching both terms over one matching either twice.
 * Terms that match nothing contribute zero rather than disqualifying the row -
 * the database decides what is a result, this function only decides what order
 * results appear in.
 *
 * Timeliness is added at a twelfth of a name match. It is a tie-shaper, not a
 * ranking signal: a search must never answer "robotics" with tomorrow's poetry
 * reading because it happens to be sooner.
 */
export function scoreSearchResult(
  candidate: SearchCandidate,
  terms: string[],
  options: { now: Date },
): number {
  if (terms.length === 0) return 0

  const perTerm = terms.map((term) => {
    const title = scoreFieldMatch(candidate.title, term) * WEIGHT_TITLE
    const secondary =
      scoreFieldMatch(candidate.secondary ?? null, term) * WEIGHT_SECONDARY

    const taxonomy = (candidate.taxonomy ?? []).reduce(
      (best, field) => Math.max(best, scoreFieldMatch(field, term)),
      0,
    )

    return Math.max(title, secondary, taxonomy * WEIGHT_TAXONOMY)
  })

  const textual = perTerm.reduce((sum, score) => sum + score, 0) / terms.length

  // Nothing matched textually, so timeliness has nothing to shape. Returning a
  // bare zero keeps "did this match?" answerable from the score alone.
  if (textual === 0) return 0

  const timely = timelinessScore(candidate.timelyAt, options.now) * WEIGHT_TIMELINESS

  // Rounded so that two rows differing only by floating-point dust compare
  // equal and fall through to the deterministic tie-breaks below.
  return Math.round((textual + timely) * 1e6) / 1e6
}

/**
 * Rank candidates, discard non-matches, apply a limit.
 *
 * Ordering is fully determined: score, then timeliness, then title, then id.
 * The last of those is what makes it total - without an id tie-break, two rows
 * with the same score and title swap places between requests depending on how
 * the database felt about row order, and a list that reshuffles on refresh
 * reads as broken even when every row is correct.
 */
export function rankSearchResults<T extends SearchCandidate>(
  candidates: T[],
  terms: string[],
  options: { now: Date; limit?: number },
): T[] {
  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: scoreSearchResult(candidate, terms, { now: options.now }),
      timely: timelinessScore(candidate.timelyAt, options.now),
    }))
    .filter((entry) => entry.score > 0)

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.timely !== a.timely) return b.timely - a.timely

    const byTitle = a.candidate.title.localeCompare(b.candidate.title)
    if (byTitle !== 0) return byTitle

    return a.candidate.id.localeCompare(b.candidate.id)
  })

  const ranked = scored.map((entry) => entry.candidate)

  return options.limit === undefined ? ranked : ranked.slice(0, options.limit)
}

/**
 * Which categories returned nothing, for the "no results" copy.
 *
 * Pure so the page never has to write `counts.events === 0 && counts.x === 0 &&`
 * chains inline, and so the empty-state rules are testable without rendering.
 */
export function isEmptyResultSet(counts: Record<string, number>): boolean {
  return Object.values(counts).every((count) => count === 0)
}
