"use client"

import { MessageSquare } from "lucide-react"
import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { addCommentAction, removeCommentAction } from "@/features/activity/actions"
import { ReportForm } from "@/features/activity/components/report-form"
import { COMMENT_BODY_MAX, validateCommentInput } from "@/lib/domain/activity"
import { formatRelativeTime } from "@/lib/format"
import type { ActivityComment } from "@/lib/services/community-activity"

/**
 * Comments on one announcement.
 *
 * Collapsed behind the count by default. Twenty announcements each showing
 * their comments would bury the announcements themselves, and on a phone it
 * would be an unreadable wall - so the count is the affordance and expanding is
 * a decision.
 *
 * Flat, with no reply control, because the table is flat. A reply button that
 * produced another top-level comment would misrepresent what happened.
 */
export function CommentSection({
  postId,
  slug,
  count,
  comments,
  canComment,
  now,
}: {
  postId: string
  slug: string
  count: number
  comments: ActivityComment[]
  /** Membership decides this; the service enforces it again. */
  canComment: boolean
  /** ISO. Passed in so the server and client agree on "2 hours ago". */
  now: string
}) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const label =
    count === 0 ? "Comment" : `${count} ${count === 1 ? "comment" : "comments"}`

  function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault()
    setError(null)

    const problems = validateCommentInput({ body })
    if (problems.length > 0) {
      setError(problems[0]!.message)
      return
    }

    startTransition(async () => {
      const failure = await addCommentAction({ postId, slug, body })

      if (failure) {
        setError(failure.message)
        return
      }

      setBody("")
    })
  }

  function remove(commentId: string) {
    setError(null)

    startTransition(async () => {
      const failure = await removeCommentAction({ commentId, slug })
      if (failure) setError(failure.message)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`comments-${postId}`}
        className="gap-1.5 self-start"
      >
        <MessageSquare aria-hidden="true" className="size-4" />
        {label}
      </Button>

      {open && (
        <div id={`comments-${postId}`} className="flex flex-col gap-4">
          {comments.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">
              No comments yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className="flex flex-col gap-1 border-l-2 border-border pl-3"
                >
                  <div className="flex flex-wrap items-center gap-x-2 text-caption text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {comment.authorName ?? "A Cirqles member"}
                    </span>
                    <time dateTime={comment.createdAt}>
                      {formatRelativeTime(comment.createdAt, new Date(now))}
                    </time>
                    {comment.edited && <span>edited</span>}
                  </div>

                  <p className="text-body-sm whitespace-pre-line">
                    {comment.body}
                  </p>

                  <div className="flex flex-wrap items-center gap-1">
                    {/*
                      Only the author's own comment offers delete. A moderator's
                      removal lives in the moderation queue rather than as a
                      second control here, so the two decisions stay distinct.
                    */}
                    {comment.viewerIsAuthor ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(comment.id)}
                        disabled={pending}
                        className="text-muted-foreground"
                      >
                        Delete
                      </Button>
                    ) : (
                      <ReportForm
                        targetKind="COMMENT"
                        targetId={comment.id}
                        slug={slug}
                        alreadyReported={false}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {canComment ? (
            <form onSubmit={submit} className="flex flex-col gap-2">
              <label htmlFor={`comment-${postId}`} className="sr-only">
                Add a comment
              </label>
              <textarea
                id={`comment-${postId}`}
                value={body}
                onChange={(changeEvent) => setBody(changeEvent.target.value)}
                rows={2}
                maxLength={COMMENT_BODY_MAX}
                placeholder="Add a comment"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button
                type="submit"
                size="sm"
                className="self-start"
                disabled={pending}
                aria-busy={pending}
              >
                Comment
              </Button>
            </form>
          ) : (
            <p className="text-body-sm text-muted-foreground">
              Join this community to comment.
            </p>
          )}

          {error && <Alert variant="error">{error}</Alert>}
        </div>
      )}
    </div>
  )
}
