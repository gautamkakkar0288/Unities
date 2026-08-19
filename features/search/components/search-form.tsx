import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchTabSlug, type SearchTab } from "@/lib/domain/search"

/**
 * The search box.
 *
 * A plain GET form, which is the whole design. Submitting navigates to
 * `/search?q=...`, so Enter works because forms work, the query is in the URL
 * because that is where a form puts it, back and forward work because they are
 * real navigations, and none of it costs a single byte of client JavaScript.
 * The controlled-input version of this needs `useState`, a submit handler, a
 * `router.push`, and a `useEffect` to resynchronise when the user hits back.
 *
 * The current tab rides along in a hidden field so that refining a query from
 * the Events tab keeps you on the Events tab. Losing the tab on every new query
 * is a small thing that makes a search feel like it is fighting you.
 *
 * There is no autocomplete. Suggestions would need either a client-side
 * debounce against a new endpoint or a full-text index, and the brief is
 * explicit that reliable beats flashy this phase.
 */
export function SearchForm({
  query,
  tab,
}: {
  query: string
  tab: SearchTab
}) {
  return (
    <form action="/search" method="get" role="search" className="flex gap-2">
      {tab !== "ALL" ? (
        <input type="hidden" name="type" value={searchTabSlug[tab]} />
      ) : null}

      <div className="relative flex-1">
        <label htmlFor="campus-search" className="sr-only">
          Search Cirqles for events, communities, opportunities and updates
        </label>

        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />

        <Input
          id="campus-search"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search events, clubs, opportunities"
          autoComplete="off"
          // Focused on arrival only when empty, so a student who followed a
          // result link and came back does not get the keyboard thrown at them.
          autoFocus={query.length === 0}
          className="h-11 pl-9"
        />
      </div>

      <Button type="submit" size="lg" className="shrink-0">
        Search
      </Button>
    </form>
  )
}
