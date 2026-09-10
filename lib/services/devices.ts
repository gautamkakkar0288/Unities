import { db } from "@/lib/db"
import { deviceTokens, type DevicePlatform } from "@/lib/db/schema"
import { registerDeviceSchema } from "@/lib/schemas/device"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Registering a device, kept out of the route handler so the rule about who a
 * token belongs to lives with the other rules rather than in an HTTP file.
 */

export type RegisteredDevice = {
  id: string
  platform: DevicePlatform
  createdAt: string
  updatedAt: string
}

/**
 * Upsert on the token.
 *
 * A device that re-registers - a new app version, a token rotation, a different
 * student signing in on the same handset - updates the row it already has. The
 * conflict target is the token, so the second case moves ownership instead of
 * leaving two rows that would both be sent to.
 *
 * The token itself is never returned. The caller already knows it, and a
 * response that echoed it would put a push capability into a log line the first
 * time somebody debugged this endpoint.
 */
export async function registerDeviceToken({
  userId,
  input,
  now = new Date(),
}: {
  userId: string
  input: unknown
  now?: Date
}): Promise<ServiceResult<RegisteredDevice>> {
  const parsed = registerDeviceSchema.safeParse(input)

  if (!parsed.success) {
    return fail("INVALID", "That device could not be registered.")
  }

  const [row] = await db
    .insert(deviceTokens)
    .values({
      userId,
      token: parsed.data.token,
      platform: parsed.data.platform,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    })
    .onConflictDoUpdate({
      target: deviceTokens.token,
      set: {
        userId,
        platform: parsed.data.platform,
        updatedAt: now,
        lastUsedAt: now,
      },
    })
    .returning({
      id: deviceTokens.id,
      platform: deviceTokens.platform,
      createdAt: deviceTokens.createdAt,
      updatedAt: deviceTokens.updatedAt,
    })

  return ok({
    id: row.id,
    platform: row.platform,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })
}
