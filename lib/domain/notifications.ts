import type { AppNotification, NotificationKind } from "@/lib/domain/types"
import type { Tone } from "@/lib/ui/tone"

/**
 * Notification categories, their labels, and their tone.
 *
 * Categories exist so preferences can be granular. A student who mutes
 * community chatter but keeps event reminders stays on the platform; one forced
 * to choose between everything and nothing turns the lot off and never comes
 * back. That is the whole argument for per-category preferences in Phase 12.
 */

export const notificationKindLabel: Record<NotificationKind, string> = {
  EVENT_REMINDER: "Event reminders",
  COMMUNITY_POST: "Community posts",
  MENTION: "Replies and mentions",
  MEMBERSHIP: "Membership updates",
  MODERATION: "Moderation outcomes",
}

export const notificationKindTone: Record<NotificationKind, Tone> = {
  EVENT_REMINDER: "brand",
  COMMUNITY_POST: "neutral",
  MENTION: "support",
  MEMBERSHIP: "info",
  MODERATION: "warning",
}

/**
 * Categories a student cannot mute.
 *
 * Moderation outcomes affect someone's standing on the platform, and membership
 * updates answer a question they explicitly asked. Silencing either would mean
 * a person never learns why their post disappeared.
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
