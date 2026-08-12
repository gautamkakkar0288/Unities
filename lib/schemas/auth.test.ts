import { describe, expect, it } from "vitest"

import { signInSchema, signUpSchema } from "./auth"

describe("signUpSchema", () => {
  it("accepts valid input", () => {
    const result = signUpSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@university.edu",
      password: "correct-horse-battery",
    })
    expect(result.success).toBe(true)
  })

  it("rejects short passwords", () => {
    const result = signUpSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@university.edu",
      password: "short",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid emails", () => {
    const result = signUpSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      password: "correct-horse-battery",
    })
    expect(result.success).toBe(false)
  })

  it("trims surrounding whitespace from names", () => {
    const result = signUpSchema.safeParse({
      name: "  Ada Lovelace  ",
      email: "ada@university.edu",
      password: "correct-horse-battery",
    })
    expect(result.success && result.data.name).toBe("Ada Lovelace")
  })
})

describe("signInSchema", () => {
  it("requires a password", () => {
    const result = signInSchema.safeParse({
      email: "ada@university.edu",
      password: "",
    })
    expect(result.success).toBe(false)
  })
})
