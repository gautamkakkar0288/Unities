import { and, asc, desc, eq, inArray, isNull, lte, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  communities,
  eventRegistrations,
  events,
  interests,
  memberships,
  users,
} from "@/lib/db/schema"
import {
  hasSeatAvailable,
  isCreatableKind,
  isRegistrationOpen,
  refuseEventTiming,
  slugifyTitle,
  timingRefusalMessage,
} from "@/lib/domain/event"
import type { EventSummary, RegistrationState } from "@/lib/domain/types"
import { createEventSchema } from "@/lib/schemas/event"
import {
  createNotification,
  createNotifications,
} from "@/lib/services/notifications"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Events, and the registration loop.
 *
 * Three rules in here are worth reading before changing anything.
 *
 * **Capacity is decided under a lock.** Every path that could hand out a seat
 * selects the event row `for update` first. Without it, two students clicking
 * register on the last seat both read `registeredCount = 39`, both decide a
 * seat is free, and the event ends up one over capacity - a bug that only
 * appears under exactly the load you least want it to.
 *
 * **Promotion happens where the seat is freed.** When a confirmed registration
 * is cancelled, the oldest waitlist entry is promoted inside the same
 * transaction. Splitting that into a follow-up job means a window where the
 * seat exists and nobody holds it, and a failure mode where the seat is freed
 * and the promotion silently never runs.
 *
 * **Notifications are written in the same transaction as the state they
 * describe.** A student who is told they are registered when the registration
 * rolled back, or who takes a seat and is never told, has no way to find out
 * which of the two happened. They commit together.
 */

export type EventListing = EventSummary

const eventSelection = {
  id: events.id,
  slug: events.slug,
  title: events.title,
  kind: events.kind,
  mode: events.mode,
  venue: events.venue,
  status: events.status,
  startsAt: events.startsAt,
  endsAt: events.endsAt,
  registrationClosesAt: events.registrationClosesAt,
  capacity: events.capacity,
  registeredCount: events.registeredCount,
  feeInPaise: events.feeInPaise,
  communityId: communities.id,
  communitySlug: communities.slug,
  communityName: communities.name,
  communityVerification: communities.verification,
  interestId: interests.id,
  interestSlug: interests.slug,
  interestLabel: interests.label,
  viewerState: eventRegistrations.state,
}

type EventRow = {
  [K in keyof typeof eventSelection]: unknown
} & {
  id: string
  slug: string
  title: string
  kind: EventSummary["kind"]
  mode: EventSummary["mode"]
  venue: string
  startsAt: Date
  endsAt: Date
  registrationClosesAt: Date | null
  capacity: number | null
  registeredCount: number
  feeInPaise: number | null
  communityId: string
  communitySlug: string
  communityName: string
  communityVerification: EventSummary["community"]["verification"]
  interestId: string
  interestSlug: string
  interestLabel: string
  viewerState: "REGISTERED" | "WAITLISTED" | "CANCELLED" | null
}

/**
 * A join condition that matches nobody when there is no viewer, mirroring the
 * approach in the communities service rather than branching the whole query.
 */
function viewerRegistrationJoin(viewerId: string | null) {
  return and(
    eq(eventRegistrations.eventId, events.id),
    eq(eventRegistrations.userId, viewerId ?? ""),
  )
}

/**
 * The viewer's registration state, including the two values that are never
 * stored.
 *
 * A cancelled row reads as `NONE`: the student is not in this event, and
 * showing them anything else would be describing their history rather than
 * their options. `CLOSED` is returned only when they hold no place, because a
 * registered student still needs to see that they are registered after the
 * deadline passes.
 */
function viewerRegistrationFor(row: EventRow, now: Date): RegistrationState {
  if (row.viewerState === "REGISTERED") return "REGISTERED"
  if (row.viewerState === "WAITLISTED") return "WAITLISTED"

  const open = isRegistrationOpen(
    {
      startsAt: row.startsAt.toISOString(),
      registrationClosesAt: row.registrationClosesAt?.toISOString() ?? null,
    },
    now.toISOString(),
  )

  return open ? "NONE" : "CLOSED"
}

function toSummary(row: EventRow, now: Date): EventSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    mode: row.mode,
    venue: row.venue,
    community: {
      id: row.communityId,
      slug: row.communitySlug,
      name: row.communityName,
      verification: row.communityVerification,
    },
    interest: {
      id: row.interestId,
      slug: row.interestSlug,
      label: row.interestLabel,
    },
    capacity: row.capacity,
    registeredCount: row.registeredCount,
    feeInPaise: row.feeInPaise,
    viewerRegistration: viewerRegistrationFor(row, now),
  }
}

/**
 * Published events, soonest first.
 *
 * Cancelled events are included when they have not happened yet, because a
 * student who registered needs to find the thing they signed up for and see
 * that it is off. Drafts never appear.
 */
export async function listEvents(args: {
  viewerId: string | null
  communityId?: string
  limit?: number
  now?: Date
}): Promise<EventSummary[]> {
  const now = args.now ?? new Date()

  const query = db
    .select(eventSelection)
    .from(events)
    .innerJoin(communities, eq(communities.id, events.communityId))
    .innerJoin(interests, eq(interests.id, events.interestId))
    .leftJoin(eventRegistrations, viewerRegistrationJoin(args.viewerId))
    .where(
      and(
        sql`${events.status} <> 'DRAFT'`,
        isNull(communities.archivedAt),
        args.communityId ? eq(events.communityId, args.communityId) : undefined,
      ),
    )
    .orderBy(asc(events.startsAt))

  const rows = args.limit ? await query.limit(args.limit) : await query

  return (rows as EventRow[]).map((row) => toSummary(row, now))
}

export type EventDetailProjection = EventSummary & {
  description: string
  agenda: Array<{ at: string; title: string }>
  status: "DRAFT" | "PUBLISHED" | "CANCELLED"
  registrationClosesAt: string
  waitlistCount: number
}

export async function getEventBySlug(args: {
  slug: string
  viewerId: string | null
  now?: Date
}): Promise<EventDetailProjection | null> {
  const now = args.now ?? new Date()

  const [row] = await db
    .select({
      ...eventSelection,
      description: events.description,
      agenda: events.agenda,
    })
    .from(events)
    .innerJoin(communities, eq(communities.id, events.communityId))
    .innerJoin(interests, eq(interests.id, events.interestId))
    .leftJoin(eventRegistrations, viewerRegistrationJoin(args.viewerId))
    .where(eq(events.slug, args.slug))
    .limit(1)

  if (!row) return null

  const typed = row as unknown as EventRow & {
    description: string
    agenda: Array<{ at: string; title: string }>
    status: "DRAFT" | "PUBLISHED" | "CANCELLED"
  }

  const [waitlist] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, typed.id),
        eq(eventRegistrations.state, "WAITLISTED"),
      ),
    )

  return {
    ...toSummary(typed, now),
    description: typed.description,
    agenda: typed.agenda ?? [],
    status: typed.status,
    registrationClosesAt: (
      typed.registrationClosesAt ?? typed.startsAt
    ).toISOString(),
    waitlistCount: waitlist?.count ?? 0,
  }
}

/**
 * Create and publish an event.
 *
 * Two authorisation facts are checked, and they are different questions. Being
 * an owner says this person runs the club; the club being verified says the
 * club is real. A verified club run by somebody else, or an unverified club run
 * by you, are both refused - and the messages say which, because "forbidden"
 * with no reason is how an organiser ends up emailing support.
 */
export async function createEvent(args: {
  organiserId: string
  input: unknown
  now?: Date
}): Promise<ServiceResult<{ id: string; slug: string }>> {
  const parsed = createEventSchema.safeParse(args.input)
  if (!parsed.success) {
    return fail(
      "INVALID",
      parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    )
  }

  const input = parsed.data
  const now = args.now ?? new Date()

  if (!isCreatableKind(input.kind)) {
    return fail(
      "INVALID",
      "Trips need an emergency contact and a refund policy, which Cirqles cannot collect yet.",
    )
  }

  const timing = refuseEventTiming({
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    registrationClosesAt: input.registrationClosesAt,
    now: now.toISOString(),
  })
  if (timing) return fail("INVALID", timingRefusalMessage[timing])

  const [community] = await db
    .select({
      id: communities.id,
      interestId: communities.interestId,
      verification: communities.verification,
      archivedAt: communities.archivedAt,
      viewerState: memberships.state,
    })
    .from(communities)
    .leftJoin(
      memberships,
      and(
        eq(memberships.communityId, communities.id),
        eq(memberships.userId, args.organiserId),
      ),
    )
    .where(eq(communities.slug, input.communitySlug))
    .limit(1)

  if (!community || community.archivedAt) {
    return fail("NOT_FOUND", "That community no longer exists.")
  }

  if (community.viewerState !== "OWNER") {
    return fail(
      "FORBIDDEN",
      "Only an owner of this community can put on an event.",
    )
  }

  if (community.verification !== "VERIFIED") {
    return fail(
      "FORBIDDEN",
      "This community has to be verified before it can publish events. Ask for verification from the community page.",
    )
  }

  const base = slugifyTitle(input.title)

  // Two events called "Orientation" is normal, so a collision is an expected
  // outcome rather than an error. Insert, and on conflict try again with a
  // short suffix instead of reading first, which would still race.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug =
      attempt === 0 ? base : `${base}-${crypto.randomUUID().slice(0, 4)}`

    const [created] = await db
      .insert(events)
      .values({
        slug,
        title: input.title,
        description: input.description,
        kind: input.kind,
        mode: input.mode,
        venue: input.venue,
        status: "PUBLISHED",
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        registrationClosesAt: input.registrationClosesAt
          ? new Date(input.registrationClosesAt)
          : null,
        capacity: input.capacity,
        feeInPaise: input.feeInPaise,
        communityId: community.id,
        interestId: community.interestId,
        createdById: args.organiserId,
      })
      .onConflictDoNothing({ target: events.slug })
      .returning({ id: events.id, slug: events.slug })

    if (created) return ok(created)
  }

  return fail("CONFLICT", "Could not find a free web address for that title.")
}

/**
 * Call off an event without deleting it.
 *
 * Registrations are kept deliberately. The people who signed up are exactly the
 * people who need to be told, so the same transaction that cancels the event
 * reads that list and writes them each a notification. Waitlisted students are
 * included: somebody waiting for a seat at an event that is not happening needs
 * telling as much as somebody holding one.
 */
export async function cancelEvent(args: {
  actorId: string
  eventId: string
  now?: Date
}): Promise<ServiceResult<{ id: string; notified: number }>> {
  const now = args.now ?? new Date()

  return db.transaction(async (tx) => {
    const [event] = await tx
      .select({
        id: events.id,
        title: events.title,
        status: events.status,
        communityId: events.communityId,
        viewerState: memberships.state,
      })
      .from(events)
      .leftJoin(
        memberships,
        and(
          eq(memberships.communityId, events.communityId),
          eq(memberships.userId, args.actorId),
        ),
      )
      .where(eq(events.id, args.eventId))
      .limit(1)

    if (!event) return fail("NOT_FOUND", "That event no longer exists.")

    if (event.viewerState !== "OWNER") {
      return fail("FORBIDDEN", "Only an owner of this community can cancel it.")
    }

    if (event.status === "CANCELLED") {
      return fail("CONFLICT", "That event is already cancelled.")
    }

    await tx
      .update(events)
      .set({ status: "CANCELLED", cancelledAt: now })
      .where(eq(events.id, args.eventId))

    const affected = await tx
      .select({ userId: eventRegistrations.userId })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, args.eventId),
          inArray(eventRegistrations.state, ["REGISTERED", "WAITLISTED"]),
        ),
      )

    await createNotifications({
      writer: tx,
      notifications: affected.map(({ userId }) => ({
        userId,
        kind: "EVENT_REMINDER" as const,
        title: `${event.title} has been cancelled`,
        body: "The organisers have called this event off. You do not need to do anything.",
        targetKind: "EVENT" as const,
        targetId: args.eventId,
        createdAt: now,
      })),
    })

    return ok({ id: args.eventId, notified: affected.length })
  })
}

/**
 * Take a seat, or a place in the queue.
 *
 * The return value says which one happened, because "you are on the waitlist"
 * and "you are going" are different enough that a shared success message would
 * be a lie to one of them.
 *
 * Idempotent in both states: a student who taps twice keeps the place they
 * already had rather than losing it - and, importantly, is not sent a second
 * confirmation, because the early return happens before the notification.
 */
export async function registerForEvent(args: {
  userId: string
  eventId: string
  now?: Date
}): Promise<ServiceResult<"REGISTERED" | "WAITLISTED">> {
  const now = args.now ?? new Date()

  return db.transaction(async (tx) => {
    const [event] = await tx
      .select({
        id: events.id,
        title: events.title,
        status: events.status,
        startsAt: events.startsAt,
        registrationClosesAt: events.registrationClosesAt,
        capacity: events.capacity,
        registeredCount: events.registeredCount,
      })
      .from(events)
      .where(eq(events.id, args.eventId))
      .for("update")
      .limit(1)

    if (!event || event.status === "DRAFT") {
      return fail("NOT_FOUND", "That event no longer exists.")
    }

    if (event.status === "CANCELLED") {
      return fail("CONFLICT", "That event has been cancelled.")
    }

    const open = isRegistrationOpen(
      {
        startsAt: event.startsAt.toISOString(),
        registrationClosesAt:
          event.registrationClosesAt?.toISOString() ?? null,
      },
      now.toISOString(),
    )

    if (!open) return fail("CONFLICT", "Registration for this event has closed.")

    const [existing] = await tx
      .select({ id: eventRegistrations.id, state: eventRegistrations.state })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, args.eventId),
          eq(eventRegistrations.userId, args.userId),
        ),
      )
      .limit(1)

    if (existing?.state === "REGISTERED") return ok("REGISTERED")
    if (existing?.state === "WAITLISTED") return ok("WAITLISTED")

    const state = hasSeatAvailable(event) ? "REGISTERED" : "WAITLISTED"

    if (existing) {
      // A cancelled row is reused rather than replaced, so the unique
      // constraint holds and the student starts a fresh place in the queue.
      await tx
        .update(eventRegistrations)
        .set({ state, createdAt: now, cancelledAt: null, promotedAt: null })
        .where(eq(eventRegistrations.id, existing.id))
    } else {
      await tx.insert(eventRegistrations).values({
        eventId: args.eventId,
        userId: args.userId,
        state,
        createdAt: now,
      })
    }

    if (state === "REGISTERED") {
      await tx
        .update(events)
        .set({ registeredCount: sql`${events.registeredCount} + 1` })
        .where(eq(events.id, args.eventId))

      await createNotification({
        writer: tx,
        notification: {
          userId: args.userId,
          kind: "EVENT_REMINDER",
          title: `You're registered for ${event.title}`,
          body: "Your seat is confirmed. You can cancel from the event page if your plans change.",
          targetKind: "EVENT",
          targetId: args.eventId,
          createdAt: now,
        },
      })

      return ok(state)
    }

    /**
     * The student's place in the queue, counted under the same lock that just
     * decided they were queued - so the number the notification quotes is the
     * number that was true when it was written. Counting outside the
     * transaction would let a concurrent registration change the answer between
     * the decision and the message.
     */
    const [queue] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, args.eventId),
          eq(eventRegistrations.state, "WAITLISTED"),
          lte(eventRegistrations.createdAt, now),
        ),
      )

    const position = queue?.count ?? 1

    await createNotification({
      writer: tx,
      notification: {
        userId: args.userId,
        kind: "EVENT_REMINDER",
        title: `You're #${position} on the waitlist for ${event.title}`,
        body: "This event is full. If a seat frees up, the next person in the queue is moved in automatically.",
        targetKind: "EVENT",
        targetId: args.eventId,
        createdAt: now,
      },
    })

    return ok(state)
  })
}

/**
 * Give up a seat or leave the queue.
 *
 * When a confirmed seat is released, the oldest waitlist entry takes it
 * immediately. `registeredCount` therefore stays put in that case - one student
 * left and one arrived - and only falls when there was nobody waiting.
 *
 * The promoted student is told in the same transaction that promotes them. This
 * is the one notification a student cannot do without: nothing on the event page
 * changed from their point of view until they are told to look at it again.
 */
export async function cancelRegistration(args: {
  userId: string
  eventId: string
  now?: Date
}): Promise<ServiceResult<{ promoted: string | null }>> {
  const now = args.now ?? new Date()

  return db.transaction(async (tx) => {
    const [event] = await tx
      .select({
        id: events.id,
        title: events.title,
        status: events.status,
      })
      .from(events)
      .where(eq(events.id, args.eventId))
      .for("update")
      .limit(1)

    if (!event) return fail("NOT_FOUND", "That event no longer exists.")

    const [existing] = await tx
      .select({ id: eventRegistrations.id, state: eventRegistrations.state })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, args.eventId),
          eq(eventRegistrations.userId, args.userId),
        ),
      )
      .limit(1)

    // Nothing to give up is a success, not an error - the student's intent is
    // already satisfied.
    if (!existing || existing.state === "CANCELLED") {
      return ok({ promoted: null })
    }

    const heldASeat = existing.state === "REGISTERED"

    await tx
      .update(eventRegistrations)
      .set({ state: "CANCELLED", cancelledAt: now })
      .where(eq(eventRegistrations.id, existing.id))

    if (!heldASeat) return ok({ promoted: null })

    const [next] = await tx
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
      .limit(1)

    if (!next) {
      await tx
        .update(events)
        .set({
          registeredCount: sql`greatest(${events.registeredCount} - 1, 0)`,
        })
        .where(eq(events.id, args.eventId))

      return ok({ promoted: null })
    }

    await tx
      .update(eventRegistrations)
      .set({ state: "REGISTERED", promotedAt: now })
      .where(eq(eventRegistrations.id, next.id))

    await createNotification({
      writer: tx,
      notification: {
        userId: next.userId,
        kind: "EVENT_REMINDER",
        title: `You're off the waitlist for ${event.title}`,
        body: "A seat opened up and it is yours. Your place is now confirmed.",
        targetKind: "EVENT",
        targetId: args.eventId,
        createdAt: now,
      },
    })

    // The seat changed hands, so the count is unchanged on purpose.
    return ok({ promoted: next.userId })
  })
}

export type RegistrationEntry = {
  id: string
  state: "REGISTERED" | "WAITLISTED" | "CANCELLED"
  registeredAt: string
  person: { id: string; name: string } | null
}

/**
 * The attendee list, for the people running the event.
 *
 * Owner-only, and the projection is the protection: it returns names, never
 * email addresses, so an organiser cannot turn a registration list into a
 * mailing list by reading it off the screen.
 */
export async function listRegistrations(args: {
  organiserId: string
  eventId: string
}): Promise<ServiceResult<RegistrationEntry[]>> {
  const [event] = await db
    .select({
      id: events.id,
      viewerState: memberships.state,
    })
    .from(events)
    .leftJoin(
      memberships,
      and(
        eq(memberships.communityId, events.communityId),
        eq(memberships.userId, args.organiserId),
      ),
    )
    .where(eq(events.id, args.eventId))
    .limit(1)

  if (!event) return fail("NOT_FOUND", "That event no longer exists.")

  if (event.viewerState !== "OWNER" && event.viewerState !== "MODERATOR") {
    return fail("FORBIDDEN", "Only the people running this event can see who is coming.")
  }

  const rows = await db
    .select({
      id: eventRegistrations.id,
      state: eventRegistrations.state,
      createdAt: eventRegistrations.createdAt,
      personId: users.id,
      personName: users.name,
    })
    .from(eventRegistrations)
    .leftJoin(users, eq(users.id, eventRegistrations.userId))
    .where(eq(eventRegistrations.eventId, args.eventId))
    .orderBy(desc(eventRegistrations.state), asc(eventRegistrations.createdAt))

  return ok(
    rows.map((row) => ({
      id: row.id,
      state: row.state,
      registeredAt: row.createdAt.toISOString(),
      person: row.personId
        ? { id: row.personId, name: row.personName ?? "A student" }
        : null,
    })),
  )
}
