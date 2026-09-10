import type { Metadata } from "next"
import Link from "next/link"

import { SignUpForm } from "@/features/auth/components/sign-up-form"

export const metadata: Metadata = { title: "Create your account" }

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-muted-foreground text-sm">
          Join your campus community on Cirqles.
        </p>
      </div>
      <SignUpForm />
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
