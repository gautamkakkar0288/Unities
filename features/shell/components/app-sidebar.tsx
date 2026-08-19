import { Logo } from "@/components/brand/logo"
import { sidebarNav } from "@/lib/navigation/config"

import { SidebarNavLink } from "./nav-link"
import { UserCard } from "./user-card"

type AppSidebarProps = {
  name: string
  email: string | null
  role: string
  /** Unread notifications for this viewer, counted once by the layout. */
  unreadCount?: number
}

/**
 * Persistent desktop sidebar.
 *
 * Fixed rather than part of the flex flow so the main column scrolls
 * independently - navigation should never scroll out of reach on a long feed.
 * Hidden below `lg`, where the bottom bar takes over.
 *
 * The count is attached by href rather than passed per item, so adding another
 * badged destination later is a line here and not a change to the link.
 */
export function AppSidebar({
  name,
  email,
  role,
  unreadCount = 0,
}: AppSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Logo />
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-1">
          {sidebarNav.map((item) => (
            <li key={item.href}>
              <SidebarNavLink
                item={item}
                badgeCount={item.href === "/notifications" ? unreadCount : 0}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <UserCard name={name} email={email} role={role} />
      </div>
    </aside>
  )
}
