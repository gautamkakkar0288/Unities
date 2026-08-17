import { describe, expect, it } from "vitest"

import {
  accountGate,
  gateDestination,
  type AccountGateInput,
} from "@/lib/domain/verification-gate"

/**
 * Exhaustive over all eight combinations, for the same reason role.test.ts is
 * exhaustive over every role pair: this function decides who gets into the
 * product. There are only eight, so "representative" would mean leaving some
 * unchecked for no saving.
 */

function input(overrides: Partial<AccountGateInput> = {}): AccountGateInput {
  return { signedIn: true, emailVerified: true, onboarded: true, ...overrides }
}

describe("accountGate", () => {
  it("lets a signed-in, verified, onboarded student through", () => {
    expect(accountGate(input())).toBe("ALLOWED")
  })

  it("sends a verified student with no interests to onboarding", () => {
    expect(accountGate(input({ onboarded: false }))).toBe("ONBOARDING")
  })

  it("sends an unverified student to verification", () => {
    expect(accountGate(input({ emailVerified: false }))).toBe("VERIFY_EMAIL")
  })

  it("checks verification before onboarding", () => {
    // The decision this module exists to encode. Both gates are shut, and the
    // student is asked to confirm their address rather than to pick interests,
    // so nothing is stored against an account that may never be claimed.
    expect(accountGate(input({ emailVerified: false, onboarded: false }))).toBe(
      "VERIFY_EMAIL",
    )
  })

  it("sends a signed-out visitor to sign in, whatever else is true", () => {
    // Four cases in one: signed out dominates, so no combination of the other
    // flags can produce a gate that assumes a user object exists.
    expect(accountGate(input({ signedIn: false }))).toBe("SIGN_IN")
    expect(accountGate(input({ signedIn: false, onboarded: false }))).toBe(
      "SIGN_IN",
    )
    expect(accountGate(input({ signedIn: false, emailVerified: false }))).toBe(
      "SIGN_IN",
    )
    expect(
      accountGate(
        input({ signedIn: false, emailVerified: false, onboarded: false }),
      ),
    ).toBe("SIGN_IN")
  })
})

describe("gateDestination", () => {
  it("routes each blocked gate to the screen that can clear it", () => {
    expect(gateDestination("SIGN_IN")).toBe("/sign-in")
    expect(gateDestination("VERIFY_EMAIL")).toBe("/verify-email")
    expect(gateDestination("ONBOARDING")).toBe("/onboarding")
  })

  it("returns null for an allowed account", () => {
    // A layout redirects on a string and renders on null, so this being null
    // rather than the current path is what stops an allowed student looping.
    expect(gateDestination("ALLOWED")).toBeNull()
  })

  it("sends verification and onboarding to different screens", () => {
    // Guards against the tempting simplification of pointing both at
    // /onboarding and letting that page sort it out - which would put an
    // unverified student on the screen this change exists to withhold.
    expect(gateDestination("VERIFY_EMAIL")).not.toBe(
      gateDestination("ONBOARDING"),
    )
  })
})
