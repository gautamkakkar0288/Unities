import type {
  ModerationItem,
  ModerationStatus,
  ModerationTargetKind,
  ReportReason,
} from "@/lib/domain/types"
import type { Tone } from "@/lib/ui/tone"

export const reportReasonLabel: Record<ReportReason, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  MISINFORMATION: "Misinformation",
  OFF_TOPIC: "Off topic",
  OTHER: "Other",
}

/**
 * Triage order. Lower is more urgent.
 *
 * Harassment outranks everything because the cost of a slow response is borne
 * by a person, not by the platform. Spam is annoying; harassment makes someone
 * leave.
 */
export const reasonSeverity: Record<ReportReason, number> = {
  HARASSMENT: 0,
  MISINFORMATION: 1,
  SPAM: 2,
  OFF_TOPIC: 3,
  OTHER: 4,
}

export const reportReasonTone: Record<ReportReason, Tone> = {
  HARASSMENT: "error",
  MISINFORMATION: "warning",
  SPAM: "neutral",
  OFF_TOPIC: "neutral",
  OTHER: "neutral",
}

export const moderationStatusLabel: Record<ModerationStatus, string> = {
  OPEN: "Open",
  IN_REVIEW: "In review",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
}

export const moderationStatusTone: Record<ModerationStatus, Tone> = {
  OPEN: "warning",
  IN_REVIEW: "info",
  RESOLVED: "success",
  DISMISSED: "neutral",
}

export const moderationTargetKindLabel: Record<ModerationTargetKind, string> = {
  POST: "Post",
  COMMENT: "Comment",
  EVENT: "Event",
  COMMUNITY: "Community",
  ACTIVITY: "Activity",
  USER: "Person",
}

export function isActionable(status: ModerationStatus): boolean {
  return status === "OPEN" || status === "IN_REVIEW"
}

/**
 * Severity first, then age - never report volume.
 *
 * Sorting by report count would let a coordinated pile-on jump the queue ahead
 * of a single credible harassment report, which is exactly backwards.
 */
export function compareModerationItems(
  a: ModerationItem,
  b: ModerationItem,
): number {
  const bySeverity = reasonSeverity[a.reason] - reasonSeverity[b.reason]
  if (bySeverity !== 0) return bySeverity

  return Date.parse(a.reportedAt) - Date.parse(b.reportedAt)
}

export function sortModerationQueue(items: ModerationItem[]): ModerationItem[] {
  return [...items].sort(compareModerationItems)
}

export function openCount(items: ModerationItem[]): number {
  return items.filter((item) => isActionable(item.status)).length
}
