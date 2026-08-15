import type { EmailMessage } from "./types"

/**
 * Message bodies live next to the transport, not inside services.
 *
 * A service should say "send this student their verification link" and be done.
 * If copy lives in the service, changing a sentence means touching a file full
 * of authorization logic, and the diff that reviewers must read carefully looks
 * identical to the diff that fixes a typo.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function verificationEmail(args: {
  to: string
  name: string | null
  universityName: string
  verifyUrl: string
  expiresInMinutes: number
}): EmailMessage {
  const greeting = args.name ? `Hi ${args.name},` : "Hi,"

  const text = [
    greeting,
    "",
    `Confirm this address to finish setting up your Cirqles account for ${args.universityName}.`,
    "",
    args.verifyUrl,
    "",
    `This link stops working in ${args.expiresInMinutes} minutes.`,
    "If you did not create a Cirqles account, you can ignore this email.",
  ].join("\n")

  // Deliberately plain HTML. Mail clients are not browsers, and a layout that
  // survives all of them is worth more than one that looks good in a preview.
  const html = [
    `<p>${escapeHtml(greeting)}</p>`,
    `<p>Confirm this address to finish setting up your Cirqles account for ${escapeHtml(args.universityName)}.</p>`,
    `<p><a href="${escapeHtml(args.verifyUrl)}">Confirm my email address</a></p>`,
    `<p>Or paste this into your browser:<br>${escapeHtml(args.verifyUrl)}</p>`,
    `<p>This link stops working in ${args.expiresInMinutes} minutes.</p>`,
    "<p>If you did not create a Cirqles account, you can ignore this email.</p>",
  ].join("\n")

  return {
    to: args.to,
    subject: "Confirm your email address for Cirqles",
    text,
    html,
  }
}
