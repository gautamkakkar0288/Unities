import { Bookmark, CalendarDays, Compass, Users } from "lucide-react"
import Link from "next/link"

/**
 * The four places a student actually goes.
 *
 * Every destination is a route that already exists - a quick action that leads
 * to a placeholder is worse than no quick action, because it teaches the student
 * that the product is hollow.
 *
 * On mobile this is a two-by-two grid rather than a horizontal scroller. Four
 * items fit, and hiding two of them behind a swipe to save vertical space would
 * trade the one thing the section is for.
 */
const actions = [
  {
    href: "/events",
    label: "Events",
    hint: "What's on",
    icon: CalendarDays,
  },
  {
    href: "/communities",
    label: "Communities",
    hint: "Find your people",
    icon: Users,
  },
  {
    href: "/explore?type=opportunities",
    label: "Opportunities",
    hint: "Internships & more",
    icon: Compass,
  },
  {
    href: "/saved",
    label: "Saved",
    hint: "Come back to it",
    icon: Bookmark,
  },
] as const

export function QuickActions() {
  return (
    <nav aria-label="Quick actions">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((action) => (
          <li key={action.href}>
            <Link
              href={action.href}
              className="flex h-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary-border hover:bg-primary-subtle focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary">
                <action.icon aria-hidden="true" className="size-4.5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-label">{action.label}</span>
                <span className="truncate text-caption text-muted-foreground">
                  {action.hint}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
