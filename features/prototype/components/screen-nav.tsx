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
          <p className="text-caption text-muted-foreground px-2 pb-1 font-medium tracking-wide uppercase">
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
                  "text-body-sm text-muted-foreground ease-standard hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 rounded-md px-2 py-1.5 transition-colors duration-150 focus-visible:ring-3 focus-visible:outline-none",
                  active && "bg-primary-subtle text-primary font-medium",
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
