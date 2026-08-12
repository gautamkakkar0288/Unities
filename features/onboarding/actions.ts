"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { setUserInterests } from "@/lib/services/interests"
import { fail, type ServiceFailure } from "@/lib/services/result"

/**
 * Save the onboarding selection.
 *
 * A server action is a public HTTP endpoint, not a private callback for the
 * component next to it. So the user comes from the session rather than the
 * arguments - accepting a userId here would let anyone set anyone's interests -
 * and the payload is passed to the service unparsed, because
 * `setInterestsSchema` inside `setUserInterests` is the validation. Parsing it
 * here as well would be a second copy of the rule that could disagree.
 *
 * The return type is failure-only on purpose. Success redirects, which throws,
 * so there is no success value a caller could forget to handle.
 */
export async function saveOnboardingInterests(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()

  if (!session?.user) {
    return fail("FORBIDDEN", "Your session has expired. Sign in again to continue.")
  }

  const result = await setUserInterests({
    userId: session.user.id,
    input,
  })

  if (!result.ok) return result

  // The app shell asks the database on every render whether onboarding is done,
  // and that answer just changed. Without this the student lands on a cached
  // shell that still believes they have not onboarded and bounces them back.
  revalidatePath("/", "layout")

  redirect("/home")
}
