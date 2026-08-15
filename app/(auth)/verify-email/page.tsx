import type { Metadata } from "next"
import Link from "next/link"

import { Alert } from "@/components/ui/alert"
import { verifyEmailToken } from "@/lib/services/verification"

export const metadata: Metadata = { title: "Confirm your email" }

/**
 * Where a verification link lands.
 *
 * This redeems on GET, which is unusual for a mutation and correct here: the
 * only thing an email client can produce is a GET, and demanding a form
 * submission would mean every student has to click twice. The token is
 * single-use and consumed on success, so the usual argument against mutating
 * GETs - that a crawler or a prefetch repeats it - costs nothing worse than one
 * already-verified account.
 *
 * Nothing is rendered from user input. The address is echoed back only after it
 * matched a token row.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token, email } = await searchParams

  const result =
    token && email
      ? await verifyEmailToken({ input: { token, email } })
      : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Confirm your email
        </h1>
      </div>

      {result === null && (
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
