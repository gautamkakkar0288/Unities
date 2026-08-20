"use client"

import { Heart } from "lucide-react"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { setReactionAction } from "@/features/activity/actions"
import { describeReaction, reactedLabel, reactionLabel } from "@/lib/domain/activity"
import { formatCount } from "@/lib/format"

/**
 * The like control.
 *
 * No optimistic flip and no animation, per the brief and for the same reason
 * `JoinButton` has none: the request can be refused - a non-member reacting is
 * a `FORBIDDEN` - and an instant filled heart followed by a silent revert is
 * worse than a moment of pending. `aria-busy` says the work is happening.
 *
 * The state is `aria-pressed` rather than colour alone, and the accessible name
 * carries the count, so a screen reader gets "3 people liked Tryouts moved.
 * Press to like" instead of "button, heart".
 */
export function ReactionButton({
  postId,
  slug,
  title,
  count,
  reacted,
}: {
  postId: string
  slug: string
  title: string
  count: number
  reacted: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function toggle() {
    setError(null)

    startTransition(async () => {
      const failure = await setReactionAction({
        postId,
        slug,
        // Send the intended end state, not "toggle". Two clicks racing then
        // converge on the same answer instead of cancelling each other out.
        reacted: !reacted,
      })

      if (failure) setError(failure.message)
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggle}
        disabled={pending}
        aria-busy={pending}
        aria-pressed={reacted}
        aria-label={describeReaction({ reacted, count, title })}
        className="gap-1.5"
      >
        <Heart
          aria-hidden="true"
          className={reacted ? "size-4 fill-current" : "size-4"}
        />
        <span>{reacted ? reactedLabel : reactionLabel}</span>
        {count > 0 && (
          <span data-numeric className="text-caption text-muted-foreground">
            {formatCount(count)}
          </span>
        )}
      </Button>

      {error && (
        <p role="status" className="text-caption text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
