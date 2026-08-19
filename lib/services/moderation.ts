import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  auditLog,
  memberships,
  postComments,
  posts,
  reports,
  users,
  reportReasons,
  type AuditTargetKind,
  type ModerationStatusValue,
  type ReportReasonValue,
} from "@/lib/db/schema"
import { canDecideReport, canReport } from "@/lib/domain/activity"
import { canModerate } from "@/lib/domain/membership"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Reporting content, and the moderation queue it forms.
 *
 * Built entirely on the existing `reports` table, its existing reason
 * vocabulary and the existing `audit_log`. Nothing here is a second moderation
 * system: the table already stores reporter, target, reason, status, reviewer
 * and resolution note, and `lib/domain/moderation.ts` already ranks reasons by
 * severity. This module is the missing write and read paths.
 *
 * The reasons a client may send are the table's enum, checked here rather than
 * trusted, so a crafted request cannot file a report with a made-up reason that
 * the queue's severity ordering has no rule for.
 */

/** Runtime guard for a value arriving from a form. */
export function isReportReason(value: unknown): value is ReportReasonValue {
  return (
    typeof value === "string" &&
    (reportReasons as readonly string[]).includes(value)
  )
}

/** What can be reported. Deliberately not every audit target kind. */
const REPORTABLE = ["POST", "COMMENT"] as const

export type ReportableKind = (typeof REPORTABLE)[number]

/**
 * File a report.
 *
 * Duplicate reports are absorbed rather than refused. The unique constraint
 * already stops one person's second report on the same thing from being
 * *counted*, and telling them "you already reported this" only informs them
 * that their first report existed - which they may have forgotten, and which
 * gives them nothing to do. Reporting twice returns success.
 *
 * The reporter is not permitted to report their own content: it occupies a
 * moderator's queue with something the author can fix with delete.
 */
export async function reportContent(args: {
  reporterId: string
  targetKind: ReportableKind
  targetId: string
  reason: ReportReasonValue
  detail?: string
  now?: Date
}): Promise<ServiceResult<{ filed: true }>> {
  if (!isReportReason(args.reason)) {
    return fail("INVALID", "Choose a reason for reporting this.")
  }

  // Resolve the target and its author from the real row. Existence is checked
  // so the queue cannot be filled with reports against ids that never existed.
  const authorId =
    args.targetKind === "POST"
      ? await postAuthor(args.targetId)
      : await commentAuthor(args.targetId)

  if (authorId === undefined) {
    return fail("NOT_FOUND", "That content no longer exists.")
  }

  if (!canReport({ authorId, viewerId: args.reporterId })) {
    return fail(
      "INVALID",
      "This is your own content - you can delete it instead.",
    )
  }

  await db
    .insert(reports)
    .values({
      reporterId: args.reporterId,
      targetKind: args.targetKind,
      targetId: args.targetId,
      reason: args.reason,
      detail: (args.detail ?? "").slice(0, 1000),
      createdAt: args.now ?? new Date(),
    })
    // The constraint is `reports_once_per_reporter`. Absorbing the conflict is
    // what makes a second report a no-op rather than an error.
    .onConflictDoNothing()

  return ok({ filed: true })
}

/** `undefined` means no such row; `null` means the author's account is gone. */
async function postAuthor(id: string): Promise<string | null | undefined> {
  const [row] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1)

  return row ? row.authorId : undefined
}

async function commentAuthor(id: string): Promise<string | null | undefined> {
  const [row] = await db
    .select({ authorId: postComments.authorId })
    .from(postComments)
    .where(eq(postComments.id, id))
    .limit(1)

  return row ? row.authorId : undefined
}

export type QueuedReport = {
  id: string
  reason: ReportReasonValue
  detail: string
  status: ModerationStatusValue
  createdAt: string
  targetKind: AuditTargetKind
  targetId: string
  /** The reported content itself, so a moderator can decide without hunting. */
  target: {
    title: string
    excerpt: string
    communitySlug: string | null
    authorName: string | null
    removed: boolean
  } | null
  /** How many separate people reported this thing. */
  reportCount: number
}

/**
 * The moderation queue for the communities this person moderates.
 *
 * Scoped by moderated community, not by role flag: a moderator of the Coding
 * Club has no business reading reports filed in the Debate Society. Campus
 * admins are handled by the same query because the role check below widens the
 * community set rather than bypassing it.
 *
 * Oldest first, so nothing waits a month. Deliberately not ordered by report
 * count - a pile-on must not outrank a single credible harassment report,
 * which is the ordering `lib/domain/moderation.ts` already argues for.
 */
export async function listModerationQueue(args: {
  moderatorId: string
  status?: ModerationStatusValue
  limit?: number
}): Promise<ServiceResult<QueuedReport[]>> {
  const [viewer] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, args.moderatorId))
    .limit(1)

  if (!viewer) return fail("NOT_FOUND", "That account no longer exists.")

  const isAdmin = viewer.role === "ADMIN"

  const moderated = await db
    .select({ communityId: memberships.communityId })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, args.moderatorId),
        inArray(memberships.state, ["MODERATOR", "OWNER"]),
      ),
    )

  const communityIds = moderated.map((row) => row.communityId)

  if (!isAdmin && communityIds.length === 0) {
    return fail("FORBIDDEN", "You do not moderate any communities.")
  }

  const status = args.status ?? "OPEN"

  const rows = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      detail: reports.detail,
      status: reports.status,
      createdAt: reports.createdAt,
      targetKind: reports.targetKind,
      targetId: reports.targetId,
    })
    .from(reports)
    .where(
      and(
        eq(reports.status, status),
        inArray(reports.targetKind, [...REPORTABLE]),
      ),
    )
    .orderBy(asc(reports.createdAt))
    .limit(Math.min(args.limit ?? 50, 100))

  if (rows.length === 0) return ok([])

  // Hydrate targets in two queries for the whole page, not one per report.
  const postIds = rows.filter((r) => r.targetKind === "POST").map((r) => r.targetId)
  const commentIds = rows
    .filter((r) => r.targetKind === "COMMENT")
    .map((r) => r.targetId)

  const [postRows, commentRows, counts] = await Promise.all([
    postIds.length > 0
      ? db
          .select({
            id: posts.id,
            title: posts.title,
            body: posts.body,
            communityId: posts.communityId,
            removedAt: posts.removedAt,
            authorName: users.name,
          })
          .from(posts)
          .leftJoin(users, eq(users.id, posts.authorId))
          .where(inArray(posts.id, postIds))
      : Promise.resolve([]),
    commentIds.length > 0
      ? db
          .select({
            id: postComments.id,
            body: postComments.body,
            communityId: posts.communityId,
            removedAt: postComments.removedAt,
            authorName: users.name,
          })
          .from(postComments)
          .innerJoin(posts, eq(posts.id, postComments.postId))
          .leftJoin(users, eq(users.id, postComments.authorId))
          .where(inArray(postComments.id, commentIds))
      : Promise.resolve([]),
    db
      .select({
        targetKind: reports.targetKind,
        targetId: reports.targetId,
        count: sql<number>`count(*)::int`,
      })
      .from(reports)
      .where(
        inArray(reports.targetId, [
          ...new Set(rows.map((row) => row.targetId)),
        ]),
      )
      .groupBy(reports.targetKind, reports.targetId),
  ])

  // Community slugs for the hydrated targets, one query.
  const communityIdsForTargets = [
    ...new Set([
      ...postRows.map((row) => row.communityId),
      ...commentRows.map((row) => row.communityId),
    ]),
  ]

  const slugRows =
    communityIdsForTargets.length > 0
      ? await db
          .select({ id: sql<string>`id`, slug: sql<string>`slug` })
          .from(sql`communities`)
          .where(sql`id in ${communityIdsForTargets}`)
      : []

  const slugs = new Map(slugRows.map((row) => [row.id, row.slug]))
  const countFor = new Map(
    counts.map((row) => [`${row.targetKind}:${row.targetId}`, row.count]),
  )

  const postById = new Map(postRows.map((row) => [row.id, row]))
  const commentById = new Map(commentRows.map((row) => [row.id, row]))

  const visible = rows.filter((row) => {
    if (isAdmin) return true
    const communityId =
      row.targetKind === "POST"
        ? postById.get(row.targetId)?.communityId
        : commentById.get(row.targetId)?.communityId
    return communityId ? communityIds.includes(communityId) : false
  })

  return ok(
    visible.map((row) => {
      const post = postById.get(row.targetId)
      const comment = commentById.get(row.targetId)
      const source = post ?? comment

      return {
        id: row.id,
        reason: row.reason,
        detail: row.detail,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        targetKind: row.targetKind,
        targetId: row.targetId,
        target: source
          ? {
              title: post ? post.title : "Comment",
              excerpt: source.body.slice(0, 300),
              communitySlug: slugs.get(source.communityId) ?? null,
              authorName: source.authorName,
              removed: source.removedAt !== null,
            }
          : null,
        reportCount: countFor.get(`${row.targetKind}:${row.targetId}`) ?? 1,
      }
    }),
  )
}

/**
 * Resolve or dismiss a report, optionally removing the content.
 *
 * Both outcomes are decisions and both are audited. Dismissal especially: "a
 * moderator looked at this and disagreed" is exactly the kind of judgement that
 * has to be attributable later, and an audit log that only records removals
 * reads as though moderators never decline.
 *
 * The removal is written in the same transaction as the decision, so a report
 * cannot end up marked resolved while the content it was about is still up.
 */
export async function decideReport(args: {
  moderatorId: string
  reportId: string
  decision: "RESOLVED" | "DISMISSED"
  /** Remove the reported content as part of resolving. */
  removeContent?: boolean
  note?: string
  now?: Date
}): Promise<ServiceResult<{ id: string; removed: boolean }>> {
  const [report] = await db
    .select({
      id: reports.id,
      status: reports.status,
      targetKind: reports.targetKind,
      targetId: reports.targetId,
    })
    .from(reports)
    .where(eq(reports.id, args.reportId))
    .limit(1)

  if (!report) return fail("NOT_FOUND", "That report no longer exists.")

  if (!canDecideReport(report.status)) {
    return fail("CONFLICT", "That report has already been decided.")
  }

  if (report.targetKind !== "POST" && report.targetKind !== "COMMENT") {
    return fail("INVALID", "That report is not about community content.")
  }

  // Authorization: moderator of the community the content lives in, or admin.
  const communityId =
    report.targetKind === "POST"
      ? (
          await db
            .select({ communityId: posts.communityId })
            .from(posts)
            .where(eq(posts.id, report.targetId))
            .limit(1)
        )[0]?.communityId
      : (
          await db
            .select({ communityId: posts.communityId })
            .from(postComments)
            .innerJoin(posts, eq(posts.id, postComments.postId))
            .where(eq(postComments.id, report.targetId))
            .limit(1)
        )[0]?.communityId

  if (!communityId) return fail("NOT_FOUND", "That content no longer exists.")

  const [viewer] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, args.moderatorId))
    .limit(1)

  const [membership] = await db
    .select({ state: memberships.state })
    .from(memberships)
    .where(
      and(
        eq(memberships.communityId, communityId),
        eq(memberships.userId, args.moderatorId),
      ),
    )
    .limit(1)

  const allowed =
    viewer?.role === "ADMIN" ||
    (membership ? canModerate(membership.state) : false)

  if (!allowed) {
    return fail("FORBIDDEN", "You do not moderate this content.")
  }

  const now = args.now ?? new Date()
  const shouldRemove = args.decision === "RESOLVED" && args.removeContent === true

  await db.transaction(async (tx) => {
    await tx
      .update(reports)
      .set({
        status: args.decision,
        reviewedById: args.moderatorId,
        reviewedAt: now,
        resolutionNote: args.note ?? "",
      })
      .where(eq(reports.id, args.reportId))

    if (shouldRemove) {
      if (report.targetKind === "POST") {
        await tx
          .update(posts)
          .set({
            removedAt: now,
            removedById: args.moderatorId,
            removalReason: args.note ?? "Removed after review",
          })
          .where(and(eq(posts.id, report.targetId), isNull(posts.removedAt)))
      } else {
        await tx
          .update(postComments)
          .set({
            removedAt: now,
            removedById: args.moderatorId,
            removalReason: args.note ?? "Removed after review",
          })
          .where(
            and(
              eq(postComments.id, report.targetId),
              isNull(postComments.removedAt),
            ),
          )
      }
    }

    await tx.insert(auditLog).values({
      actorId: args.moderatorId,
      action:
        args.decision === "RESOLVED" ? "report.resolved" : "report.dismissed",
      targetKind: report.targetKind,
      targetId: report.targetId,
      summary:
        args.decision === "RESOLVED"
          ? `Resolved a report${shouldRemove ? " and removed the content" : ""}${args.note ? `: ${args.note}` : ""}`
          : `Dismissed a report${args.note ? `: ${args.note}` : ""}`,
      createdAt: now,
    })
  })

  return ok({ id: args.reportId, removed: shouldRemove })
}

/** Reports this viewer has already filed, so the UI does not offer it twice. */
export async function reportedTargetIds(args: {
  reporterId: string
  targetKind: ReportableKind
  targetIds: string[]
}): Promise<Set<string>> {
  if (args.targetIds.length === 0) return new Set()

  const rows = await db
    .select({ targetId: reports.targetId })
    .from(reports)
    .where(
      and(
        eq(reports.reporterId, args.reporterId),
        eq(reports.targetKind, args.targetKind),
        inArray(reports.targetId, args.targetIds),
      ),
    )

  return new Set(rows.map((row) => row.targetId))
}

/** Newest audit entries for one piece of content, for an authorized operator. */
export async function auditTrailFor(args: {
  targetKind: AuditTargetKind
  targetId: string
  limit?: number
}): Promise<Array<{ action: string; summary: string; createdAt: string }>> {
  const rows = await db
    .select({
      action: auditLog.action,
      summary: auditLog.summary,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.targetKind, args.targetKind),
        eq(auditLog.targetId, args.targetId),
      ),
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(args.limit ?? 20)

  return rows.map((row) => ({
    action: row.action,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
  }))
}
