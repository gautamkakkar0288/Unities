import { Skeleton } from "@/components/ui/skeleton"

/**
 * The picker waits on two queries. The skeleton mirrors the eventual layout -
 * heading, two lines of copy, a field of chips - so nothing jumps when the
 * taxonomy arrives.
 */
export default function OnboardingLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-readable" />
        <Skeleton className="h-4 w-3/4 max-w-readable" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-28 rounded-full" />
        ))}
      </div>
    </div>
  )
}
