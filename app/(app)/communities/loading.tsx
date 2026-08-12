import { Skeleton } from "@/components/ui/skeleton"

/**
 * Mirrors the real layout: heading, filter row, then a grid of cards of roughly
 * the height a card actually is. A spinner in the middle of the page would tell
 * the student less and make the content jump when it arrives.
 */
export default function CommunitiesLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading communities</span>

      <div className="flex flex-col gap-2 pb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <div className="flex flex-col gap-4 pb-6">
        <div className="flex flex-wrap gap-2">
          {["all", "university", "city", "interest", "global"].map((key) => (
            <Skeleton key={key} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-9 w-full max-w-md" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {["a", "b", "c", "d", "e", "f"].map((key) => (
          <Skeleton key={key} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
