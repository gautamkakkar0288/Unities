import type { NextResponse } from "next/server"

import { auth } from "@/auth"
import type { UserRole } from "@/lib/db/schema"

import { mobileError } from "./response"

/**
 * Authentication for the mobile API, which is the same authentication as the
 * web: the Auth.js session cookie, read by `auth()`.
 *
 * There is deliberately no second mechanism here - no API key, no bearer token,
 * no "mobile secret". A second way in is a second thing that can be wrong, and
 * the credentials provider plus the session cookie already answer the only
 * question a route needs answered.
 *
 * Every route takes the caller's identity from here and never from the request
 * body or a path segment. That is the single rule that stops one student acting
 * on another student's data.
 */

export type MobileSession = {
  userId: string
  /**
   * A snapshot from the JWT, so it is the role at sign-in. Anything that must
   * be current - the profile endpoint, an authorisation decision inside a
   * service - reads the database instead, exactly as the web does.
   */
  role: UserRole
  email: string | null
  name: string | null
  image: string | null
}

export async function getMobileSession(): Promise<MobileSession | null> {
  const session = await auth()
  const user = session?.user

  if (!user?.id) return null

  return {
    userId: user.id,
    role: (user as { role?: UserRole }).role ?? "STUDENT",
    email: user.email ?? null,
    name: user.name ?? null,
    image: user.image ?? null,
  }
}

export type RequiredMobileSession =
  | { ok: true; session: MobileSession }
  | { ok: false; response: NextResponse }

/**
 * A result rather than a throw, matching `ServiceResult` in the service layer:
 * the caller cannot forget to handle the unauthenticated case, because it does
 * not type-check until it does.
 */
export async function requireMobileSession(): Promise<RequiredMobileSession> {
  const session = await getMobileSession()

  if (!session) {
    return {
      ok: false,
      response: mobileError("UNAUTHORIZED", "Sign in to continue."),
    }
  }

  return { ok: true, session }
}
