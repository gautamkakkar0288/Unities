"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { setUserInterests } from "@/lib/services/interests"
import { updateDisplayName } from "@/lib/services/profile"
import { fail, type ServiceFailure } from "@/lib/services/result"

/**
 * Profile writes.
 *
 * Both take the account from the session, so neither can be pointed at someone
 * else's row no matter what the request body says.
 *
 * Neither returns a success payload. The pages are server rendered from the
 * database, so revalidation is what shows the change - a returned value would
 * be a second copy of the same state, free to disagree with the row.
 */

export async function updateDisplayNameAction(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const result = await updateDisplayName({ userId: session.user.id, input })
  if (!result.ok) return result

  // Only /profile is revalidated. The sidebar and header read the name from
  // the session token, which this write cannot change - see the note on
  // `updateDisplayName`.
  revalidatePath("/profile")
}

/**
 * The same interest write onboarding uses, without the redirect.
 *
 * `setUserInterests` is called rather than reimplemented, so the minimum and
 * the deduplication are enforced once. A student editing interests later is
 * doing the same thing they did on their first day.
 */
export async function saveProfileInterests(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const result = await setUserInterests({ userId: session.user.id, input })
  if (!result.ok) return result

  revalidatePath("/profile")
  revalidatePath("/profile/interests")
}
