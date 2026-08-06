import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const spinnerVariants = cva("animate-spin text-current", {
  variants: {
    size: { sm: "size-3.5", md: "size-4", lg: "size-6" },
  },
  defaultVariants: { size: "md" },
})

/**
 * Inline progress indicator for actions in flight (button submits, inline
 * refetches). Prefer `Skeleton` for page and list loading.
 *
 * `label` is rendered for assistive technology only; pass `null` when an
 * adjacent visible label already announces the pending state.
 */
function Spinner({
  className,
  size,
  label = "Loading",
  ...props
}: ComponentProps<"svg"> &
  VariantProps<typeof spinnerVariants> & { label?: string | null }) {
  return (
    <>
      <svg
        data-slot="spinner"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={cn(spinnerVariants({ size }), className)}
        {...props}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
          className="opacity-25"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <span role="status" className="sr-only">
          {label}
        </span>
      )}
    </>
  )
}

export { Spinner, spinnerVariants }
