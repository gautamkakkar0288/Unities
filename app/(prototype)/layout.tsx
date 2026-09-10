import { ArrowUpRight, ChevronDown } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PrototypeScreenNav } from "@/features/prototype/components/screen-nav"
import { prototypeRoutesEnabled } from "@/lib/prototype/access"

/**
 * Prototype shell.
 *
 * Deliberately not the real app shell. Sharing it would mean either loosening
 * the authenticated layout's session guard or signing in to view fixtures, and
 * a prototype that borrows production chrome is one screenshot away from being
 * mistaken for the product. The banner is permanent and unmissable for the
 * same reason.
 *
 * The whole subtree 404s unless prototypeRoutesEnabled(): these screens include
 * a payment flow for a feature that does not exist, and a student who reaches
 * it on a production URL has no way to know that.
 */
export const metadata: Metadata = {
  title: "Prototype",
  robots: { index: false, follow: false },
}

export default function PrototypeLayout({ children }: { children: ReactNode }) {
  if (!prototypeRoutesEnabled()) notFound()

  return (
    <div className="bg-background min-h-screen">
      <a
        href="#content"
        className="focus:bg-card focus:text-body-sm focus:shadow-panel sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <div className="border-warning-border bg-warning-subtle text-warning-foreground sticky top-0 z-40 border-b">
        <div className="max-w-wide text-caption mx-auto flex h-12 w-full items-center gap-2 px-4 sm:px-6">
          <span className="font-medium">Prototype</span>
          <span className="hidden sm:inline">
            Every name, number, and post on these screens is fabricated fixture
            data. Nothing here is saved, no registration is real, and the
            payment screens take no money.
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

      <div className="max-w-wide mx-auto flex w-full">
        <aside className="border-border hidden w-72 shrink-0 border-r lg:block">
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
          <details className="group border-border bg-card mb-8 rounded-lg border p-3 lg:hidden">
            <summary className="text-body-sm flex cursor-pointer list-none items-center justify-between gap-2 font-medium">
              Jump to screen
              <ChevronDown className="ease-standard size-4 transition-transform duration-200 group-open:rotate-180" />
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
