import { requireMobileSession } from "@/lib/api/mobile/auth"
import { withMobileRoute } from "@/lib/api/mobile/handler"
import { mobileData, mobileError } from "@/lib/api/mobile/response"
import { serializeMobileUser } from "@/lib/api/mobile/serializers/user"
import { getProfile } from "@/lib/services/profile"

/**
 * GET /api/mobile/me - the signed-in account.
 *
 * Reads the database through `getProfile` rather than answering from the JWT.
 * The token is a snapshot from sign-in; the profile is current, and a client
 * that has just completed email verification or been given a role needs the
 * current answer.
 */
export const GET = withMobileRoute("GET /api/mobile/me", async () => {
  const authenticated = await requireMobileSession()
  if (!authenticated.ok) return authenticated.response

  const { session } = authenticated
  const profile = await getProfile(session.userId)

  if (!profile) {
    // A valid cookie pointing at an account that no longer exists. This is not
    // a 404: the request failed because the caller is no longer anybody, and
    // the client should sign out rather than retry.
    return mobileError("UNAUTHORIZED", "Sign in again to continue.")
  }

  return mobileData(serializeMobileUser(profile, session))
})
