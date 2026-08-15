import { describe, expect, it } from "vitest"

import { userRoles } from "@/lib/db/schema"

import {
  communityVerificationForDecision,
  MAXIMUM_EVIDENCE_LENGTH,
  MINIMUM_EVIDENCE_LENGTH,
  roleAfterVerification,
} from "./organizer-verification"

describe("role after verification", () => {
  it("promotes a student to organiser", () => {
    expect(roleAfterVerification("STUDENT")).toBe("ORGANIZER")
  })

  it("never lowers an existing role", () => {
    // Verifying a club run by an admin must not demote the admin.
    for (const role of userRoles) {
      if (role === "STUDENT") continue
      expect(roleAfterVerification(role)).toBe(role)
    }
  })

  it("is idempotent, so approving twice changes nothing further", () => {
    const once = roleAfterVerification("STUDENT")
    expect(roleAfterVerification(once)).toBe(once)
  })
})

describe("community verification after a decision", () => {
  it("verifies on approval", () => {
    expect(communityVerificationForDecision("APPROVED")).toBe("VERIFIED")
  })

  it("returns to unverified on rejection rather than staying pending", () => {
    expect(communityVerificationForDecision("REJECTED")).toBe("UNVERIFIED")
  })
})

describe("evidence bounds", () => {
  it("asks for a sentence, not an essay", () => {
    expect(MINIMUM_EVIDENCE_LENGTH).toBeGreaterThan(0)
    expect(MINIMUM_EVIDENCE_LENGTH).toBeLessThan(MAXIMUM_EVIDENCE_LENGTH)
  })
})
