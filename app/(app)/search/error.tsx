"use client"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

/**
 * Error boundary for search.
 *
 * `error.message` is deliberately not rendered. A failure here is a database
 * error, and those quote table names, column names and sometimes the query -
 * none of which belongs on a student's screen. The student is told the search
 * failed and offered the one useful action, which is trying it again.
 */
export default function SearchError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-page px-4 py-16 sm:px-6 lg:px-8">
      <EmptyState
        title="Search is not working right now"
        description="Something went wrong looking that up. Your query is still in the address bar, so trying again is safe."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  )
}
