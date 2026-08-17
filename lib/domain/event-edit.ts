import type { Timestamp } from "@/lib/domain/types"

/**
 * What an organiser may change about an event that already exists.
 *
 * Creating an event asks whether the values are sane. Editing one asks a
 * harder question: whether moving from the stored values to the new ones takes
 * something away from a student who already committed. That is why these rules
 * live apart from `refuseEventTiming` - both run on an edit, and they are
 * answering different things.
 *
 * Pure, so the promotion arithmetic can be tested exhaustively without a
 * database standing in the way.
 */

export type EventEditRefusal =
  | "ALREADY_CANCELLED"
  | "ALREADY_STARTED"
  | "CAPACITY_BELOW_CONFIRMED"

/**
 * Whether this edit may proceed at all.
 *
 * The order matters and is deliberate: the strongest, least recoverable
 * objection is reported first, so an organiser editing a cancelled event that
 * also started yesterday is told the thing that actually explains the refusal.
 *
 * A cancelled event is not editable. Reviving one through the edit form would
 * mean students who were told it was off find it back on with no notification
 * having been sent - the honest path is a new event, which produces a new
 * registration list.
 *
 * An event that has started is not editable either. At that point the record
 * describes what happened rather than what is planned, and letting an organiser
 * move the venue of a workshop already underway rewrites the evidence for
 * anybody who could not find it.
 */
export function refuseEventEdit(args: {
  status: "DRAFT" | "PUBLISHED" | "CANCELLED"
  startsAt: Timestamp
  registeredCount: number
  nextCapacity: number | null
  now: Timestamp
}): EventEditRefusal | null {
  if (args.status === "CANCELLED") return "ALREADY_CANCELLED"

  if (Date.parse(args.startsAt) <= Date.parse(args.now)) {
    return "ALREADY_STARTED"
  }

  // Null is unlimited, which can never be below anything.
  if (args.nextCapacity !== null && args.nextCapacity < args.registeredCount) {
    return "CAPACITY_BELOW_CONFIRMED"
  }

  return null
}

export const editRefusalMessage: Record<EventEditRefusal, string> = {
  ALREADY_CANCELLED:
    "This event has been cancelled. Put on a new one rather than editing this.",
  ALREADY_STARTED: "This event has already started, so it cannot be changed.",
  CAPACITY_BELOW_CONFIRMED:
    "That is fewer seats than the number of students already going. Raise it, or cancel the event.",
}

/**
 * How many confirmed seats are free once the new capacity applies.
 *
 * Raising a limit is the case this exists for. Seats appear, and if nothing
 * acts on that the students in the queue keep waiting for places that are
 * already available - a waitlist that never moves even though the organiser
 * just made room.
 *
 * Returns null when the limit was removed altogether, meaning everybody
 * waiting can be let in. Null is not zero here, and a caller that treats it as
 * a number will promote nobody.
 */
export function seatsAvailableAfter(args: {
  nextCapacity: number | null
  registeredCount: number
}): number | null {
  if (args.nextCapacity === null) return null

  return Math.max(args.nextCapacity - args.registeredCount, 0)
}
