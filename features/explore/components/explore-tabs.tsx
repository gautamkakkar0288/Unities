import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  exploreTabLabel,
  exploreTabSlug,
  exploreTabs,
  type ExploreTab,
} from "@/lib/domain/explore"

/**
 * The four things a student can browse.
 *
 * Links, not buttons with client state. The active tab is a URL parameter, so a
 * tab is a navigation and should be a real anchor: shareable, openable in a new
 * tab, and reachable with the keyboard for free. A `role="tablist"` widget here
 * would mean reimplementing arrow-key handling and focus management to end up
 * somewhere slightly worse than a nav.
 *
 * Counts come from the rows that were actually loaded, so a tab never promises
 * more than the list can show.
 */
export function ExploreTabs({
  active,
  counts,
  query,
}: {
  active: ExploreTab
  counts: Record<ExploreTab, number>
  /** Preserved across tab changes, because the text filter is a lens, not a tab. */
  query: string
}) {
  return (
    <nav aria-label="Browse by type">
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {exploreTabs.map((tab) => {
          const params = new URLSearchParams({ type: exploreTabSlug[tab] })
          if (query) params.set("q", query)

          const isActive = tab === active

          return (
            <li key={tab} className="shrink-0">
              <Link
                href={`/explore?${params.toString()}`}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "flex items-center gap-2 rounded-lg bg-primary-subtle px-3 py-2 text-label text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    : "flex items-center gap-2 rounded-lg px-3 py-2 text-label text-muted-foreground hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                }
              >
                {exploreTabLabel[tab]}
                <Badge variant={isActive ? "brand" : "neutral"}>
                  <span data-numeric>{counts[tab]}</span>
                </Badge>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
