import { createHash, randomBytes } from "node:crypto"

import { and, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { places, users, verificationTokens } from "@/lib/db/schema"
import {
  VERIFICATION_TOKEN_TTL_MINUTES,
  emailDomainOf,
  isVerificationTokenExpired,
  verificationExpiresAt,
} from "@/lib/domain/university"
import type { PlaceRef } from "@/lib/domain/types"
import { sendEmail } from "@/lib/email"
import { verificationEmail } from "@/lib/email/templates"
import { verifyEmailSchema } from "@/lib/schemas/verification"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * University email verification.
 *
 * This is the service that lets the rest of Cirqles stop guessing. Once a row
 * has `email_verified` and a `university_id`, every later question - can this
 * person join a campus-scoped community, can they be made an organiser - has a
 * database answer instead of an assumption about the address someone typed.
 *
 * Two decisions worth knowing before changing anything here:
 *
 * 1. The allowed domain is a `places` row, never a constant. `chitkara.edu.in`
 *    appears in the seed and nowhere in the source. Adding a campus is an
 *    INSERT.
 *
 * 2. The token is stored as a SHA-256 digest. `verification_tokens` is a table
 *    a backup, a log, or a leaked dump can expose, and a plaintext token in any
 *    of those is a working key to somebody's verified account. Hashing costs one
 *    line and removes that entirely. It is a digest rather than bcrypt because
 *    the input is 256 bits of CSPRNG output - there is no dictionary to attack,
 *    so a slow hash would buy nothing and cost latency on every click.
 */

/** How long a link lasts, re-exported so callers and copy cannot drift apart. */
export { VERIFICATION_TOKEN_TTL_MINUTES }

/**
 * Hash a token for storage or lookup.
 *
 * Exported for the database tests, which need to plant a row with a known
 * token - the alternative is testing expiry by waiting an hour.
 */
export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/**
 * Which campus, if any, claims this address.
 *
 * `null` means "no active university has registered this domain", which is the
 * answer for a personal address and for a real campus nobody has added yet. The
 * caller decides what to tell the student; this only reports the fact.
 *
 * Only ACTIVE places count. A SUSPENDED campus should stop admitting new
 * accounts without deleting the university and orphaning everyone already in it.
 */
export async function findUniversityForEmail(
  email: string,
): Promise<PlaceRef | null> {
  const domain = emailDomainOf(email)
  if (!domain) return null

  const [place] = await db
    .select({
      id: places.id,
      slug: places.slug,
      name: places.name,
      kind: places.kind,
    })
    .from(places)
    .where(
      and(
        eq(places.kind, "UNIVERSITY"),
        eq(places.status, "ACTIVE"),
        eq(places.emailDomain, domain),
      ),
    )
    .limit(1)

  return place ?? null
}

/**
 * Mint a verification token for an account and mail the link.
 *
 * Any previous token for the address is deleted first. Two live links for one
 * account is a needless second key, and "resend" should mean the newest mail is
 * the one that works - which is also what a student expects when the first mail
 * has not arrived.
 *
 * A transport failure propagates. The caller decides whether that should fail
 * their operation; registration deliberately does not, because an account that
 * exists with an unverified address can be recovered with a resend, while an
 * account that was never created cannot.
 */
export async function requestEmailVerification(args: {
  userId: string
  now?: Date
}): Promise<ServiceResult<{ email: string; expiresAt: Date }>> {
  const now = args.now ?? new Date()

  const [account] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1)

  if (!account) return fail("NOT_FOUND", "We could not find your account.")

  if (account.emailVerified) {
    return fail("CONFLICT", "That email address is already confirmed.")
  }

  const university = await findUniversityForEmail(account.email)
  if (!university) {
    return fail(
      "FORBIDDEN",
      "Cirqles is only open to students with a university email address.",
    )
  }

  const token = randomBytes(32).toString("hex")
  const expires = verificationExpiresAt(now)

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, account.email))

  await db.insert(verificationTokens).values({
    identifier: account.email,
    token: hashVerificationToken(token),
    expires,
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const verifyUrl = new URL("/verify-email", baseUrl)
  verifyUrl.searchParams.set("token", token)
  verifyUrl.searchParams.set("email", account.email)

  await sendEmail(
    verificationEmail({
      to: account.email,
      name: account.name,
      universityName: university.name,
      verifyUrl: verifyUrl.toString(),
      expiresInMinutes: VERIFICATION_TOKEN_TTL_MINUTES,
    }),
  )

  return ok({ email: account.email, expiresAt: expires })
}

/**
 * Redeem a link.
 *
 * Verifying also confirms the account's campus. The domain was already checked
 * at registration, so this is not new information - but it is now information
 * somebody proved they can receive mail for, which is the only reason to trust
 * it at all.
 *
 * The token row is deleted on success, so a link works exactly once. Re-clicking
 * an already-used link on an already-verified account reports success rather
 * than an error - the student's intent was "make my account verified", and it is.
 */
export async function verifyEmailToken(args: {
  input: unknown
  now?: Date
}): Promise<ServiceResult<{ email: string; university: PlaceRef | null }>> {
  const now = args.now ?? new Date()

  const parsed = verifyEmailSchema.safeParse(args.input)
  if (!parsed.success) {
    return fail(
      "INVALID",
      parsed.error.issues[0]?.message ?? "That verification link is not valid.",
    )
  }

  const email = parsed.data.email.trim().toLowerCase()
  const tokenHash = hashVerificationToken(parsed.data.token)

  const [row] = await db
    .select({ expires: verificationTokens.expires })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, tokenHash),
      ),
    )
    .limit(1)

  if (!row) {
    // Covers a forged token, a used one, and a superseded one. Only one of
    // those deserves a different answer: the student who clicked their own
    // link twice should not be told something went wrong.
    const [account] = await db
      .select({ emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (account?.emailVerified) {
      return ok({ email, university: await findUniversityForEmail(email) })
    }

    return fail(
      "INVALID",
      "That verification link is not valid. Ask for a new one.",
    )
  }

  if (isVerificationTokenExpired(row.expires, now)) {
    // Clear it out. A dead token has no further use and leaving it makes the
    // table grow with rows that can only ever produce this same error.
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, tokenHash),
        ),
      )

    return fail(
      "INVALID",
      "That verification link has expired. Ask for a new one.",
    )
  }

  const university = await findUniversityForEmail(email)

  const [updated] = await db
    .update(users)
    .set({
      emailVerified: now,
      // Only ever set, never cleared: if the domain is later retired from
      // places, an already-linked account keeps the campus it proved.
      ...(university ? { universityId: university.id } : {}),
    })
    .where(eq(users.email, email))
    .returning({ id: users.id })

  if (!updated) return fail("NOT_FOUND", "We could not find your account.")

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email))

  return ok({ email, university })
}
