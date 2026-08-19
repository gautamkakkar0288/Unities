"use client"

import {
  Activity,
  AtSign,
  CalendarClock,
  Megaphone,
  ShieldAlert,
  UserCheck,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

import { markNotificationReadAction } from "@/features/notifications/actions"
import type { NotificationKindValue } from "@/lib/db/schema"
import { notificationKindLabel } from "@/lib/domain/notifications"
import { formatRelativeTime } from "@/lib/format"
import type { NotificationProjection } from "@/lib/services/notifications"
import { cn } from "@/lib/utils"

/**
 * One notification.
 *
 * Icons are chosen so the kind is legible before the text is read - a megaphone
 * for an announcement, a calendar for anything about an event. They are
 * decorative, so they are hidden from assistive technology; the kind is
 * announced as words instead.
 */
const kindIcon: Record<NotificationKindValue, LucideIcon> = {
  EVENT_REMINDER: CalendarClock,
  COMMUNITY_POST: Megaphone,
  MENTION: AtSign,
  MEMBERSHIP: UserCheck,
  MODERATION: ShieldAlert,
  ACTIVITY: Activity,
}

/**
 * A notification row.
 *
 * Reading and navigating are the same gesture. The mark-read action is fired
 * without awaiting it and the row is dimmed immediately: the student is leaving
 * for the event page, and blocking that navigation on a write they will never see
 * complete would make the product feel slow for no gain. If the write fails, the
 * next render restores the unread state from the database.
 *
 * When there is no destination - a verification decision, a system message - the
 * row is a `button` rather than a link with a fake href. Marking it read is
 * still a real action, so it is still interactive, but it does not pretend to go
 * anywhere.
 */
export function NotificationItem({
  notification,
  now,
}: {
  notification: NotificationProjection
  /** The server's clock, so relative times match between server and client. */
  now: string
}) {
  const [read, setRead] = useState(notification.read)
  const [, startTransition] = useTransition()

  const Icon = kindIcon[notification.kind]

  function markRead() {
    if (read) return

    setRead(true)
    startTransition(async () => {
      await markNotificationReadAction(notification.id)
    })
  }

  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          read
            ? "bg-muted text-muted-foreground"
            : "bg-primary-subtle text-primary",
        )}
      >
        <Icon className="size-4" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span
            className={cn(
              "text-body-sm min-w-0 break-words",
              read ? "font-normal" : "font-semibold",
            )}
          >
            {notification.title}
          </span>

          {/*
            The unread state is conveyed three ways: the dot, the weight and
            tint, and this text. Only the text survives for a screen reader, and
            only the dot survives for someone who cannot distinguish the tint.
          */}
          {!read && (
            <>
              <span className="sr-only">Unread</span>
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-primary"
              />
            </>
          )}
        </span>

        {notification.body && (
          <span className="text-body-sm break-words text-muted-foreground">
            {notification.body}
          </span>
        )}

        <span className="text-caption text-muted-foreground">
          {notificationKindLabel[notification.kind]}
          {" \u00b7 "}
          {/*
            A machine-readable time next to the human one, so "2 hours ago"
            stays meaningful to anything reading the markup.
          */}
          <time dateTime={notification.createdAt} data-numeric>
            {formatRelativeTime(notification.createdAt, now)}
          </time>
        </span>
      </span>
    </>
  )

  const shell = cn(
    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors duration-150",
    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
    read
      ? "border-border bg-card hover:bg-muted/60"
      : "border-primary-border bg-primary-subtle/40 hover:bg-primary-subtle/70",
  )

  if (notification.href) {
    return (
      <Link href={notification.href} onClick={markRead} className={shell}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={markRead} className={shell}>
      {content}
    </button>
  )
}
