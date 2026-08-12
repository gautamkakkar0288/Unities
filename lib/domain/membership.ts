import type { CommunitySummary, MembershipState } from "@/lib/domain/types"
import type { ActionVariant, Tone } from "@/lib/ui/tone"

/**
 * What the join control should say and do for this viewer.
 *
 * This lives in the domain layer rather than inside the card component because
 * the same rules govern the community card, the community header, the mobile
 * sheet, and the eventual server action that performs the join. Encoding them
 * once means the button can never disagree with the endpoint behind it.
 */

export type MembershipAction = {
  label: string
  variant: ActionVariant
  /** True when the control is informational rather than actionable. */
  disabled: boolean
  /** Accessible description, since "Join" alone loses the community name. */
  accessibleLabel: string
}

export function describeMembershipAction(
  community: Pick<CommunitySummary, "name" | "joinPolicy" | "viewerMembership">,
): MembershipAction {
  const { name, joinPolicy, viewerMembership } = community

  switch (viewerMembership) {
    case "NONE":
      switch (joinPolicy) {
        case "OPEN":
          return {
            label: "Join",
            variant: "default",
            disabled: false,
            accessibleLabel: `Join ${name}`,
          }
        case "APPROVAL":
          return {
            label: "Request to join",
            variant: "outline",
            disabled: false,
            accessibleLabel: `Request to join ${name}`,
          }
        case "INVITE":
          // Not a disabled Join button. A control that looks actionable and
          // is not teaches the student nothing; naming the rule does.
          return {
            label: "Invite only",
            variant: "outline",
            disabled: true,
            accessibleLabel: `${name} is invite only. Members are added by a moderator.`,
          }
      }
    // eslint-disable-next-line no-fallthrough
    case "INVITED":
      return {
        label: "Accept invite",
        variant: "default",
        disabled: false,
        accessibleLabel: `Accept your invitation to ${name}`,
      }
    case "PENDING":
      return {
        label: "Requested",
        variant: "outline",
        disabled: true,
        accessibleLabel: `Your request to join ${name} is awaiting review`,
      }
    case "MEMBER":
      return {
        label: "Joined",
        variant: "secondary",
        disabled: false,
        accessibleLabel: `Leave ${name}`,
      }
    case "MODERATOR":
      return {
        label: "Moderator",
        variant: "secondary",
        disabled: false,
        accessibleLabel: `Manage ${name}`,
      }
    case "OWNER":
      return {
        label: "Owner",
        variant: "secondary",
        disabled: false,
        accessibleLabel: `Manage ${name}`,
      }
  }
}

/**
 * The word for the viewer's own relationship to a community, as a badge.
 *
 * Separate from `describeMembershipAction` because that describes a *control*.
 * Reusing its labels here would put "Accept invite" on a card that cannot
 * accept anything, which is a button-shaped promise the card does not keep.
 *
 * `NONE` is deliberately null rather than "Not a member": a badge on every
 * single card carries no information and costs a line of vertical space on the
 * smallest screen this has to work on.
 */
export const membershipBadgeLabel: Record<MembershipState, string | null> = {
  NONE: null,
  INVITED: "Invited",
  PENDING: "Requested",
  MEMBER: "Joined",
  MODERATOR: "Moderator",
  OWNER: "Owner",
}

/** Whether this membership state may post, comment, or register as a member. */
export function canParticipate(state: MembershipState): boolean {
  return state === "MEMBER" || state === "MODERATOR" || state === "OWNER"
}

/** Whether this membership state may moderate the community. */
export function canModerate(state: MembershipState): boolean {
  return state === "MODERATOR" || state === "OWNER"
}

export const verificationTone: Record<CommunitySummary["verification"], Tone> = {
  VERIFIED: "info",
  PENDING: "warning",
  UNVERIFIED: "neutral",
}

export const verificationLabel: Record<
  CommunitySummary["verification"],
  string
> = {
  VERIFIED: "Verified",
  PENDING: "Verification pending",
  UNVERIFIED: "Unverified",
}
