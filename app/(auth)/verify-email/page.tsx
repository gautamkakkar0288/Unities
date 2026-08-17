import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { resendVerificationEmailAction } from "@/features/verification/actions"
import { hasVerifiedEmail } from "@/lib/services/account"
import {
  VERIFICATION_TOKEN_TTL_MINUTES,
  verifyEmailToken,
} from "@/lib/services/verification"

export const metadata: Metadata = { title: "Confirm your email" }

/**
 * Where a verification link lands, and where the account gate sends anyone who
 * has not used one yet.
 *
 * This redeems on GET, which is unusual for a mutation and correct here: the
 * only thing an email client can produce is a GET, and demanding a form
 * submission would mean every student has to click twice. The token is
 * single-use and consumed on success, so the usual argument against mutating
 * GETs - that a crawler or a prefetch repeats it - costs nothing worse than one
 * already-verified account.
 *
 * Three arrivals, in order of precedence:
 *
 * 1. With a token - redeem it and report the outcome.
 * 2. Signed in and still unverified - the gated student. Name the address being
 *    waited on and offer a resend, because this is where they were sent and
 *    telling them to go and sign in would be a loop.
 * 3. Anyone else - an incomplete or hand-copied link.
 *
 * Nothing is rendered from user input. The address is either echoed after it
 * matched a token row or read from the session, and the resend outcome is a
 * fixed code mapped to fixed copy rather than a message taken from the URL.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string; resend?: string }>
}) {
  const { token, email, resend } = await searchParams

  const result =
    token && email
      ? await verifyEmailToken({ input: { token, email } })
      : null

  // Only consult the session when there is no link to redeem - a student
  // clicking a link from their phone may have no session at all, and that is a
  // supported case rather than a problem.
  const session = result === null ? await auth() : null
  const verified = session?.user
    ? await hasVerifiedEmail(session.user.id)
    : false

  // Already done, and no link to process. Nothing here applies to them.
  if (session?.user && verified) redirect("/home")

  const waitingFor =
    session?.user && !verified ? (session.user.email ?? null) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Confirm your email
        </h1>
      </div>

      {resend === "sent" && (
        <Alert variant="success" title="A new link is on its way">
          It is valid for {VERIFICATION_TOKEN_TTL_MINUTES} minutes. Any earlier
          link has stopped working, so use the newest email.
        </Alert>
      )}

      {resend === "failed" && (
        <Alert variant="error" title="We could not send that email">
          Nothing was sent, so there is no new link on its way. Try again in a
          moment, and tell us if it keeps failing.
        </Alert>
      )}

      {result === null && waitingFor !== null && (
        <>
          <Alert variant="warning" title="Confirm your email to continue">
            We are waiting for you to open the link we sent to {waitingFor}.
            Cirqles stays locked until then, so that everyone here is a
            verified student.
          </Alert>

          <form action={resendVerificationEmailAction}>
            <Button type="submit" variant="secondary" className="w-full">
              Send me a new link
            </Button>
          </form>
        </>
      )}

      {result === null && waitingFor === null && (
        <Alert variant="warning" title="This link is incomplete">
          Open the link from your inbox exactly as it was sent. Copying only
          part of it will not work.
        </Alert>
      )}

      {result?.ok === true && (
        <Alert variant="success" title="You are verified">
          {result.data.university
            ? `Your ${result.data.university.name} account is confirmed.`
            : "Your account is confirmed."}
        </Alert>
      )}

      {result?.ok === false && (
        <Alert variant="error" title="We could not confirm that link">
          {result.message}
        </Alert>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {result?.ok === true ? (
          <Link
            href="/home"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Continue to Cirqles
          </Link>
        ) : waitingFor !== null ? (
          <>Signed in as {waitingFor}.</>
        ) : (
          <>
            Need another link?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{" "}
            and ask us to resend it.
          </>
        )}
      </p>
    </div>
  )
}
