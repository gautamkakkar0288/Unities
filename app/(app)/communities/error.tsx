"use client"

import { useEffect } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

/**
 * The directory's own error boundary.
 *
 * Scoped to this route rather than the whole shell, so a failed query loses the
 * list and nothing else: navigation, and the rest of the app, stay usable.
 *
 * The student is told what failed and given a retry, never the exception -
 * `error.message` from a database failure is both meaningless to them and a
 * quiet way to leak schema details. The digest is enough to find it in the logs.
 */
export default function CommunitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Communities directory failed to load", error)
  }, [error])

  return (
    <div className="flex flex-col items-start gap-4">
      <Alert variant="error" title="We could not load communities">
        Something went wrong on our side. Trying again usually works.
        {error.digest && (
          <span className="mt-1 block text-caption text-muted-foreground">
            Reference: {error.digest}
          </span>
        )}
      </Alert>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
