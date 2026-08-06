"use server"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { signUpSchema } from "@/lib/schemas/auth"

export type RegisterResult =
  | { status: "success" }
  | { status: "error"; message: string }

/**
 * Registration business logic lives here rather than in the form component, so
 * it can be reused by onboarding, invites, and admin-created accounts later.
 */
export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check your details and try again.",
    }
  }

  const { name, email, password } = parsed.data

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    return {
      status: "error",
      message: "An account with this email already exists.",
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.insert(users).values({ name, email, passwordHash, role: "STUDENT" })

  return { status: "success" }
}
