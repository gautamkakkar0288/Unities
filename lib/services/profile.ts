import { and, asc, eq, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  communities,
  interests,
  memberships,
  places,
  userInterests,
  users,
  type UserRole,
} from "@/lib/db/schema"
import type { Interest, MembershipState, PlaceRef } from "@/lib/domain/types"
import { updateProfileSchema } from "@/lib/schemas/profile"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * The viewer's own profile.
 *
 * Read this as self-only. It returns an email address, which is correct for a
 * student looking at their own account and wrong for anyone else's - so if a
 * public profile page ever appears, it needs its own narrower projection here
 * rather than a `viewerId !== userId` branch bolted onto this one. The
 * `listCommunityLeads` comment explains why: a server component serialises
 * whatever it is handed straight into the page payload.
 */

export type ProfileCommunity = {
  id: string
  slug: string
  name: string
  state: Exclude<MembershipState, "NONE">
}

export type Profile = {
  id: string
  name: string | null
  email: string
  avatarUrl: string | null
  role: UserRole
  /** The campus this account belongs to, if it has been linked to one. */
  university: PlaceRef | null
  interests: Interest[]
  communities: ProfileCommunity[]
}

/**
 * Communities the student runs come before ones they belong to, and requests
 * they are still waiting on come last.
 *
 * Ordered in SQL rather than sorted afterwards, so it survives a limit if this
 * list ever grows one.
 */
const membershipRank = sql`case ${memberships.state}
  when 'OWNER' then 0
  when 'MODERATOR' then 1
  when 'MEMBER' then 2
  when 'INVITED' then 3
  else 4 end`

export async function getProfile(userId: string): Promise<Profile | null> {
  const [account] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.image,
      role: users.role,
      placeId: places.id,
      placeSlug: places.slug,
      placeName: places.name,
      placeKind: places.kind,
    })
    .from(users)
    .leftJoin(places, eq(places.id, users.universityId))
    .where(eq(users.id, userId))
    .limit(1)

  if (!account) return null

  // Retired interests are dropped, for the same reason `hasCompletedOnboarding`
  // ignores them: a student whose picks were all later retired should be shown
  // an empty list and asked to choose again, not a list of dead tags.
  const chosen = await db
    .select({
      id: interests.id,
      slug: interests.slug,
      label: interests.label,
    })
    .from(userInterests)
    .innerJoin(interests, eq(interests.id, userInterests.interestId))
    .where(
      and(eq(userInterests.userId, userId), eq(interests.status, "ACTIVE")),
    )
    .orderBy(asc(interests.sortOrder), asc(interests.label))

  const joined = await db
    .select({
      id: communities.id,
      slug: communities.slug,
      name: communities.name,
      state: memberships.state,
    })
    .from(memberships)
    .innerJoin(communities, eq(communities.id, memberships.communityId))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(membershipRank), asc(communities.name))

  return {
    id: account.id,
    name: account.name,
    email: account.email,
    avatarUrl: account.avatarUrl,
    role: account.role,
    university:
      account.placeId && account.placeSlug && account.placeName && account.placeKind
        ? {
            id: account.placeId,
            slug: account.placeSlug,
            name: account.placeName,
            kind: account.placeKind,
          }
        : null,
    interests: chosen,
    communities: joined,
  }
}

/**
 * Rename yourself.
 *
 * The session is not updated here and cannot be: the name in the JWT is a
 * snapshot taken at sign-in. Anything rendered from the database - this page
 * included - is correct immediately; anything rendered from the session shows
 * the old name until the token refreshes. That is a real seam, and it is the
 * argument for reading identity from the database wherever it is displayed.
 */
export async function updateDisplayName(args: {
  userId: string
  input: unknown
}): Promise<ServiceResult<{ name: string }>> {
  const parsed = updateProfileSchema.safeParse(args.input)
  if (!parsed.success) {
    return fail(
      "INVALID",
      parsed.error.issues[0]?.message ?? "That name will not work.",
    )
  }

  const [updated] = await db
    .update(users)
    .set({ name: parsed.data.name })
    .where(eq(users.id, args.userId))
    .returning({ name: users.name })

  if (!updated) return fail("NOT_FOUND", "We could not find your account.")

  return ok({ name: updated.name ?? parsed.data.name })
}
