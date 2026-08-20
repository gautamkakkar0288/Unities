import { Search } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { exploreTabSlug, type ExploreTab } from "@/lib/domain/explore"

/**
 * Narrowing what is already on screen.
 *
 * A plain GET form, which is the whole point: submitting puts the term in the
 * URL, the server re-renders, and the result is shareable and survives a reload
 * with no client JavaScript and no state to get out of step. A debounced
 * controlled input would need a client component and a router push per keystroke
 * to reach the same place.
 *
 * The label says "filter" rather than "search" deliberately. This narrows the
 * loaded lists by title; the global search across people, posts and communities
 * is a later phase with its own service, and promising it here would be a
 * promise the page cannot keep.
 */
export function ExploreSearch({
  tab,
  query,
}: {
  tab: ExploreTab
  query: string
}) {
  return (
    <form action="/explore" method="get" className="flex items-end gap-2">
      {/* Keeps the current tab when the form navigates. */}
      <input type="hidden" name="type" value={exploreTabSlug[tab]} />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label htmlFor="explore-q">Filter by name</Label>
        <Input
          id="explore-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Try &ldquo;hackathon&rdquo; or &ldquo;coding&rdquo;"
          autoComplete="off"
        />
      </div>

      <button type="submit" className={buttonVariants({ variant: "outline" })}>
        <Search aria-hidden="true" />
        Filter
      </button>
    </form>
  )
}
