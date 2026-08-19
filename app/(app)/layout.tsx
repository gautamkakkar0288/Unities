import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { auth } from "@/auth"
import { AppSidebar } from "@/features/shell/components/app-sidebar"
import { AppTopBar } from "@/features/shell/components/app-top-bar"
import { MobileNav } from "@/features/shell/components/mobile-nav"
import {
  accountGate,
  gateDestination,
} from "@/lib/domain/verification-gate"
import { hasVerifiedEmail } from "@/lib/services/account"
import { hasCompletedOnboarding } from "@/lib/services/interests"
import { countUnreadNotifications } from "@/lib/services/notifications"

/**
 * Authenticated product shell.
 *
 * The session check duplicates what the proxy already enforces, and that is
 * deliberate. The proxy is an optimisation, not a security boundary: it can be
 * bypassed by matcher gaps or misconfiguration, and it does not run for every
 * server-side render path. Authorising again here means the shell can never
 * render without a user, and it is also where we get the user object we need
 * anyway - so the guard costs nothing extra.
 *
 * The verification and onboarding gates live here for the same reason: they
 * cover every page in the shell at once, so a student cannot reach one by typing
 * its URL. Which gate wins is `accountGate`'s decision, not this file's, because
 * onboarding needs the identical answer and a second copy of the ordering would
 * eventually contradict the first.
 *
 * Three indexed reads per render, concurrently. That is the price of the
 * guarantee that no authenticated surface renders for an unverified or
 * un-onboarded account - and neither answer can be taken from the session,
 * because a JWT minted before either happened keeps reporting the state it was
 * minted with.
 *
 * The unread count is fetched here, once, and handed to all three navigation
 * surfaces. Letting each of them count for itself would mean three queries per
 * page and three chances for the sidebar and the bottom bar to show different
 * numbers on the same screen.
 */
export default async function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()

  if (!session?.user) redirect("/sign-in")

  const [emailVerified, onboarded, unreadCount] = await Promise.all([
    hasVerifiedEmail(session.user.id),
    hasCompletedOnboarding(session.user.id),
    countUnreadNotifications(session.user.id),
  ])

  const destination = gateDestination(
    accountGate({ signedIn: true, emailVerified, onboarded }),
  )

  if (destination) redirect(destination)

  const { name, email, role } = session.user

  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-body-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <AppSidebar
        name={name ?? email ?? "Your account"}
        email={email ?? null}
        role={role}
        unreadCount={unreadCount}
      />

      {/* Offset matches the fixed sidebar width. */}
      <div className="flex min-h-full flex-1 flex-col lg:pl-64">
        <AppTopBar unreadCount={unreadCount} />

        <main id="content" className="flex-1">
          {/*
           * Bottom padding clears the fixed mobile bar. Without it the last
           * item of any list sits permanently underneath the navigation.
           */}
          <div className="mx-auto w-full max-w-page px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
            {children}
          </div>
        </main>
      </div>

      <MobileNav unreadCount={unreadCount} />
    </div>
  )
}
