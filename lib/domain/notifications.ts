import type { AppNotification, NotificationKind } from "@/lib/domain/types"
import type { Tone } from "@/lib/ui/tone"

export const notificationKindLabel: Record<NotificationKind, string> = {
  EVENT_REMINDER: "Event",
  COMMUNITY_POST: "Community",
  MENTION: "Mention",
  MEMBERSHIP: "Membership",
  MODERATION: "Moderation",
  ACTIVITY: "Activity",
}

export const notificationKindTone: Record<NotificationKind, Tone> = {
  EVENT_REMINDER: "brand",
  COMMUNITY_POST: "neutral",
  MENTION: "support",
  MEMBERSHIP: "info",
  MODERATION: "warning",
  ACTIVITY: "success",
}

/**
 * Kinds a student cannot switch off.
 *
 * Everything else is a preference. These two are consequences - being removed
 * from a community or having a report resolved is something you are owed
 * regardless of your settings, and hiding it would leave people confused about
 * why the product suddenly behaves differently for them.
 */
export const requiredNotificationKinds: NotificationKind[] = [
  "MEMBERSHIP",
  "MODERATION",
]

export function isMutable(kind: NotificationKind): boolean {
  return !requiredNotificationKinds.includes(kind)
}

export function unreadCount(notifications: AppNotification[]): number {
  return notifications.filter((notification) => !notification.read).length
}
