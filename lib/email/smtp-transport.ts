import nodemailer from "nodemailer"

import type { EmailMessage, EmailTransport } from "./types"

/**
 * Configuration required to build an SMTP transport.
 *
 * Intentionally a plain object rather than reading from `process.env` here —
 * the caller (application startup or tests) decides where the values come from,
 * keeping this module free of side effects and easy to test in isolation.
 */
export type SmtpConfig = {
  host: string
  port: number
  /** true for port 465 (SMTPS), false for 587 (STARTTLS) */
  secure: boolean
  user: string
  password: string
  /** The `From` address on every outgoing message. */
  from: string
}

/**
 * Build an SMTP transport from explicit configuration.
 *
 * The transport is verified (nodemailer `verify()`) before it is returned, so
 * a bad host or wrong credentials fail at startup rather than on the first
 * verification email a new student tries to receive.
 *
 * Call this once at application startup and pass the result to
 * `setEmailTransport`. Do not call it per-request — a new SMTP connection pool
 * per email is the sort of mistake that takes down a mail server.
 */
export async function createSmtpTransport(
  config: SmtpConfig,
): Promise<EmailTransport> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  })

  // Fail loudly at startup rather than silently at send time.
  await transporter.verify()

  return {
    name: `smtp(${config.host}:${config.port})`,

    async send(message: EmailMessage): Promise<void> {
      await transporter.sendMail({
        from: config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      })
    },
  }
}

/**
 * Read SMTP configuration from environment variables.
 *
 * Returns `null` (and an explanation) when any required variable is absent, so
 * the application can decide whether to fall back to the console transport
 * (acceptable in staging) or to refuse to start (correct in production).
 *
 * Never throws: callers inspect the result.
 */
export function smtpConfigFromEnv():
  | { config: SmtpConfig; missing: null }
  | { config: null; missing: string[] } {
  const required: Record<string, string | undefined> = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
  }

  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length > 0) {
    return { config: null, missing }
  }

  return {
    config: {
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT ?? "587"),
      secure: process.env.SMTP_PORT === "465",
      user: process.env.SMTP_USER!,
      password: process.env.SMTP_PASSWORD!,
      from: process.env.SMTP_FROM!,
    },
    missing: null,
  }
}
