import { Skeleton } from "@/components/ui/skeleton"

/**
 * Shell-level loading state. Mirrors the eventual page shape - a heading block
 * followed by content cards - so switching to real content does not shift the
 * layout (docs/DESIGN/15).
 */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 pb-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading
      </span>
    </div>
  )
}
