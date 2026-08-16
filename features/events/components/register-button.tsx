"use client"

import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  cancelRegistrationAction,
  registerForEventAction,
} from "@/features/events/actions"
import { describeRegistration } from "@/lib/domain/registration"
import type { EventSummary } from "@/lib/domain/types"

/**
 * The register control.
 *
 * What it says comes from `describeRegistration`, the same function the cards
 * use, so a student is never told "Join the waitlist" in one place and
 * "Register" in another for the same event.
 *
 * There is no optimistic update, for the same reason the join button has none:
 * pressing register can end in a seat *or* a place in the queue, and which one
 * depends on a count this component cannot see resolved under a lock. Showing
 * "You are going" to somebody who is ninth on the waitlist is a worse failure
 * than a moment of pending.
 */
export function RegisterButton({
  event,
  now,
  size = "lg",
}: {
  event: EventSummary
  now: string
  size?: "sm" | "lg"
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const registration = describeRegistration(event, now)
  const holdsAPlace =
    event.viewerRegistration === "REGISTERED" ||
    event.viewerRegistration === "WAITLISTED"

  // Closed, and the student has nothing to give up. The label already explains
  // why, so the button stays visible and inert rather than disappearing and
  // leaving them wondering where it went.
  if (!holdsAPlace && registration.ctaDisabled) {
    return (
      <Button
        type="button"
        size={size}
        variant="outline"
        disabled
        aria-label={registration.accessibleCtaLabel}
      >
        {registration.ctaLabel}
      </Button>
    )
  }

  const label = holdsAPlace
    ? event.viewerRegistration === "WAITLISTED"
      ? "Leave the waitlist"
      : "Cancel my registration"
    : registration.ctaLabel

  const accessibleLabel = holdsAPlace
    ? `${label} for ${event.title}`
    : registration.accessibleCtaLabel

  function run() {
    setError(null)

    startTransition(async () => {
      const target = { eventId: event.id, slug: event.slug }

      const failure = holdsAPlace
        ? await cancelRegistrationAction(target)
        : await registerForEventAction(target)

      // Success returns nothing: the action revalidates and this component is
      // re-rendered from the database with the new state.
      if (failure) setError(failure.message)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size={size}
        variant={holdsAPlace ? "outline" : "default"}
        onClick={run}
        disabled={pending}
        aria-busy={pending}
        aria-label={accessibleLabel}
      >
        {label}
      </Button>

      {/*
        "Registration for this event has closed", "That event has been
        cancelled" - refusals a student can act on, and the reason the service
        returns messages rather than codes. Sending these to a console would
        make the button look broken.
      */}
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  )
}
