import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const containerVariants = cva(
  // Page padding steps: 16 / 24 / 32 / 48px (docs/DESIGN/04-Spacing-&-Layout).
  "mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12",
  {
    variants: {
      size: {
        page: "max-w-page",
        wide: "max-w-wide",
        readable: "max-w-readable",
      },
    },
    defaultVariants: { size: "page" },
  },
)

/**
 * The single horizontal rhythm primitive. Every page shell uses this instead
 * of ad-hoc max-widths, so container widths change in one place.
 */
function Container({
  className,
  size,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof containerVariants>) {
  return (
    <div
      data-slot="container"
      className={cn(containerVariants({ size }), className)}
      {...props}
    />
  )
}

export { Container, containerVariants }
