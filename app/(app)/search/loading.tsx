import { Skeleton } from "@/components/ui/skeleton"

/**
 * Skeleton shaped like the search page: header, box, tab strip, result grid.
 *
 * The search box is part of the skeleton on purpose. A student who has just
 * submitted a query is looking at the words they typed, and blanking the input
 * mid-navigation reads as the search having been thrown away.
 */
export default function SearchLoading() {
  return (
    <div className="mx-auto w-full max-w-page space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Skeleton className="h-11 w-full" />

      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className="h-9 w-24" />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-44 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
