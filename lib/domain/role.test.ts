import { describe, expect, it } from "vitest"

import { userRoles, type UserRole } from "@/lib/db/schema"

import {
  assignableRoles,
  canAssignRoles,
  canReviewVerification,
  isAdminRole,
  refuseRoleAssignment,
  roleRank,
} from "./role"

/**
 * Authorization is the one place where a test suite earns its keep by being
 * exhaustive rather than representative. Every case below is a way somebody
 * could gain authority they were not given.
 */

const assign = (
  actorRole: UserRole,
  targetRole: UserRole,
  nextRole: UserRole,
  same = false,
) =>
  refuseRoleAssignment({
    actorId: "actor",
    actorRole,
    targetId: same ? "actor" : "target",
    targetRole,
    nextRole,
  })

describe("role ranking", () => {
  it("orders every role distinctly", () => {
    const ranks = userRoles.map(roleRank)
    expect(new Set(ranks).size).toBe(userRoles.length)
  })

  it("puts students at the bottom and platform admins at the top", () => {
    for (const role of userRoles) {
      expect(roleRank("STUDENT")).toBeLessThanOrEqual(roleRank(role))
      expect(roleRank("PLATFORM_ADMIN")).toBeGreaterThanOrEqual(roleRank(role))
    }
  })
})

describe("who may review verification", () => {
  it("admits campus and platform admins", () => {
    expect(canReviewVerification("UNIVERSITY_ADMIN")).toBe(true)
    expect(canReviewVerification("PLATFORM_ADMIN")).toBe(true)
  })

  it("refuses students, organisers, and community moderators", () => {
    expect(canReviewVerification("STUDENT")).toBe(false)
    expect(canReviewVerification("ORGANIZER")).toBe(false)
    // Moderating one community is not authority over another one.
    expect(canReviewVerification("COMMUNITY_MODERATOR")).toBe(false)
  })

  it("agrees with isAdminRole for every role", () => {
    for (const role of userRoles) {
      expect(canReviewVerification(role)).toBe(isAdminRole(role))
      expect(canAssignRoles(role)).toBe(isAdminRole(role))
    }
  })
})

describe("assignable roles", () => {
  it("is empty for anyone who cannot assign roles", () => {
    expect(assignableRoles("STUDENT")).toEqual([])
    expect(assignableRoles("ORGANIZER")).toEqual([])
    expect(assignableRoles("COMMUNITY_MODERATOR")).toEqual([])
  })

  it("never includes the actor's own role", () => {
    for (const role of userRoles) {
      expect(assignableRoles(role)).not.toContain(role)
    }
  })

  it("lets a platform admin grant organiser but not platform admin", () => {
    const roles = assignableRoles("PLATFORM_ADMIN")
    expect(roles).toContain("ORGANIZER")
    expect(roles).toContain("UNIVERSITY_ADMIN")
    // The only way to mint a platform admin is the seed.
    expect(roles).not.toContain("PLATFORM_ADMIN")
  })

  it("lets a university admin grant organiser but not their own level", () => {
    const roles = assignableRoles("UNIVERSITY_ADMIN")
    expect(roles).toContain("ORGANIZER")
    expect(roles).toContain("COMMUNITY_MODERATOR")
    expect(roles).not.toContain("UNIVERSITY_ADMIN")
    expect(roles).not.toContain("PLATFORM_ADMIN")
  })
})

describe("refusing a role assignment", () => {
  it("refuses anyone who is not an admin", () => {
    expect(assign("STUDENT", "STUDENT", "ORGANIZER")).toBe("NOT_PERMITTED")
    expect(assign("ORGANIZER", "STUDENT", "ORGANIZER")).toBe("NOT_PERMITTED")
    expect(assign("COMMUNITY_MODERATOR", "STUDENT", "ORGANIZER")).toBe(
      "NOT_PERMITTED",
    )
  })

  it("refuses self promotion, for every role", () => {
    for (const role of userRoles) {
      const refusal = assign(role, role, "PLATFORM_ADMIN", true)
      // Non-admins are stopped earlier; admins are stopped by SELF.
      expect(refusal).not.toBeNull()
      if (isAdminRole(role)) expect(refusal).toBe("SELF")
    }
  })

  it("refuses self demotion too, so an admin cannot lock themselves out", () => {
    expect(assign("PLATFORM_ADMIN", "PLATFORM_ADMIN", "STUDENT", true)).toBe(
      "SELF",
    )
  })

  it("refuses granting a role at or above the actor's own", () => {
    expect(assign("UNIVERSITY_ADMIN", "STUDENT", "UNIVERSITY_ADMIN")).toBe(
      "ABOVE_ACTOR",
    )
    expect(assign("UNIVERSITY_ADMIN", "STUDENT", "PLATFORM_ADMIN")).toBe(
      "ABOVE_ACTOR",
    )
    expect(assign("PLATFORM_ADMIN", "STUDENT", "PLATFORM_ADMIN")).toBe(
      "ABOVE_ACTOR",
    )
  })

  it("refuses acting on a peer or a superior", () => {
    expect(assign("UNIVERSITY_ADMIN", "UNIVERSITY_ADMIN", "STUDENT")).toBe(
      "TARGET_ABOVE_ACTOR",
    )
    expect(assign("UNIVERSITY_ADMIN", "PLATFORM_ADMIN", "STUDENT")).toBe(
      "TARGET_ABOVE_ACTOR",
    )
  })

  it("reports a no-op rather than pretending something happened", () => {
    expect(assign("PLATFORM_ADMIN", "ORGANIZER", "ORGANIZER")).toBe("UNCHANGED")
  })

  it("allows the promotions the product actually needs", () => {
    expect(assign("UNIVERSITY_ADMIN", "STUDENT", "ORGANIZER")).toBeNull()
    expect(assign("PLATFORM_ADMIN", "STUDENT", "UNIVERSITY_ADMIN")).toBeNull()
    // And the demotions, which matter just as much.
    expect(assign("PLATFORM_ADMIN", "ORGANIZER", "STUDENT")).toBeNull()
  })
})
