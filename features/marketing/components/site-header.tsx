"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Logo } from "@/components/brand/logo"
import { buttonVariants } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { marketingNav } from "@/lib/marketing/content"
import { cn } from "@/lib/utils"

/**
 * Marketing header.
 *
 * Frosted glass is used here deliberately - docs/DESIGN/02 allows it for
 * floating navigation and nowhere else. The mobile panel closes on Escape and
 * on navigation, and locks body scroll while open so the page behind does not
 * drift under the user's thumb.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="max-w-page mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 xl:px-12">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {marketingNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-sm text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md px-3 py-2 transition-colors duration-150 focus-visible:ring-3 focus-visible:outline-none"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Get started
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="border-border text-foreground hover:bg-muted focus-visible:ring-ring/50 inline-flex size-9 items-center justify-center rounded-lg border transition-colors duration-150 focus-visible:ring-3 focus-visible:outline-none lg:hidden"
          >
            {open ? (
              <X className="size-4" aria-hidden="true" />
            ) : (
              <Menu className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="border-border bg-background border-t lg:hidden"
        >
          <nav
            aria-label="Mobile"
            className="max-w-page mx-auto flex w-full flex-col gap-1 px-4 py-4 sm:px-6"
          >
            {marketingNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-body text-foreground hover:bg-muted focus-visible:ring-ring/50 rounded-md px-3 py-2.5 transition-colors duration-150 focus-visible:ring-3 focus-visible:outline-none"
              >
                {link.label}
              </Link>
            ))}

            <div className="border-border mt-2 flex flex-col gap-2 border-t pt-4">
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: "outline" })}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className={buttonVariants()}
              >
                Create your account
              </Link>
              <div className="flex justify-center pt-2 sm:hidden">
                <ThemeToggle />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
