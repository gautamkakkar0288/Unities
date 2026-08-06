import type {
  ModerationItem,
  ModerationStatus,
  ModerationTargetKind,
  ReportReason,
} from "@/lib/domain/types"
import type { Tone } from "@/lib/ui/tone"

/**
 * Moderation vocabulary and queue ordering.
 *
 * Ordering lives here rather than in the Operations Center component because it
 * is a policy decision, not a layout one: harassment outranks spam regardless of
 * report count, because ten people reporting a course advert is an annoyance
 * while one person reporting harassment may be in a bad situation right now.
 */

export const reportReasonLabel: Record<ReportReason, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  MISINFORMATION: "Misinformation",
  OFF_TOPIC: "Off topic",
  OTHER: "Other",
}

/** Lower number is handled first. */
const reasonSeverity: Record<ReportReason, number> = {
  HARASSMENT: 0,
  MISINFORMATION: 1,
  SPAM: 2,
  OFF_TOPIC: 3,
  OTHER: 4,
}

export const reportReasonTone: Record<ReportReason, Tone> = {
  SPAM: "warning",
  HARASSMENT: "error",
  MISINFORMATION: "warning",
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
  OPEN: "error",
  IN_REVIEW: "warning",
  RESOLVED: "success",
  DISMISSED: "neutral",
}

export const moderationTargetKindLabel: Record<ModerationTargetKind, string> = {
  POST: "Post",
  COMMENT: "Comment",
  EVENT: "Event",
  COMMUNITY: "Community",
  USER: "Person",
}

export function isActionable(status: ModerationStatus): boolean {
  return status === "OPEN" || status === "IN_REVIEW"
}

/**
 * Queue order: unhandled before handled, then by severity, then by how many
 * people reported it, then oldest first. Oldest-last would let an item rot at
 * the bottom of the list forever.
 */
export function compareModerationItems(
  a: ModerationItem,
  b: ModerationItem,
): number {
  const actionable = Number(isActionable(b.status)) - Number(isActionable(a.status))
  if (actionable !== 0) return actionable

  const severity = reasonSeverity[a.reason] - reasonSeverity[b.reason]
  if (severity !== 0) return severity

  const reports = b.reportCount - a.reportCount
  if (reports !== 0) return reports

  return a.reportedAt.localeCompare(b.reportedAt)
}

export function sortModerationQueue(items: ModerationItem[]): ModerationItem[] {
  return [...items].sort(compareModerationItems)
}

export function openCount(items: ModerationItem[]): number {
  return items.filter((item) => isActionable(item.status)).length
}
