"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notifications"
import { fail, type ServiceFailure } from "@/lib/services/result"

/**
 * Changing read state.
 *
 * These are the only notification mutations exposed to the browser, and neither
 * takes a recipient - the viewer comes from the session, and the service scopes
 * its statements by that id. There is no action for creating a notification on
 * purpose: notifications assert that something happened, so only the services
 * that make things happen may write them.
 *
 * The whole layout is revalidated rather than just the page, because the unread
 * badge lives in the shell. Revalidating only `/notifications` would leave the
 * badge showing a count the page below it has already cleared.
 */

export async function markNotificationReadAction(
  notificationId: unknown,
): Promise<ServiceFailure | void> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  if (typeof notificationId !== "string") {
    return fail("INVALID", "That notification could not be identified.")
  }

  const result = await markNotificationRead({
    viewerId: session.user.id,
    notificationId,
  })

  if (!result.ok) return result

  revalidatePath("/notifications", "layout")
}

export async function markAllNotificationsReadAction(): Promise<
  ServiceFailure | void
> {
  const session = await auth()
  if (!session?.user) {
    return fail(
      "FORBIDDEN",
      "Your session has expired. Sign in again to continue.",
    )
  }

  const result = await markAllNotificationsRead({
    viewerId: session.user.id,
  })

  if (!result.ok) return result

  revalidatePath("/notifications", "layout")
}
