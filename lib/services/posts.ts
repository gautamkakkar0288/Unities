import { and, desc, eq, inArray, isNull } from "drizzle-orm"

import { db } from "@/lib/db"
import { communities, events, posts, users } from "@/lib/db/schema"
import type { VerificationState } from "@/lib/domain/types"

/**
 * Community announcement reads.
 *
 * The posts table has existed since the demo database landed but had no read
 * path, which is why "Campus updates" could not be built until now. This is
 * reads only: publishing an announcement is an organiser flow with its own
 * authorisation and its own notification fan-out, and bolting a write onto a
 * feed query is how that ends up unaudited.
 *
 * Removed posts never appear. Removal is a moderation state rather than a
 * delete, so the row survives for review while students stop seeing it.
 */

export type PostSummary = {
  id: string
  title: string
  body: string
  createdAt: string
  community: {
    id: string
    slug: string
    name: string
    verification: VerificationState
  }
  /**
   * Display name only, never the email. A feed is the last place that should be
   * handing out addresses, and the projection is what guarantees it - not the
   * discipline of whoever writes the component.
   */
  authorName: string | null
  /** Set when the announcement is about an event, so the card can link to it. */
  event: { slug: string; title: string } | null
  /** Where the card goes: the community that said it. */
  href: string
}

type PostRow = {
  id: string
  title: string
  body: string
  createdAt: Date
  communityId: string
  communitySlug: string
  communityName: string
  communityVerification: VerificationState
  authorName: string | null
  eventSlug: string | null
  eventTitle: string | null
}

function toSummary(row: PostRow): PostSummary {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    community: {
      id: row.communityId,
      slug: row.communitySlug,
      name: row.communityName,
      verification: row.communityVerification,
    },
    authorName: row.authorName,
    event:
      row.eventSlug && row.eventTitle
        ? { slug: row.eventSlug, title: row.eventTitle }
        : null,
    href: `/communities/${row.communitySlug}`,
  }
}

/**
 * Recent announcements, newest first.
 *
 * One query with three joins rather than a post query followed by a lookup per
 * row. Fifteen announcements would otherwise be forty-six round trips, and the
 * feed renders every one of them on first paint.
 *
 * Ties on `createdAt` break on id so the order is stable - the demo seed writes
 * several posts at the same instant, and a feed that reshuffles between two
 * renders of the same data looks broken even though nothing is wrong.
 */
export async function listRecentPosts(args: {
  limit?: number
  /** Restrict to specific communities, e.g. the ones a student joined. */
  communityIds?: string[]
}): Promise<PostSummary[]> {
  if (args.communityIds && args.communityIds.length === 0) return []

  const query = db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      createdAt: posts.createdAt,
      communityId: communities.id,
      communitySlug: communities.slug,
      communityName: communities.name,
      communityVerification: communities.verification,
      authorName: users.name,
      eventSlug: events.slug,
      eventTitle: events.title,
    })
    .from(posts)
    .innerJoin(communities, eq(communities.id, posts.communityId))
    .leftJoin(users, eq(users.id, posts.authorId))
    .leftJoin(events, eq(events.id, posts.eventId))
    .where(
      and(
        isNull(posts.removedAt),
        isNull(communities.archivedAt),
        args.communityIds
          ? inArray(posts.communityId, args.communityIds)
          : undefined,
      ),
    )
    .orderBy(desc(posts.createdAt), desc(posts.id))

  const rows = args.limit ? await query.limit(args.limit) : await query

  return (rows as PostRow[]).map(toSummary)
}
