import type { getProfile } from "@/lib/services/profile"

import type { MobileSession } from "../auth"

type Profile = NonNullable<Awaited<ReturnType<typeof getProfile>>>

/**
 * The account, as the account's own device may see it.
 *
 * Built by naming every field rather than spreading the row, so a column added
 * to `users` tomorrow cannot appear on the wire by accident. The password hash
 * is not omitted here - `getProfile` never selects it in the first place - but
 * the same reasoning applies to anything else the table might grow.
 *
 * The email is deliberate: this endpoint only ever describes the caller to
 * themselves. A public profile would need a narrower shape, which is exactly
 * what the note on `getProfile` says.
 *
 * `image` and `imageUrl` carry the same value because the mobile client's
 * session model reads one name and the rest of its models read the other.
 * Duplicating one string is cheaper than a breaking rename on either side.
 */
export function serializeMobileUser(profile: Profile, session: MobileSession) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    image: profile.avatarUrl,
    imageUrl: profile.avatarUrl,
    // The database, not the token. A role changed after sign-in should be
    // visible without making the student sign in again.
    role: profile.role,
    /** True when the session's cached role has gone stale. */
    roleChangedSinceSignIn: profile.role !== session.role,
    university: profile.university,
    interests: profile.interests,
    communities: profile.communities,
  }
}
