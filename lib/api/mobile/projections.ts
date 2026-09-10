import { and, eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import { events, notifications } from "@/lib/db/schema"

/**
 * Narrow read-only lookups that exist because the shared services project for
 * the web UI, which needs slightly less than the mobile client does.
 *
 * Two fields are involved and both are genuinely needed:
 *
 * - An event's `status`. `listEvents` excludes drafts but deliberately keeps
 *   cancelled events in the list, because a student who registered deserves to
 *   see that it was called off. The list projection does not carry the field,
 *   and a mobile list that silently rendered a cancelled event as normal would
 *   be worse than a slightly wider query here. Widening `EventSummary` instead
 *   would change a domain type the whole web app shares, for a caller that is
 *   not the web app.
 *
 * - A notification's target and read timestamp. `NotificationProjection`
 *   resolves an `href` for the web, but the mobile client routes on
 *   `targetKind`/`targetId` and shows relative time from `readAt`.
 *
 * These read columns; they make no decisions. Every rule about what a student
 * may see still lives in `lib/services/*`, and the notification lookup is
 * scoped to the viewer's own rows so it cannot become a way to probe someone
 * else's alerts.
 */

export type EventRecordStatus = "DRAFT" | "PUBLISHED" | "CANCELLED"

export async function eventStatusesByIds(
  ids: string[],
): Promise<Map<string, EventRecordStatus>> {
  if (ids.length === 0) return new Map()

  const rows = await db
    .select({ id: events.id, status: events.status })
    .from(events)
    .where(inArray(events.id, ids))

  return new Map(rows.map((row) => [row.id, row.status as EventRecordStatus]))
}

export type NotificationRefs = {
  targetKind: string | null
  targetId: string | null
  readAt: string | null
}

export async function notificationRefsForViewer(
  viewerId: string,
  ids: string[],
): Promise<Map<string, NotificationRefs>> {
  if (ids.length === 0) return new Map()

  const rows = await db
    .select({
      id: notifications.id,
      targetKind: notifications.targetKind,
      targetId: notifications.targetId,
      readAt: notifications.readAt,
    })
    .from(notifications)
    .where(
      and(
        // Ownership, again, in the WHERE clause rather than in a later check.
        eq(notifications.userId, viewerId),
        inArray(notifications.id, ids),
      ),
    )

  return new Map(
    rows.map((row) => [
      row.id,
      {
        targetKind: row.targetKind ?? null,
        targetId: row.targetId ?? null,
        readAt: row.readAt ? row.readAt.toISOString() : null,
      },
    ]),
  )
}
