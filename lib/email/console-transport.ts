import type { EmailMessage, EmailTransport } from "./types"

/**
 * The development transport. It prints; it does not deliver.
 *
 * This is the honest default, and the loud prefix is the point. A silent no-op
 * transport is how a team ships to production believing verification mail works
 * because nothing ever errored. Anyone reading these logs can see immediately
 * that no message left the machine, and the link is printed in full so local
 * development does not need a mail server at all.
 *
 * It refuses to run in production for the same reason: failing to send is
 * recoverable, believing you sent is not.
 */
export const consoleTransport: EmailTransport = {
  name: "console",

  async send(message: EmailMessage): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "The console email transport cannot be used in production. " +
          "Configure a real transport before deploying.",
      )
    }

    console.info(
      [
        "",
        "──────────────────────────────────────────────",
        "EMAIL NOT SENT - console transport (dev only)",
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        "──────────────────────────────────────────────",
        message.text,
        "──────────────────────────────────────────────",
        "",
      ].join("\n"),
    )
  },
}
