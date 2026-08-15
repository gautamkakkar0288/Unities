import { z } from "zod"

/**
 * What a verification link must carry.
 *
 * Both halves are needed. The token alone would let anyone with a stolen link
 * verify, which is the point of a token - but pairing it with the identifier
 * means the lookup is by primary key rather than a scan over a `token` column,
 * and it matches the shape of the Auth.js `verification_tokens` table this
 * flow reuses.
 *
 * Every message is the same on purpose. Telling someone "that token exists but
 * is for a different address" is a probe an attacker can run.
 */
const LINK_INVALID = "That verification link is not valid."

export const verifyEmailSchema = z.object({
  email: z.email(LINK_INVALID),
  token: z.string().min(1, LINK_INVALID),
})

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
