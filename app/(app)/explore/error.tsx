"use client"

import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

/**
 * As on Home, the underlying message is not shown. Database errors name tables
 * and columns, and that is not information a student needs or a stranger should
 * be given.
 */
export default function ExploreError({ reset }: { reset: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="We could not load Explore"
      description="Something went wrong reading campus data. Nothing you saved has been affected."
      action={
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      }
    />
  )
}
