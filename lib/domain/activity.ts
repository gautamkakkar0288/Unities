import type { Activity, ActivityKind, Timestamp } from "@/lib/domain/types"
import type { ActionVariant, Tone } from "@/lib/ui/tone"

/**
 * "Anyone up for badminton at 6?"
 *
 * Activities are the lightest thing a student can post, and the rules protect
 * that lightness:
 *
 * - **They expire.** A request for a doubles partner is worthless the morning
 *   after, and worse than worthless if it is still sitting in a list looking
 *   current. Expiry is a timestamp on the row, not a cron job, so a stale
 *   activity is never shown even if nothing has run.
 * - **Filled is not closed.** People drop out. A filled activity stays visible
 *   with its spots shown so a late joiner knows where they stand.
 * - **No organiser role.** Whoever posted it is a participant, not staff. That
 *   is the whole difference between an activity and an event, and it is why the
 *   two are separate types rather than one type with a flag.
 */

export const activityKindLabel: Record<ActivityKind, string> = {
  SPORT: "Sport",
  STUDY: "Study",
  TEAM: "Team-up",
  TRAVEL: "Travel",
  CASUAL: "Hang out",
}

export const activityKindTone: Record<ActivityKind, Tone> = {
  SPORT: "success",
  STUDY: "info",
  TEAM: "brand",
  TRAVEL: "featured",
  CASUAL: "neutral",
}

export type ActivityDescriptor = {
  spotsLeft: number
  isFull: boolean
  isExpired: boolean
  /** e.g. "2 of 4 spots taken" */
  spotsLabel: string
  ctaLabel: string
  ctaVariant: ActionVariant
  ctaDisabled: boolean
  accessibleCtaLabel: string
  status: { label: string; tone: Tone } | null
}

export function isExpired(activity: Activity, now: Timestamp): boolean {
  return Date.parse(activity.expiresAt) <= Date.parse(now)
}

export function describeActivity(
  activity: Activity,
  now: Timestamp,
): ActivityDescriptor {
  const spotsLeft = Math.max(0, activity.spotsNeeded - activity.spotsFilled)
  const isFull = spotsLeft === 0
  const expired = isExpired(activity, now) || activity.status === "EXPIRED"
  const cancelled = activity.status === "CANCELLED"

  const spotsLabel = `${activity.spotsFilled} of ${activity.spotsNeeded} spots taken`

  if (cancelled) {
    return {
      spotsLeft,
      isFull,
      isExpired: expired,
      spotsLabel,
      ctaLabel: "Cancelled",
      ctaVariant: "outline",
      ctaDisabled: true,
      accessibleCtaLabel: `${activity.title} was cancelled`,
      status: { label: "Cancelled", tone: "neutral" },
    }
  }

  if (expired) {
    return {
      spotsLeft,
      isFull,
      isExpired: true,
      spotsLabel,
      ctaLabel: "Expired",
      ctaVariant: "outline",
      ctaDisabled: true,
      accessibleCtaLabel: `${activity.title} has expired`,
      status: { label: "Expired", tone: "neutral" },
    }
  }

  if (activity.viewerHasJoined) {
    return {
      spotsLeft,
      isFull,
      isExpired: false,
      spotsLabel,
      ctaLabel: "You are in",
      ctaVariant: "secondary",
      ctaDisabled: false,
      accessibleCtaLabel: `Leave ${activity.title}`,
      status: { label: "Joined", tone: "success" },
    }
  }

  if (isFull) {
    return {
      spotsLeft: 0,
      isFull: true,
      isExpired: false,
      spotsLabel,
      // Not "Full" as a dead end - people drop out, and the poster would
      // rather have a reserve than an empty court.
      ctaLabel: "Ask to join anyway",
      ctaVariant: "outline",
      ctaDisabled: false,
      accessibleCtaLabel: `${activity.title} is full. Ask to join anyway.`,
      status: { label: "Full", tone: "warning" },
    }
  }

  return {
    spotsLeft,
    isFull: false,
    isExpired: false,
    spotsLabel,
    ctaLabel: spotsLeft === 1 ? "Take the last spot" : "I am in",
    ctaVariant: "default",
    ctaDisabled: false,
    accessibleCtaLabel: `Join ${activity.title}`,
    status:
      spotsLeft === 1 ? { label: "1 spot left", tone: "warning" } : null,
  }
}

/** Sort for the "Find people" section: soonest first, expired never shown. */
export function liveActivities(
  activities: Activity[],
  now: Timestamp,
): Activity[] {
  return activities
    .filter(
      (activity) =>
        !isExpired(activity, now) &&
        activity.status !== "EXPIRED" &&
        activity.status !== "CANCELLED",
    )
    .sort((a, b) => Date.parse(a.happensAt) - Date.parse(b.happensAt))
}
