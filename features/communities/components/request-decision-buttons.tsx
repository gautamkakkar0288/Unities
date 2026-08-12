"use client"

import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { reviewJoinRequestAction } from "@/features/communities/moderation-actions"

type RequestDecisionButtonsProps = {
  communityId: string
  slug: string
  applicantId: string
  /** Used for the accessible label, since "Approve" alone loses the person. */
  applicantName: string
}

/**
 * Approve and decline for one pending request.
 *
 * No optimistic removal of the row. Two moderators can be looking at the same
 * queue, and the second one to press gets `NOT_FOUND` - "That request has
 * already been handled." Hiding the row first would hide that message too, and
 * the moderator would be left believing they made a decision somebody else
 * made.
 */
export function RequestDecisionButtons({
  communityId,
  slug,
  applicantId,
  applicantName,
}: RequestDecisionButtonsProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function decide(decision: "APPROVE" | "DECLINE") {
    setError(null)
    startTransition(async () => {
      const failure = await reviewJoinRequestAction({
        communityId,
        slug,
        applicantId,
        decision,
      })

      if (failure) setError(failure.message)
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => decide("DECLINE")}
          aria-label={`Decline ${applicantName}`}
        >
          Decline
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => decide("APPROVE")}
          aria-label={`Approve ${applicantName}`}
        >
          {isPending && <Spinner size="sm" label={null} />}
          Approve
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  )
}
