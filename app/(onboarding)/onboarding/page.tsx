import { Sparkles } from "lucide-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { EmptyState } from "@/components/ui/empty-state"
import { InterestPicker } from "@/features/onboarding/components/interest-picker"
import { MINIMUM_INTERESTS } from "@/lib/domain/interest"
import { hasVerifiedEmail } from "@/lib/services/account"
import {
  getUserInterests,
  hasCompletedOnboarding,
  listInterests,
} from "@/lib/services/interests"

export const metadata: Metadata = { title: "Choose your interests" }

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  // This page sits outside the app shell, so the shell's gate never runs for
  // it. Without this check a student could type the URL and reach a picker
  // whose save setUserInterests would refuse - a form that cannot succeed is
  // worse than an honest redirect.
  if (!(await hasVerifiedEmail(session.user.id))) redirect("/verify-email")

  // Onboarding is a step, not a screen you can revisit to no purpose. A student
  // who has already done it and types the URL belongs on their feed; changing
  // interests later is a profile concern (1.6).
  if (await hasCompletedOnboarding(session.user.id)) redirect("/home")

  const [interests, selected] = await Promise.all([
    listInterests(),
    getUserInterests(session.user.id),
  ])

  // An empty taxonomy is a deployment fault, not a student-facing state. Saying
  // so plainly beats rendering an empty page that looks like a bug in the
  // picker.
  if (interests.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="There are no interests to pick yet"
        description="The interest taxonomy has not been seeded on this environment, so onboarding cannot continue. Run the seed command against this database."
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-h2">What are you into?</h1>
        <p className="max-w-readable text-body text-muted-foreground">
          Pick at least {MINIMUM_INTERESTS}. This is how Cirqles decides which
          communities and events to put in front of you, and you can change it
          whenever you like.
        </p>
      </header>

      <InterestPicker
        interests={interests}
        initialSelectedIds={selected.map((interest) => interest.id)}
      />
    </div>
  )
}
