"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { joinCommunity, leaveCommunity } from "@/lib/services/communities"
import { fail, type ServiceFailure } from "@/lib/services/result"

/**
 * Joining and leaving.
 *
 * A server action is a public HTTP endpoint. The user is therefore taken from
 * the session and never from the arguments - an action that accepted a userId
 * would let anyone join anyone to anything - and the authorisation itself stays
 * in the service, which reads the join policy from the row at write time.
 *
 * These return the failure or nothing. There is no success payload because the
 * page is revalidated and re-rendered from the database; handing the client a
 * state to display would create a second source of truth that can disagree with
 * the row.
 */

type Target = { communityId: string; slug: string }

/**
 * Slugs are used to build a revalidation path, so they are checked rather than
 * trusted. The community id is opaque to us and validated by the service, which
 * returns NOT_FOUND for anything that does not resolve.
 */
const SLUG = /^[a-z0-9-]{1,120}$/i

function readTarget(input: unknown): Target | null {
  if (typeof input !== "object" || input === null) return null

  const { communityId, slug } = input as Record<string, unknown>

  if (typeof communityId !== "string" || communityId.length === 0) return null
  if (typeof slug !== "string" || !SLUG.test(slug)) return null

  return { communityId, slug }
}

/**
 * The directory shows member counts and the viewer's own state on every card,
 * and the detail page shows both plus the join control. Both are server
 * rendered, so without this the student presses Join and the page keeps
 * insisting they are not a member.
 */
function revalidateCommunity(slug: string) {
  revalidatePath("/communities")
  revalidatePath(`/communities/${slug}`)
}

export async function joinCommunityAction(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail("FORBIDDEN", "Your session has expired. Sign in again to continue.")
  }

  const target = readTarget(input)
  if (!target) return fail("INVALID", "That community could not be identified.")

  const result = await joinCommunity({
    userId: session.user.id,
    communityId: target.communityId,
  })

  if (!result.ok) return result

  revalidateCommunity(target.slug)
}

export async function leaveCommunityAction(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail("FORBIDDEN", "Your session has expired. Sign in again to continue.")
  }

  const target = readTarget(input)
  if (!target) return fail("INVALID", "That community could not be identified.")

  const result = await leaveCommunity({
    userId: session.user.id,
    communityId: target.communityId,
  })

  if (!result.ok) return result

  revalidateCommunity(target.slug)
}
