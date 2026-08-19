import { and, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  communities,
  events,
  opportunities,
  savedItems,
  savedTargetKinds,
  type SavedTargetKind,
} from "@/lib/db/schema"
import type { CommunitySummary, EventSummary } from "@/lib/domain/types"
import { listCommunitiesForViewer } from "@/lib/services/communities"
import { listEvents } from "@/lib/services/events"
import {
  listOpportunities,
  type OpportunitySummary,
} from "@/lib/services/opportunities"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Saving, unsaving, and reading back what a student saved.
 *
 * Two properties are load-bearing.
 *
 * **Saving is idempotent, and the database is what makes it so.** The insert
 * runs `onConflictDoNothing` against `saved_items_once_per_target`, so a double
 * tap, two open tabs, and a retried request all converge on one row. A
 * read-then-insert check would still race; this cannot.
 *
 * **The kind is validated here, not only at the edge.** A server action is a
 * public endpoint, so "the button only ever sends EVENT" is not a guarantee.
 * Anything outside `savedTargetKinds` is refused before a row is written, and
 * the target is checked for existence so the Saved page cannot fill up with
 * bookmarks pointing at nothing.
 *
 * Reads resolve saves through the existing projections rather than new selects.
 * That means a saved event carries the same `viewerRegistration` it carries
 * everywhere else, so the Saved page can show a real register control instead of
 * a decorative one.
 */

export type SavedEventItem = {
  kind: "EVENT"
  savedAt: string
  href: string
  event: EventSummary
}

export type SavedCommunityItem = {
  kind: "COMMUNITY"
  savedAt: string
  href: string
  community: CommunitySummary
}

export type SavedOpportunityItem = {
  kind: "OPPORTUNITY"
  savedAt: string
  /** External: an opportunity lives on somebody else's site. Empty if unknown. */
  href: string
  opportunity: OpportunitySummary
}

export type SavedItem =
  | SavedEventItem
  | SavedCommunityItem
  | SavedOpportunityItem

export function isSavedTargetKind(value: unknown): value is SavedTargetKind {
  return (
    typeof value === "string" &&
    (savedTargetKinds as readonly string[]).includes(value)
  )
}

/**
 * Does the thing being saved exist?
 *
 * Checked because `targetId` has no foreign key - it cannot have one, since it
 * points at three different tables. This is the replacement guarantee, and it
 * is why a bad id is a `NOT_FOUND` rather than a silently stored row.
 */
async function targetExists(
  targetKind: SavedTargetKind,
  targetId: string,
): Promise<boolean> {
  if (targetKind === "EVENT") {
    const [row] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, targetId))
      .limit(1)
    return Boolean(row)
  }

  if (targetKind === "COMMUNITY") {
    const [row] = await db
      .select({ id: communities.id })
      .from(communities)
      .where(eq(communities.id, targetId))
      .limit(1)
    return Boolean(row)
  }

  const [row] = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(eq(opportunities.id, targetId))
    .limit(1)
  return Boolean(row)
}

function readTarget(
  targetKind: unknown,
  targetId: unknown,
): ServiceResult<{ targetKind: SavedTargetKind; targetId: string }> {
  if (!isSavedTargetKind(targetKind)) {
    return fail("INVALID", "That is not something Cirqles can save.")
  }

  if (typeof targetId !== "string" || targetId.trim().length === 0) {
    return fail("INVALID", "That item could not be identified.")
  }

  return ok({ targetKind, targetId })
}

/**
 * Save something.
 *
 * Returns the resulting state rather than "created", because the caller is a
 * toggle and what it needs to know is whether the thing is saved now - which is
 * the same answer whether this call did the work or a previous one did.
 */
export async function saveItem(args: {
  userId: string
  targetKind: unknown
  targetId: unknown
}): Promise<ServiceResult<{ saved: true }>> {
  const target = readTarget(args.targetKind, args.targetId)
  if (!target.ok) return target

  const exists = await targetExists(
    target.data.targetKind,
    target.data.targetId,
  )

  if (!exists) {
    return fail("NOT_FOUND", "That item no longer exists.")
  }

  await db
    .insert(savedItems)
    .values({
      userId: args.userId,
      targetKind: target.data.targetKind,
      targetId: target.data.targetId,
    })
    .onConflictDoNothing({
      target: [savedItems.userId, savedItems.targetKind, savedItems.targetId],
    })

  return ok({ saved: true })
}

/**
 * Unsave.
 *
 * Scoped to the caller's own rows by the `userId` predicate, so there is no
 * request shape that removes somebody else's bookmark. Removing something that
 * was not saved is a success: the student's intent is already satisfied.
 */
export async function unsaveItem(args: {
  userId: string
  targetKind: unknown
  targetId: unknown
}): Promise<ServiceResult<{ saved: false }>> {
  const target = readTarget(args.targetKind, args.targetId)
  if (!target.ok) return target

  await db
    .delete(savedItems)
    .where(
      and(
        eq(savedItems.userId, args.userId),
        eq(savedItems.targetKind, target.data.targetKind),
        eq(savedItems.targetId, target.data.targetId),
      ),
    )

  return ok({ saved: false })
}

/**
 * The ids a student has saved of one kind.
 *
 * This is what a list of cards needs: one query for the whole page, rather than
 * an "is this saved" query per card. Returns a `Set` because every caller is
 * asking membership questions.
 */
export async function savedTargetIds(args: {
  viewerId: string | null
  targetKind: SavedTargetKind
}): Promise<Set<string>> {
  if (!args.viewerId) return new Set()

  const rows = await db
    .select({ targetId: savedItems.targetId })
    .from(savedItems)
    .where(
      and(
        eq(savedItems.userId, args.viewerId),
        eq(savedItems.targetKind, args.targetKind),
      ),
    )

  return new Set(rows.map((row) => row.targetId))
}

export async function isSaved(args: {
  viewerId: string | null
  targetKind: SavedTargetKind
  targetId: string
}): Promise<boolean> {
  if (!args.viewerId) return false

  const [row] = await db
    .select({ id: savedItems.id })
    .from(savedItems)
    .where(
      and(
        eq(savedItems.userId, args.viewerId),
        eq(savedItems.targetKind, args.targetKind),
        eq(savedItems.targetId, args.targetId),
      ),
    )
    .limit(1)

  return Boolean(row)
}

/**
 * Everything a student saved, newest save first.
 *
 * The order is the order of saving, not of the underlying things. "What did I
 * bookmark recently" is the question this page answers; sorting events by start
 * date instead would bury a save made a minute ago beneath one made last month.
 *
 * Targets are resolved in one round per kind and then matched back, so the page
 * costs four queries rather than one per row. Anything that has since been
 * deleted, archived, or unpublished resolves to nothing and is dropped - the
 * documented cost of a polymorphic target, handled in one place.
 */
export async function listSavedItems(args: {
  viewerId: string
  kind?: SavedTargetKind
  now?: Date
}): Promise<SavedItem[]> {
  const now = args.now ?? new Date()

  const rows = await db
    .select({
      targetKind: savedItems.targetKind,
      targetId: savedItems.targetId,
      createdAt: savedItems.createdAt,
    })
    .from(savedItems)
    .where(
      and(
        eq(savedItems.userId, args.viewerId),
        args.kind ? eq(savedItems.targetKind, args.kind) : undefined,
      ),
    )
    .orderBy(desc(savedItems.createdAt))

  if (rows.length === 0) return []

  const idsOf = (kind: SavedTargetKind) =>
    rows.filter((row) => row.targetKind === kind).map((row) => row.targetId)

  const eventIds = idsOf("EVENT")
  const communityIds = idsOf("COMMUNITY")
  const opportunityIds = idsOf("OPPORTUNITY")

  const [eventList, communityList, opportunityList] = await Promise.all([
    eventIds.length > 0
      ? listEvents({ viewerId: args.viewerId, now })
      : Promise.resolve([]),
    communityIds.length > 0
      ? listCommunitiesForViewer({ viewerId: args.viewerId })
      : Promise.resolve([]),
    listOpportunities({ ids: opportunityIds }),
  ])

  const eventById = new Map(eventList.map((event) => [event.id, event]))
  const communityById = new Map(
    communityList.map((community) => [community.id, community]),
  )
  const opportunityById = new Map(
    opportunityList.map((opportunity) => [opportunity.id, opportunity]),
  )

  const items: SavedItem[] = []

  for (const row of rows) {
    const savedAt = row.createdAt.toISOString()

    if (row.targetKind === "EVENT") {
      const event = eventById.get(row.targetId)
      if (!event) continue
      items.push({
        kind: "EVENT",
        savedAt,
        href: `/events/${event.slug}`,
        event,
      })
      continue
    }

    if (row.targetKind === "COMMUNITY") {
      const community = communityById.get(row.targetId)
      if (!community) continue
      items.push({
        kind: "COMMUNITY",
        savedAt,
        href: `/communities/${community.slug}`,
        community,
      })
      continue
    }

    const opportunity = opportunityById.get(row.targetId)
    if (!opportunity) continue
    items.push({
      kind: "OPPORTUNITY",
      savedAt,
      href: opportunity.url,
      opportunity,
    })
  }

  return items
}

/**
 * How many people saved each of these.
 *
 * Exists for the feed's ranking signal in the next phase, and lives here rather
 * than in a feed service because it reads this table. Takes ids so the caller
 * decides the candidate set - a global "most saved" query would be a different
 * question with a different index.
 */
export async function saveCountsFor(args: {
  targetKind: SavedTargetKind
  targetIds: string[]
}): Promise<Map<string, number>> {
  if (args.targetIds.length === 0) return new Map()

  const rows = await db
    .select({ targetId: savedItems.targetId })
    .from(savedItems)
    .where(
      and(
        eq(savedItems.targetKind, args.targetKind),
        inArray(savedItems.targetId, args.targetIds),
      ),
    )

  const counts = new Map<string, number>()
  for (const row of rows) {
    counts.set(row.targetId, (counts.get(row.targetId) ?? 0) + 1)
  }

  return counts
}
