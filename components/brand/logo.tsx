import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * Brand mark: three overlapping circles - the communities a student belongs to.
 * Drawn with currentColor so it inherits the surrounding text colour and works
 * in both themes without a second asset.
 */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.75" />
      <circle
        cx="15"
        cy="9"
        r="5.25"
        stroke="currentColor"
        strokeWidth="1.75"
        opacity="0.55"
      />
      <circle
        cx="12"
        cy="14.5"
        r="5.25"
        stroke="currentColor"
        strokeWidth="1.75"
        opacity="0.3"
      />
    </svg>
  )
}

/** Wordmark that links home. `asLink={false}` for use inside another link. */
function Logo({
  className,
  asLink = true,
}: {
  className?: string
  asLink?: boolean
}) {
  const content = (
    <>
      <LogoMark className="text-primary" />
      <span className="text-h4 tracking-tight">Cirqles</span>
    </>
  )

  const classes = cn(
    "inline-flex items-center gap-2 rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
    className,
  )

  if (!asLink) return <span className={classes}>{content}</span>

  return (
    <Link href="/" className={classes} aria-label="Cirqles home">
      {content}
    </Link>
  )
}

export { Logo, LogoMark }
