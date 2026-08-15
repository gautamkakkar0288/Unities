import type { EventKind, EventMode, Timestamp } from "@/lib/domain/types"

/**
 * Event vocabulary, slugs, and the timing rules.
 *
 * Pure functions only. The registration deadline in particular is defined here
 * rather than in the service because two callers need it and they must not
 * disagree: the write path uses it to refuse a late registration, and the read
 * projection uses it to decide whether a viewer sees `CLOSED`. A student who is
 * shown an open button and then told registration closed is the exact failure
 * this arrangement prevents.
 */

export const eventKindLabel: Record<EventKind, string> = {
  WORKSHOP: "Workshop",
  TALK: "Talk",
  TOURNAMENT: "Tournament",
  PERFORMANCE: "Performance",
  TRIP: "Trip",
  MEETUP: "Meetup",
  DRIVE: "Drive",
}

/**
 * What an organiser may actually create today.
 *
 * `TRIP` is missing on purpose. A trip needs an emergency contact, a consent
 * flag, and an itemised refund policy, none of which have anywhere to live
 * yet - offering it would produce a trip listing with none of the obligations
 * that make a trip safe to run.
 */
export const creatableEventKinds: EventKind[] = [
  "WORKSHOP",
  "TALK",
  "TOURNAMENT",
  "PERFORMANCE",
  "MEETUP",
  "DRIVE",
]

export function isCreatableKind(kind: EventKind): boolean {
  return creatableEventKinds.includes(kind)
}

export const eventModeLabels: Record<EventMode, string> = {
  IN_PERSON: "In person",
  ONLINE: "Online",
  HYBRID: "Hybrid",
}

/**
 * A title to the URL a student sees.
 *
 * Kept short because event titles run long ("Introduction to Competitive
 * Programming - Session 2") and a slug is read aloud and typed by hand more
 * often than anyone expects.
 */
export function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 8)
    .join("-")

  // A title of pure punctuation would otherwise produce an empty path segment.
  return slug || "event"
}

export type EventTimingRefusal =
  | "ENDS_BEFORE_IT_STARTS"
  | "STARTS_IN_THE_PAST"
  | "CLOSES_AFTER_IT_STARTS"

/**
 * Whether these times describe an event that can exist.
 *
 * Returns the first problem rather than a list: a form that reports one clear
 * fault gets fixed, and a form that reports three gets abandoned.
 */
export function refuseEventTiming(args: {
  startsAt: Timestamp
  endsAt: Timestamp
  registrationClosesAt: Timestamp | null
  now: Timestamp
}): EventTimingRefusal | null {
  const starts = Date.parse(args.startsAt)
  const ends = Date.parse(args.endsAt)
  const now = Date.parse(args.now)

  if (ends <= starts) return "ENDS_BEFORE_IT_STARTS"
  if (starts < now) return "STARTS_IN_THE_PAST"

  if (args.registrationClosesAt) {
    if (Date.parse(args.registrationClosesAt) > starts) {
      return "CLOSES_AFTER_IT_STARTS"
    }
  }

  return null
}

export const timingRefusalMessage: Record<EventTimingRefusal, string> = {
  ENDS_BEFORE_IT_STARTS: "The end time has to be after the start time.",
  STARTS_IN_THE_PAST: "That start time has already passed.",
  CLOSES_AFTER_IT_STARTS:
    "Registration has to close by the time the event starts.",
}

/**
 * When registration actually closes.
 *
 * A null column means "when the event starts", which is what almost every
 * event wants and what `describeRegistration` already assumes. Deriving it
 * means an organiser who moves the start time cannot leave a stale deadline
 * behind.
 */
export function registrationDeadline(event: {
  startsAt: Timestamp
  registrationClosesAt: Timestamp | null
}): Timestamp {
  return event.registrationClosesAt ?? event.startsAt
}

export function isRegistrationOpen(
  event: { startsAt: Timestamp; registrationClosesAt: Timestamp | null },
  now: Timestamp,
): boolean {
  return Date.parse(now) < Date.parse(registrationDeadline(event))
}

/** True when a confirmed seat is available right now. */
export function hasSeatAvailable(event: {
  capacity: number | null
  registeredCount: number
}): boolean {
  return event.capacity === null || event.registeredCount < event.capacity
}
