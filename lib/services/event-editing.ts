import { and, asc, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  auditLog,
  communities,
  eventRegistrations,
  events,
  memberships,
  type AuditTargetKind,
} from "@/lib/db/schema"
import { AUDIT_ACTIONS } from "@/lib/domain/audit"
import { refuseEventTiming, timingRefusalMessage } from "@/lib/domain/event"
import {
  editRefusalMessage,
  refuseEventEdit,
  seatsAvailableAfter,
} from "@/lib/domain/event-edit"
import type { EventSummary } from "@/lib/domain/types"
import { updateEventSchema } from "@/lib/schemas/event-edit"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Editing a published event.
 *
 * Separate from `lib/services/events.ts` because that file is already the
 * longest service in the project and this adds a second write path with its own
 * transaction; splitting the reads out of it is a refactor worth doing
 * deliberately rather than as a side effect of adding a feature.
 *
 * The shape follows the rest of the layer: authorisation is read from the
 * database at write time inside the transaction, never taken from the caller,
 * and the projection returned is the minimum the redirect needs.
 *
 * Every successful edit writes an `audit_log` row in the same transaction, the
 * convention Phase 2 established for privileged writes. It is the only record
 * that an event moved: the `events` table has `created_at` and `cancelled_at`
 * and no `updated_at`, so a student who registered when the venue was Block 3
 * still cannot tell from their own screen that it has changed. Notifying them
 * is Phase 4 work, and it depends on this trail existing.
 */

export type EventEdit = {
  id: string
  slug: string
  /** Waitlisted students who took a seat because capacity went up. */
  promoted: string[]
}

/**
 * An event as its organiser needs to see it in a form.
 *
 * Deliberately not `EventDetailProjection`. That one is built for students and
 * resolves `registrationClosesAt` to the start time when it is unset, which is
 * correct on a listing and wrong in a form - prefilling it would write the
 * default in as an explicit value, and an organiser who later moved the start
 * would be left with a close time nobody chose.
 *
 * `communityVerified` is reported rather than enforced here so the screen can
 * explain a lapse instead of pretending the event is missing. The save is still
 * refused by `updateEvent`, which is where it counts.
 */
export type EventEditable = {
  id: string
  slug: string
  title: string
  description: string
  kind: EventSummary["kind"]
  mode: EventSummary["mode"]
  venue: string
  startsAt: string
  endsAt: string
  registrationClosesAt: string | null
  capacity: number | null
  feeInPaise: number | null
  status: "DRAFT" | "PUBLISHED" | "CANCELLED"
  registeredCount: number
  waitlistCount: number
  communityVerified: boolean
}

/**
 * Load an event for editing, for the person who runs it.
 *
 * Owner-only, which is stricter than the attendee list on purpose: a moderator
 * may see who is coming, but rewriting what students signed up for belongs to
 * whoever is accountable for the community.
 */
export async function getEventForEdit(args: {
  actorId: string
  slug: string
}): Promise<ServiceResult<EventEditable>> {
  const [row] = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      description: events.description,
      kind: events.kind,
      mode: events.mode,
      venue: events.venue,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      registrationClosesAt: events.registrationClosesAt,
      capacity: events.capacity,
      feeInPaise: events.feeInPaise,
      status: events.status,
      registeredCount: events.registeredCount,
      verification: communities.verification,
      archivedAt: communities.archivedAt,
      viewerState: memberships.state,
    })
    .from(events)
    .innerJoin(communities, eq(communities.id, events.communityId))
    .leftJoin(
      memberships,
      and(
        eq(memberships.communityId, communities.id),
        eq(memberships.userId, args.actorId),
      ),
    )
    .where(eq(events.slug, args.slug))
    .limit(1)

  if (!row || row.archivedAt) {
    return fail("NOT_FOUND", "That event no longer exists.")
  }

  if (row.viewerState !== "OWNER") {
    return fail(
      "FORBIDDEN",
      "Only an owner of this community can change this event.",
    )
  }

  const [waitlist] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, row.id),
        eq(eventRegistrations.state, "WAITLISTED"),
      ),
    )

  return ok({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    kind: row.kind,
    mode: row.mode,
    venue: row.venue,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    // Null survives, because null means something here.
    registrationClosesAt: row.registrationClosesAt?.toISOString() ?? null,
    capacity: row.capacity,
    feeInPaise: row.feeInPaise,
    status: row.status,
    registeredCount: row.registeredCount,
    waitlistCount: waitlist?.count ?? 0,
    communityVerified: row.verification === "VERIFIED",
  })
}

/**
 * Change the details of an event, and let the queue in if seats appeared.
 *
 * Authorisation asks the same two questions as creating: whether this person
 * owns the community, and whether the community is verified. The second is
 * checked again rather than assumed from the fact that the event exists,
 * because verification can be withdrawn after publication - and a club that
 * has lost its verification should not be able to keep rewriting a listing
 * students are relying on.
 */
export async function updateEvent(args: {
  actorId: string
  input: unknown
  now?: Date
}): Promise<ServiceResult<EventEdit>> {
  const parsed = updateEventSchema.safeParse(args.input)
  if (!parsed.success) {
    return fail(
      "INVALID",
      parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    )
  }

  const input = parsed.data
  const now = args.now ?? new Date()

  return db.transaction(async (tx) => {
    // Locked before the count is read: this path writes registeredCount, and
    // registerForEvent decides on the last seat from the same column.
    const [event] = await tx
      .select({
        id: events.id,
        slug: events.slug,
        status: events.status,
        startsAt: events.startsAt,
        capacity: events.capacity,
        registeredCount: events.registeredCount,
      })
      .from(events)
      .where(eq(events.id, input.eventId))
      .for("update")
      .limit(1)

    if (!event) return fail("NOT_FOUND", "That event no longer exists.")

    const [community] = await tx
      .select({
        name: communities.name,
        verification: communities.verification,
        archivedAt: communities.archivedAt,
        viewerState: memberships.state,
      })
      .from(events)
      .innerJoin(communities, eq(communities.id, events.communityId))
      .leftJoin(
        memberships,
        and(
          eq(memberships.communityId, communities.id),
          eq(memberships.userId, args.actorId),
        ),
      )
      .where(eq(events.id, input.eventId))
      .limit(1)

    if (!community || community.archivedAt) {
      return fail("NOT_FOUND", "That community no longer exists.")
    }

    if (community.viewerState !== "OWNER") {
      return fail(
        "FORBIDDEN",
        "Only an owner of this community can change this event.",
      )
    }

    if (community.verification !== "VERIFIED") {
      return fail(
        "FORBIDDEN",
        "This community has to be verified before its events can be changed.",
      )
    }

    const refusal = refuseEventEdit({
      status: event.status,
      startsAt: event.startsAt.toISOString(),
      registeredCount: event.registeredCount,
      nextCapacity: input.capacity,
      now: now.toISOString(),
    })
    if (refusal) return fail("INVALID", editRefusalMessage[refusal])

    const timing = refuseEventTiming({
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      registrationClosesAt: input.registrationClosesAt,
      now: now.toISOString(),
    })
    if (timing) return fail("INVALID", timingRefusalMessage[timing])

    // Slug and kind are absent on purpose, not forgotten. See the schema.
    await tx
      .update(events)
      .set({
        title: input.title,
        description: input.description,
        mode: input.mode,
        venue: input.venue,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        registrationClosesAt: input.registrationClosesAt
          ? new Date(input.registrationClosesAt)
          : null,
        capacity: input.capacity,
        feeInPaise: input.feeInPaise,
      })
      .where(eq(events.id, event.id))

    const promoted = await promoteFromWaitlist({
      tx,
      eventId: event.id,
      seats: seatsAvailableAfter({
        nextCapacity: input.capacity,
        registeredCount: event.registeredCount,
      }),
      now,
    })

    if (promoted.length > 0) {
      await tx
        .update(events)
        .set({
          registeredCount: sql`${events.registeredCount} + ${promoted.length}`,
        })
        .where(eq(events.id, event.id))
    }

    /**
     * The record that this event is no longer what students registered for.
     *
     * In the same transaction as the change, per the convention Phase 2 set: an
     * audit row that can fail on its own is worse than none, because the gaps
     * are silent and nobody knows which edits are missing.
     *
     * The promotion is named in the summary when there was one. "Seats were
     * added and four students came off the waitlist" is the part of an edit
     * somebody may later have to account for, and it is invisible from the
     * event row afterwards.
     */
    await tx.insert(auditLog).values({
      actorId: args.actorId,
      action: AUDIT_ACTIONS.eventEdited,
      targetKind: "EVENT" satisfies AuditTargetKind,
      targetId: event.id,
      summary:
        promoted.length > 0
          ? `Edited ${input.title} (${community.name}) and admitted ${promoted.length} ${promoted.length === 1 ? "student" : "students"} from the waitlist`
          : `Edited ${input.title} (${community.name})`,
    })

    return ok({ id: event.id, slug: event.slug, promoted })
  })
}

/**
 * Hand a given number of freed seats to the front of the queue.
 *
 * `seats` of null means the capacity limit was removed, so everybody waiting
 * comes in - which is why this takes `number | null` rather than defaulting a
 * missing limit to zero and promoting nobody at the exact moment the organiser
 * made room for everybody.
 *
 * Oldest first, by `createdAt`, which is the same ordering
 * `cancelRegistration` promotes on. Two different orderings would mean a
 * student's position in the queue depended on how the seat happened to be
 * freed.
 *
 * `createdAt` is never rewritten here. It is the queue key, so a promoted
 * student keeps the timestamp that earned them the seat; touching it would
 * reorder everybody still waiting behind them.
 */
async function promoteFromWaitlist(args: {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
  eventId: string
  seats: number | null
  now: Date
}): Promise<string[]> {
  if (args.seats === 0) return []

  const query = args.tx
    .select({
      id: eventRegistrations.id,
      userId: eventRegistrations.userId,
    })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, args.eventId),
        eq(eventRegistrations.state, "WAITLISTED"),
      ),
    )
    .orderBy(asc(eventRegistrations.createdAt))

  const waiting =
    args.seats === null ? await query : await query.limit(args.seats)

  if (waiting.length === 0) return []

  await args.tx
    .update(eventRegistrations)
    .set({ state: "REGISTERED", promotedAt: args.now })
    .where(
      inArray(
        eventRegistrations.id,
        waiting.map((row) => row.id),
      ),
    )

  return waiting.map((row) => row.userId)
}
