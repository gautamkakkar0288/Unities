import { and, asc, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { memberships, users, type UserRole } from "@/lib/db/schema"

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
