import type { ReactNode } from "react"

import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { signOutAction } from "@/features/shell/actions"

/**
 * Onboarding runs outside the app shell.
 *
 * Two reasons, both structural. The shell redirects here until onboarding is
 * done, so rendering onboarding inside it would be a page protected by a gate
 * that sends you to that page. And the shell offers a sidebar full of exits
 * from a step that cannot be skipped.
 *
 * Sign out is the one way out, because a student who lands here on the wrong
 * account must not be trapped.
 */
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <Logo />
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  )
}
