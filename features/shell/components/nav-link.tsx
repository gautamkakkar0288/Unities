"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { isActiveRoute, type NavItem } from "@/lib/navigation/config"
import { cn } from "@/lib/utils"

/**
 * Sidebar navigation link.
 *
 * `aria-current="page"` is what actually communicates the active state to a
 * screen reader; the colour change is only the visual half of that.
 */
export function SidebarNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active = isActiveRoute(pathname, item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        active
          ? "bg-primary-subtle font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {item.label}
    </Link>
  )
}
