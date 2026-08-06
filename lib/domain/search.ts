import type { SearchResult, SearchResultKind } from "@/lib/domain/types"
import type { Tone } from "@/lib/ui/tone"

/**
 * Search vocabulary.
 *
 * Results are grouped by kind rather than interleaved by relevance score.
 * "Robotics" matches a community, an event, a post, and a person, and a student
 * searching it almost always wants one specific category - a single ranked list
 * forces them to visually filter what the interface could have grouped.
 */

export const searchResultKindLabel: Record<SearchResultKind, string> = {
  COMMUNITY: "Communities",
  EVENT: "Events",
  PERSON: "People",
  POST: "Posts",
}

export const searchResultKindTone: Record<SearchResultKind, Tone> = {
  COMMUNITY: "brand",
  EVENT: "support",
  PERSON: "info",
  POST: "neutral",
}

/**
 * Display order. Communities and events first because they are joinable and
 * attendable - they are what search is for on a campus platform.
 */
export const searchResultKindOrder: SearchResultKind[] = [
  "COMMUNITY",
  "EVENT",
  "POST",
  "PERSON",
]

export function groupResultsByKind(
  results: SearchResult[],
): Array<{ kind: SearchResultKind; results: SearchResult[] }> {
  return searchResultKindOrder.map((kind) => ({
    kind,
    results: results.filter((result) => result.kind === kind),
  })).filter((group) => group.results.length > 0)
}
