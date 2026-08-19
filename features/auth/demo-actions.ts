"use server"

import { AuthError } from "next-auth"

import { signIn } from "@/auth"
import { DEMO_PASSWORD, findDemoAccount, isDemoAuthEnabled } from "@/lib/demo/accounts"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Sign in as one of the seeded demo accounts.
 *
 * This deliberately does not shortcut authentication. It hands the seeded
 * account's real credentials to the same Credentials provider the sign-in form
 * uses, so Auth.js performs the same database lookup, the same bcrypt
 * comparison and issues the same session. The role in that session is read from
 * the user row, never from this request - which is the whole reason the action
 * takes an email rather than a role.
 *
 * Consequences worth stating: if the seed has not run, this fails exactly as a
 * wrong password would, and if someone changes the demo password in the seed
 * without changing `lib/demo/accounts.ts`, this stops working. Both are
 * preferable to a code path that can mint a session without checking anything.
 */
export async function signInAsDemoAccount(
  email: string,
): Promise<ServiceResult<never>> {
  // Server-side, not merely hidden in the UI. A disabled demo mode has to
  // refuse a hand-written call to this action.
  if (!isDemoAuthEnabled()) {
    return fail("FORBIDDEN", "Demo sign-in is not enabled.")
  }

  // Only the three seeded accounts. Without this the action would be an
  // "authenticate anyone whose password happens to be the demo one" endpoint.
  const account = findDemoAccount(email)
  if (!account) {
    return fail("NOT_FOUND", "That is not a demo account.")
  }

  try {
    await signIn("credentials", {
      email: account.email,
      password: DEMO_PASSWORD,
      redirectTo: "/home",
    })
  } catch (error) {
    // A successful sign-in throws a redirect, and swallowing it here would
    // leave the user on the sign-in page with a session they cannot see. Only
    // real authentication failures are ours to report.
    if (error instanceof AuthError) {
      return fail(
        "INVALID",
        "The demo accounts are missing. Run `npm run db:reset` and try again.",
      )
    }

    throw error
  }

  return ok(undefined as never)
}
