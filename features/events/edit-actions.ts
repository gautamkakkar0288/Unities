"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { updateEvent } from "@/lib/services/event-editing"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Correcting a published event.
 *
 * A server action is a public HTTP endpoint, so the identity comes from the
 * session here and the permission question is answered by the service against
 * the database - never from anything the browser sent.
 */

export type EventEditOutcome = {
  slug: string
  /**
   * How many students came off the waitlist because seats were added.
   *
   * A count rather than the ids the service returns: the organiser needs to
   * know the queue moved, and the browser has no reason to hold a list of who
   * is in it.
   */
  promoted: number
}

export async function updateEventAction(
  input: unknown,
): Promise<ServiceResult<EventEditOutcome>> {
  const session = await auth()
  if (!session?.user) {
    return fail("FORBIDDEN", "Sign in to change this event.")
  }

  const result = await updateEvent({ actorId: session.user.id, input })
  if (!result.ok) return result

  const { slug, promoted } = result.data

  // Every surface that shows this event: the directory a student browses, the
  // page they may already have open, and the organiser's own two screens.
  revalidatePath("/events")
  revalidatePath(`/events/${slug}`)
  revalidatePath(`/events/${slug}/manage`)
  revalidatePath(`/events/${slug}/edit`)

  return ok({ slug, promoted: promoted.length })
}
