import { describe, expect, it } from "vitest"

import { resolveJoinOutcome, type JoinOutcome } from "@/lib/domain/join-policy"
import { describeMembershipAction } from "@/lib/domain/membership"
import type { CommunitySummary, MembershipState } from "@/lib/domain/types"

/**
 * UI/backend policy consistency.
 *
 * The architectural claim being defended here is that the control a student
 * sees can never promise something the write path refuses. These tests pin the
 * pairing itself, not just the two sides separately - if someone changes the
 * label for APPROVAL to "Join" without changing the outcome, this fails.
 */

const joinPolicies = ["OPEN", "APPROVAL", "INVITE"] as const

function action(
  joinPolicy: CommunitySummary["joinPolicy"],
  viewerMembership: MembershipState,
) {
  return describeMembershipAction({
    name: "Test Community",
    joinPolicy,
    viewerMembership,
  })
}

describe("join policy: what the button says and what the server does", () => {
  it.each<{
    joinPolicy: (typeof joinPolicies)[number]
    label: string
    disabled: boolean
    outcome: JoinOutcome
  }>([
    { joinPolicy: "OPEN", label: "Join", disabled: false, outcome: "MEMBER" },
    {
      joinPolicy: "APPROVAL",
      label: "Request to join",
      disabled: false,
      outcome: "PENDING",
    },
    {
      joinPolicy: "INVITE",
      label: "Invite only",
      disabled: true,
      outcome: "REFUSED",
    },
  ])(
    "$joinPolicy shows \"$label\" and resolves to $outcome",
    ({ joinPolicy, label, disabled, outcome }) => {
      const ui = action(joinPolicy, "NONE")

      expect(ui.label).toBe(label)
      expect(ui.disabled).toBe(disabled)
      expect(resolveJoinOutcome(joinPolicy, "NONE")).toBe(outcome)
    },
  )

  it("only offers an actionable control when the write path would accept it", () => {
    for (const joinPolicy of joinPolicies) {
      const ui = action(joinPolicy, "NONE")
      const outcome = resolveJoinOutcome(joinPolicy, "NONE")

      // The inverse of the failure this design exists to prevent: an enabled
      // control whose corresponding write is refused.
      if (!ui.disabled) expect(outcome).not.toBe("REFUSED")
      if (outcome === "REFUSED") expect(ui.disabled).toBe(true)
    }
  })

  it("lets an invited student in regardless of policy", () => {
    for (const joinPolicy of joinPolicies) {
      expect(action(joinPolicy, "INVITED").label).toBe("Accept invite")
      expect(resolveJoinOutcome(joinPolicy, "INVITED")).toBe("MEMBER")
    }
  })

  it("treats a pending request as settled, not as a second chance to apply", () => {
    for (const joinPolicy of joinPolicies) {
      expect(action(joinPolicy, "PENDING").label).toBe("Requested")
      expect(action(joinPolicy, "PENDING").disabled).toBe(true)
      expect(resolveJoinOutcome(joinPolicy, "PENDING")).toBe("UNCHANGED")
    }
  })

  it.each<MembershipState>(["MEMBER", "MODERATOR", "OWNER"])(
    "is a no-op for an existing %s",
    (state) => {
      for (const joinPolicy of joinPolicies) {
        expect(resolveJoinOutcome(joinPolicy, state)).toBe("UNCHANGED")
      }
    },
  )
})
