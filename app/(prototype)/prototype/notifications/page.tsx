import {
  Bell,
  CalendarClock,
  Handshake,
  MessageCircle,
  ShieldAlert,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import {
  notificationKindLabel,
  notificationKindTone,
  unreadCount,
} from "@/lib/domain/notifications"
import type { AppNotification, NotificationKind } from "@/lib/domain/types"
import { notifications, prototypeNow } from "@/lib/prototype/fixtures"
import { formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"

export const metadata = { title: "Notifications" }

/**
 * Typed as a total Record on purpose: adding a notification kind should break
 * the build here rather than render a blank square in production. ACTIVITY was
 * added with D31 and this map is how we found out.
 */
const kindIcon: Record<NotificationKind, LucideIcon> = {
  EVENT_REMINDER: CalendarClock,
  ACTIVITY: Handshake,
  COMMUNITY_POST: Bell,
  MENTION: MessageCircle,
  MEMBERSHIP: UserPlus,
  MODERATION: ShieldAlert,
}

/**
 * Every notification is a link.
 *
 * A notification that cannot be acted on is an interruption with no payoff, so
 * each row navigates to the thing it is about. Unread state is carried by a
 * visible dot and by text, never by colour alone.
 */
function NotificationRow({
  notification,
}: {
  notification: AppNotification
}) {
  const Icon = kindIcon[notification.kind]

  return (
    <Card
      interactive
      className={cn(
        "gap-0",
        !notification.read && "border-primary-border bg-primary-subtle/30",
      )}
    >
      <CardContent className="flex items-start gap-3">
        {notification.actor ? (
          <Avatar
            size="sm"
            name={notification.actor.name}
            src={notification.actor.avatarUrl}
          />
        ) : (
          <span
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <Icon className="size-4" />
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={notificationKindTone[notification.kind]}>
              {notificationKindLabel[notification.kind]}
            </Badge>
            {!notification.read && (
              <span className="text-caption font-medium text-primary">
                Unread
              </span>
            )}
          </div>
          <Link
            href={notification.href}
            className="rounded-sm text-body-sm font-medium hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {notification.title}
          </Link>
          <p className="text-caption text-muted-foreground">
            {notification.body}
          </p>
          <time
            dateTime={notification.createdAt}
            className="text-caption text-muted-foreground"
          >
            {formatRelativeTime(notification.createdAt, prototypeNow)}
          </time>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PrototypeNotificationsPage() {
  const unread = notifications.filter((item) => !item.read)
  const earlier = notifications.filter((item) => item.read)

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 12"
        title="Notifications"
        description="Grouped by whether you have seen them, categorised so preferences can be granular, and every row leads somewhere."
        notes={[
          "Mark as read does nothing yet",
          "Grouping identical notifications (five replies on one post) comes with Phase 12",
          "Push and email delivery are separate from this in-app list",
        ]}
      />

      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-body-sm text-muted-foreground">
            <span data-numeric>{unreadCount(notifications)}</span> unread
          </p>
          <Button type="button" variant="outline" size="lg">
            Mark all as read
          </Button>
        </div>

        <section aria-labelledby="unread-heading" className="flex flex-col gap-3">
          <h2 id="unread-heading" className="text-h3">
            New
          </h2>
          <ul className="flex flex-col gap-3">
            {unread.map((notification) => (
              <li key={notification.id}>
                <NotificationRow notification={notification} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="earlier-heading" className="flex flex-col gap-3">
          <h2 id="earlier-heading" className="text-h3">
            Earlier
          </h2>
          <ul className="flex flex-col gap-3">
            {earlier.map((notification) => (
              <li key={notification.id}>
                <NotificationRow notification={notification} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
