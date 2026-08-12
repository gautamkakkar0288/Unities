import { ArrowUpRight, ChevronDown } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PrototypeScreenNav } from "@/features/prototype/components/screen-nav"

/**
 * Prototype shell.
 *
 * Deliberately not the real app shell. Sharing it would mean either loosening
 * the authenticated layout's session guard or signing in to view fixtures, and
 * a prototype that borrows production chrome is one screenshot away from being
 * mistaken for the product. The banner is permanent and unmissable for the
 * same reason.
 */
export const metadata: Metadata = {
  title: "Prototype",
  robots: { index: false, follow: false },
}

export default function PrototypeLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-body-sm focus:shadow-panel"
      >
        Skip to content
      </a>

      <div className="sticky top-0 z-40 border-b border-warning-border bg-warning-subtle text-warning-foreground">
        <div className="mx-auto flex h-12 w-full max-w-wide items-center gap-2 px-4 text-caption sm:px-6">
          <span className="font-medium">Prototype</span>
          <span className="hidden sm:inline">
            Every name, number, and post on these screens is fabricated fixture
            data.
          </span>
          <Link
            href="/home"
            className="ml-auto inline-flex shrink-0 items-center gap-1 font-medium underline underline-offset-4"
          >
            Real app
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-wide">
        <aside className="hidden w-72 shrink-0 border-r border-border lg:block">
          <div className="sticky top-12 max-h-[calc(100vh-3rem)] overflow-y-auto px-4 py-6">
            <div className="mb-6 flex items-center justify-between gap-2">
              <Logo />
              <ThemeToggle />
            </div>
            <PrototypeScreenNav />
          </div>
        </aside>

        <main
          id="content"
          className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10"
        >
          <details className="group mb-8 rounded-lg border border-border bg-card p-3 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-body-sm font-medium">
              Jump to screen
              <ChevronDown className="size-4 transition-transform duration-200 ease-standard group-open:rotate-180" />
            </summary>
            <div className="pt-4">
              <PrototypeScreenNav />
            </div>
          </details>

          {children}
        </main>
      </div>
    </div>
  )
}
