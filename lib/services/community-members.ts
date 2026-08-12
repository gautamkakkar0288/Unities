import { and, asc, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { memberships, users, type UserRole } from "@/lib/db/schema"
import { canModerate } from "@/lib/domain/membership"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Reads about the people in a community, as opposed to the community itself.
 *
 * Separate from `communities.ts` because these queries answer a different
 * question and will grow in a different direction: the moderator's pending
 * queue, member lists, and role changes all belong here, and none of them
 * belong in a file that is already the single place membership *rules* live.
 */

/**
 * A person who runs a community, as shown publicly on its page.
 *
 * Deliberately not the user row. `users` also holds an email address and a
 * bcrypt hash, and in a server component the returned object is serialised into
 * the payload sent to the browser - so "select the row and pick fields in the
 * component" is how a password hash ends up in someone's page source. The
 * projection is the protection, and it lives here rather than in the UI.
 */
export type CommunityLead = {
  id: string
  /** Users may have no name set; the UI decides what to show instead. */
  name: string | null
  avatarUrl: string | null
  role: UserRole
  state: "OWNER" | "MODERATOR"
}

const LEAD_STATES = ["OWNER", "MODERATOR"] as const

/**
 * The owners and moderators of one community, owners first.
 *
 * Only these two states are public. `MEMBER` is not returned: publishing a
 * complete member list of every campus community would turn Cirqles into a
 * directory of who belongs to what, which is a privacy decision nobody made.
 * `PENDING` and `INVITED` are more sensitive still - a rejected request should
 * not be visible to anyone but the moderators.
 *
 * Ordered in SQL so the ordering survives pagination if this ever grows one.
 */
export async function listCommunityLeads(args: {
  communityId: string
}): Promise<CommunityLead[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.image,
      role: users.role,
      state: memberships.state,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(memberships.communityId, args.communityId),
        inArray(memberships.state, [...LEAD_STATES]),
      ),
    )
    .orderBy(
      asc(sql`case ${memberships.state} when 'OWNER' then 0 else 1 end`),
      asc(users.name),
    )

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    avatarUrl: row.avatarUrl,
    role: row.role,
    // Narrowed rather than asserted blindly: the query filters to these two.
    state: row.state === "OWNER" ? "OWNER" : "MODERATOR",
  }))
}

/**
 * Someone waiting for a decision on an approval community.
 *
 * Same projection discipline as `CommunityLead`, and for a stronger reason: a
 * pending request is private between the applicant and the moderators, so this
 * shape is never handed to anyone else.
 */
export type JoinRequest = {
  userId: string
  name: string | null
  avatarUrl: string | null
  role: UserRole
  /** ISO-8601, per the domain's timestamp convention. */
  requestedAt: string | null
}

/**
 * The pending queue for one community.
 *
 * The authorization is here rather than in the page, matching
 * `reviewJoinRequest`: the read and the write that follows it have to agree
 * about who may act, and the only way to guarantee that is for both to ask the
 * same layer. A page-level check would also have to be repeated in every future
 * caller, and the one that forgets is the one that leaks a list of students who
 * asked to join a selective society.
 *
 * Oldest first, because a queue that is not ordered by waiting time is how
 * someone waits a month.
 */
export async function listPendingRequests(args: {
  moderatorId: string
  communityId: string
}): Promise<ServiceResult<JoinRequest[]>> {
  const [viewer] = await db
    .select({ state: memberships.state })
    .from(memberships)
    .where(
      and(
        eq(memberships.communityId, args.communityId),
        eq(memberships.userId, args.moderatorId),
      ),
    )
    .limit(1)

  if (!viewer || !canModerate(viewer.state)) {
    return fail("FORBIDDEN", "You do not moderate this community.")
  }

  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      avatarUrl: users.image,
      role: users.role,
      requestedAt: memberships.requestedAt,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(memberships.communityId, args.communityId),
        eq(memberships.state, "PENDING"),
      ),
    )
    .orderBy(asc(memberships.requestedAt))

  return ok(
    rows.map((row) => ({
      userId: row.userId,
      name: row.name,
      avatarUrl: row.avatarUrl,
      role: row.role,
      requestedAt: row.requestedAt ? row.requestedAt.toISOString() : null,
    })),
  )
}
