import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  communities,
  communityProposalSupporters,
  communityProposals,
  interests,
  memberships,
  places,
  users,
} from "@/lib/db/schema"
import {
  findSimilarCommunities,
  normaliseCommunityName,
  toCommunityRef,
} from "@/lib/domain/community"
import { canModerate } from "@/lib/domain/membership"
import type {
  CommunityRef,
  CommunitySummary,
  MembershipState,
} from "@/lib/domain/types"
import {
  proposeCommunitySchema,
  type ProposeCommunityInput,
} from "@/lib/schemas/community"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Community reads and writes.
 *
 * Everything in this file is server-only and is the single place membership
 * rules are enforced. The equivalent display rules live in `lib/domain/*` and
 * are imported rather than restated - `describeMembershipAction` decides what
 * the button says, and this file decides what actually happens, but both read
 * from the same `joinPolicy`. When they disagree, a student sees "Join", clicks
 * it, and gets an error, which is the specific failure this arrangement exists
 * to prevent.
 *
 * Components never call Drizzle. They call these functions, or a server action
 * that calls these functions.
 */

/** The membership states that count towards `memberCount` and may participate. */
const PARTICIPATING: MembershipState[] = ["MEMBER", "MODERATOR", "OWNER"]

type CommunityRow = {
  id: string
  slug: string
  name: string
  tagline: string
  kind: CommunitySummary["kind"]
  scope: CommunitySummary["scope"]
  memberCount: number
  verification: CommunitySummary["verification"]
  joinPolicy: CommunitySummary["joinPolicy"]
  interestId: string | null
  interestSlug: string | null
  interestLabel: string | null
  placeId: string | null
  placeSlug: string | null
  placeName: string | null
  placeKind: "UNIVERSITY" | "CITY" | null
  viewerState: Exclude<MembershipState, "NONE"> | null
}

const communitySelection = {
  id: communities.id,
  slug: communities.slug,
  name: communities.name,
  tagline: communities.tagline,
  kind: communities.kind,
  scope: communities.scope,
  memberCount: communities.memberCount,
  verification: communities.verification,
  joinPolicy: communities.joinPolicy,
  interestId: interests.id,
  interestSlug: interests.slug,
  interestLabel: interests.label,
  placeId: places.id,
  placeSlug: places.slug,
  placeName: places.name,
  placeKind: places.kind,
  viewerState: memberships.state,
}

/**
 * Rows to the domain shape.
 *
 * `viewerMembership` collapses "no row" to `NONE` here, at the boundary. This
 * is the one place the database's absence-means-none convention is translated,
 * so nothing above this layer ever has to reason about a null membership.
 */
function toSummary(row: CommunityRow): CommunitySummary {
  if (!row.interestId || !row.interestSlug || !row.interestLabel) {
    // The column is NOT NULL with a restricted foreign key, so this is a bug,
    // not a user-facing condition - hence a throw rather than a failure result.
    throw new Error(`Community ${row.slug} has no interest attached.`)
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    kind: row.kind,
    scope: row.scope,
    place:
      row.placeId && row.placeSlug && row.placeName && row.placeKind
        ? {
            id: row.placeId,
            slug: row.placeSlug,
            name: row.placeName,
            kind: row.placeKind,
          }
        : null,
    interest: {
      id: row.interestId,
      slug: row.interestSlug,
      label: row.interestLabel,
    },
    memberCount: row.memberCount,
    verification: row.verification,
    joinPolicy: row.joinPolicy,
    viewerMembership: row.viewerState ?? "NONE",
  }
}

/**
 * A join condition that is false for everyone when there is no viewer.
 *
 * Signed-out visitors still see the directory, and branching the whole query on
 * `viewerId` would mean maintaining two nearly identical queries that drift.
 */
function viewerMembershipJoin(viewerId: string | null) {
  return and(
    eq(memberships.communityId, communities.id),
    eq(memberships.userId, viewerId ?? ""),
  )
}

/**
 * The places a student's discovery walks through: their campus, then the city
 * that campus sits in (D28). This is why `places` is self-referencing - the
 * hierarchy is one join, not a hardcoded map that has to be edited when the
 * second university arrives.
 */
export async function scopePlaceIdsForUser(userId: string): Promise<string[]> {
  const [row] = await db
    .select({ universityId: users.universityId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!row?.universityId) return []

  const [campus] = await db
    .select({ id: places.id, parentPlaceId: places.parentPlaceId })
    .from(places)
    .where(eq(places.id, row.universityId))
    .limit(1)

  if (!campus) return []

  return campus.parentPlaceId ? [campus.id, campus.parentPlaceId] : [campus.id]
}

/**
 * The community directory for one viewer: campus, city, interests, everywhere.
 *
 * Ordering is by scope rank first and member count second, so the campus a
 * student actually attends is never below a large global community. The rank is
 * computed in SQL rather than sorted in JS because this list paginates later,
 * and a page boundary applied before an in-memory sort produces a shuffled
 * directory.
 */
export async function listCommunitiesForViewer(args: {
  viewerId: string | null
  placeIds?: string[]
}): Promise<CommunitySummary[]> {
  const placeIds =
    args.placeIds ??
    (args.viewerId ? await scopePlaceIdsForUser(args.viewerId) : [])

  const scopeRank = sql<number>`case ${communities.scope}
    when 'UNIVERSITY' then 0
    when 'CITY' then 1
    when 'INTEREST' then 2
    else 3 end`

  const visible =
    placeIds.length > 0
      ? or(inArray(communities.placeId, placeIds), isNull(communities.placeId))
      : isNull(communities.placeId)

  const rows = await db
    .select(communitySelection)
    .from(communities)
    .innerJoin(interests, eq(interests.id, communities.interestId))
    .leftJoin(places, eq(places.id, communities.placeId))
    .leftJoin(memberships, viewerMembershipJoin(args.viewerId))
    .where(and(isNull(communities.archivedAt), visible))
    .orderBy(asc(scopeRank), desc(communities.memberCount), asc(communities.name))

  return rows.map(toSummary)
}

export async function getCommunityBySlug(args: {
  slug: string
  viewerId: string | null
}): Promise<(CommunitySummary & { about: string; guidelines: string[] }) | null> {
  const [row] = await db
    .select({
      ...communitySelection,
      about: communities.about,
      guidelines: communities.guidelines,
    })
    .from(communities)
    .innerJoin(interests, eq(interests.id, communities.interestId))
    .leftJoin(places, eq(places.id, communities.placeId))
    .leftJoin(memberships, viewerMembershipJoin(args.viewerId))
    .where(eq(communities.slug, args.slug))
    .limit(1)

  if (!row) return null

  return {
    ...toSummary(row),
    about: row.about,
    guidelines: row.guidelines ?? [],
  }
}

/**
 * Join, request to join, or accept an invitation - whichever the policy and the
 * current state make correct.
 *
 * One function rather than three because the caller is a button whose meaning
 * is already decided by `describeMembershipAction`. Exposing `join`, `request`,
 * and `accept` separately would let a client call the wrong one and bypass the
 * policy, so the policy is read here, from the row, at write time.
 *
 * Idempotent: joining twice is a success, not an error. Students double-tap.
 */
export async function joinCommunity(args: {
  userId: string
  communityId: string
}): Promise<ServiceResult<MembershipState>> {
  return db.transaction(async (tx) => {
    const [community] = await tx
      .select({
        id: communities.id,
        joinPolicy: communities.joinPolicy,
        archivedAt: communities.archivedAt,
      })
      .from(communities)
      .where(eq(communities.id, args.communityId))
      .limit(1)

    if (!community || community.archivedAt) {
      return fail("NOT_FOUND", "That community no longer exists.")
    }

    const [existing] = await tx
      .select({ id: memberships.id, state: memberships.state })
      .from(memberships)
      .where(
        and(
          eq(memberships.communityId, args.communityId),
          eq(memberships.userId, args.userId),
        ),
      )
      .limit(1)

    // Already inside, or already waiting. Say so rather than erroring.
    if (existing && PARTICIPATING.includes(existing.state)) {
      return ok(existing.state)
    }
    if (existing?.state === "PENDING") return ok("PENDING")

    // An invitation is an offer; accepting it ignores the join policy, which is
    // the entire point of an invite-only community.
    if (existing?.state === "INVITED") {
      await tx
        .update(memberships)
        .set({ state: "MEMBER", joinedAt: new Date() })
        .where(eq(memberships.id, existing.id))
      await tx
        .update(communities)
        .set({ memberCount: sql`${communities.memberCount} + 1` })
        .where(eq(communities.id, args.communityId))
      return ok("MEMBER")
    }

    if (community.joinPolicy === "INVITE") {
      return fail(
        "FORBIDDEN",
        "This community is invite only. A moderator has to add you.",
      )
    }

    if (community.joinPolicy === "APPROVAL") {
      await tx.insert(memberships).values({
        communityId: args.communityId,
        userId: args.userId,
        state: "PENDING",
        requestedAt: new Date(),
      })
      return ok("PENDING")
    }

    await tx.insert(memberships).values({
      communityId: args.communityId,
      userId: args.userId,
      state: "MEMBER",
      joinedAt: new Date(),
    })
    // Same transaction as the insert, so the denormalised count cannot drift
    // from the rows it summarises.
    await tx
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, args.communityId))

    return ok("MEMBER")
  })
}

/**
 * Leave, withdraw a request, or decline an invitation.
 *
 * The sole-owner check is the only hard block. A community with no owner has
 * nobody who can approve members, edit it, or hand it over, and recovering one
 * is a manual database operation - so the exit is refused with an explanation
 * rather than allowed and cleaned up later.
 */
export async function leaveCommunity(args: {
  userId: string
  communityId: string
}): Promise<ServiceResult<"NONE">> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: memberships.id, state: memberships.state })
      .from(memberships)
      .where(
        and(
          eq(memberships.communityId, args.communityId),
          eq(memberships.userId, args.userId),
        ),
      )
      .limit(1)

    if (!existing) return ok("NONE")

    if (existing.state === "OWNER") {
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(memberships)
        .where(
          and(
            eq(memberships.communityId, args.communityId),
            eq(memberships.state, "OWNER"),
          ),
        )

      if (count <= 1) {
        return fail(
          "CONFLICT",
          "You are the only owner. Make someone else an owner before you leave.",
        )
      }
    }

    await tx.delete(memberships).where(eq(memberships.id, existing.id))

    if (PARTICIPATING.includes(existing.state)) {
      // GREATEST guards against a count that has already drifted below zero;
      // a negative member count on a card is a visible bug, a stuck zero is not.
      await tx
        .update(communities)
        .set({
          memberCount: sql`greatest(${communities.memberCount} - 1, 0)`,
        })
        .where(eq(communities.id, args.communityId))
    }

    return ok("NONE")
  })
}

/** A moderator accepting or declining a pending request. */
export async function reviewJoinRequest(args: {
  moderatorId: string
  communityId: string
  applicantId: string
  decision: "APPROVE" | "DECLINE"
}): Promise<ServiceResult<MembershipState>> {
  return db.transaction(async (tx) => {
    const [moderator] = await tx
      .select({ state: memberships.state })
      .from(memberships)
      .where(
        and(
          eq(memberships.communityId, args.communityId),
          eq(memberships.userId, args.moderatorId),
        ),
      )
      .limit(1)

    // Authority is read from the membership row, not from the caller's word for
    // it. `canModerate` is the same predicate the UI uses to show the queue.
    if (!moderator || !canModerate(moderator.state)) {
      return fail("FORBIDDEN", "You do not moderate this community.")
    }

    const [request] = await tx
      .select({ id: memberships.id, state: memberships.state })
      .from(memberships)
      .where(
        and(
          eq(memberships.communityId, args.communityId),
          eq(memberships.userId, args.applicantId),
        ),
      )
      .limit(1)

    if (!request || request.state !== "PENDING") {
      return fail("NOT_FOUND", "That request has already been handled.")
    }

    if (args.decision === "DECLINE") {
      await tx.delete(memberships).where(eq(memberships.id, request.id))
      return ok("NONE")
    }

    await tx
      .update(memberships)
      .set({
        state: "MEMBER",
        joinedAt: new Date(),
        decidedById: args.moderatorId,
        decidedAt: new Date(),
      })
      .where(eq(memberships.id, request.id))

    await tx
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, args.communityId))

    return ok("MEMBER")
  })
}

export type ProposalOutcome =
  | { status: "SUBMITTED"; proposalId: string }
  /** The student is shown these and can either join one or confirm and resubmit. */
  | { status: "DUPLICATE_SUSPECTED"; matches: CommunityRef[] }

/**
 * A student asking for a community that does not exist (D26).
 *
 * The duplicate check runs here as well as in the browser. The client-side
 * version exists to be helpful while typing; this one exists because the server
 * action is a public endpoint and "the form checked it" is not a guarantee.
 * Both call the same `findSimilarCommunities`, so they cannot disagree about
 * what counts as a duplicate.
 */
export async function proposeCommunity(args: {
  userId: string
  input: unknown
}): Promise<ServiceResult<ProposalOutcome>> {
  const parsed = proposeCommunitySchema.safeParse(args.input)
  if (!parsed.success) {
    return fail(
      "INVALID",
      parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    )
  }

  const input: ProposeCommunityInput = parsed.data

  if (!input.acknowledgedDuplicates) {
    const candidates = await listCommunitiesForViewer({
      viewerId: args.userId,
      placeIds: input.placeId ? [input.placeId] : [],
    })

    const matches = findSimilarCommunities(input.name, candidates)
    if (matches.length > 0) {
      return ok({
        status: "DUPLICATE_SUSPECTED",
        matches: matches.map((match) => toCommunityRef(match.community)),
      })
    }
  }

  const [proposal] = await db
    .insert(communityProposals)
    .values({
      proposedName: input.name,
      normalisedName: normaliseCommunityName(input.name),
      tagline: input.tagline,
      reason: input.reason,
      interestId: input.interestId,
      scope: input.scope,
      placeId: input.placeId,
      proposedById: args.userId,
      status: "PENDING",
      supporterCount: 1,
    })
    .returning({ id: communityProposals.id })

  // The proposer is their own first supporter, so the count and the join table
  // agree from the first row rather than after the first other student backs it.
  await db
    .insert(communityProposalSupporters)
    .values({ proposalId: proposal.id, userId: args.userId })
    .onConflictDoNothing()

  return ok({ status: "SUBMITTED", proposalId: proposal.id })
}

/**
 * "I want this too."
 *
 * The count is only incremented when a supporter row was actually inserted -
 * `onConflictDoNothing().returning()` gives an empty array on conflict, which
 * makes the second click a no-op instead of inflating demand. Demand that can
 * be inflated by refreshing is not demand.
 */
export async function supportProposal(args: {
  userId: string
  proposalId: string
}): Promise<ServiceResult<{ supporterCount: number }>> {
  return db.transaction(async (tx) => {
    const [proposal] = await tx
      .select({
        id: communityProposals.id,
        status: communityProposals.status,
        supporterCount: communityProposals.supporterCount,
      })
      .from(communityProposals)
      .where(eq(communityProposals.id, args.proposalId))
      .limit(1)

    if (!proposal) return fail("NOT_FOUND", "That proposal no longer exists.")
    if (proposal.status !== "PENDING") {
      return fail("CONFLICT", "That proposal has already been decided.")
    }

    const inserted = await tx
      .insert(communityProposalSupporters)
      .values({ proposalId: args.proposalId, userId: args.userId })
      .onConflictDoNothing()
      .returning({ proposalId: communityProposalSupporters.proposalId })

    if (inserted.length === 0) {
      return ok({ supporterCount: proposal.supporterCount })
    }

    const [updated] = await tx
      .update(communityProposals)
      .set({ supporterCount: sql`${communityProposals.supporterCount} + 1` })
      .where(eq(communityProposals.id, args.proposalId))
      .returning({ supporterCount: communityProposals.supporterCount })

    return ok({ supporterCount: updated.supporterCount })
  })
}
