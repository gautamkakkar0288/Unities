import { Skeleton } from "@/components/ui/skeleton"

export default function CommunityLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading community</span>

      <div className="flex flex-wrap gap-2 pb-3">
        {["kind", "interest", "scope"].map((key) => (
          <Skeleton key={key} className="h-5 w-24 rounded-md" />
        ))}
      </div>

      <div className="flex flex-col gap-2 pb-6">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <Skeleton className="mb-8 h-4 w-72 max-w-full" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
