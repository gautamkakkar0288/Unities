import { Skeleton } from "@/components/ui/skeleton"

/**
 * Home while the feed is loading.
 *
 * The skeleton mirrors the real layout - greeting, quick actions, then two card
 * grids - so the page does not jump when the data lands. A generic centred
 * spinner would be less work and would make the first paint feel slower than it
 * is, because there would be nothing to read.
 */
export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true">
      <span className="sr-only" role="status">
        Loading your campus feed
      </span>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16" />
        ))}
      </div>

      {Array.from({ length: 2 }).map((_, section) => (
        <div key={section} className="flex flex-col gap-4">
          <Skeleton className="h-7 w-56" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, card) => (
              <Skeleton key={card} className="h-64" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
