"use client"

import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { decideReportAction } from "@/features/moderation/actions"

type Props = {
  reportId: string
  targetKind: string
  communitySlug: string | null
  /** The content is already removed, so "resolve and remove" is meaningless. */
  alreadyRemoved: boolean
}

/**
 * The three decisions a moderator can make about one report.
 *
 * No optimistic state. A moderation decision that appears to have been applied
 * and then silently was not is worse than a slow button, so the row waits for
 * the server and the page revalidates.
 *
 * The note is optional but shared by all three actions, because "why" is the
 * part of a decision that matters six months later when someone asks.
 */
export function ReportDecisionButtons({
  reportId,
  targetKind,
  communitySlug,
  alreadyRemoved,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const noteId = `moderation-note-${reportId}`

  const decide = (decision: "RESOLVED" | "DISMISSED", removeContent: boolean) => {
    setError(null)
    startTransition(async () => {
      const result = await decideReportAction({
        reportId,
        decision,
        removeContent,
        note,
        communitySlug,
      })
      if (result) setError(result.message)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label htmlFor={noteId} className="text-label text-muted-foreground">
          Note (optional)
        </label>
        <input
          id={noteId}
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          placeholder="Why you decided this"
          disabled={pending}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-body-sm focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => decide("DISMISSED", false)}
        >
          Dismiss
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => decide("RESOLVED", false)}
        >
          Resolve, keep content
        </Button>

        {!alreadyRemoved && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => decide("RESOLVED", true)}
          >
            Resolve and remove {targetKind === "COMMENT" ? "comment" : "post"}
          </Button>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {pending ? "Saving your decision" : ""}
      </p>

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  )
}
