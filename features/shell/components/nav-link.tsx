"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { isActiveRoute } from "@/lib/navigation/config"
import { cn } from "@/lib/utils"

import { UnreadBadge } from "./unread-badge"

/**
 * Sidebar navigation link.
 *
 * `aria-current="page"` is what actually communicates the active state to a
 * screen reader; the colour change is only the visual half of that.
 *
 * The badge is optional and pushed to the right by `ml-auto`, so an item with a
 * count and one without still line up on their labels.
 */
export function SidebarNavLink({
  href,
  label,
  icon,
  badgeCount = 0,
}: {
  href: string
  label: string
  icon?: ReactNode
  badgeCount?: number
}) {
  const pathname = usePathname()
  const active = isActiveRoute(pathname, href)

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-body-sm focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 focus-visible:ring-3 focus-visible:outline-none",
        active
          ? "bg-primary-subtle text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {label}
      {badgeCount > 0 && (
        <span className="ml-auto flex items-center">
          <UnreadBadge count={badgeCount} />
        </span>
      )}
    </Link>
  )
}
