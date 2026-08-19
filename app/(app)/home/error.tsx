"use client"

import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

/**
 * When the feed cannot be read.
 *
 * The student is told the feed did not load and given a retry, and that is all.
 * `error.message` is deliberately not rendered: a failure here comes from the
 * database layer, and those messages carry table names, column names and
 * occasionally fragments of SQL. None of that helps a student and all of it
 * helps somebody probing the app.
 *
 * `reset` re-renders the segment, which re-runs the server component and its
 * queries - so a transient failure recovers without a full reload.
 */
export default function HomeError({ reset }: { reset: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="We could not load your feed"
      description="Something went wrong on our side. Your saved items and registrations are safe."
      action={
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      }
    />
  )
}
