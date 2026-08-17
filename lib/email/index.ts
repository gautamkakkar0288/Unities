import { consoleTransport } from "./console-transport"
import type { EmailMessage, EmailTransport } from "./types"

export type { EmailMessage, EmailTransport } from "./types"
export { consoleTransport } from "./console-transport"
export {
  createSmtpTransport,
  smtpConfigFromEnv,
  type SmtpConfig,
} from "./smtp-transport"


/**
 * The one place that decides how mail leaves Cirqles.
 *
 * A module-level binding rather than a factory call per send, so that swapping
 * the transport in a test swaps it for every service underneath without any of
 * them taking a transport parameter they would otherwise never use. The cost is
 * that this is global state; the containment is that only `setEmailTransport`
 * can change it, and only two callers ever should - application start-up, and
 * tests.
 *
 * The default is the console transport, which throws in production. That means
 * a deployment that forgets to configure mail fails loudly on the first send
 * instead of quietly dropping every verification link.
 */
let transport: EmailTransport = consoleTransport

export function setEmailTransport(next: EmailTransport): void {
  transport = next
}

export function currentEmailTransport(): EmailTransport {
  return transport
}

export function sendEmail(message: EmailMessage): Promise<void> {
  return transport.send(message)
}
