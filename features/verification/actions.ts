"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { requestOrganizerVerification } from "@/lib/services/organizer-verification"
import { fail, type ServiceFailure } from "@/lib/services/result"

/**
 * A club owner asking for verification.
 *
 * Returns only failures. Success is shown by the form switching to its
 * submitted state, and there is nothing useful to send back - the request has
 * no page the owner can watch, deliberately, because a queue position students
 * can refresh is a queue students will refresh.
 *
 * The requester is the session, never the form. Whether they actually own the
 * community is `requestOrganizerVerification`'s decision, not this file's.
 */
export async function requestVerificationAction(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const result = await requestOrganizerVerification({
    userId: session.user.id,
    input,
  })

  if (!result.ok) return result

  // The community now shows a pending badge, wherever it is rendered.
  revalidatePath("/communities")
  revalidatePath("/admin/verification")
}
