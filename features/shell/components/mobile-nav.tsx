"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { isActiveRoute, mobileNav } from "@/lib/navigation/config"
import { cn } from "@/lib/utils"

/**
 * Persistent mobile bottom navigation.
 *
 * Stays mounted across primary screens as required by docs/UX/02. Every target
 * is at least 44x44, and `env(safe-area-inset-bottom)` keeps the bar clear of
 * the iOS home indicator - without it the last few pixels of each tap target
 * are unreachable on modern iPhones.
 */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {mobileNav.map((item) => {
          const active = isActiveRoute(pathname, item.href)
          const Icon = item.icon

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] transition-colors duration-100 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset",
                  active
                    ? "font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-5 shrink-0", active && "text-primary")}
                  aria-hidden="true"
                />
                {item.shortLabel ?? item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
