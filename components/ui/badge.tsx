import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-caption font-medium whitespace-nowrap [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "border-border bg-muted text-muted-foreground",
        brand: "border-primary-border bg-primary-subtle text-primary",
        support: "border-support-border bg-support-subtle text-support",
        featured:
          "border-featured-border bg-featured-subtle text-featured-foreground",
        success:
          "border-success-border bg-success-subtle text-success-foreground",
        warning:
          "border-warning-border bg-warning-subtle text-warning-foreground",
        info: "border-info-border bg-info-subtle text-info-foreground",
        error:
          "border-destructive-border bg-destructive-subtle text-destructive",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
)

/**
 * Status and metadata pill.
 *
 * Colour is never the only signal (docs/DESIGN/02-Color-System.md): a badge
 * always carries a text label, and callers should pair status badges with an
 * icon so meaning survives colour-blindness and greyscale printing.
 */
function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
