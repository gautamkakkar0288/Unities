import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { InterestPicker } from "@/features/onboarding/components/interest-picker"
import { saveProfileInterests } from "@/features/profile/actions"
import { PageHeader } from "@/features/shell/components/page-header"
import { getUserInterests, listInterests } from "@/lib/services/interests"

export const metadata: Metadata = { title: "Your interests" }

/**
 * Editing interests after onboarding.
 *
 * The same picker and the same write, with a different destination: onboarding
 * sends the student into the product, this leaves them where they were. Nothing
 * about the rules changes, which is the point of reusing both.
 */
export default async function ProfileInterestsPage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const [available, selected] = await Promise.all([
    listInterests(),
    getUserInterests(session.user.id),
  ])

  return (
    <>
      <PageHeader
        title="Your interests"
        description="Change what Cirqles puts in front of you."
      />

      <div className="max-w-readable">
        <InterestPicker
          interests={available}
          initialSelectedIds={selected.map((interest) => interest.id)}
          save={saveProfileInterests}
          submitLabel="Save interests"
          savedMessage="Saved. Recommendations will use these from now on."
        />
      </div>
    </>
  )
}
