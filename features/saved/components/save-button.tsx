"use client"

import { Bookmark, BookmarkCheck } from "lucide-react"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { saveItemAction, unsaveItemAction } from "@/features/saved/actions"
import type { SavedTargetKind } from "@/lib/db/schema"

/**
 * The save control, used everywhere something can be saved.
 *
 * One component rather than one per surface, because "saved" has to look and
 * read the same on an event card, a community card, and an opportunity - and a
 * second implementation is how the accessible label ends up missing on the
 * third one.
 *
 * Unlike registering, this **is** optimistic. Saving has exactly one possible
 * outcome, decided by nothing the browser cannot already see: there is no
 * capacity, no queue, no policy. The only thing that can go wrong is the request
 * failing, and that path puts the state back and says so. A pending spinner on
 * a bookmark would be slower than the thing it describes.
 */
export function SaveButton({
  targetKind,
  targetId,
  label,
  saved,
  revalidate,
  variant = "outline",
  size = "lg",
  showLabel = false,
}: {
  targetKind: SavedTargetKind
  targetId: string
  /** The name of the thing, for the accessible label. */
  label: string
  saved: boolean
  /** Path to re-render after the write, e.g. the page holding this button. */
  revalidate?: string
  variant?: "outline" | "ghost" | "secondary"
  size?: "sm" | "lg" | "icon" | "icon-sm"
  /** Icon only by default; lists with room can show the word. */
  showLabel?: boolean
}) {
  const [optimistic, setOptimistic] = useState(saved)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // The prop is the truth after any re-render from the server. Tracking it
  // means an unsave performed on another tab, or the page being revalidated,
  // is not overwritten by stale local state.
  const [lastSaved, setLastSaved] = useState(saved)
  if (lastSaved !== saved) {
    setLastSaved(saved)
    setOptimistic(saved)
  }

  const accessibleLabel = optimistic
    ? `Remove ${label} from saved`
    : `Save ${label}`

  function toggle() {
    const next = !optimistic

    setError(null)
    setOptimistic(next)

    startTransition(async () => {
      const failure = next
        ? await saveItemAction({ targetKind, targetId, revalidate })
        : await unsaveItemAction({ targetKind, targetId, revalidate })

      if (failure) {
        // Put it back. A bookmark that looks saved and is not is worse than an
        // error message, because the student will not check.
        setOptimistic(!next)
        setError(failure.message)
      }
    })
  }

  const Icon = optimistic ? BookmarkCheck : Bookmark

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant={optimistic ? "secondary" : variant}
        size={showLabel ? size : size === "sm" ? "icon-sm" : "icon"}
        onClick={toggle}
        aria-pressed={optimistic}
        aria-label={accessibleLabel}
        title={accessibleLabel}
        disabled={pending}
      >
        <Icon aria-hidden="true" />
        {showLabel && (optimistic ? "Saved" : "Save")}
      </Button>

      {error && (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
