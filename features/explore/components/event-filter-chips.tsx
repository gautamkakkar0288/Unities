import { X } from "lucide-react"
import Link from "next/link"

import {
  eventKindLabel,
  eventWhenFilters,
  eventWhenLabel,
  filterableEventKinds,
  hasActiveEventFilters,
  type EventFilters,
} from "@/lib/domain/explore"

/**
 * Event filter chips.
 *
 * Each chip is a link to the same page with one parameter changed, which is why
 * back works, why a filtered view can be pasted into a group chat, and why none
 * of this needs client state. `buildHref` starts from the current filters and
 * changes exactly one thing, so combinations compose - "free" and "online" and
 * "today" together is just three chips having been clicked.
 *
 * Only chips the schema can answer appear here: timing from the event dates, fee
 * from `feeInPaise`, mode from `mode`, and category from the real `EventKind`
 * enum. "Technical" and "Cultural" are interest taxonomy rather than event
 * columns, so they are not offered - a chip that quietly matches nothing is a
 * worse outcome than a chip that is absent.
 */
export function EventFilterChips({
  filters,
  query,
}: {
  filters: EventFilters
  query: string
}) {
  function buildHref(next: Partial<EventFilters>): string {
    const merged = { ...filters, ...next }
    const params = new URLSearchParams({ type: "events" })

    if (query) params.set("q", query)
    if (merged.when !== "UPCOMING") params.set("when", merged.when.toLowerCase())
    if (merged.free) params.set("free", "1")
    if (merged.online) params.set("online", "1")
    if (merged.kind) params.set("kind", merged.kind.toLowerCase())

    return `/explore?${params.toString()}`
  }

  const chipClass = (active: boolean) =>
    active
      ? "inline-flex items-center gap-1.5 rounded-full border border-primary-border bg-primary-subtle px-3 py-1.5 text-caption text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      : "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-caption text-muted-foreground hover:border-primary-border hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="sr-only">Filter events by when they happen</h3>
        {eventWhenFilters.map((when) => (
          <Link
            key={when}
            href={buildHref({ when })}
            aria-pressed={filters.when === when}
            className={chipClass(filters.when === when)}
          >
            {eventWhenLabel[when]}
          </Link>
        ))}

        <span aria-hidden="true" className="h-4 w-px bg-border" />

        <Link
          href={buildHref({ free: !filters.free })}
          aria-pressed={filters.free}
          className={chipClass(filters.free)}
        >
          Free
        </Link>
        <Link
          href={buildHref({ online: !filters.online })}
          aria-pressed={filters.online}
          className={chipClass(filters.online)}
        >
          Online
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h3 className="sr-only">Filter events by type</h3>
        {filterableEventKinds.map((kind) => (
          <Link
            key={kind}
            href={buildHref({ kind: filters.kind === kind ? null : kind })}
            aria-pressed={filters.kind === kind}
            className={chipClass(filters.kind === kind)}
          >
            {eventKindLabel[kind]}
          </Link>
        ))}

        {hasActiveEventFilters(filters) && (
          <Link
            href={buildHref({
              when: "UPCOMING",
              free: false,
              online: false,
              kind: null,
            })}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-3.5" />
            Clear filters
          </Link>
        )}
      </div>
    </div>
  )
}
