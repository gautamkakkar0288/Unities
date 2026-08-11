import type { CommunitySummary, MembershipState } from "@/lib/domain/types"

/**
 * What joining should do, given a policy and where the viewer currently stands.
 *
 * This is deliberately a pure function with no database access, extracted from
 * the service. The reason is testability of a specific claim: that the button a
 * student sees and the write the server performs are driven by the same rule.
 * While the rule lived inside `joinCommunity`, that claim could only be checked
 * by reading both files carefully and believing the reader. Now
 * `describeMembershipAction` and this function can be asserted against each
 * other in a unit test with no Postgres involved, and any future divergence
 * fails CI instead of reaching a student as a "Join" button that errors.
 */
export type JoinOutcome =
  /** The viewer ends up inside the community. */
  | "MEMBER"
  /** A request is recorded and a moderator decides. */
  | "PENDING"
  /** The policy forbids self-service entry. */
  | "REFUSED"
  /** Already a member, or already waiting. Nothing to do. */
  | "UNCHANGED"

export function resolveJoinOutcome(
  joinPolicy: CommunitySummary["joinPolicy"],
  current: MembershipState,
): JoinOutcome {
  // Already inside, or already waiting. Idempotent: students double-tap.
  if (current === "MEMBER" || current === "MODERATOR" || current === "OWNER") {
    return "UNCHANGED"
  }
  if (current === "PENDING") return "UNCHANGED"

  // An invitation is an offer, and accepting it ignores the join policy. That
  // is the entire point of an invite-only community.
  if (current === "INVITED") return "MEMBER"

  switch (joinPolicy) {
    case "OPEN":
      return "MEMBER"
    case "APPROVAL":
      return "PENDING"
    case "INVITE":
      return "REFUSED"
  }
}
