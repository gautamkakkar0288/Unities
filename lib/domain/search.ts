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
