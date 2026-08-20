"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { decideReport } from "@/lib/services/moderation"

/**
 * Moderation decisions, from the queue UI.
 *
 * The moderator is taken from the session, never from the form. Everything the
 * client may influence is the report id, the decision, whether to remove, and
 * a note - and the service re-checks that this account moderates the community
 * the content actually lives in, so a crafted request with someone else's
 * report id is refused rather than obeyed.
 */

export async function decideReportAction(args: {
  reportId: string
  decision: "RESOLVED" | "DISMISSED"
  removeContent?: boolean
  note?: string
  /** Revalidated so a removal disappears from the community page too. */
  communitySlug?: string | null
}): Promise<{ message: string } | undefined> {
  const session = await auth()
  const moderatorId = session?.user?.id

  if (!moderatorId) return { message: "Sign in to review reports." }

  // Narrow the decision here rather than trusting the string that arrived.
  if (args.decision !== "RESOLVED" && args.decision !== "DISMISSED") {
    return { message: "Choose whether to resolve or dismiss this report." }
  }

  const note = args.note?.trim()

  const result = await decideReport({
    moderatorId,
    reportId: args.reportId,
    decision: args.decision,
    removeContent: args.removeContent === true,
    note: note ? note.slice(0, 500) : undefined,
  })

  if (!result.ok) return { message: result.message }

  revalidatePath("/admin/moderation")

  // A removal changes what everyone else sees, so the surfaces that read posts
  // are revalidated too. Feed and Search both filter removed rows already.
  if (result.data.removed) {
    revalidatePath("/home")
    revalidatePath("/explore")
    revalidatePath("/search")
    if (args.communitySlug) {
      revalidatePath(`/communities/${args.communitySlug}`)
    }
  }

  return undefined
}
