"use client"

import { Check } from "lucide-react"
import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { saveOnboardingInterests } from "@/features/onboarding/actions"
import { MINIMUM_INTERESTS } from "@/lib/domain/interest"
import type { Interest } from "@/lib/domain/types"
import { cn } from "@/lib/utils"

type InterestPickerProps = {
  interests: Interest[]
  /** Interests already stored, so a returning student sees their picks. */
  initialSelectedIds: string[]
}

/**
 * The onboarding interest picker.
 *
 * MINIMUM_INTERESTS is imported rather than written as a number, and the
 * disabled Continue button is a courtesy rather than the rule - the same
 * minimum is enforced by `setInterestsSchema` on the server, over the distinct
 * set. If this component disappeared, the rule would still hold.
 *
 * Toggles are native buttons with `aria-pressed` rather than checkboxes styled
 * as chips, so a screen reader announces the pressed state without the
 * component having to describe itself.
 */
export function InterestPicker({
  interests,
  initialSelectedIds,
}: InterestPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const remaining = MINIMUM_INTERESTS - selectedIds.length

  function toggle(id: string) {
    setError(null)
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selected) => selected !== id)
        : [...current, id],
    )
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const failure = await saveOnboardingInterests({ interestIds: selectedIds })

      // Success redirects and never resolves here, so anything returned is a
      // failure the student needs to read.
      if (failure) setError(failure.message)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="group"
        aria-label="Interests"
        className="flex flex-wrap gap-2"
      >
        {interests.map((interest) => {
          const isSelected = selectedIds.includes(interest.id)

          return (
            <button
              key={interest.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(interest.id)}
              disabled={isPending}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-body-sm transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              {isSelected && <Check className="size-3.5" aria-hidden="true" />}
              {interest.label}
            </button>
          )
        })}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-body-sm text-muted-foreground">
          {remaining > 0
            ? `Pick ${remaining} more to continue.`
            : `${selectedIds.length} selected.`}
        </p>

        <Button
          type="button"
          onClick={submit}
          disabled={isPending || remaining > 0}
          className="w-full sm:w-auto"
        >
          {isPending && <Spinner size="sm" label={null} />}
          {isPending ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  )
}
