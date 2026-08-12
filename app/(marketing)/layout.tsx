import type { ReactNode } from "react"

import { SiteFooter } from "@/features/marketing/components/site-footer"
import { SiteHeader } from "@/features/marketing/components/site-header"

/**
 * Public marketing shell. Kept as its own route group so the authenticated app
 * shell added in Phase 5 can have completely different chrome without either
 * layout having to branch on session state.
 */
export default function MarketingLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-body-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
