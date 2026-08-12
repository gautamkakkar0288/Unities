import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type SectionProps = {
  id?: string
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
  align?: "start" | "center"
  className?: string
}

/**
 * Shared marketing section shell.
 *
 * Every landing section needs the same eyebrow / heading / description stack
 * and the same vertical rhythm. Centralising it here keeps section spacing
 * identical down the page - the single most common way a landing page starts
 * looking amateur is inconsistent gaps between sections.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  align = "start",
  className,
}: SectionProps) {
  const headingId = id ? `${id}-heading` : undefined

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      // scroll-mt clears the sticky header when jumping to an anchor.
      className={cn("scroll-mt-20 py-16 sm:py-20 lg:py-24", className)}
    >
      <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 xl:px-12">
        <div
          className={cn(
            "flex flex-col gap-3",
            align === "center" && "items-center text-center",
          )}
        >
          {eyebrow && (
            <p className="text-caption font-semibold tracking-wide text-primary uppercase">
              {eyebrow}
            </p>
          )}
          <h2 id={headingId} className="max-w-2xl text-h2">
            {title}
          </h2>
          {description && (
            <p className="max-w-readable text-body-lg text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  )
}
