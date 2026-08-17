import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

/**
 * The database's answer to the questions the account gate asks.
 *
 * Separate from `verification.ts`, which mints and redeems tokens. That service
 * is about proving an address; this is about reporting the settled fact
 * afterwards, and every authenticated render needs the fact without wanting the
 * token machinery, `node:crypto`, or the mail transport in its import graph.
 */

/**
 * Whether this account has proved it can receive mail at its address.
 *
 * Selects one indexed column by primary key, because this runs on every
 * authenticated render. `emailVerified` is a timestamp and callers only need the
 * question answered, so the coercion happens here rather than in each layout.
 *
 * This reads the database on purpose, even when a session is already in hand.
 * Sessions are JWTs (D8): a token minted at sign-up carries whatever was true
 * then, so trusting it would keep a student locked out for the token's whole
 * lifetime after they verified - the gate would outlive the condition it
 * describes.
 *
 * An unknown id returns false rather than throwing. The gate's job is to refuse
 * anything it cannot vouch for, and "this user does not exist" is emphatically
 * that.
 */
export async function hasVerifiedEmail(userId: string): Promise<boolean> {
  const [account] = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return Boolean(account?.emailVerified)
}
