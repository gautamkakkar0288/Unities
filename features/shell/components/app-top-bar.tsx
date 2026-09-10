import { Bell, Bookmark, Search } from "lucide-react"
import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { appHomeHref } from "@/lib/navigation/config"

import { UnreadBadge } from "./unread-badge"

/**
 * Top bar: global search, saved, notifications, and appearance.
 *
 * Search renders as a link styled like an input rather than a real input.
 * Search is a destination with its own history and results per docs/UX/02, so
 * typing here would mean maintaining query state in two places. The link is
 * honest about what tapping it does, and it costs no client JavaScript.
 *
 * The bell's accessible label carries the count as words - a badge that is only
 * a coloured circle with a digit in it says nothing to a screen reader.
 */
export function AppTopBar({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* The sidebar owns the logo on desktop. */}
      <div className="lg:hidden">
        <Logo />
      </div>

      <Link
        href="/search"
        className="border-border bg-card text-body-sm text-muted-foreground hover:bg-muted focus-visible:ring-ring/50 ml-auto flex h-9 items-center gap-2 rounded-lg border px-3 transition-colors duration-150 focus-visible:ring-3 focus-visible:outline-none lg:mr-auto lg:ml-0 lg:w-72"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden lg:inline">Search Cirqles</span>
        <span className="sr-only lg:hidden">Search</span>
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href="/saved"
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:ring-3 focus-visible:outline-none lg:size-9"
          aria-label="Saved"
        >
          <Bookmark className="size-5 lg:size-4" aria-hidden="true" />
        </Link>

        <Link
          href="/notifications"
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 relative flex size-11 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:ring-3 focus-visible:outline-none lg:size-9"
          aria-label="Notifications"
        >
          <Bell className="size-5 lg:size-4" aria-hidden="true" />
          <UnreadBadge count={unreadCount} floating />
        </Link>

        <ThemeToggle />
      </div>

      <span className="sr-only">
        <Link href={appHomeHref}>Home</Link>
      </span>
    </header>
  )
}
