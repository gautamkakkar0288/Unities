import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().optional(),

  /**
   * SMTP transport — all optional. When absent the application falls back to
   * the console transport (dev only). A deployment that needs real mail must
   * supply all four SMTP_* variables; `smtpConfigFromEnv()` in
   * `lib/email/smtp-transport.ts` checks them and lists any that are missing.
   */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM,
})

