import { Megaphone } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRelativeTime } from "@/lib/format"
import type { PostSummary } from "@/lib/services/posts"

/**
 * A community announcement.
 *
 * No reactions, no comment count, no reply box. The posts table is announcements
 * and the product is not a forum yet; rendering affordances for interactions
 * that do not exist would be the fastest way to make the showcase look like a
 * lie.
 *
 * The body is clamped rather than truncated in JavaScript so the full text stays
 * in the document for screen readers and for search, and long announcements
 * cannot blow out the card on a 390px screen.
 */
export function UpdateCard({
  post,
  now,
}: {
  post: PostSummary
  now: string
}) {
  return (
    <Card interactive className="h-full gap-3">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">
            <Megaphone aria-hidden="true" />
            {post.community.name}
          </Badge>
          {post.community.verification === "VERIFIED" && (
            <Badge variant="info">Verified</Badge>
          )}
        </div>

        <CardTitle className="text-body">
          <Link
            href={post.href}
            className="rounded-sm hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {post.title}
          </Link>
        </CardTitle>

        <p className="text-caption text-muted-foreground">
          {post.authorName ?? "A club organiser"} &middot;{" "}
          {formatRelativeTime(post.createdAt, now)}
        </p>
      </CardHeader>

      {post.body && (
        <CardContent>
          <p className="line-clamp-3 text-body-sm text-muted-foreground">
            {post.body}
          </p>
        </CardContent>
      )}

      {post.event && (
        <CardContent className="mt-auto">
          <Link
            href={`/events/${post.event.slug}`}
            className="text-caption text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            About {post.event.title}
          </Link>
        </CardContent>
      )}
    </Card>
  )
}
