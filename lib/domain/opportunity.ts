import type { OpportunityKind } from "@/lib/db/schema"
import type { Tone } from "@/lib/ui/tone"

/**
 * Opportunity display rules.
 *
 * An opportunity is a signpost, not something you register for, so everything
 * here is about answering one question quickly: is this still open, and what
 * kind of thing is it.
 */

export const opportunityKindLabel: Record<OpportunityKind, string> = {
  INTERNSHIP: "Internship",
  COMPETITION: "Competition",
  VOLUNTEERING: "Volunteering",
  SCHOLARSHIP: "Scholarship",
  CAMPUS: "On campus",
  STARTUP: "Startup",
}

export const opportunityKindTone: Record<OpportunityKind, Tone> = {
  INTERNSHIP: "brand",
  COMPETITION: "support",
  VOLUNTEERING: "success",
  SCHOLARSHIP: "info",
  CAMPUS: "neutral",
  STARTUP: "warning",
}

/**
 * Three states, not a boolean.
 *
 * `ROLLING` is a real answer for a listing with no deadline, and collapsing it
 * into "open" would mean the card either invents a date or shows a blank space
 * where every other card has one.
 */
export type DeadlineState = "ROLLING" | "OPEN" | "CLOSED"

export function deadlineState(
  deadlineIso: string | null,
  nowIso: string,
): DeadlineState {
  if (!deadlineIso) return "ROLLING"
  return new Date(deadlineIso).getTime() > new Date(nowIso).getTime()
    ? "OPEN"
    : "CLOSED"
}

export const deadlineStateTone: Record<DeadlineState, Tone> = {
  ROLLING: "neutral",
  OPEN: "success",
  CLOSED: "warning",
}
