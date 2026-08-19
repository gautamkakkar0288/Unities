import { Bell } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { MarkAllReadButton } from "@/features/notifications/components/mark-all-read-button"
import { NotificationList } from "@/features/notifications/components/notification-list"
import { PageHeader } from "@/features/shell/components/page-header"
import { unreadSummary } from "@/lib/domain/notification-feed"
import { listNotifications } from "@/lib/services/notifications"

export const metadata: Metadata = { title: "Notifications" }

/**
 * The notification centre.
 *
 * Unread comes first, in its own section, because it is the reason anybody opens
 * this page. Everything below is the archive - the same rows, in day groups, so
 * a student can find the confirmation they half remember from last week.
 *
 * Unread rows appear twice, in the section at the top and again in their day
 * group. That is deliberate: the alternative is that marking something read
 * makes it jump down the page under the cursor.
 *
 * One query serves both sections, and the unread count is derived from it rather
 * than counted separately, so the heading cannot disagree with the rows beneath
 * it.
 */
export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const nowIso = new Date().toISOString()

  const notifications = await listNotifications({
    viewerId: session.user.id,
    limit: 50,
  })

  const unread = notifications.filter((notification) => !notification.read)
  const summary = unreadSummary(unread.length)

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Stay up to date with your communities, events, and opportunities."
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Registrations, waitlist changes, and announcements from your communities will show up here."
          action={
            <Link href="/explore" className={buttonVariants()}>
              Explore campus
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-body-sm text-muted-foreground" aria-live="polite">
              {summary ?? "Nothing new right now."}
            </p>
            <MarkAllReadButton unreadCount={unread.length} />
          </div>

          {unread.length > 0 && (
            <section aria-labelledby="unread" className="flex flex-col gap-3">
              <h2 id="unread" className="text-h4">
                Unread
              </h2>
              <NotificationList
                notifications={unread}
                now={nowIso}
                grouped={false}
              />
            </section>
          )}

          <section aria-labelledby="all" className="flex flex-col gap-3">
            <h2 id="all" className="text-h4">
              All notifications
            </h2>
            <NotificationList notifications={notifications} now={nowIso} />
          </section>
        </div>
      )}
    </>
  )
}
