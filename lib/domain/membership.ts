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
 * Which write, if any, the control should perform.
 *
 * Kept here beside `describeMembershipAction` rather than decided inside the
 * button, for the same reason that function exists: the label and the write
 * have to be read from one place or they eventually disagree, and the way that
 * failure shows up is a student clicking "Join" and being removed from
 * something.
 *
 * `PENDING` is `LEAVE` because withdrawing a request is what `leaveCommunity`
 * does with a pending row - it deletes it and, correctly, does not touch the
 * member count, since a request was never a member.
 *
 * Owners and moderators get `LEAVE` too. The service refuses a sole owner with
 * an explanation, and that refusal is worth showing; silently hiding the exit
 * would leave someone who has genuinely handed over the community unable to
 * step away.
 */
export type MembershipIntent = "JOIN" | "LEAVE" | "NONE"

export function membershipIntent(
  community: Pick<CommunitySummary, "joinPolicy" | "viewerMembership">,
): MembershipIntent {
  switch (community.viewerMembership) {
    case "NONE":
      // An invite-only community has nothing for a non-member to press.
      return community.joinPolicy === "INVITE" ? "NONE" : "JOIN"
    case "INVITED":
      return "JOIN"
    case "PENDING":
    case "MEMBER":
    case "MODERATOR":
    case "OWNER":
      return "LEAVE"
  }
}

/**
 * The word on the control when the intent is to leave.
 *
 * Separate from `describeMembershipAction`, whose labels for these states are
 * statuses - "Joined", "Owner" - because a button has to say what pressing it
 * does. "Withdraw request" rather than "Leave" for a pending row, since there
 * is nothing yet to leave.
 */
export function describeLeaveAction(
  community: Pick<CommunitySummary, "name" | "viewerMembership">,
): Pick<MembershipAction, "label" | "accessibleLabel"> {
  if (community.viewerMembership === "PENDING") {
    return {
      label: "Withdraw request",
      accessibleLabel: `Withdraw your request to join ${community.name}`,
    }
  }

  return { label: "Leave", accessibleLabel: `Leave ${community.name}` }
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
