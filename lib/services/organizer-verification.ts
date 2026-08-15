import { and, asc, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  auditLog,
  communities,
  memberships,
  users,
  verificationRequests,
  type AuditTargetKind,
  type UserRole,
  type VerificationRequestStatus,
  type VerificationState,
} from "@/lib/db/schema"
import { AUDIT_ACTIONS } from "@/lib/domain/audit"
import {
  communityVerificationForDecision,
  roleAfterVerification,
} from "@/lib/domain/organizer-verification"
import { canReviewVerification } from "@/lib/domain/role"
import {
  requestVerificationSchema,
  reviewVerificationSchema,
} from "@/lib/schemas/verification-request"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Organiser verification: the flow that answers "is this club real, and is this
 * person authorised to run it" (Phase 2.3).
 *
 * Every mutation here does its own authorization. Not because the pages are
 * untrustworthy, but because a service that trusts its caller has to be audited
 * once per caller forever, and the caller that forgets is the one that ships.
 *
 * The verified state itself is written to `communities.verification`, the column
 * the whole UI already reads. This module owns the transition; nothing else may
 * write that column.
 */

/**
 * A request as a reviewer needs to see it.
 *
 * Not the raw row, and not the domain `VerificationRequest` either - that shape
 * wants a `PersonSummary` with a username and a programme, and neither column
 * exists yet. Inventing them here to satisfy a type would be faking data, so
 * this projection carries only what the database can actually answer for.
 */
export type OrganizerVerificationRequest = {
  id: string
  status: VerificationRequestStatus
  evidence: string
  /** ISO-8601, per the domain's timestamp convention. */
  requestedAt: string
  decidedAt: string | null
  reviewerNote: string | null
  community: {
    id: string
    slug: string
    name: string
    verification: VerificationState
  }
  /** Null when the requester has since deleted their account. */
  requestedBy: { id: string; name: string | null } | null
}

/**
 * Resolve the actor's role and check they may review at all.
 *
 * One helper rather than the same three lines in each function, so a future
 * reviewer-only read cannot accidentally ship without the check.
 */
async function requireReviewer(
  userId: string,
): Promise<ServiceResult<UserRole>> {
  const [reviewer] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!reviewer) {
    return fail("FORBIDDEN", "You cannot review verification requests.")
  }

  if (!canReviewVerification(reviewer.role)) {
    return fail("FORBIDDEN", "You cannot review verification requests.")
  }

  return ok(reviewer.role)
}

/**
 * A club's owner asks for it to be recognised.
 *
 * Owner only, not moderators. Recognition is a claim about who runs the club,
 * and the person who runs it is the one who has to stand behind the evidence.
 */
export async function requestOrganizerVerification(args: {
  userId: string
  input: unknown
}): Promise<ServiceResult<{ requestId: string }>> {
  const parsed = requestVerificationSchema.safeParse(args.input)
  if (!parsed.success) {
    return fail(
      "INVALID",
      parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    )
  }

  const { communitySlug, evidence } = parsed.data

  const [community] = await db
    .select({
      id: communities.id,
      name: communities.name,
      verification: communities.verification,
      archivedAt: communities.archivedAt,
    })
    .from(communities)
    .where(eq(communities.slug, communitySlug))
    .limit(1)

  if (!community) {
    return fail("NOT_FOUND", "That community does not exist.")
  }

  if (community.archivedAt) {
    return fail("INVALID", "That community is archived.")
  }

  if (community.verification === "VERIFIED") {
    return fail("CONFLICT", "That community is already verified.")
  }

  const [membership] = await db
    .select({ state: memberships.state })
    .from(memberships)
    .where(
      and(
        eq(memberships.communityId, community.id),
        eq(memberships.userId, args.userId),
      ),
    )
    .limit(1)

  if (!membership || membership.state !== "OWNER") {
    return fail(
      "FORBIDDEN",
      "Only the owner of a community can ask for it to be verified.",
    )
  }

  const [pending] = await db
    .select({ id: verificationRequests.id })
    .from(verificationRequests)
    .where(
      and(
        eq(verificationRequests.communityId, community.id),
        eq(verificationRequests.status, "PENDING"),
      ),
    )
    .limit(1)

  if (pending) {
    return fail(
      "CONFLICT",
      "This community already has a request awaiting review.",
    )
  }

  /**
   * One transaction: the request, the badge that now says "pending", and the
   * audit row are one fact. A partial commit here would leave a community
   * claiming a review that does not exist.
   */
  const requestId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(verificationRequests)
      .values({
        communityId: community.id,
        requestedById: args.userId,
        evidence,
      })
      .returning({ id: verificationRequests.id })

    await tx
      .update(communities)
      .set({ verification: "PENDING" })
      .where(eq(communities.id, community.id))

    await tx.insert(auditLog).values({
      actorId: args.userId,
      action: AUDIT_ACTIONS.verificationRequested,
      targetKind: "COMMUNITY" satisfies AuditTargetKind,
      targetId: community.id,
      summary: `Requested verification for ${community.name}`,
    })

    return created.id
  })

  return ok({ requestId })
}

/**
 * The reviewer's queue.
 *
 * Oldest first, because a queue that is not ordered by waiting time is how a
 * club waits a month while newer requests are answered.
 */
export async function listVerificationRequests(args: {
  reviewerId: string
  status?: VerificationRequestStatus
}): Promise<ServiceResult<OrganizerVerificationRequest[]>> {
  const reviewer = await requireReviewer(args.reviewerId)
  if (!reviewer.ok) return reviewer

  const rows = await db
    .select({
      id: verificationRequests.id,
      status: verificationRequests.status,
      evidence: verificationRequests.evidence,
      createdAt: verificationRequests.createdAt,
      decidedAt: verificationRequests.decidedAt,
      reviewerNote: verificationRequests.reviewerNote,
      communityId: communities.id,
      communitySlug: communities.slug,
      communityName: communities.name,
      communityVerification: communities.verification,
      requestedById: users.id,
      requestedByName: users.name,
    })
    .from(verificationRequests)
    .innerJoin(
      communities,
      eq(communities.id, verificationRequests.communityId),
    )
    .leftJoin(users, eq(users.id, verificationRequests.requestedById))
    .where(
      args.status ? eq(verificationRequests.status, args.status) : undefined,
    )
    .orderBy(asc(verificationRequests.createdAt))

  return ok(
    rows.map((row) => ({
      id: row.id,
      status: row.status,
      evidence: row.evidence,
      requestedAt: row.createdAt.toISOString(),
      decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
      reviewerNote: row.reviewerNote,
      community: {
        id: row.communityId,
        slug: row.communitySlug,
        name: row.communityName,
        verification: row.communityVerification,
      },
      requestedBy: row.requestedById
        ? { id: row.requestedById, name: row.requestedByName }
        : null,
    })),
  )
}

/**
 * Approve or reject, and apply the consequences.
 *
 * Approval does three things at once: the community becomes verified, the
 * person who asked becomes an organiser, and the decision is recorded. All
 * three in one transaction, because a verified club whose owner was not
 * promoted is a club that cannot create the events it was verified to run.
 */
export async function reviewVerificationRequest(args: {
  reviewerId: string
  input: unknown
}): Promise<ServiceResult<{ status: "APPROVED" | "REJECTED" }>> {
  const reviewer = await requireReviewer(args.reviewerId)
  if (!reviewer.ok) return reviewer

  const parsed = reviewVerificationSchema.safeParse(args.input)
  if (!parsed.success) {
    return fail(
      "INVALID",
      parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    )
  }

  const { requestId, decision, note } = parsed.data

  const [request] = await db
    .select({
      id: verificationRequests.id,
      status: verificationRequests.status,
      communityId: verificationRequests.communityId,
      requestedById: verificationRequests.requestedById,
      communityName: communities.name,
    })
    .from(verificationRequests)
    .innerJoin(
      communities,
      eq(communities.id, verificationRequests.communityId),
    )
    .where(eq(verificationRequests.id, requestId))
    .limit(1)

  if (!request) {
    return fail("NOT_FOUND", "That request does not exist.")
  }

  if (request.status !== "PENDING") {
    return fail("CONFLICT", "That request has already been decided.")
  }

  /**
   * An admin may not verify their own club.
 *
   * This is the whole point of having a review step. Without it, the one person
   * who both wants recognition and can grant it is the one person who needs no
   * approval at all - and being an admin is not evidence that a club is real.
   */
  if (request.requestedById && request.requestedById === args.reviewerId) {
    return fail(
      "FORBIDDEN",
      "You cannot review your own verification request. Ask another admin.",
    )
  }

  const nextVerification = communityVerificationForDecision(decision)

  await db.transaction(async (tx) => {
    await tx
      .update(verificationRequests)
      .set({
        status: decision,
        reviewedById: args.reviewerId,
        reviewerNote: note ?? null,
        decidedAt: new Date(),
      })
      .where(eq(verificationRequests.id, request.id))

    await tx
      .update(communities)
      .set({ verification: nextVerification })
      .where(eq(communities.id, request.communityId))

    if (decision === "APPROVED" && request.requestedById) {
      const [owner] = await tx
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, request.requestedById))
        .limit(1)

      if (owner) {
        const nextRole = roleAfterVerification(owner.role)
        // Only ever a promotion, and only when it changes something.
        if (nextRole !== owner.role) {
          await tx
            .update(users)
            .set({ role: nextRole })
            .where(eq(users.id, request.requestedById))
        }
      }
    }

    await tx.insert(auditLog).values({
      actorId: args.reviewerId,
      action:
        decision === "APPROVED"
          ? AUDIT_ACTIONS.verificationApproved
          : AUDIT_ACTIONS.verificationRejected,
      targetKind: "COMMUNITY" satisfies AuditTargetKind,
      targetId: request.communityId,
      summary: `${decision === "APPROVED" ? "Approved" : "Rejected"} verification for ${request.communityName}`,
    })
  })

  return ok({ status: decision })
}

export type AuditLogEntry = {
  id: string
  action: string
  targetKind: AuditTargetKind
  targetId: string
  summary: string
  at: string
  actor: { id: string; name: string | null } | null
}

/**
 * The audit trail, newest first.
 *
 * Reviewer-gated like the queue itself: the log names who did what to whom, and
 * that is not public information. Read-only by design - there is no service
 * function that edits or deletes an entry, which is what makes it a trail.
 */
export async function listAuditEntries(args: {
  viewerId: string
  limit?: number
}): Promise<ServiceResult<AuditLogEntry[]>> {
  const viewer = await requireReviewer(args.viewerId)
  if (!viewer.ok) return viewer

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      targetKind: auditLog.targetKind,
      targetId: auditLog.targetId,
      summary: auditLog.summary,
      createdAt: auditLog.createdAt,
      actorId: users.id,
      actorName: users.name,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .orderBy(desc(auditLog.createdAt))
    .limit(Math.min(args.limit ?? 50, 200))

  return ok(
    rows.map((row) => ({
      id: row.id,
      action: row.action,
      targetKind: row.targetKind,
      targetId: row.targetId,
      summary: row.summary,
      at: row.createdAt.toISOString(),
      actor: row.actorId ? { id: row.actorId, name: row.actorName } : null,
    })),
  )
}
