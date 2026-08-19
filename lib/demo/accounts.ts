import type { UserRole } from "@/lib/db/schema"

/**
 * The showcase accounts, defined once.
 *
 * The sign-in buttons, the seed and the documentation all describe the same
 * three accounts, and a demo where the printed credentials do not work is worse
 * than a demo with no shortcut at all. `lib/demo/accounts.test.ts` asserts this
 * file and the seed still agree.
 *
 * These are fictional identities in a local database. The password is in the
 * source deliberately - it is not a secret, it is a label on a demo fixture,
 * and hiding it in an environment variable would only make the demo harder to
 * start while protecting nothing.
 */

export const DEMO_PASSWORD = "demo1234"

export type DemoAccount = {
  email: string
  /** What the button says. */
  label: string
  /** One line under the button, so a presenter knows what they are about to show. */
  description: string
  role: UserRole
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "gautam1153.becse24@chitkara.edu.in",
    label: "Continue as Demo Student",
    description:
      "Onboarded, five communities, upcoming events, saved items, unread notifications.",
    role: "STUDENT",
  },
  {
    email: "organizer.codingclub@chitkara.edu.in",
    label: "Continue as Demo Organiser",
    description:
      "Owns three verified clubs. Can create, edit and manage their events.",
    role: "ORGANIZER",
  },
  {
    email: "admin.cirqles@chitkara.edu.in",
    label: "Continue as Demo Admin",
    description: "Verification queue, moderation reports, and the audit log.",
    role: "PLATFORM_ADMIN",
  },
]

/**
 * Whether the one-click buttons exist at all.
 *
 * Off whenever a real database is configured, which is the case that matters:
 * a deployment must never offer to sign anyone in as an administrator. The
 * explicit opt-in covers a developer running the demo database against a
 * checkout that happens to have `DATABASE_URL` in the environment.
 *
 * Checked in the server action as well as in the UI. Not rendering a button is
 * not the same as refusing the request.
 */
export function isDemoAuthEnabled(): boolean {
  if (process.env.CIRQLES_DEMO_AUTH === "1") return true
  if (process.env.CIRQLES_DEMO_AUTH === "0") return false

  return !process.env.DATABASE_URL
}

export function findDemoAccount(email: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((account) => account.email === email)
}
