import type { SavedTargetKind } from "@/lib/db/schema"

/**
 * Saved items, in the words the interface uses.
 *
 * The kinds are the schema's - `savedTargetKinds` - not a second list. A
 * separate UI taxonomy would let the two drift, and the failure would be a tab
 * that shows nothing because it filters on a string the database never stores.
 */

export const savedKindLabel: Record<SavedTargetKind, string> = {
  EVENT: "Event",
  COMMUNITY: "Community",
  OPPORTUNITY: "Opportunity",
}

/** `ALL` is a view, not a stored kind, which is why it is not in the schema. */
export type SavedFilter = "ALL" | SavedTargetKind

export const savedFilters: SavedFilter[] = [
  "ALL",
  "EVENT",
  "COMMUNITY",
  "OPPORTUNITY",
]

export const savedFilterLabel: Record<SavedFilter, string> = {
  ALL: "All",
  EVENT: "Events",
  COMMUNITY: "Communities",
  OPPORTUNITY: "Opportunities",
}

/**
 * The filter arrives in a query string, so it is untrusted input. Anything
 * unrecognised falls back to `ALL` rather than erroring: a mistyped URL should
 * show a student their saved things, not a stack trace.
 */
export function isSavedFilter(value: unknown): value is SavedFilter {
  return (
    typeof value === "string" && (savedFilters as string[]).includes(value)
  )
}

export function readSavedFilter(value: unknown): SavedFilter {
  return isSavedFilter(value) ? value : "ALL"
}

export type SavedCounts = Record<SavedFilter, number>

/**
 * Counts for the tabs.
 *
 * Derived from the list that is already loaded rather than four `count(*)`
 * queries. The numbers on the tabs and the cards below them therefore cannot
 * disagree, which is the only reason to show counts at all.
 */
export function countSaved(
  items: Array<{ kind: SavedTargetKind }>,
): SavedCounts {
  const counts: SavedCounts = {
    ALL: items.length,
    EVENT: 0,
    COMMUNITY: 0,
    OPPORTUNITY: 0,
  }

  for (const item of items) counts[item.kind] += 1

  return counts
}

/**
 * Empty states, per filter.
 *
 * Each one names the thing that is missing. "Nothing saved yet" on the Events
 * tab is technically true and practically useless - a student with three saved
 * communities would read it as the feature being broken.
 */
export const savedEmptyState: Record<
  SavedFilter,
  { title: string; description: string }
> = {
  ALL: {
    title: "Nothing saved yet",
    description:
      "Bookmark an event, a club, or an opportunity and it waits for you here.",
  },
  EVENT: {
    title: "No saved events yet",
    description:
      "Explore campus and bookmark something you do not want to miss.",
  },
  COMMUNITY: {
    title: "No saved communities yet",
    description:
      "Save a club you are still deciding about, then come back to it.",
  },
  OPPORTUNITY: {
    title: "No saved opportunities yet",
    description:
      "Internships, competitions, and scholarships you save show up here.",
  },
}
