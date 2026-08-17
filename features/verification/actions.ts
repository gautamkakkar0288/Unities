"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { requestOrganizerVerification } from "@/lib/services/organizer-verification"
import { fail, type ServiceFailure } from "@/lib/services/result"
import { requestEmailVerification } from "@/lib/services/verification"

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

/**
 * A student asking for another confirmation link.
 *
 * Called from a plain form on /verify-email, so it takes no arguments and the
 * account comes from the session - a resend that accepted an address would let
 * anyone post mail to anyone.
 *
 * The outcome travels back as a fixed code in the query string rather than a
 * message. Redirecting with the service's own text would mean rendering
 * something from the URL, and a page that prints arbitrary query content is a
 * page anyone can put words into.
 *
 * The transport failure is caught on purpose, and reported as a failure rather
 * than swallowed. `sendEmail` throws when no real transport is configured, and
 * telling a student their link is on its way when the mailer refused leaves
 * them waiting for something that does not exist. `redirect` throws to work, so
 * it stays outside the try - catching it would swallow the navigation itself.
 */
export async function resendVerificationEmailAction(): Promise<void> {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  let sent = false

  try {
    const result = await requestEmailVerification({ userId: session.user.id })
    sent = result.ok
  } catch {
    sent = false
  }

  redirect(sent ? "/verify-email?resend=sent" : "/verify-email?resend=failed")
}
