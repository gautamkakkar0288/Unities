import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  /** The primary way forward. Empty states should never be dead ends. */
  action?: ReactNode
  secondaryAction?: ReactNode
  className?: string
}

/**
 * Empty states must explain the absence and offer a next step
 * (docs/DESIGN/13). `action` is strongly encouraged for every product surface.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "border-border flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <div className="max-w-readable flex flex-col gap-1.5">
        <p className="text-h4">{title}</p>
        {description && (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

export { EmptyState }
