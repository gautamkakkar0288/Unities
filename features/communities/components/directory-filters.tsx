import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  communityScopeLabel,
  communityScopeOrder,
} from "@/lib/domain/community"
import type { CommunityScope } from "@/lib/domain/types"
import { cn } from "@/lib/utils"

/**
 * Scope tabs and search for the directory.
 *
 * Links and a GET form rather than client state, which is what keeps the whole
 * directory a server component: no filtering code ships to the browser, the
 * results are a real URL a student can share or bookmark, back works, and it
 * all functions on a bad campus connection before JavaScript has loaded.
 *
 * Each control preserves the other's value, because losing your search when you
 * switch scope is the kind of small betrayal that stops people using filters.
 */
export function DirectoryFilters({
  activeScope,
  query,
}: {
  activeScope: CommunityScope | null
  query: string
}) {
  const hrefFor = (scope: CommunityScope | null) => {
    const params = new URLSearchParams()
    if (scope) params.set("scope", scope)
    if (query) params.set("q", query)
    const search = params.toString()
    return search ? `/communities?${search}` : "/communities"
  }

  const tabs: Array<{ scope: CommunityScope | null; label: string }> = [
    { scope: null, label: "All" },
    ...communityScopeOrder.map((scope) => ({
      scope,
      label: communityScopeLabel[scope],
    })),
  ]

  return (
    <div className="flex flex-col gap-4 pb-6">
      <nav aria-label="Filter communities by scope">
        <ul className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = tab.scope === activeScope
            return (
              <li key={tab.scope ?? "ALL"}>
                <Link
                  href={hrefFor(tab.scope)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center rounded-full border px-3.5 py-1.5 text-body-sm transition-colors duration-150",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <form
        action="/communities"
        method="get"
        role="search"
        className="flex max-w-md gap-2"
      >
        {/* Submitting the form must not silently drop the chosen scope. */}
        {activeScope && (
          <input type="hidden" name="scope" value={activeScope} />
        )}
        <label htmlFor="community-search" className="sr-only">
          Search communities
        </label>
        <Input
          id="community-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by name, interest, or place"
        />
        <button type="submit" className={cn(buttonVariants({ variant: "outline" }))}>
          Search
        </button>
      </form>
    </div>
  )
}
