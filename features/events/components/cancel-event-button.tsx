"use client"

import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cancelEventAction } from "@/features/events/organiser-actions"

/**
 * Calling an event off.
 *
 * Two presses, not one. This is the only control on the platform that affects
 * everyone who registered, it cannot be undone, and it sits on the same screen
 * as the attendee list an organiser opens routinely. A confirm step costs one
 * click and prevents a mistake that has to be apologised for by email.
 */
export function CancelEventButton({
  eventId,
  slug,
  attendeeCount,
}: {
  eventId: string
  slug: string
  attendeeCount: number
}) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run() {
    setError(null)

    startTransition(async () => {
      const failure = await cancelEventAction({ eventId, slug })

      if (failure) {
        setError(failure.message)
        setConfirming(false)
      }
      // Success revalidates: the page re-renders as a cancelled event.
    })
  }

  if (!confirming) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirming(true)}
        >
          Cancel this event
        </Button>
        {error && <Alert variant="error">{error}</Alert>}
      </div>
    )
  }

  return (
    <Alert variant="warning" title="Cancel this event?">
      <p>
        {attendeeCount === 0
          ? "Nobody has registered yet, so nobody will be let down."
          : `${attendeeCount} ${attendeeCount === 1 ? "person has" : "people have"} registered. They keep their place in the record so they can be told, but the event will show as cancelled.`}{" "}
        This cannot be undone.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="destructive"
          onClick={run}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? "Cancelling…" : "Yes, cancel it"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Keep it
        </Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
    </Alert>
  )
}
