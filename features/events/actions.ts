"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { cancelRegistration, registerForEvent } from "@/lib/services/events"
import { fail, type ServiceFailure } from "@/lib/services/result"

/**
 * Registering, and giving up a place.
 *
 * A server action is a public HTTP endpoint. The student is therefore taken
 * from the session and never from the arguments - an action that accepted a
 * userId would let anyone register anyone for anything - and the rules about
 * capacity, deadlines and cancelled events stay in the service, which decides
 * them under a row lock at write time.
 *
 * These return the failure or nothing. There is no success payload: the page is
 * revalidated and re-rendered from the database, so the seat count a student
 * sees is the row, not something this layer guessed.
 */

type Target = { eventId: string; slug: string }

/** The slug builds a revalidation path, so it is checked rather than trusted. */
const SLUG = /^[a-z0-9-]{1,140}$/i

function readTarget(input: unknown): Target | null {
  if (typeof input !== "object" || input === null) return null

  const { eventId, slug } = input as Record<string, unknown>

  if (typeof eventId !== "string" || eventId.length === 0) return null
  if (typeof slug !== "string" || !SLUG.test(slug)) return null

  return { eventId, slug }
}

/**
 * The listing shows seats left and the viewer's state on every card, and the
 * detail page shows both plus the control. Both are server rendered, so without
 * this the student registers and the page carries on saying they have not.
 */
function revalidateEvent(slug: string) {
  revalidatePath("/events")
  revalidatePath(`/events/${slug}`)
}

export async function registerForEventAction(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const target = readTarget(input)
  if (!target) return fail("INVALID", "That event could not be identified.")

  const result = await registerForEvent({
    userId: session.user.id,
    eventId: target.eventId,
  })

  if (!result.ok) return result

  revalidateEvent(target.slug)
}

export async function cancelRegistrationAction(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const target = readTarget(input)
  if (!target) return fail("INVALID", "That event could not be identified.")

  const result = await cancelRegistration({
    userId: session.user.id,
    eventId: target.eventId,
  })

  if (!result.ok) return result

  revalidateEvent(target.slug)
}
