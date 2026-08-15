"use server"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { signUpSchema } from "@/lib/schemas/auth"
import {
  findUniversityForEmail,
  requestEmailVerification,
} from "@/lib/services/verification"

export type RegisterResult =
  | { status: "success" }
  | { status: "error"; message: string }

/**
 * Registration business logic lives here rather than in the form component, so
 * it can be reused by onboarding, invites, and admin-created accounts later.
 *
 * The campus gate is a database lookup, not a constant. An address is allowed
 * because some active `places` row registered its domain, which is what makes
 * opening Cirqles to a second university an INSERT rather than a deploy. It is
 * enforced here rather than in `signUpSchema` because Zod runs in the browser
 * too and cannot see the table - and a client-side gate is a suggestion anyway.
 */
export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check your details and try again.",
    }
  }

  const { name, password } = parsed.data
  // Addresses are stored lowercase so the unique index actually prevents the
  // same person registering twice with different capitalisation.
  const email = parsed.data.email.trim().toLowerCase()

  const university = await findUniversityForEmail(email)
  if (!university) {
    return {
      status: "error",
      message:
        "Cirqles is only open to students with a university email address. " +
        "Use the address your campus gave you.",
    }
  }

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

  // The campus is recorded now because the gate above proved the domain
  // matches. `email_verified` stays null: the domain says which university,
  // only a redeemed token says the mailbox is really theirs.
  const [created] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role: "STUDENT",
      universityId: university.id,
    })
    .returning({ id: users.id })

  // A mail failure must not lose the account. The student is registered, can
  // sign in, and can ask for another link; rolling back a real signup because
  // an SMTP host was briefly unreachable is the worse outcome by a distance.
  if (created) {
    try {
      await requestEmailVerification({ userId: created.id })
    } catch (error) {
      console.error("Verification email failed to send", error)
    }
  }

  return { status: "success" }
}

export type ResendResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string }

/**
 * Send another verification link to the signed-in student's own address.
 *
 * Takes no email argument on purpose. If the address came from the caller this
 * would be an open relay pointed at anyone's inbox; taking it from the session
 * means a student can only ever mail themselves.
 */
export async function resendVerificationEmail(): Promise<ResendResult> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { status: "error", message: "Sign in to request a new link." }
  }

  try {
    const result = await requestEmailVerification({ userId })

    if (!result.ok) {
      return { status: "error", message: result.message }
    }

    return {
      status: "success",
      message: `We sent a new link to ${result.data.email}.`,
    }
  } catch (error) {
    console.error("Verification email failed to send", error)
    return {
      status: "error",
      message: "We could not send that email just now. Try again shortly.",
    }
  }
}
