import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "./accounts"

/**
 * The seed and the sign-in screen must describe the same accounts.
 *
 * They are written independently - the seed builds rows, this file drives the
 * buttons and the documentation - and nothing but this test connects them. A
 * drift here produces the worst possible demo failure: credentials printed on
 * screen that do not work, discovered in front of an audience.
 *
 * Asserted by reading the seed source rather than by importing it, because
 * importing would execute it and try to open a database.
 */

const seedSource = readFileSync("lib/db/demo-seed.ts", "utf8")

describe("demo accounts agree with the seed", () => {
  it("uses the same password", () => {
    expect(seedSource).toContain(`const DEMO_PASSWORD = "${DEMO_PASSWORD}"`)
  })

  it.each(DEMO_ACCOUNTS)("seeds $email", ({ email }) => {
    expect(seedSource).toContain(email)
  })

  it("covers a student, an organiser and an admin", () => {
    /**
     * Three roles, because the showcase walks through all three dashboards. If
     * one is dropped, a scenario in the README silently becomes
     * undemonstrable.
     */
    expect(DEMO_ACCOUNTS.map((account) => account.role)).toEqual([
      "STUDENT",
      "ORGANIZER",
      "PLATFORM_ADMIN",
    ])
  })

  it("only uses chitkara.edu.in addresses", () => {
    // The demo has to obey the university-email rule it is demonstrating.
    for (const account of DEMO_ACCOUNTS) {
      expect(account.email.endsWith("@chitkara.edu.in")).toBe(true)
    }
  })
})
