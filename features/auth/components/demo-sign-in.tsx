"use client"

import { useState, useTransition } from "react"

import { signInAsDemoAccount } from "@/features/auth/demo-actions"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { DemoAccount } from "@/lib/demo/accounts"

/**
 * One button per seeded role.
 *
 * The account list is passed in from the server rather than imported here, so
 * the decision about whether demo sign-in exists is made in one place - the
 * page - and this component cannot accidentally render in a deployment where it
 * should not.
 *
 * The password is shown on screen on purpose. A presenter should never have to
 * hunt through a README mid-demo, and the normal email form has to stay usable
 * for demonstrating that authentication is real.
 */
export function DemoSignIn({
  accounts,
  password,
}: {
  accounts: DemoAccount[]
  password: string
}) {
  const [pending, startTransition] = useTransition()
  const [busyEmail, setBusyEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (accounts.length === 0) return null

  const continueAs = (email: string) => {
    setError(null)
    setBusyEmail(email)

    startTransition(async () => {
      const result = await signInAsDemoAccount(email)

      // Only reached when sign-in failed - success redirects out of the page.
      if (!result.ok) {
        setError(result.message)
      }
      setBusyEmail(null)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-caption text-muted-foreground">
          or explore the demo
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="flex flex-col gap-2">
        {accounts.map((account) => (
          <div key={account.email} className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              disabled={pending}
              onClick={() => continueAs(account.email)}
            >
              {busyEmail === account.email ? "Signing in…" : account.label}
            </Button>
            <p className="text-caption text-muted-foreground">
              {account.description}
            </p>
          </div>
        ))}
      </div>

      <p className="text-caption text-muted-foreground">
        Demo accounts in a local database. All three use the password{" "}
        <code className="font-medium">{password}</code>, so the email form above
        works with them too. Every identity in the demo data is fictional.
      </p>
    </div>
  )
}
