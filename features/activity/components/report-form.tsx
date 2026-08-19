"use client"

import { Flag } from "lucide-react"
import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { reportContentAction } from "@/features/activity/actions"
import type { ReportableKind } from "@/lib/services/moderation"

/**
 * Reporting, as an inline disclosure rather than a modal.
 *
 * Deliberately not a dialog: `components/ui` has no dialog primitive, and an
 * accessible one needs a focus trap, restoration, escape handling and inert
 * background. Hand-rolling that here would produce a modal a keyboard user can
 * fall out of. A disclosure is honest about what it is, works on a 390px screen
 * without any of that machinery, and keeps the reported content on screen while
 * the reason is chosen.
 *
 * The reasons are the table's own vocabulary, rendered as radios. The client
 * cannot introduce a new one - the values come from this list, and both the
 * action and the service check membership of the enum before writing.
 */

/**
 * Labels for the existing `reportReasons`, written for students.
 *
 * Not derived from the enum values: "MISINFORMATION" is not a sentence anyone
 * should read on a form.
 */
const REASONS = [
  { value: "SPAM", label: "Spam or advertising" },
  { value: "HARASSMENT", label: "Harassment or abuse" },
  { value: "MISINFORMATION", label: "Misleading information" },
  { value: "OFF_TOPIC", label: "Not relevant to this community" },
  { value: "OTHER", label: "Something else" },
] as const

export function ReportForm({
  targetKind,
  targetId,
  slug,
  alreadyReported,
}: {
  targetKind: ReportableKind
  targetId: string
  slug: string
  alreadyReported: boolean
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>("")
  const [detail, setDetail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  const noun = targetKind === "POST" ? "update" : "comment"

  if (alreadyReported || done) {
    return (
      <p role="status" className="text-caption text-muted-foreground">
        Reported. A moderator will review this {noun}.
      </p>
    )
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="gap-1.5 text-muted-foreground"
      >
        <Flag aria-hidden="true" className="size-4" />
        Report
      </Button>
    )
  }

  function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault()
    setError(null)

    if (reason === "") {
      setError("Choose a reason for reporting this.")
      return
    }

    startTransition(async () => {
      const failure = await reportContentAction({
        targetKind,
        targetId,
        slug,
        reason,
        detail,
      })

      if (failure) {
        setError(failure.message)
        return
      }

      setDone(true)
    })
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-md border border-border p-3"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="text-label pb-1">Why are you reporting this {noun}?</legend>
        {REASONS.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 text-body-sm"
          >
            <input
              type="radio"
              name={`report-reason-${targetId}`}
              value={option.value}
              checked={reason === option.value}
              onChange={() => setReason(option.value)}
              className="size-4 focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`report-detail-${targetId}`} className="text-label">
          Anything else? <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id={`report-detail-${targetId}`}
          value={detail}
          onChange={(changeEvent) => setDetail(changeEvent.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending} aria-busy={pending}>
          Send report
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
