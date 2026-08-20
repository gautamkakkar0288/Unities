"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import {
  addComment,
  editPost,
  publishPost,
  removeComment,
  removePost,
  setPostReaction,
} from "@/lib/services/community-activity"
import {
  isReportReason,
  reportContent,
  type ReportableKind,
} from "@/lib/services/moderation"

/**
 * Server actions for community activity.
 *
 * The shape follows `features/communities/actions.ts`: success returns nothing
 * and revalidates so the page re-renders from the database, failure returns the
 * service's message. The messages are written for students, which is the reason
 * the services return prose rather than codes.
 *
 * **Every action derives the actor from `auth()`.** None of them accepts a user
 * id, an author, a community for an existing post, a timestamp, or any
 * moderation field. Where a community id is accepted - publishing only - the
 * service independently checks that this actor is a member of it, so passing
 * someone else's community id gets a refusal rather than a post.
 *
 * `slug` is accepted purely to know which path to revalidate. It cannot affect
 * authorization: it is never read by the services.
 */

type ActionFailure = { message: string } | undefined

async function actorId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

/**
 * Revalidate everywhere an announcement is visible.
 *
 * The community page, and Home because "Campus updates" reads the same table -
 * which is what makes a new post appear in the feed without a seed reset. A
 * removal reaches the same three places for the same reason.
 */
function revalidateActivity(slug: string) {
  revalidatePath(`/communities/${slug}`)
  revalidatePath("/home")
  revalidatePath("/explore")
}

export async function publishPostAction(input: {
  communityId: string
  slug: string
  title: string
  body: string
  eventId?: string | null
}): Promise<ActionFailure> {
  const viewerId = await actorId()
  if (!viewerId) return { message: "Sign in to post an update." }

  const result = await publishPost({
    authorId: viewerId,
    communityId: input.communityId,
    input: {
      title: input.title,
      body: input.body,
      // An empty string from a <select> is "no event", not an id.
      eventId: input.eventId ? input.eventId : null,
    },
  })

  if (!result.ok) return { message: result.error.message }

  revalidateActivity(input.slug)
  return undefined
}

export async function editPostAction(input: {
  postId: string
  slug: string
  title: string
  body: string
  eventId?: string | null
}): Promise<ActionFailure> {
  const viewerId = await actorId()
  if (!viewerId) return { message: "Sign in to edit this update." }

  const result = await editPost({
    actorId: viewerId,
    postId: input.postId,
    input: {
      title: input.title,
      body: input.body,
      eventId: input.eventId ? input.eventId : null,
    },
  })

  if (!result.ok) return { message: result.error.message }

  revalidateActivity(input.slug)
  return undefined
}

export async function removePostAction(input: {
  postId: string
  slug: string
  reason?: string
}): Promise<ActionFailure> {
  const viewerId = await actorId()
  if (!viewerId) return { message: "Sign in to remove this update." }

  const result = await removePost({
    actorId: viewerId,
    postId: input.postId,
    reason: input.reason,
  })

  if (!result.ok) return { message: result.error.message }

  revalidateActivity(input.slug)
  return undefined
}

export async function setReactionAction(input: {
  postId: string
  slug: string
  reacted: boolean
}): Promise<ActionFailure> {
  const viewerId = await actorId()
  if (!viewerId) return { message: "Sign in to react." }

  const result = await setPostReaction({
    actorId: viewerId,
    postId: input.postId,
    reacted: input.reacted,
  })

  if (!result.ok) return { message: result.error.message }

  // Only the pages that show the count. A like is not a feed event.
  revalidatePath(`/communities/${input.slug}`)
  revalidatePath("/home")
  return undefined
}

export async function addCommentAction(input: {
  postId: string
  slug: string
  body: string
}): Promise<ActionFailure> {
  const viewerId = await actorId()
  if (!viewerId) return { message: "Sign in to comment." }

  const result = await addComment({
    actorId: viewerId,
    postId: input.postId,
    input: { body: input.body },
  })

  if (!result.ok) return { message: result.error.message }

  revalidatePath(`/communities/${input.slug}`)
  revalidatePath("/home")
  return undefined
}

export async function removeCommentAction(input: {
  commentId: string
  slug: string
}): Promise<ActionFailure> {
  const viewerId = await actorId()
  if (!viewerId) return { message: "Sign in to delete this comment." }

  const result = await removeComment({
    actorId: viewerId,
    commentId: input.commentId,
  })

  if (!result.ok) return { message: result.error.message }

  revalidatePath(`/communities/${input.slug}`)
  revalidatePath("/home")
  return undefined
}

/**
 * File a report.
 *
 * The reason is checked against the table's enum here *and* in the service.
 * Twice on purpose: this one gives a clean refusal to a mistyped form, and the
 * service's one is the guarantee, since the action is not the only caller.
 */
export async function reportContentAction(input: {
  targetKind: ReportableKind
  targetId: string
  slug: string
  reason: string
  detail?: string
}): Promise<ActionFailure> {
  const viewerId = await actorId()
  if (!viewerId) return { message: "Sign in to report this." }

  if (!isReportReason(input.reason)) {
    return { message: "Choose a reason for reporting this." }
  }

  const result = await reportContent({
    reporterId: viewerId,
    targetKind: input.targetKind,
    targetId: input.targetId,
    reason: input.reason,
    detail: input.detail,
  })

  if (!result.ok) return { message: result.error.message }

  revalidatePath(`/communities/${input.slug}`)
  return undefined
}
