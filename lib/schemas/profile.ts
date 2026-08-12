import { z } from "zod"

/**
 * Input contract for profile writes.
 *
 * Only the display name for now. The domain's `ProfileDetail` also carries a
 * bio, a username, and a programme, and the `users` table has none of them -
 * so a form collecting them would either write nowhere or need columns nobody
 * has designed yet. They arrive when the schema does.
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give us at least two characters to call you by.")
    .max(60, "Keep your name under 60 characters."),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
