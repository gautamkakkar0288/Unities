"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { reviewVerificationRequest } from "@/lib/services/organizer-verification"
import { fail, type ServiceFailure } from "@/lib/services/result"
import { assignRole } from "@/lib/services/roles"

/**
 * Administrator actions: deciding verification requests, and changing a role.
 *
 * Both take the actor from the session. Neither checks whether that actor is an
 * administrator - the services do, because they are also reachable from a seed
 * script and from whatever calls them next, and a check written here would
 * protect only this file.
 */

export async function reviewVerificationAction(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const result = await reviewVerificationRequest({
    reviewerId: session.user.id,
    input,
  })

  if (!result.ok) return result

  revalidatePath("/admin/verification")
  // An approved club is verified everywhere it appears.
  revalidatePath("/communities")
}

export async function assignRoleAction(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const result = await assignRole({ actorId: session.user.id, input })

  if (!result.ok) return result

  revalidatePath("/admin/verification")
}
