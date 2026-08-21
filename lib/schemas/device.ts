import { z } from "zod"

import { devicePlatforms } from "@/lib/db/schema"

/**
 * What a device may claim about itself.
 *
 * The platform is checked against the schema's own enum rather than a string
 * literal written here, so the column and the contract cannot drift apart.
 * `"android"` from a client that lowercases is accepted and normalised;
 * `"web"` is refused outright, because a platform the sender will not know how
 * to reach is worse stored than rejected.
 *
 * The token has a floor as well as a ceiling. FCM and APNs tokens are long, so
 * anything very short is a placeholder, an empty string, or a bug in the client
 * - none of which should occupy a row that a future sender will try to use.
 */
export const registerDeviceSchema = z.object({
  token: z
    .string()
    .trim()
    .min(32, "That device token does not look valid")
    .max(4096, "That device token is too long"),
  platform: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.enum(devicePlatforms, "Platform must be android or ios")),
})

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>
