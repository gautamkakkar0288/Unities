/**
 * Grouping for the notification centre.
 *
 * Three buckets, not a full relative-time scale. "Today", "Yesterday" and
 * "Earlier" are the distinctions a student actually acts on; a fourth heading
 * for "this week" would split a short list into fragments and make the page look
 * emptier than it is.
 *
 * `now` is an argument rather than `Date.now()` because this runs during render
 * on both the server and the client, and a function that reads the clock itself
 * produces different output in each - which React reports as a hydration
 * mismatch. It also makes the boundaries testable.
 */

export type NotificationGroup = "TODAY" | "YESTERDAY" | "EARLIER"

export const notificationGroupLabel: Record<NotificationGroup, string> = {
  TODAY: "Today",
  YESTERDAY: "Yesterday",
  EARLIER: "Earlier",
}

/** Local-calendar day boundaries, not "24 hours ago". */
function dayIndex(date: Date): number {
  return Math.floor(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() /
      86_400_000,
  )
}

export function notificationGroup(
  createdAtIso: string,
  nowIso: string,
): NotificationGroup {
  const difference =
    dayIndex(new Date(nowIso)) - dayIndex(new Date(createdAtIso))

  // A notification timestamped slightly in the future - clock skew, or a
  // reminder written ahead of time - belongs with today rather than in a
  // fourth bucket nobody has a heading for.
  if (difference <= 0) return "TODAY"
  if (difference === 1) return "YESTERDAY"
  return "EARLIER"
}

const ORDER: NotificationGroup[] = ["TODAY", "YESTERDAY", "EARLIER"]

/**
 * Split an already-sorted list into groups, dropping the empty ones.
 *
 * The input order is preserved inside each group, so the service's newest-first
 * ordering survives - this function decides headings, not sorting.
 */
export function groupNotifications<T extends { createdAt: string }>(
  items: T[],
  nowIso: string,
): Array<{ group: NotificationGroup; label: string; items: T[] }> {
  const buckets = new Map<NotificationGroup, T[]>()

  for (const item of items) {
    const group = notificationGroup(item.createdAt, nowIso)
    const bucket = buckets.get(group)
    if (bucket) bucket.push(item)
    else buckets.set(group, [item])
  }

  return ORDER.filter((group) => (buckets.get(group)?.length ?? 0) > 0).map(
    (group) => ({
      group,
      label: notificationGroupLabel[group],
      items: buckets.get(group) as T[],
    }),
  )
}

/** "3 unread" / "1 unread" / null when there is nothing to say. */
export function unreadSummary(count: number): string | null {
  if (count <= 0) return null
  return `${count} unread`
}
