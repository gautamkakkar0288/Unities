"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { fail, type ServiceFailure } from "@/lib/services/result"
import { saveItem, unsaveItem } from "@/lib/services/saved"

/**
 * Saving and unsaving.
 *
 * The student comes from the session, never from the arguments. An action that
 * accepted a userId would let anyone fill anyone else's bookmarks - and these
 * are endpoints, not function calls, however much they look like the latter.
 *
 * The kind and the id are passed through unvalidated *on purpose*: the service
 * validates them, because it is the layer that has to be right even when called
 * from somewhere new. Duplicating the check here would create two places for it
 * to be wrong in different ways.
 */

/**
 * Which page to re-render after the write.
 *
 * A save button appears on the event listing, the event page, the community
 * directory, and Saved itself, and each needs a different path revalidated. The
 * caller therefore names it - but it builds a cache key, so it is checked
 * against a narrow shape rather than trusted.
 */
const SAFE_PATH = /^\/[a-z0-9\-\/]{0,120}$/i

function readRevalidate(input: unknown): string[] {
  const paths = new Set<string>(["/saved"])

  if (typeof input === "string" && SAFE_PATH.test(input)) paths.add(input)

  return [...paths]
}

type SaveInput = {
  targetKind?: unknown
  targetId?: unknown
  revalidate?: unknown
}

export async function saveItemAction(
  input: SaveInput,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const result = await saveItem({
    userId: session.user.id,
    targetKind: input.targetKind,
    targetId: input.targetId,
  })

  if (!result.ok) return result

  for (const path of readRevalidate(input.revalidate)) revalidatePath(path)
}

export async function unsaveItemAction(
  input: SaveInput,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const result = await unsaveItem({
    userId: session.user.id,
    targetKind: input.targetKind,
    targetId: input.targetId,
  })

  if (!result.ok) return result

  for (const path of readRevalidate(input.revalidate)) revalidatePath(path)
}
