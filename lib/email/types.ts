/**
 * The email seam.
 *
 * Services describe *what* to send. Exactly one module knows *how* it leaves
 * the building. That split is the entire reason this file exists: the moment a
 * service imports a provider SDK, swapping providers becomes a grep, tests need
 * network stubbing, and a misconfigured API key takes down community joins
 * along with the mail.
 *
 * Keep this interface boring. Anything provider-shaped that leaks in here -
 * template ids, tags, tracking settings - is a sign the abstraction is being
 * bent around one vendor.
 */

export type EmailMessage = {
  /** A single recipient. Bulk sending is a different problem with a different shape. */
  to: string
  subject: string
  /** Always required. A mail client that refuses HTML must still get the link. */
  text: string
  html: string
}

export type EmailTransport = {
  /** Named so logs and tests can say which implementation actually ran. */
  readonly name: string
  /**
   * Deliver, or throw.
   *
   * Throwing is right here, unlike in services: a transport failure is a fault,
   * not an expected outcome a student caused. Callers decide whether that fault
   * should fail their operation - registration, for instance, should not be
   * rolled back because a mail server was briefly down.
   */
  send(message: EmailMessage): Promise<void>
}
