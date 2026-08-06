import { cva, type VariantProps } from "class-variance-authority"
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-body-sm",
  {
    variants: {
      variant: {
        info: "border-info-border bg-info-subtle text-info-foreground",
        success:
          "border-success-border bg-success-subtle text-success-foreground",
        warning:
          "border-warning-border bg-warning-subtle text-warning-foreground",
        error:
          "border-destructive-border bg-destructive-subtle text-destructive",
      },
    },
    defaultVariants: { variant: "info" },
  },
)

const variantIcon: Record<
  NonNullable<VariantProps<typeof alertVariants>["variant"]>,
  LucideIcon
> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

/**
 * Inline feedback banner.
 *
 * The icon is chosen by the component rather than the caller, which enforces
 * the "never rely on colour alone" rule at the API level — you cannot render a
 * status alert without its matching glyph. Errors and warnings assert as
 * `alert` so they interrupt; info and success announce politely.
 */
function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: Omit<ComponentProps<"div">, "title"> &
  VariantProps<typeof alertVariants> & { title?: ReactNode }) {
  const Icon = variantIcon[variant ?? "info"]
  const assertive = variant === "error" || variant === "warning"

  return (
    <div
      data-slot="alert"
      role={assertive ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
    </div>
  )
}

export { Alert, alertVariants }
