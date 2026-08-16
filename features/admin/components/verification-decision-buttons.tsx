"use client"

import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { reviewVerificationAction } from "@/features/admin/actions"

/**
 * Approve and reject for one pending request.
 *
 * The note is one optional input rather than a dialog. It is the only thing the
 * club will ever be told about a rejection, so it has to be in front of the
 * reviewer as they decide - not behind a second click they can skip.
 *
 * No optimistic removal, for the same reason as the join queue: two admins can
 * be looking at this list, and the second one to press needs to see "already
 * decided" rather than watch the row vanish as though they decided it.
 */
export function VerificationDecisionButtons({
  requestId,
  communityName,
}: {
  requestId: string
  communityName: string
}) {
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function decide(decision: "APPROVED" | "REJECTED") {
    setError(null)
    startTransition(async () => {
      const failure = await reviewVerificationAction({
        requestId,
        decision,
        note: note.trim() ? note.trim() : undefined,
      })

      if (failure) setError(failure.message)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Note for the club (optional)"
        aria-label={`Note about ${communityName}`}
        disabled={isPending}
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => decide("REJECTED")}
          aria-label={`Reject ${communityName}`}
        >
          Reject
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => decide("APPROVED")}
          aria-label={`Approve ${communityName}`}
        >
          {isPending && <Spinner size="sm" label={null} />}
          Approve
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  )
}
