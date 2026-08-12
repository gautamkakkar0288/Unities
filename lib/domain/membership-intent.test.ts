import { describe, expect, it } from "vitest"

import {
  describeLeaveAction,
  describeMembershipAction,
  membershipIntent,
} from "@/lib/domain/membership"
import type { CommunitySummary } from "@/lib/domain/types"

type Viewer = Pick<
  CommunitySummary,
  "name" | "joinPolicy" | "viewerMembership"
>

function viewer(overrides: Partial<Viewer> = {}): Viewer {
  return {
    name: "Robotics",
    joinPolicy: "OPEN",
    viewerMembership: "NONE",
    ...overrides,
  }
}

describe("membershipIntent", () => {
  it("joins an open community", () => {
    expect(membershipIntent(viewer())).toBe("JOIN")
  })

  it("still joins an approval community, because requesting is joining", () => {
    // resolveJoinOutcome turns this into PENDING server-side. The control does
    // not need a third intent for it.
    expect(membershipIntent(viewer({ joinPolicy: "APPROVAL" }))).toBe("JOIN")
  })

  it("offers nothing to press on an invite-only community", () => {
    expect(membershipIntent(viewer({ joinPolicy: "INVITE" }))).toBe("NONE")
  })

  it("treats accepting an invitation as joining", () => {
    // Even for an invite-only community: the invitation is the permission.
    expect(
      membershipIntent(viewer({ joinPolicy: "INVITE", viewerMembership: "INVITED" })),
    ).toBe("JOIN")
  })

  it("withdraws a pending request through leave", () => {
    expect(membershipIntent(viewer({ viewerMembership: "PENDING" }))).toBe("LEAVE")
  })

  it.each(["MEMBER", "MODERATOR", "OWNER"] as const)(
    "lets a %s leave",
    (state) => {
      expect(membershipIntent(viewer({ viewerMembership: state }))).toBe("LEAVE")
    },
  )
})

describe("describeLeaveAction", () => {
  it("does not say leave when there is nothing to leave yet", () => {
    expect(describeLeaveAction(viewer({ viewerMembership: "PENDING" }))).toEqual({
      label: "Withdraw request",
      accessibleLabel: "Withdraw your request to join Robotics",
    })
  })

  it("names the community, so the label survives being read alone", () => {
    expect(
      describeLeaveAction(viewer({ viewerMembership: "MEMBER" })).accessibleLabel,
    ).toBe("Leave Robotics")
  })
})

describe("the label and the write agree", () => {
  it.each(["NONE", "INVITED"] as const)(
    "gives %s an enabled control and a JOIN intent",
    (state) => {
      const community = viewer({ viewerMembership: state })
      expect(membershipIntent(community)).toBe("JOIN")
      expect(describeMembershipAction(community).disabled).toBe(false)
    },
  )

  it("gives an invite-only non-member a disabled control and no intent", () => {
    // The pairing that matters: if these ever disagreed, the student would see
    // a live button that the service is guaranteed to refuse.
    const community = viewer({ joinPolicy: "INVITE" })
    expect(describeMembershipAction(community).disabled).toBe(true)
    expect(membershipIntent(community)).toBe("NONE")
  })
})
