import type { listNotifications } from "@/lib/services/notifications"

import type { NotificationRefs } from "../projections"

type NotificationItem = Awaited<ReturnType<typeof listNotifications>>[number]

/**
 * One alert, for the device of the person it belongs to.
 *
 * `userId` is taken from the session rather than from the row, because the only
 * notifications this endpoint can return are already the caller's own - the
 * service scopes the query - and echoing the session value makes that
 * impossible to get wrong.
 *
 * `read` and `readAt` are both sent: the service computes the boolean, and the
 * timestamp lets the client sort and show "seen 2h ago". Nothing about who
 * caused the notification, which moderator acted, or which audit row it came
 * from is included.
 */
export function serializeNotification(
  notification: NotificationItem,
  viewerId: string,
  refs: NotificationRefs | undefined,
) {
  return {
    id: notification.id,
    userId: viewerId,
    kind: notification.kind,
    title: notification.title,
    body: notification.body,
    createdAt: notification.createdAt,
    read: notification.read,
    readAt: refs?.readAt ?? null,
    targetKind: refs?.targetKind ?? null,
    targetId: refs?.targetId ?? null,
    /** The web path the service resolved. Useful for deep links. */
    href: notification.href,
  }
}
