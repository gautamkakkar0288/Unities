import { Bookmark, Heart, MessageCircle, Pin } from "lucide-react"
import Link from "next/link"

import { VerificationBadge } from "@/components/domain/verification-badge"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import type { Post, PostKind } from "@/lib/domain/types"
import { formatCount, formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Tone } from "@/lib/ui/tone"

const postKindBadge: Record<PostKind, { label: string; tone: Tone } | null> = {
  ANNOUNCEMENT: { label: "Announcement", tone: "featured" },
  QUESTION: { label: "Question", tone: "info" },
  // An ordinary update needs no label. Badging everything badges nothing.
  UPDATE: null,
}

/**
 * A post in a feed or on a community page.
 *
 * The author's role is always visible next to their name. On a campus platform
 * the difference between an announcement from an organiser and a rumour from a
 * classmate is the entire value of the feed, so attribution is not optional
 * decoration - it is the feature (PRD section 3).
 */
export function PostCard({
  post,
  now,
  href,
  communityHref,
}: {
  post: Post
  now: string
  href: string
  communityHref: string
}) {
  const kindBadge = postKindBadge[post.kind]

  return (
    <Card
      interactive
      className={cn(
        "gap-4",
        post.kind === "ANNOUNCEMENT" && "border-featured-border",
      )}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Avatar
            size="sm"
            name={post.author.name}
            src={post.author.avatarUrl}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-body-sm font-medium">
                {post.author.name}
              </span>
              <Badge variant={roleBadgeVariant[post.author.role]}>
                {roleLabels[post.author.role]}
              </Badge>
              {kindBadge && (
                <Badge variant={kindBadge.tone}>{kindBadge.label}</Badge>
              )}
              {post.pinned && (
                <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                  <Pin aria-hidden="true" className="size-3" />
                  Pinned
                </span>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-x-1.5 text-caption text-muted-foreground">
              <Link
                href={communityHref}
                className="rounded-sm hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {post.community.name}
              </Link>
              <VerificationBadge state={post.community.verification} compact />
              <span aria-hidden="true">-</span>
              <time dateTime={post.createdAt}>
                {formatRelativeTime(post.createdAt, now)}
              </time>
            </p>
          </div>
        </div>

        <Link
          href={href}
          className="rounded-sm text-body-sm whitespace-pre-line focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="line-clamp-4">{post.body}</span>
        </Link>
      </CardContent>

      <CardFooter className="gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={post.viewerHasReacted}
          aria-label={`Like this post by ${post.author.name}`}
        >
          <Heart
            aria-hidden="true"
            className={cn(post.viewerHasReacted && "fill-primary text-primary")}
          />
          <span data-numeric>{formatCount(post.reactionCount)}</span>
        </Button>

        <Button type="button" variant="ghost" size="sm" render={<Link href={href} />}>
          <MessageCircle aria-hidden="true" />
          <span data-numeric>{formatCount(post.commentCount)}</span>
          <span className="sr-only">comments</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          aria-pressed={post.viewerHasSaved}
          aria-label={post.viewerHasSaved ? "Remove from saved" : "Save post"}
        >
          <Bookmark
            aria-hidden="true"
            className={cn(post.viewerHasSaved && "fill-primary text-primary")}
          />
        </Button>
      </CardFooter>
    </Card>
  )
}
