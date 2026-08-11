import {
  Bell,
  Compass,
  Home,
  Plus,
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
 * tabs, no horizontal scrolling, no nested bars. Create sits in the centre slot
 * (D36) because creating an activity, event, or community request is core to
 * the product's identity - Discover → Connect → Create → Experience - and a
 * creation entry hidden behind other screens reads as a product that does not
 * expect you to create anything. Search moved to the top bar, which both
 * navigation documents already agree owns global search; Communities and Saved
 * are reached through the primary screens rather than occupying permanent
 * slots.
 */
export const mobileNav: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Create", href: "/create", icon: Plus },
  { label: "Notifications", href: "/notifications", icon: Bell, shortLabel: "Alerts" },
  { label: "Profile", href: "/profile", icon: User },
]

/**
 * Desktop sidebar.
 *
 * The six-item primary navigation locked on 2026-08-11 (D36): Home, Explore,
 * Communities, Create, Notifications, Profile.
 *
 * Two earlier decisions are amended by this list. Saved loses its slot - it is
 * reached through Profile → Saved and bookmark affordances in Home and Explore,
 * because a bookmark list is a utility, not a destination the product is about.
 * And Notifications joins the sidebar (partially superseding D18): the top bar
 * keeps the indicator, but the product owner locked Notifications as primary
 * navigation, and the navigation documents' own tiebreak rule - sidebar for
 * places, top bar for tools - reads a notification inbox as a place.
 */
export const sidebarNav: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Communities", href: "/communities", icon: Users },
  { label: "Create", href: "/create", icon: Plus },
  { label: "Notifications", href: "/notifications", icon: Bell },
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
