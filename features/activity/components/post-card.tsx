"use client"

import Link from "next/link"
import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { removePostAction } from "@/features/activity/actions"
import { CommentSection } from "@/features/activity/components/comment-section"
import { PostComposer } from "@/features/activity/components/post-composer"
import { ReactionButton } from "@/features/activity/components/reaction-button"
import { ReportForm } from "@/features/activity/components/report-form"
import { formatRelativeTime } from "@/lib/format"
import type {
  ActivityComment,
  ActivityPost,
} from "@/lib/services/community-activity"

/**
 * One announcement, with its actions.
 *
 * Shows the community, the author's display name, when it was posted, the
 * title, the body, the linked event, real reaction and comment counts, and the
 * controls this viewer may actually use. It shows no email, no account detail
 * and no database identifier - the projection it renders does not contain them,
 * which is the guarantee rather than the discipline of this file.
 *
 * The counts come from rows. Before this branch there was nothing to count, and
 * the earlier work correctly refused to render numbers it could not source;
 * that stays true, the tables simply exist now.
 */
export function PostCard({
  post,
  comments,
  linkableEvents,
  canComment,
  alreadyReported,
  reportedComments,
  now,
}: {
  post: ActivityPost
  comments: ActivityComment[]
  /** Only needed when this viewer can edit. */
  linkableEvents: Array<{ id: string; title: string }>
  canComment: boolean
  alreadyReported: boolean
  /**
   * Comment ids this viewer has already reported. Passed down rather than
   * looked up per comment, and only ever this viewer's own reports.
   */
  reportedComments: Set<string>
  now: string
}) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function remove() {
    setError(null)

    startTransition(async () => {
      const failure = await removePostAction({
        postId: post.id,
        slug: post.community.slug,
      })

      if (failure) {
        setError(failure.message)
        setConfirming(false)
      }
    })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex flex-wrap items-center gap-x-2 text-caption text-muted-foreground">
          <span className="font-medium text-foreground">
            {post.authorName ?? "A Cirqles member"}
          </span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.createdAt}>
            {formatRelativeTime(post.createdAt, new Date(now))}
          </time>
          {post.viewerIsAuthor && <Badge variant="outline">Your update</Badge>}
        </div>

        {editing ? (
          <PostComposer
            communityId={post.community.id}
            slug={post.community.slug}
            events={linkableEvents}
            post={{ id: post.id, title: post.title, body: post.body }}
            onDone={() => setEditing(false)}
          />
        ) : (
          <>
            {/*
              A heading, not a bold paragraph. The activity list is a list of
              announcements, and screen-reader users navigate it by heading.
            */}
            <h3 className="text-h4 wrap-anywhere">{post.title}</h3>

            {post.body && (
              <p className="max-w-readable text-body whitespace-pre-line text-muted-foreground">
                {post.body}
              </p>
            )}

            {post.event && (
              <Link
                href={`/events/${post.event.slug}`}
                className="text-body-sm font-medium underline underline-offset-4"
              >
                {post.event.title}
              </Link>
            )}
          </>
        )}

        <div className="flex flex-wrap items-center gap-1 border-t border-border pt-3">
          <ReactionButton
            postId={post.id}
            slug={post.community.slug}
            title={post.title}
            count={post.reactionCount}
            reacted={post.viewerHasReacted}
          />

          {post.viewerCanEdit && !editing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          )}

          {/*
            Removal asks first. It is not reversible from this screen, and the
            control sits beside Edit where a mis-tap is plausible.
          */}
          {post.viewerCanRemove &&
            (confirming ? (
              <span className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={remove}
                  disabled={pending}
                  aria-busy={pending}
                >
                  {post.viewerIsAuthor ? "Delete update" : "Remove update"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                >
                  Keep
                </Button>
              </span>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(true)}
                className="text-muted-foreground"
              >
                {post.viewerIsAuthor ? "Delete" : "Remove"}
              </Button>
            ))}

          {!post.viewerIsAuthor && (
            <ReportForm
              targetKind="POST"
              targetId={post.id}
              slug={post.community.slug}
              alreadyReported={alreadyReported}
            />
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <CommentSection
          postId={post.id}
          slug={post.community.slug}
          count={post.commentCount}
          comments={comments}
          canComment={canComment}
          reportedComments={reportedComments}
          now={now}
        />
      </CardContent>
    </Card>
  )
}
