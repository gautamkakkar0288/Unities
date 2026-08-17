import { and, asc, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  communities,
  eventRegistrations,
  events,
  memberships,
} from "@/lib/db/schema"
import { refuseEventTiming, timingRefusalMessage } from "@/lib/domain/event"
import {
  editRefusalMessage,
  refuseEventEdit,
  seatsAvailableAfter,
} from "@/lib/domain/event-edit"
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
 * Note what is missing: nothing records that an edit happened. The `events`
 * table has `created_at` and `cancelled_at` and no `updated_at`, so a student
 * who registered when the venue was Block 3 cannot tell it has moved. That is a
 * real gap, and it belongs in `audit_log` - which already exists and already
 * takes an `EVENT` target - rather than in a column added on a guess.
 */

export type EventEdit = {
  id: string
  slug: string
  /** Waitlisted students who took a seat because capacity went up. */
  promoted: string[]
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
