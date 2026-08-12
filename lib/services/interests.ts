import { and, asc, eq, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  interestSuggestionSupporters,
  interestSuggestions,
  interests,
  userInterests,
} from "@/lib/db/schema"
import {
  MINIMUM_INTERESTS,
  normaliseInterestLabel,
} from "@/lib/domain/interest"
import type { Interest } from "@/lib/domain/types"
import {
  setInterestsSchema,
  suggestInterestSchema,
} from "@/lib/schemas/community"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/** The curated taxonomy, in picker order. Retired interests are never offered. */
export async function listInterests(): Promise<Interest[]> {
  return db
    .select({ id: interests.id, slug: interests.slug, label: interests.label })
    .from(interests)
    .where(eq(interests.status, "ACTIVE"))
    .orderBy(asc(interests.sortOrder), asc(interests.label))
}

export async function getUserInterests(userId: string): Promise<Interest[]> {
  return db
    .select({ id: interests.id, slug: interests.slug, label: interests.label })
    .from(userInterests)
    .innerJoin(interests, eq(interests.id, userInterests.interestId))
    .where(eq(userInterests.userId, userId))
    .orderBy(asc(interests.sortOrder))
}

/**
 * Whether this student has finished onboarding.
 *
 * "Finished" is defined here, in the same file as the write that satisfies it,
 * so the layout gate and the picker cannot drift apart. It is deliberately not
 * a boolean column on the user: a flag would have to be kept in step with the
 * rows by hand, and the first time it drifts a student is either stuck in a
 * loop or let past with an empty selection.
 *
 * Only ACTIVE interests count. A student whose three picks were all later
 * retired has an empty recommendation feed, which is exactly the state
 * onboarding exists to prevent - counting the rows alone would call that done.
 *
 * A count rather than getUserInterests, because this runs on every render of
 * every authenticated page and does not need the labels.
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userInterests)
    .innerJoin(interests, eq(interests.id, userInterests.interestId))
    .where(
      and(
        eq(userInterests.userId, userId),
        eq(interests.status, "ACTIVE"),
      ),
    )

  return (row?.count ?? 0) >= MINIMUM_INTERESTS
}

/**
 * Replace a student's interests wholesale.
 *
 * Delete-then-insert rather than a diff, because the picker submits the full
 * set and a diff would be more code for an identical result on a table with at
 * most seventeen rows per user. Wrapped in a transaction so a failure halfway
 * cannot leave a student with no interests at all - which would silently empty
 * their recommendations.
 */
export async function setUserInterests(args: {
  userId: string
  input: unknown
}): Promise<ServiceResult<Interest[]>> {
  const parsed = setInterestsSchema.safeParse(args.input)
  if (!parsed.success) {
    return fail(
      "INVALID",
      parsed.error.issues[0]?.message ?? "Pick a few interests to continue.",
    )
  }

  const requested = [...new Set(parsed.data.interestIds)]

  return db.transaction(async (tx) => {
    const valid = await tx
      .select({ id: interests.id })
      .from(interests)
      .where(eq(interests.status, "ACTIVE"))

    const validIds = new Set(valid.map((row) => row.id))
    const unknown = requested.filter((id) => !validIds.has(id))
    if (unknown.length > 0) {
      return fail("INVALID", "One of those interests is no longer available.")
    }

    await tx.delete(userInterests).where(eq(userInterests.userId, args.userId))
    await tx.insert(userInterests).values(
      requested.map((interestId) => ({ userId: args.userId, interestId })),
    )

    return ok(
      await tx
        .select({
          id: interests.id,
          slug: interests.slug,
          label: interests.label,
        })
        .from(userInterests)
        .innerJoin(interests, eq(interests.id, userInterests.interestId))
        .where(eq(userInterests.userId, args.userId))
        .orderBy(asc(interests.sortOrder)),
    )
  })
}

export type SuggestionOutcome =
  /** It already exists under a name the student did not search for. */
  | { status: "ALREADY_EXISTS"; interest: Interest }
  | { status: "RECORDED"; demandCount: number }

/**
 * A student asking for an interest the taxonomy does not have (D27).
 *
 * Three things happen in order, and the order matters. First we check whether
 * the thing already exists under another name - most "missing" interests are a
 * failed search, and telling the student "we call that Coding" is a better
 * outcome for them and for the taxonomy than queueing a suggestion nobody will
 * approve. Then the suggestion is recorded against its *normalised* label, so
 * repeat asks aggregate into one row. Only then does demand rise, and only for
 * a student who has not already asked.
 */
export async function suggestInterest(args: {
  userId: string
  input: unknown
}): Promise<ServiceResult<SuggestionOutcome>> {
  const parsed = suggestInterestSchema.safeParse(args.input)
  if (!parsed.success) {
    return fail(
      "INVALID",
      parsed.error.issues[0]?.message ?? "That does not look like an interest.",
    )
  }

  const label = parsed.data.label
  const normalised = normaliseInterestLabel(label)

  if (!normalised) {
    return fail("INVALID", "That does not look like an interest.")
  }

  const existing = await listInterests()
  const alreadyExists = existing.find(
    (interest) =>
      normaliseInterestLabel(interest.label) === normalised ||
      normaliseInterestLabel(interest.slug) === normalised,
  )

  if (alreadyExists) {
    return ok({ status: "ALREADY_EXISTS", interest: alreadyExists })
  }

  return db.transaction(async (tx) => {
    await tx
      .insert(interestSuggestions)
      .values({
        label,
        normalisedLabel: normalised,
        suggestedById: args.userId,
        demandCount: 0,
        status: "PENDING",
      })
      .onConflictDoNothing({ target: interestSuggestions.normalisedLabel })

    const [suggestion] = await tx
      .select({
        id: interestSuggestions.id,
        status: interestSuggestions.status,
        demandCount: interestSuggestions.demandCount,
        mapsToInterestId: interestSuggestions.mapsToInterestId,
      })
      .from(interestSuggestions)
      .where(eq(interestSuggestions.normalisedLabel, normalised))
      .limit(1)

    if (!suggestion) {
      return fail("INVALID", "We could not record that suggestion.")
    }

    // A reviewer already decided this is an existing interest under another
    // name. Send the student there instead of collecting the same signal twice.
    if (suggestion.status === "MERGED" && suggestion.mapsToInterestId) {
      const [mapped] = await tx
        .select({
          id: interests.id,
          slug: interests.slug,
          label: interests.label,
        })
        .from(interests)
        .where(eq(interests.id, suggestion.mapsToInterestId))
        .limit(1)

      if (mapped) return ok({ status: "ALREADY_EXISTS", interest: mapped })
    }

    const inserted = await tx
      .insert(interestSuggestionSupporters)
      .values({ suggestionId: suggestion.id, userId: args.userId })
      .onConflictDoNothing()
      .returning({ suggestionId: interestSuggestionSupporters.suggestionId })

    if (inserted.length === 0) {
      return ok({ status: "RECORDED", demandCount: suggestion.demandCount })
    }

    const [updated] = await tx
      .update(interestSuggestions)
      .set({ demandCount: sql`${interestSuggestions.demandCount} + 1` })
      .where(eq(interestSuggestions.id, suggestion.id))
      .returning({ demandCount: interestSuggestions.demandCount })

    return ok({ status: "RECORDED", demandCount: updated.demandCount })
  })
}
