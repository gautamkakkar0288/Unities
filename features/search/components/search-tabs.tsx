import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/cn"
import {
  searchHref,
  searchTabLabel,
  searchTabs,
  type SearchTab,
} from "@/lib/domain/search"

/**
 * Result tabs, as links.
 *
 * Anchors rather than buttons: each tab is a different URL, so it should be
 * shareable, openable in a new tab, and reachable with browser history. The
 * counts come from the ranked result sets, never from a separate count query
 * that could disagree with the list underneath.
 *
 * The strip scrolls horizontally inside its own overflow context at 390px. The
 * negative margin and matching padding let the focus ring of the first and last
 * tab render without being clipped, which is the usual casualty of a scrolling
 * tab bar.
 */
export function SearchTabs({
  active,
  query,
  counts,
}: {
  active: SearchTab
  query: string
  counts?: Record<Exclude<SearchTab, "ALL">, number> & { ALL: number }
}) {
  return (
    <nav
      aria-label="Search result categories"
      className="-mx-1 overflow-x-auto px-1 pb-1"
    >
      <ul className="flex min-w-max items-center gap-1">
        {searchTabs.map((tab) => {
          const isActive = tab === active
          const count = counts?.[tab]

          return (
            <li key={tab}>
              <Link
                href={searchHref({ query, tab })}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm font-medium transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isActive
                    ? "bg-primary-subtle text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {searchTabLabel[tab]}
                {count !== undefined && count > 0 ? (
                  <Badge variant={isActive ? "brand" : "neutral"}>{count}</Badge>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
