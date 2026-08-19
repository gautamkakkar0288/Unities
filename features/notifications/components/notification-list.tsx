import { NotificationItem } from "@/features/notifications/components/notification-item"
import { groupNotifications } from "@/lib/domain/notification-feed"
import type { NotificationProjection } from "@/lib/services/notifications"

/**
 * A list of notifications under day headings.
 *
 * A server component: the rows are interactive but the grouping is not, so only
 * the row ships to the browser. The headings are real `h3`s inside a labelled
 * section, which is what lets someone skim the page by headings rather than
 * reading forty rows.
 */
export function NotificationList({
  notifications,
  now,
  grouped = true,
}: {
  notifications: NotificationProjection[]
  now: string
  /** The unread section is short and already labelled, so it skips headings. */
  grouped?: boolean
}) {
  if (notifications.length === 0) return null

  if (!grouped) {
    return (
      <ul className="flex flex-col gap-2">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <NotificationItem notification={notification} now={now} />
          </li>
        ))}
      </ul>
    )
  }

  const groups = groupNotifications(notifications, now)

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.group} className="flex flex-col gap-2">
          <h3 className="text-label text-muted-foreground">{group.label}</h3>
          <ul className="flex flex-col gap-2">
            {group.items.map((notification) => (
              <li key={notification.id}>
                <NotificationItem notification={notification} now={now} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
