import type { Metadata } from "next"
import Link from "next/link"

import { DemoSignIn } from "@/features/auth/components/demo-sign-in"
import { SignInForm } from "@/features/auth/components/sign-in-form"
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  isDemoAuthEnabled,
} from "@/lib/demo/accounts"

export const metadata: Metadata = { title: "Sign in" }

export default function SignInPage() {
  /**
   * Decided here, on the server, and passed down. The component receives an
   * empty list rather than a flag, so there is no way for the buttons to render
   * without the page having agreed to it.
   */
  const demoAccounts = isDemoAuthEnabled() ? DEMO_ACCOUNTS : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue to Cirqles.
        </p>
      </div>
      <SignInForm />
      <DemoSignIn accounts={demoAccounts} password={DEMO_PASSWORD} />
      <p className="text-center text-sm text-muted-foreground">
        New to Cirqles?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  )
}
