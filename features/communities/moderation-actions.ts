"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { reviewJoinRequest } from "@/lib/services/communities"
import { fail, type ServiceFailure } from "@/lib/services/result"

/**
 * Approving and declining join requests.
 *
 * Returns only failures, like join and leave: the queue is server rendered, so
 * a decision that succeeded is shown by the row disappearing rather than by a
 * value travelling back to the browser.
 *
 * The moderator is taken from the session and never from the request. Everything
 * else - whether this account actually moderates this community, and whether
 * the request is still pending - is decided by `reviewJoinRequest`.
 */

const reviewSchema = z.object({
  communityId: z.string().min(1),
  /** Carried only so the right paths can be revalidated afterwards. */
  slug: z.string().regex(/^[a-z0-9-]{1,120}$/i),
  applicantId: z.string().min(1),
  decision: z.enum(["APPROVE", "DECLINE"]),
})

export async function reviewJoinRequestAction(
  input: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) {
    return fail("INVALID", "That request could not be identified.")
  }

  const result = await reviewJoinRequest({
    moderatorId: session.user.id,
    communityId: parsed.data.communityId,
    applicantId: parsed.data.applicantId,
    decision: parsed.data.decision,
  })

  if (!result.ok) return result

  const { slug } = parsed.data
  revalidatePath(`/communities/${slug}/requests`)
  // An approval changes the member count on both the detail page and the card
  // in the directory.
  revalidatePath(`/communities/${slug}`)
  revalidatePath("/communities")
}
