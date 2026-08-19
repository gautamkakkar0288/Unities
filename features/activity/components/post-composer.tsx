"use client"

import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { editPostAction, publishPostAction } from "@/features/activity/actions"
import {
  POST_BODY_MAX,
  POST_TITLE_MAX,
  validatePostInput,
} from "@/lib/domain/activity"

/**
 * The composer, for publishing and for editing.
 *
 * One component for both because the fields, the limits and the validation are
 * identical - the only difference is which action runs and what the button
 * says. Two components would be two places for the limits to drift.
 *
 * Validation runs here *and* in the service. This copy exists to answer
 * instantly without a round trip; the service's copy is the one that decides.
 * Both call `validatePostInput`, so they cannot disagree about what is valid.
 */
export function PostComposer({
  communityId,
  slug,
  events,
  post,
  onDone,
}: {
  communityId: string
  slug: string
  /** Publishable events in this community, for the optional link. */
  events: Array<{ id: string; title: string }>
  /** Present when editing. */
  post?: { id: string; title: string; body: string; eventId?: string | null }
  onDone?: () => void
}) {
  const editing = post !== undefined

  const [title, setTitle] = useState(post?.title ?? "")
  const [body, setBody] = useState(post?.body ?? "")
  const [eventId, setEventId] = useState(post?.eventId ?? "")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const problems = validatePostInput({ title, body })
  const titleProblem = problems.find((problem) => problem.field === "title")
  const bodyProblem = problems.find((problem) => problem.field === "body")
  // Only after they have typed something, so the form does not open shouting.
  const showTitleProblem = title.length > 0 && titleProblem !== undefined

  function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault()
    setError(null)

    if (problems.length > 0) {
      setError(problems[0]!.message)
      return
    }

    startTransition(async () => {
      const failure = editing
        ? await editPostAction({ postId: post!.id, slug, title, body, eventId })
        : await publishPostAction({ communityId, slug, title, body, eventId })

      if (failure) {
        setError(failure.message)
        return
      }

      if (!editing) {
        setTitle("")
        setBody("")
        setEventId("")
      }

      onDone?.()
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="post-title" className="text-label">
          Title
        </label>
        <input
          id="post-title"
          name="title"
          value={title}
          onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          maxLength={POST_TITLE_MAX}
          required
          aria-invalid={showTitleProblem}
          aria-describedby={showTitleProblem ? "post-title-error" : undefined}
          placeholder="Tryouts moved to Saturday"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-body outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {showTitleProblem && (
          <p id="post-title-error" className="text-caption text-destructive">
            {titleProblem.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="post-body" className="text-label">
          Details <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="post-body"
          name="body"
          value={body}
          onChange={(changeEvent) => setBody(changeEvent.target.value)}
          maxLength={POST_BODY_MAX}
          rows={4}
          aria-invalid={bodyProblem !== undefined}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-body outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="What do members need to know?"
        />
        {/*
          A counter only near the limit. Shown permanently it reads as a target,
          and an announcement is as long as it needs to be.
        */}
        {body.length > POST_BODY_MAX - 300 && (
          <p data-numeric className="text-caption text-muted-foreground">
            {POST_BODY_MAX - body.length} characters left
          </p>
        )}
      </div>

      {events.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="post-event" className="text-label">
            Link an event <span className="text-muted-foreground">(optional)</span>
          </label>
          <select
            id="post-event"
            name="eventId"
            value={eventId ?? ""}
            onChange={(changeEvent) => setEventId(changeEvent.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-body outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">No event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {editing ? "Save changes" : "Post update"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
