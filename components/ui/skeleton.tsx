import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Skeletons are preferred over spinners for content-rich surfaces
 * (docs/DESIGN/15). Compose them to mirror the eventual layout so there is no
 * shift when real content arrives.
 */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
