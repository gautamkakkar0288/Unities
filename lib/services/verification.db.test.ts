// @vitest-environment node
import { eq, inArray } from "drizzle-orm"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import { places, users, verificationTokens } from "@/lib/db/schema"
import { setEmailTransport, consoleTransport } from "@/lib/email"
import type { EmailMessage, EmailTransport } from "@/lib/email"
import {
  findUniversityForEmail,
  hashVerificationToken,
  requestEmailVerification,
  verifyEmailToken,
} from "@/lib/services/verification"

/**
 * Verification against a real Postgres.
 *
 * A fake database would not test the thing most likely to break here: that the
 * campus lookup is a join against a real `places` row rather than a constant,
 * and that a verified account genuinely carries a `university_id` afterwards.
 * Those are the two facts every later authorization decision rests on.
 *
 * Mail is captured through the transport seam instead of being stubbed at the
 * module level, which incidentally proves the seam works.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

/** Fictional domains, so a real seed can never collide with these rows. */
const UNI_ID = "vf-place-university"
const UNI_DOMAIN = "vf-campus.test"
const SUSPENDED_ID = "vf-place-suspended"
const SUSPENDED_DOMAIN = "vf-closed.test"

const STUDENT = "vf-user-student"
const STUDENT_EMAIL = `student@${UNI_DOMAIN}`
const OUTSIDER = "vf-user-outsider"
const OUTSIDER_EMAIL = "outsider@vf-gmail.test"
const VERIFIED = "vf-user-verified"
const VERIFIED_EMAIL = `already@${UNI_DOMAIN}`

const USER_IDS = [STUDENT, OUTSIDER, VERIFIED]
const EMAILS = [STUDENT_EMAIL, OUTSIDER_EMAIL, VERIFIED_EMAIL]
const PLACE_IDS = [UNI_ID, SUSPENDED_ID]

/** Captures what would have been sent, so the link can be read back out. */
const sent: EmailMessage[] = []
const captureTransport: EmailTransport = {
  name: "capture",
  async send(message) {
    sent.push(message)
  },
}

/** Pull the token out of the link the student would have clicked. */
function tokenFromLastEmail(): string {
  const last = sent.at(-1)
  if (!last) throw new Error("No email was sent")
  const match = last.text.match(/token=([a-f0-9]+)/)
  if (!match) throw new Error(`No token in email:\n${last.text}`)
  return match[1]
}

async function cleanup() {
  await db
    .delete(verificationTokens)
    .where(inArray(verificationTokens.identifier, EMAILS))
  await db.delete(users).where(inArray(users.id, USER_IDS))
  await db.delete(places).where(inArray(places.id, PLACE_IDS))
}

async function resetUsers() {
  await db
    .delete(verificationTokens)
    .where(inArray(verificationTokens.identifier, EMAILS))
  await db.delete(users).where(inArray(users.id, USER_IDS))

  await db.insert(users).values([
    { id: STUDENT, name: "Campus Student", email: STUDENT_EMAIL },
    { id: OUTSIDER, name: "Outsider", email: OUTSIDER_EMAIL },
    {
      id: VERIFIED,
      name: "Already Verified",
      email: VERIFIED_EMAIL,
      emailVerified: new Date("2026-01-01T00:00:00.000Z"),
    },
  ])
}

describe.skipIf(!hasDatabase)("university email verification", () => {
  beforeAll(async () => {
    setEmailTransport(captureTransport)
    await cleanup()

    await db.insert(places).values([
      {
        id: UNI_ID,
        kind: "UNIVERSITY" as const,
        name: "Verification Test University",
        slug: "vf-campus",
        status: "ACTIVE" as const,
        emailDomain: UNI_DOMAIN,
      },
      {
        id: SUSPENDED_ID,
        kind: "UNIVERSITY" as const,
        name: "Suspended Test University",
        slug: "vf-closed",
        status: "SUSPENDED" as const,
        emailDomain: SUSPENDED_DOMAIN,
      },
    ])
  })

  afterAll(async () => {
    await cleanup()
    setEmailTransport(consoleTransport)
  })

  afterEach(() => {
    sent.length = 0
  })

  describe("finding the campus for an address", () => {
    beforeAll(resetUsers)

    it("matches an active university by its email domain", async () => {
      const place = await findUniversityForEmail(STUDENT_EMAIL)
      expect(place?.id).toBe(UNI_ID)
    })

    it("is case insensitive, because students type their own address", async () => {
      const place = await findUniversityForEmail(`Student@${UNI_DOMAIN.toUpperCase()}`)
      expect(place?.id).toBe(UNI_ID)
    })

    it("does not match a personal address", async () => {
      expect(await findUniversityForEmail(OUTSIDER_EMAIL)).toBeNull()
    })

    it("does not match a suspended campus", async () => {
      expect(
        await findUniversityForEmail(`someone@${SUSPENDED_DOMAIN}`),
      ).toBeNull()
    })

    it("does not match a malformed address", async () => {
      expect(await findUniversityForEmail("not-an-address")).toBeNull()
    })
  })

  describe("requesting a link", () => {
    beforeAll(resetUsers)

    it("refuses an account that does not exist", async () => {
      const result = await requestEmailVerification({ userId: "vf-nobody" })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("NOT_FOUND")
    })

    it("refuses an address no campus claims", async () => {
      const result = await requestEmailVerification({ userId: OUTSIDER })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("FORBIDDEN")
      expect(sent).toHaveLength(0)
    })

    it("refuses an account that is already verified", async () => {
      const result = await requestEmailVerification({ userId: VERIFIED })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("CONFLICT")
      expect(sent).toHaveLength(0)
    })

    it("sends a link and stores only the hash of the token", async () => {
      const result = await requestEmailVerification({ userId: STUDENT })
      expect(result.ok).toBe(true)
      expect(sent).toHaveLength(1)

      const token = tokenFromLastEmail()

      const rows = await db
        .select({ token: verificationTokens.token })
        .from(verificationTokens)
        .where(eq(verificationTokens.identifier, STUDENT_EMAIL))

      expect(rows).toHaveLength(1)
      // The plaintext token must never be recoverable from the table.
      expect(rows[0].token).not.toBe(token)
      expect(rows[0].token).toBe(hashVerificationToken(token))
    })

    it("replaces the previous token, so only the newest link works", async () => {
      await requestEmailVerification({ userId: STUDENT })
      const first = tokenFromLastEmail()

      await requestEmailVerification({ userId: STUDENT })
      const second = tokenFromLastEmail()

      expect(second).not.toBe(first)

      const rows = await db
        .select({ token: verificationTokens.token })
        .from(verificationTokens)
        .where(eq(verificationTokens.identifier, STUDENT_EMAIL))

      expect(rows).toHaveLength(1)
      expect(rows[0].token).toBe(hashVerificationToken(second))
    })
  })

  describe("redeeming a link", () => {
    beforeAll(resetUsers)

    it("rejects a forged token", async () => {
      const result = await verifyEmailToken({
        input: { email: STUDENT_EMAIL, token: "deadbeef" },
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("INVALID")
    })

    it("rejects a valid token presented for the wrong address", async () => {
      await resetUsers()
      await requestEmailVerification({ userId: STUDENT })
      const token = tokenFromLastEmail()

      const result = await verifyEmailToken({
        input: { email: OUTSIDER_EMAIL, token },
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("INVALID")
    })

    it("rejects malformed input", async () => {
      const result = await verifyEmailToken({
        input: { email: "not-an-address", token: "" },
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("INVALID")
    })

    it("rejects an expired token and clears it away", async () => {
      await resetUsers()
      // Mint at a point far enough in the past that it is dead by now.
      const longAgo = new Date(Date.now() - 48 * 60 * 60_000)
      await requestEmailVerification({ userId: STUDENT, now: longAgo })
      const token = tokenFromLastEmail()

      const result = await verifyEmailToken({
        input: { email: STUDENT_EMAIL, token },
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("INVALID")

      const rows = await db
        .select({ token: verificationTokens.token })
        .from(verificationTokens)
        .where(eq(verificationTokens.identifier, STUDENT_EMAIL))
      expect(rows).toHaveLength(0)

      const [account] = await db
        .select({ emailVerified: users.emailVerified })
        .from(users)
        .where(eq(users.id, STUDENT))
      expect(account.emailVerified).toBeNull()
    })

    it("verifies the account and links it to the campus", async () => {
      await resetUsers()
      await requestEmailVerification({ userId: STUDENT })
      const token = tokenFromLastEmail()

      const result = await verifyEmailToken({
        input: { email: STUDENT_EMAIL, token },
      })
      expect(result.ok).toBe(true)

      const [account] = await db
        .select({
          emailVerified: users.emailVerified,
          universityId: users.universityId,
        })
        .from(users)
        .where(eq(users.id, STUDENT))

      expect(account.emailVerified).toBeInstanceOf(Date)
      // This is the fact every later authorization decision reads.
      expect(account.universityId).toBe(UNI_ID)
    })

    it("consumes the token, so a link works exactly once", async () => {
      await resetUsers()
      await requestEmailVerification({ userId: STUDENT })
      const token = tokenFromLastEmail()

      await verifyEmailToken({ input: { email: STUDENT_EMAIL, token } })

      const rows = await db
        .select({ token: verificationTokens.token })
        .from(verificationTokens)
        .where(eq(verificationTokens.identifier, STUDENT_EMAIL))
      expect(rows).toHaveLength(0)
    })

    it("reports success when an already verified student clicks again", async () => {
      await resetUsers()
      await requestEmailVerification({ userId: STUDENT })
      const token = tokenFromLastEmail()

      const first = await verifyEmailToken({
        input: { email: STUDENT_EMAIL, token },
      })
      expect(first.ok).toBe(true)

      // The intent was "make my account verified", and it is.
      const second = await verifyEmailToken({
        input: { email: STUDENT_EMAIL, token },
      })
      expect(second.ok).toBe(true)
    })
  })
})
