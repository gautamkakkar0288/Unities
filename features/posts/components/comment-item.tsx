import { Heart } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import type { Comment } from "@/lib/domain/types"
import { formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * A single comment.
 *
 * Rendered as an `article` inside the thread's list so screen reader users can
 * jump comment to comment. The organiser role badge is repeated here rather
 * than only on the post: in a long thread, the authoritative answer is usually
 * halfway down, and it needs to be identifiable there.
 */
export function CommentItem({
  comment,
  now,
}: {
  comment: Comment
  now: string
}) {
  return (
    <article className="flex gap-3 py-4">
      <Avatar size="sm" name={comment.author.name} src={comment.author.avatarUrl} />
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-body-sm font-medium">{comment.author.name}</span>
          <Badge variant={roleBadgeVariant[comment.author.role]}>
            {roleLabels[comment.author.role]}
          </Badge>
          <time
            dateTime={comment.createdAt}
            className="text-caption text-muted-foreground"
          >
            {formatRelativeTime(comment.createdAt, now)}
          </time>
        </div>
        <p className="text-body-sm">{comment.body}</p>
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={comment.viewerHasReacted}
            aria-label={`Like this comment by ${comment.author.name}`}
          >
            <Heart
              aria-hidden="true"
              className={cn(
                comment.viewerHasReacted && "fill-primary text-primary",
              )}
            />
            <span data-numeric>{comment.reactionCount}</span>
          </Button>
        </div>
      </div>
    </article>
  )
}
