import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/features/shell/components/page-header"

/**
 * Saved, loading.
 *
 * The header is real rather than a skeleton, because it is known before the
 * query runs and animating text that will not change is noise. Six card-shaped
 * blocks match the grid that replaces them, so the page does not jump.
 */
export default function SavedLoading() {
  return (
    <>
      <PageHeader
        title="Saved"
        description="Keep the events, communities, and opportunities you want to come back to."
      />

      <div className="flex flex-col gap-6">
        <div className="flex gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-9 w-28 rounded-lg" />
          ))}
        </div>

        <ul
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
          aria-label="Loading saved items"
        >
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <li key={index}>
              <Skeleton className="h-56 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
