import Link from "next/link"

import {
  savedFilterLabel,
  savedFilters,
  type SavedCounts,
  type SavedFilter,
} from "@/lib/domain/saved"
import { cn } from "@/lib/utils"

/**
 * The Saved tabs.
 *
 * Links, not buttons. The page is server rendered from the database, so a
 * client-side tab would mean shipping the whole saved list to the browser to
 * filter it there - and it would break the back button, sharing, and reload.
 * `?tab=event` is a real address for a real view.
 *
 * Rendered as a `nav` with `aria-current` rather than the ARIA tabs pattern,
 * because these navigate. Announcing them as tabs would promise keyboard
 * behaviour - arrow keys moving between panels - that navigation does not have.
 */
export function SavedFilters({
  active,
  counts,
}: {
  active: SavedFilter
  counts: SavedCounts
}) {
  return (
    <nav aria-label="Filter saved items" className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1 px-1">
        {savedFilters.map((filter) => {
          const isActive = filter === active
          const count = counts[filter]

          return (
            <li key={filter}>
              <Link
                href={
                  filter === "ALL"
                    ? "/saved"
                    : `/saved?tab=${filter.toLowerCase()}`
                }
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-body-sm transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isActive
                    ? "bg-primary-subtle font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {savedFilterLabel[filter]}
                {/*
                  The count is decoration next to a label that already says
                  what the tab is, so it is hidden from screen readers - "Events
                  4" read aloud is a worse label than "Events".
                */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "rounded-md px-1.5 text-caption",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                  data-numeric
                >
                  {count}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
