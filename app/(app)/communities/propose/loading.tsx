import { Skeleton } from "@/components/ui/skeleton"

export default function ProposeCommunityLoading() {
  return (
    <div className="max-w-readable flex flex-col gap-6">
      <Skeleton className="h-9 w-64" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  )
}
