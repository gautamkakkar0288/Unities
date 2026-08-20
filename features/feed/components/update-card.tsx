import { Heart, MessageSquare, Megaphone } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRelativeTime } from "@/lib/format"
import type { PostSummary } from "@/lib/services/posts"

/**
 * A community announcement.
 *
 * Reaction and comment counts are real aggregates over `post_reactions` and
 * `post_comments`. Until those tables existed this card deliberately showed
 * none of it, because affordances for interactions that did not exist would
 * have been the fastest way to make the showcase look like a lie. The tables
 * exist now, so the numbers are sourced rather than invented - and when no
 * activity state is supplied the card still renders nothing rather than zeros.
 *
 * The counts are shown, not operated. Liking and commenting live on the
 * community page, where the comment thread and composer are; a like control
 * here would need its own revalidation path to avoid appearing inert.
 *
 * The body is clamped rather than truncated in JavaScript so the full text stays
 * in the document for screen readers and for search, and long announcements
 * cannot blow out the card on a 390px screen.
 */
export function UpdateCard({
  post,
  now,
  activity,
}: {
  post: PostSummary
  now: string
  /**
   * Real counts for this post, or null when the caller did not load them.
   * Null renders no activity line at all, rather than "0 likes".
   */
  activity?: {
    reactionCount: number
    commentCount: number
    viewerHasReacted: boolean
  } | null
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
        <CardContent>
          <Link
            href={`/events/${post.event.slug}`}
            className="text-caption text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            About {post.event.title}
          </Link>
        </CardContent>
      )}

      {/*
        Text, not buttons. Assistive technology reads "2 likes, 1 comment" as
        the state it is, and nothing here suggests a control that Home does not
        actually offer. Sits at the bottom of the card whatever else is present.
      */}
      {activity && (
        <CardContent className="mt-auto">
          <p className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Heart
                aria-hidden="true"
                className={
                  activity.viewerHasReacted
                    ? "size-3.5 fill-current text-primary"
                    : "size-3.5"
                }
              />
              <span data-numeric>
                {activity.reactionCount}{" "}
                {activity.reactionCount === 1 ? "like" : "likes"}
              </span>
            </span>

            <span className="flex items-center gap-1.5">
              <MessageSquare aria-hidden="true" className="size-3.5" />
              <span data-numeric>
                {activity.commentCount}{" "}
                {activity.commentCount === 1 ? "comment" : "comments"}
              </span>
            </span>

            {activity.viewerHasReacted && (
              <span className="text-primary">You liked this</span>
            )}
          </p>
        </CardContent>
      )}
    </Card>
  )
}
