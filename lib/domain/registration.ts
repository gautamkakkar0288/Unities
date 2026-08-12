import { formatCapacity, formatFee } from "@/lib/format"
import type { EventSummary } from "@/lib/domain/types"
import type { Tone } from "@/lib/ui/tone"

/**
 * Registration state, seat maths, and what the button says.
 *
 * The single most important rule here: an event that is full is not the same as
 * an event that is closed. A full event can still take waitlist entries, which
 * is exactly how a student ends up attending when someone drops out. Collapsing
 * the two into one "unavailable" state quietly costs real attendance.
 *
 * Registration closes when the event starts. That is a deliberate default
 * rather than a separate field on the summary shape, so a listing card never
 * needs to fetch detail data to know whether the button should work.
 */

export type RegistrationDescriptor = {
  /** `null` when the event has unlimited capacity. */
  seatsLeft: number | null
  isFull: boolean
  isClosed: boolean
  /** "12 of 40 seats", "Full", "264 going". */
  capacityLabel: string
  /** Free or the rupee amount. */
  feeLabel: string
  ctaLabel: string
  ctaDisabled: boolean
  accessibleCtaLabel: string
  /** Status pill, or `null` when there is nothing worth flagging. */
  status: { label: string; tone: Tone } | null
  /** True when seats are scarce enough to be worth saying out loud. */
  isNearlyFull: boolean
}

const SCARCITY_THRESHOLD = 5

export function describeRegistration(
  event: Pick<
    EventSummary,
    | "title"
    | "startsAt"
    | "capacity"
    | "registeredCount"
    | "feeInPaise"
    | "viewerRegistration"
  >,
  now: string,
): RegistrationDescriptor {
  const { capacity, registeredCount, feeInPaise, viewerRegistration } = event

  const seatsLeft =
    capacity === null ? null : Math.max(0, capacity - registeredCount)
  const isFull = seatsLeft === 0
  const isClosed =
    viewerRegistration === "CLOSED" ||
    new Date(now).getTime() >= new Date(event.startsAt).getTime()

  const capacityLabel = formatCapacity(registeredCount, capacity)
  const feeLabel = formatFee(feeInPaise)
  const isNearlyFull =
    !isFull && seatsLeft !== null && seatsLeft <= SCARCITY_THRESHOLD

  const base = {
    seatsLeft,
    isFull,
    isClosed,
    capacityLabel,
    feeLabel,
    isNearlyFull,
  }

  if (viewerRegistration === "REGISTERED") {
    return {
      ...base,
      ctaLabel: "Registered",
      ctaDisabled: false,
      accessibleCtaLabel: `Manage your registration for ${event.title}`,
      status: { label: "Registered", tone: "success" },
    }
  }

  if (viewerRegistration === "WAITLISTED") {
    return {
      ...base,
      ctaLabel: "On the waitlist",
      ctaDisabled: false,
      accessibleCtaLabel: `Leave the waitlist for ${event.title}`,
      status: { label: "Waitlisted", tone: "warning" },
    }
  }

  if (isClosed) {
    return {
      ...base,
      ctaLabel: "Registration closed",
      ctaDisabled: true,
      accessibleCtaLabel: `Registration for ${event.title} has closed`,
      status: { label: "Closed", tone: "neutral" },
    }
  }

  if (isFull) {
    return {
      ...base,
      ctaLabel: "Join the waitlist",
      ctaDisabled: false,
      accessibleCtaLabel: `Join the waitlist for ${event.title}`,
      status: { label: "Full", tone: "warning" },
    }
  }

  return {
    ...base,
    ctaLabel: feeInPaise ? `Register - ${feeLabel}` : "Register",
    ctaDisabled: false,
    accessibleCtaLabel: `Register for ${event.title}`,
    status: isNearlyFull
      ? {
          label: seatsLeft === 1 ? "1 seat left" : `${seatsLeft} seats left`,
          tone: "warning",
        }
      : null,
  }
}

export const eventModeLabel = {
  IN_PERSON: "In person",
  ONLINE: "Online",
  HYBRID: "Hybrid",
} as const
