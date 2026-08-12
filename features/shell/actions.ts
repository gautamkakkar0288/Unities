"use server"

import { signOut } from "@/auth"

/**
 * Sign out via a server action so it works as a plain form submission.
 *
 * A form POST rather than an onClick handler means signing out still works if
 * client JavaScript fails to load, and it cannot be triggered by a stray link
 * prefetch the way a GET route could.
 */
export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}
