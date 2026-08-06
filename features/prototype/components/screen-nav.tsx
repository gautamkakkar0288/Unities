"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { prototypeScreenGroups } from "@/lib/prototype/screens"
import { cn } from "@/lib/utils"

/**
 * Prototype screen switcher. Client-side only because it needs the current
 * pathname to mark the active screen - the same reason the real sidebar nav
 * link is a client component.
 */
export function PrototypeScreenNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Prototype screens" className="flex flex-col gap-5">
      {prototypeScreenGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p className="px-2 pb-1 text-caption font-medium tracking-wide text-muted-foreground uppercase">
            {group.label}
          </p>
          {group.screens.map((screen) => {
            const active = pathname === screen.href
            return (
              <Link
                key={screen.href}
                href={screen.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2 py-1.5 text-body-sm text-muted-foreground transition-colors duration-150 ease-standard hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active && "bg-primary-subtle font-medium text-primary",
                )}
              >
                {screen.title}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
