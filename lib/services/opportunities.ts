import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  communities,
  interests,
  opportunities,
  type OpportunityKind,
} from "@/lib/db/schema"

/**
 * Opportunity reads.
 *
 * Deliberately small. The table is a listing that points at somebody else's
 * application form, so there is no registration loop to own here and no
 * viewer-specific state beyond whether the student saved it - which the saved
 * service answers, because that is where saving lives.
 */

export type OpportunitySummary = {
  id: string
  slug: string
  title: string
  description: string
  kind: OpportunityKind
  interest: { id: string; slug: string; label: string }
  /** Where to actually apply. May be empty for campus-only listings. */
  url: string
  /** Null means rolling. */
  deadline: string | null
  /** Set when a club is offering this rather than the university at large. */
  community: { id: string; slug: string; name: string } | null
}

const opportunitySelection = {
  id: opportunities.id,
  slug: opportunities.slug,
  title: opportunities.title,
  description: opportunities.description,
  kind: opportunities.kind,
  url: opportunities.url,
  deadline: opportunities.deadline,
  interestId: interests.id,
  interestSlug: interests.slug,
  interestLabel: interests.label,
  communityId: communities.id,
  communitySlug: communities.slug,
  communityName: communities.name,
}

type OpportunityRow = {
  id: string
  slug: string
  title: string
  description: string
  kind: OpportunityKind
  url: string
  deadline: Date | null
  interestId: string
  interestSlug: string
  interestLabel: string
  communityId: string | null
  communitySlug: string | null
  communityName: string | null
}

function toSummary(row: OpportunityRow): OpportunitySummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    kind: row.kind,
    interest: {
      id: row.interestId,
      slug: row.interestSlug,
      label: row.interestLabel,
    },
    url: row.url,
    deadline: row.deadline ? row.deadline.toISOString() : null,
    community:
      row.communityId && row.communitySlug && row.communityName
        ? {
            id: row.communityId,
            slug: row.communitySlug,
            name: row.communityName,
          }
        : null,
  }
}

/**
 * Open listings, closest deadline first, rolling ones last.
 *
 * The ordering is expressed as an explicit `is null` sort key rather than
 * `nulls last`, matching the convention used elsewhere in the project so the
 * same SQL runs against both Postgres and the demo database.
 *
 * Removed listings never appear. Removal is a moderation state, not a delete,
 * so the row survives for review while the student stops seeing it.
 */
export async function listOpportunities(args: {
  /** Restrict to specific rows, e.g. the ones a student saved. */
  ids?: string[]
  limit?: number
}): Promise<OpportunitySummary[]> {
  // An empty `inArray` is not a valid SQL expression, and "no ids" already has
  // an obvious answer.
  if (args.ids && args.ids.length === 0) return []

  const rollingLast = sql<number>`case when ${opportunities.deadline} is null then 1 else 0 end`

  const query = db
    .select(opportunitySelection)
    .from(opportunities)
    .innerJoin(interests, eq(interests.id, opportunities.interestId))
    .leftJoin(communities, eq(communities.id, opportunities.communityId))
    .where(
      and(
        isNull(opportunities.removedAt),
        args.ids ? inArray(opportunities.id, args.ids) : undefined,
      ),
    )
    .orderBy(
      asc(rollingLast),
      asc(opportunities.deadline),
      asc(opportunities.title),
    )

  const rows = args.limit ? await query.limit(args.limit) : await query

  return (rows as OpportunityRow[]).map(toSummary)
}

export async function getOpportunityBySlug(
  slug: string,
): Promise<OpportunitySummary | null> {
  const [row] = await db
    .select(opportunitySelection)
    .from(opportunities)
    .innerJoin(interests, eq(interests.id, opportunities.interestId))
    .leftJoin(communities, eq(communities.id, opportunities.communityId))
    .where(and(eq(opportunities.slug, slug), isNull(opportunities.removedAt)))
    .limit(1)

  return row ? toSummary(row as OpportunityRow) : null
}
