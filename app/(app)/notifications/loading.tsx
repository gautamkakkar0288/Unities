import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/features/shell/components/page-header"

/**
 * Notifications, loading.
 *
 * Row-shaped placeholders in the same rhythm as the real list, so nothing moves
 * when the data lands.
 */
export default function NotificationsLoading() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Stay up to date with your communities, events, and opportunities."
      />

      <ul
        className="flex flex-col gap-2"
        aria-busy="true"
        aria-label="Loading notifications"
      >
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <li key={index}>
            <Skeleton className="h-24 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    </>
  )
}
