import { CalendarDays } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatRelativeTime } from "@/lib/format"
import type { UpdateSearchResult } from "@/lib/services/search"

/**
 * A campus update as a search result.
 *
 * The one new card in this phase, because `main` has no component for a post -
 * events, communities and opportunities all already have one that renders
 * exactly the fields a result needs.
 *
 * It carries no reaction or comment affordances. The `posts` table stores no
 * such counts, and a comment button that cannot comment is worse than an
 * announcement that admits it is an announcement.
 *
 * `now` is passed in rather than read here so the relative timestamp is computed
 * once, on the server, from the same clock as the rest of the page. Reading the
 * clock inside a card is how a page earns a hydration mismatch.
 */
export function UpdateResultCard({
  update,
  now,
}: {
  update: UpdateSearchResult
  now: string
}) {
  return (
    <Card interactive className="h-full">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="text-caption text-muted-foreground flex flex-wrap items-center gap-2">
          <Link
            href={update.href}
            className="text-foreground focus-visible:ring-ring/50 font-medium hover:underline focus-visible:ring-3 focus-visible:outline-none"
          >
            {update.community.name}
          </Link>

          {update.community.verification === "VERIFIED" ? (
            <Badge variant="success">Verified</Badge>
          ) : null}

          <span aria-hidden="true">·</span>
          <span>{formatRelativeTime(update.createdAt, now)}</span>

          {update.authorName ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{update.authorName}</span>
            </>
          ) : null}
        </div>

        <h3 className="text-h4">
          <Link
            href={update.href}
            className="focus-visible:ring-ring/50 hover:underline focus-visible:ring-3 focus-visible:outline-none"
          >
            {update.title}
          </Link>
        </h3>

        <p className="text-body-sm text-muted-foreground line-clamp-3">
          {update.excerpt}
        </p>

        {update.event ? (
          <Link
            href={`/events/${update.event.slug}`}
            className="text-body-sm text-foreground focus-visible:ring-ring/50 mt-auto inline-flex items-center gap-2 font-medium hover:underline focus-visible:ring-3 focus-visible:outline-none"
          >
            <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
            {update.event.title}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  )
}
