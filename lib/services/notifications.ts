import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm"

import { db, type Database } from "@/lib/db"
import {
  communities,
  events,
  notifications,
  posts,
  type AuditTargetKind,
  type NotificationKindValue,
} from "@/lib/db/schema"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Notifications: writing them from trusted flows, and reading one person's own.
 *
 * **Nothing here takes a recipient from a caller that could be a browser.** The
 * create functions are called by services - registration, promotion,
 * cancellation, verification - and the read and write-state functions take the
 * viewer's own id and scope every statement by it in the WHERE clause. There is
 * deliberately no action that lets a client create a notification, because a
 * notification is a claim that something happened.
 *
 * **A notification records the past.** The title and body are written at
 * creation rather than rendered from current state at read time: "you came off
 * the waitlist" has to keep saying that after the capacity changes again.
 *
 * **Targets are resolved, not trusted.** `targetId` points at three different
 * tables and so cannot have a foreign key. Reads therefore look each target up
 * and drop notifications whose target has since vanished, rather than rendering
 * a link that 404s.
 */

/**
 * Anything that can run an insert - the pool, or a transaction.
 *
 * Structural rather than a union of Drizzle's transaction types, because the
 * only capability this module needs from a caller's transaction is `insert`.
 */
export type NotificationWriter = Pick<Database, "insert">

export type NewNotification = {
  userId: string
  kind: NotificationKindValue
  title: string
  body?: string
  targetKind?: AuditTargetKind | null
  targetId?: string | null
  /** Defaults to now. Passed explicitly so a transaction can share one clock. */
  createdAt?: Date
}

/**
 * Write notifications.
 *
 * Bulk by default because the interesting cases are plural: an event is
 * cancelled and forty people need telling. One statement rather than forty
 * round trips, inside the caller's transaction when there is one.
 *
 * `onConflictDoNothing` covers the unique index the schema defines. That index
 * includes `createdAt`, so it stops an exactly-repeated write - a retried
 * request - rather than two genuinely separate notifications about the same
 * thing. Suppressing the second of those is the caller's job, because only the
 * caller knows whether the change was meaningful.
 */
export async function createNotifications(args: {
  notifications: NewNotification[]
  writer?: NotificationWriter
}): Promise<void> {
  if (args.notifications.length === 0) return

  const writer = args.writer ?? db

  await writer
    .insert(notifications)
    .values(
      args.notifications.map((notification) => ({
        userId: notification.userId,
        kind: notification.kind,
        title: notification.title,
        body: notification.body ?? "",
        targetKind: notification.targetKind ?? null,
        targetId: notification.targetId ?? null,
        createdAt: notification.createdAt ?? new Date(),
      })),
    )
    .onConflictDoNothing()
}

/** The singular case, which is most of them. */
export async function createNotification(args: {
  notification: NewNotification
  writer?: NotificationWriter
}): Promise<void> {
  await createNotifications({
    notifications: [args.notification],
    writer: args.writer,
  })
}

export type NotificationProjection = {
  id: string
  kind: NotificationKindValue
  title: string
  body: string
  /** ISO-8601, per the domain's timestamp convention. */
  createdAt: string
  read: boolean
  /**
   * Where tapping it goes. Null when the notification is a fact rather than a
   * place - an approved verification is about you, not a page.
   */
  href: string | null
}

type NotificationRow = {
  id: string
  kind: NotificationKindValue
  title: string
  body: string
  createdAt: Date
  readAt: Date | null
  targetKind: AuditTargetKind | null
  targetId: string | null
}

/**
 * Turn `(targetKind, targetId)` pairs into real paths.
 *
 * One query per kind for the whole page rather than one per notification. A
 * target that resolves to nothing is left out of the map, and the caller drops
 * the link rather than the notification: the text still says something true.
 */
async function resolveHrefs(rows: NotificationRow[]): Promise<Map<string, string>> {
  const idsFor = (kind: AuditTargetKind) => [
    ...new Set(
      rows
        .filter((row) => row.targetKind === kind && row.targetId)
        .map((row) => row.targetId as string),
    ),
  ]

  const eventIds = idsFor("EVENT")
  const communityIds = idsFor("COMMUNITY")
  const postIds = idsFor("POST")

  const [eventRows, communityRows, postRows] = await Promise.all([
    eventIds.length > 0
      ? db
          .select({ id: events.id, slug: events.slug })
          .from(events)
          .where(inArray(events.id, eventIds))
      : Promise.resolve([]),
    communityIds.length > 0
      ? db
          .select({ id: communities.id, slug: communities.slug })
          .from(communities)
          .where(inArray(communities.id, communityIds))
      : Promise.resolve([]),
    postIds.length > 0
      ? db
          .select({ id: posts.id, communitySlug: communities.slug })
          .from(posts)
          .innerJoin(communities, eq(communities.id, posts.communityId))
          .where(and(inArray(posts.id, postIds), isNull(posts.removedAt)))
      : Promise.resolve([]),
  ])

  const hrefs = new Map<string, string>()

  for (const row of eventRows) hrefs.set(`EVENT:${row.id}`, `/events/${row.slug}`)
  for (const row of communityRows) {
    hrefs.set(`COMMUNITY:${row.id}`, `/communities/${row.slug}`)
  }
  // A post has no page of its own yet, so the honest destination is the
  // community that published it. Inventing /posts/<id> would be a dead link.
  for (const row of postRows) {
    hrefs.set(`POST:${row.id}`, `/communities/${row.communitySlug}`)
  }

  return hrefs
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

/**
 * One person's notifications, newest first.
 *
 * Paginated by `before` rather than an offset. An offset shifts every time a
 * notification arrives, which on an inbox that grows at the top means page two
 * silently repeats or skips rows; a timestamp cursor is stable.
 */
export async function listNotifications(args: {
  viewerId: string
  limit?: number
  /** ISO-8601. Returns notifications strictly older than this. */
  before?: string
  unreadOnly?: boolean
}): Promise<NotificationProjection[]> {
  const limit = Math.min(Math.max(args.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)

  const rows = (await db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      title: notifications.title,
      body: notifications.body,
      createdAt: notifications.createdAt,
      readAt: notifications.readAt,
      targetKind: notifications.targetKind,
      targetId: notifications.targetId,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, args.viewerId),
        args.unreadOnly ? isNull(notifications.readAt) : undefined,
        args.before
          ? lt(notifications.createdAt, new Date(args.before))
          : undefined,
      ),
    )
    // Newest first, with the id as a tiebreak so two notifications written in
    // the same transaction have a stable order across requests.
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit)) as NotificationRow[]

  if (rows.length === 0) return []

  const hrefs = await resolveHrefs(rows)

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    read: row.readAt !== null,
    href:
      row.targetKind && row.targetId
        ? hrefs.get(`${row.targetKind}:${row.targetId}`) ?? null
        : null,
  }))
}

/**
 * The badge.
 *
 * The most frequent query in the product - it renders on every page for every
 * signed-in student - which is why `notifications_user_unread_idx` exists.
 */
export async function countUnreadNotifications(
  viewerId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, viewerId), isNull(notifications.readAt)),
    )

  return row?.count ?? 0
}

/**
 * Mark one read.
 *
 * The owner check *is* the WHERE clause: a notification belonging to somebody
 * else matches nothing, so it returns NOT_FOUND rather than telling the caller
 * that a notification they may not see exists. Already-read is a success -
 * clicking the same notification twice is not an error.
 */
export async function markNotificationRead(args: {
  viewerId: string
  notificationId: string
  now?: Date
}): Promise<ServiceResult<{ read: true }>> {
  if (args.notificationId.trim().length === 0) {
    return fail("INVALID", "That notification could not be identified.")
  }

  const updated = await db
    .update(notifications)
    .set({ readAt: args.now ?? new Date() })
    .where(
      and(
        eq(notifications.id, args.notificationId),
        eq(notifications.userId, args.viewerId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id })

  if (updated.length > 0) return ok({ read: true })

  // Nothing was updated: either it was already read, or it is not theirs. The
  // two are distinguished here so the second is not reported as success.
  const [existing] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.id, args.notificationId),
        eq(notifications.userId, args.viewerId),
      ),
    )
    .limit(1)

  if (!existing) {
    return fail("NOT_FOUND", "That notification no longer exists.")
  }

  return ok({ read: true })
}

/** Mark everything unread as read, and say how many that was. */
export async function markAllNotificationsRead(args: {
  viewerId: string
  now?: Date
}): Promise<ServiceResult<{ marked: number }>> {
  const updated = await db
    .update(notifications)
    .set({ readAt: args.now ?? new Date() })
    .where(
      and(
        eq(notifications.userId, args.viewerId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id })

  return ok({ marked: updated.length })
}

/**
 * Has this person already been told this?
 *
 * For the callers that must not repeat themselves - an organiser correcting a
 * typo three times should not send three "the venue changed" notifications. The
 * unique index cannot answer this, because it includes `createdAt`.
 */
export async function hasNotification(args: {
  userId: string
  kind: NotificationKindValue
  targetKind: AuditTargetKind
  targetId: string
  /** Only look this far back, so a legitimate later update is not suppressed. */
  since?: Date
}): Promise<boolean> {
  const [row] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, args.userId),
        eq(notifications.kind, args.kind),
        eq(notifications.targetKind, args.targetKind),
        eq(notifications.targetId, args.targetId),
        args.since
          ? sql`${notifications.createdAt} >= ${args.since.toISOString()}`
          : undefined,
      ),
    )
    .limit(1)

  return Boolean(row)
}
