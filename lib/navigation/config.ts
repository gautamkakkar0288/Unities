import {
  Bell,
  Bookmark,
  Compass,
  Home,
  Search,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  /** Short label for the mobile bar, where horizontal space is tight. */
  shortLabel?: string
}

/**
 * Mobile bottom navigation.
 *
 * Exactly the five items mandated by docs/UX/02-Navigation-System.md: no hidden
 * tabs, no horizontal scrolling, no nested bars. Communities and Saved are
 * deliberately absent - docs/UX/00-Information-Architecture.md states they are
 * reached through the primary screens rather than occupying permanent slots.
 */
export const mobileNav: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Search", href: "/search", icon: Search },
  { label: "Notifications", href: "/notifications", icon: Bell, shortLabel: "Alerts" },
  { label: "Profile", href: "/profile", icon: User },
]

/**
 * Desktop sidebar.
 *
 * The two navigation documents disagree on this list (see DECISIONS.md D18).
 * `00-Information-Architecture.md` includes Search and Notifications in the
 * sidebar, while `02-Navigation-System.md` omits them - and both documents
 * agree the top bar owns global search and the notification indicator. Listing
 * them in the sidebar too would give one destination two competing entry
 * points on the same screen, so we follow the navigation-specific document.
 */
export const sidebarNav: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Communities", href: "/communities", icon: Users },
  { label: "Saved", href: "/saved", icon: Bookmark },
  { label: "Profile", href: "/profile", icon: User },
]

/** Where a signed-in user belongs. Used by auth redirects and the logo link. */
export const appHomeHref = "/home"

/**
 * Whether a nav item should render as the current page.
 *
 * Exact match for top-level destinations, prefix match for their children, so
 * `/communities/robotics` still highlights Communities. The prefix check is
 * boundary-aware: `/save` must not activate `/saved`.
 */
export function isActiveRoute(pathname: string, href: string): boolean {
  if (pathname === href) return true
  return pathname.startsWith(`${href}/`)
}
