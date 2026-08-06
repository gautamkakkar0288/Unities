import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Visible labels are mandatory across Cirqles (docs/DESIGN/03-Typography.md
 * — "Avoid placeholder-only forms"). `required` renders a visual marker plus
 * screen-reader text, so the requirement is never colour- or glyph-only.
 */
function Label({
  className,
  children,
  required,
  ...props
}: ComponentProps<"label"> & { required?: boolean }) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-1 text-label font-medium text-foreground select-none",
        "has-[+_:disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <>
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
          <span className="sr-only">(required)</span>
        </>
      )}
    </label>
  )
}

export { Label }
