"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { cancelEvent, createEvent } from "@/lib/services/events"
import {
  fail,
  ok,
  type ServiceFailure,
  type ServiceResult,
} from "@/lib/services/result"

/**
 * Organiser actions: publishing an event, and calling one off.
 *
 * Nothing here decides who is allowed. The service checks that the caller owns
 * the community and that the community is verified, because those facts have to
 * be read from the database at write time - a check in this layer would be a
 * check against whatever the page happened to render minutes ago.
 *
 * `createEventAction` returns the slug on success, unlike the register actions
 * which return nothing. The organiser is redirected to the event they just
 * made, and that address does not exist until the insert picks one.
 */

export async function createEventAction(
  input: unknown,
): Promise<ServiceResult<{ id: string; slug: string }>> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const result = await createEvent({
    organiserId: session.user.id,
    input,
  })

  if (!result.ok) return result

  revalidatePath("/events")

  return ok(result.data)
}

export async function cancelEventAction(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  if (typeof input !== "object" || input === null) {
    return fail("INVALID", "That event could not be identified.")
  }

  const { eventId, slug } = input as Record<string, unknown>

  if (typeof eventId !== "string" || eventId.length === 0) {
    return fail("INVALID", "That event could not be identified.")
  }
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,140}$/i.test(slug)) {
    return fail("INVALID", "That event could not be identified.")
  }

  const result = await cancelEvent({
    actorId: session.user.id,
    eventId,
  })

  if (!result.ok) return result

  revalidatePath("/events")
  revalidatePath(`/events/${slug}`)
  revalidatePath(`/events/${slug}/manage`)
}
