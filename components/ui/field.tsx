import type { ReactNode } from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FieldRenderProps = {
  id: string
  "aria-invalid": true | undefined
  "aria-describedby": string | undefined
}

type FieldProps = {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: (props: FieldRenderProps) => ReactNode
}

/**
 * Form field wrapper.
 *
 * Uses a render prop so the label, hint, and error are wired to the control
 * automatically. Without this, every form re-implements `aria-invalid` and
 * `aria-describedby` by hand and eventually one of them drifts — this makes
 * the accessible wiring impossible to forget.
 */
function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div data-slot="field" className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}

      {hint && !error && (
        <p id={hintId} className="text-caption text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-caption text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export { Field }
