import { describe, expect, it } from "vitest"

import {
  VERIFICATION_TOKEN_TTL_MINUTES,
  emailDomainOf,
  isVerificationTokenExpired,
  verificationExpiresAt,
} from "@/lib/domain/university"

/**
 * The interesting cases here are the rejections.
 *
 * Every input this function accepts becomes a string that gets compared against
 * `places.email_domain`. A garbage string that survives parsing does not throw -
 * it just fails to match, and the student is told their university is not on
 * Cirqles when in fact they made a typo. So the bar is: if it is not clearly a
 * domain, return null and let the caller say something accurate.
 */
describe("reading a university domain off an address", () => {
  it("takes the part after the at sign", () => {
    expect(emailDomainOf("student@chitkara.edu.in")).toBe("chitkara.edu.in")
  })

  it("lowercases, because addresses are typed by humans", () => {
    expect(emailDomainOf("Student@Chitkara.Edu.In")).toBe("chitkara.edu.in")
  })

  it("tolerates surrounding whitespace from a paste", () => {
    expect(emailDomainOf("  student@chitkara.edu.in ")).toBe("chitkara.edu.in")
  })

  it("rejects an address with no at sign", () => {
    expect(emailDomainOf("chitkara.edu.in")).toBeNull()
  })

  it("rejects an address with two at signs", () => {
    expect(emailDomainOf("a@b@chitkara.edu.in")).toBeNull()
  })

  it("rejects an empty local part", () => {
    expect(emailDomainOf("@chitkara.edu.in")).toBeNull()
  })

  it("rejects an empty domain", () => {
    expect(emailDomainOf("student@")).toBeNull()
  })

  it("rejects a dotless host, which is never a campus", () => {
    expect(emailDomainOf("student@localhost")).toBeNull()
  })

  it("rejects a domain with a leading or trailing dot", () => {
    expect(emailDomainOf("student@.edu.in")).toBeNull()
    expect(emailDomainOf("student@chitkara.")).toBeNull()
  })
})

describe("verification token expiry", () => {
  const now = new Date("2026-08-16T00:00:00.000Z")

  it("expires the configured number of minutes after minting", () => {
    const expires = verificationExpiresAt(now)
    const minutes = (expires.getTime() - now.getTime()) / 60_000
    expect(minutes).toBe(VERIFICATION_TOKEN_TTL_MINUTES)
  })

  it("a fresh token is not expired", () => {
    expect(isVerificationTokenExpired(verificationExpiresAt(now), now)).toBe(
      false,
    )
  })

  it("a token is dead at its expiry instant, not after it", () => {
    expect(isVerificationTokenExpired(now, now)).toBe(true)
  })

  it("a token from yesterday is expired", () => {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60_000)
    expect(isVerificationTokenExpired(yesterday, now)).toBe(true)
  })
})
