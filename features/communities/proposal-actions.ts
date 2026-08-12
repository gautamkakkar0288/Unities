"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { proposeCommunityFormSchema } from "@/lib/schemas/community"
import {
  proposeCommunity,
  scopePlaceIdsForUser,
  type ProposalOutcome,
} from "@/lib/services/communities"
import { fail, type ServiceResult } from "@/lib/services/result"

/**
 * Proposing a community.
 *
 * Unlike join and leave, this action returns its outcome. It has to: a
 * suspected duplicate is not a failure and not a success, it is a question the
 * student has to answer, and the only place that question can be asked is the
 * form they are standing in front of.
 *
 * The duplicate rule itself is not reimplemented here. `proposeCommunity` runs
 * `findSimilarCommunities` against the proposer's real discovery scope, and
 * this layer never decides what counts as a match - it only carries the answer
 * back.
 */

/**
 * The place a proposal is attached to is derived, never accepted.
 *
 * The form sends a scope; this turns it into an id using the proposer's own
 * campus. A `placeId` taken from the request would let anyone file proposals
 * against any university in the system, and a reviewer looking at a queue has
 * no way to notice that.
 */
async function resolvePlaceId(
  userId: string,
  scope: "UNIVERSITY" | "CITY" | "INTEREST",
): Promise<ServiceResult<string | null>> {
  if (scope === "INTEREST") return { ok: true, data: null }

  const [campusId, cityId] = await scopePlaceIdsForUser(userId)

  if (scope === "UNIVERSITY") {
    if (!campusId) {
      return fail(
        "INVALID",
        "Your account is not linked to a campus yet, so it cannot host a campus community. Propose it under your interests instead.",
      )
    }
    return { ok: true, data: campusId }
  }

  if (!cityId) {
    return fail(
      "INVALID",
      "We do not know which city your campus sits in yet. Propose it under your interests instead.",
    )
  }
  return { ok: true, data: cityId }
}

export async function proposeCommunityAction(
  input: unknown,
): Promise<ServiceResult<ProposalOutcome>> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const parsed = proposeCommunityFormSchema.safeParse(input)
  if (!parsed.success) {
    return fail(
      "INVALID",
      parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    )
  }

  // Read separately and compared to `true`, so anything other than an explicit
  // acknowledgement - including a missing field or a truthy string - leaves the
  // duplicate check switched on.
  const acknowledgedDuplicates =
    typeof input === "object" &&
    input !== null &&
    (input as Record<string, unknown>).acknowledgedDuplicates === true

  const place = await resolvePlaceId(session.user.id, parsed.data.scope)
  if (!place.ok) return place

  const result = await proposeCommunity({
    userId: session.user.id,
    input: { ...parsed.data, placeId: place.data, acknowledgedDuplicates },
  })

  // Only a real submission changes anything a page is showing. A duplicate
  // warning has written nothing, so there is nothing to revalidate.
  if (result.ok && result.data.status === "SUBMITTED") {
    revalidatePath("/communities")
  }

  return result
}
