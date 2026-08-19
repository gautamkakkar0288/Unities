"use client"

import { CheckCheck } from "lucide-react"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { markAllNotificationsReadAction } from "@/features/notifications/actions"

/**
 * Mark everything read.
 *
 * Not shown at all when there is nothing unread - the server decides that, so
 * the button cannot appear as a no-op. Not optimistic either: this one clears a
 * whole list and the count in the navigation, and a shell that empties and then
 * refills on failure is more alarming than a moment of waiting.
 */
export function MarkAllReadButton({ unreadCount }: { unreadCount: number }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (unreadCount <= 0) return null

  function markAll() {
    setError(null)
    startTransition(async () => {
      const failure = await markAllNotificationsReadAction()
      if (failure) setError(failure.message)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={markAll}
        disabled={pending}
        aria-busy={pending}
      >
        <CheckCheck aria-hidden="true" />
        {pending ? "Marking read..." : "Mark all read"}
      </Button>

      {error && (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
