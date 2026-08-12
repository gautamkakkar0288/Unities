import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { Alert } from "@/components/ui/alert"
import { ProposeCommunityForm } from "@/features/communities/components/propose-community-form"
import { PageHeader } from "@/features/shell/components/page-header"
import { canCreateCommunityDirectly } from "@/lib/domain/community"
import { listInterests } from "@/lib/services/interests"

export const metadata: Metadata = {
  title: "Propose a community",
  description: "Ask for a club, society, or interest group that does not exist yet.",
}

/**
 * The proposal screen.
 *
 * Note the route: `/communities/propose` sits in front of
 * `/communities/[slug]`, which means a community can never be reachable at the
 * slug "propose". That is a fair trade for a readable URL, and the slug is
 * generated at approval time where it can be avoided.
 */
export default async function ProposeCommunityPage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const interests = await listInterests()

  return (
    <>
      <PageHeader
        title="Propose a community"
        description="Tell us what is missing. A reviewer reads every proposal."
      />

      <div className="flex max-w-readable flex-col gap-6">
        {!canCreateCommunityDirectly(session.user.role) ? null : (
          <Alert variant="info" title="You can normally create these outright">
            Your role is allowed to create a community without review, but that
            screen is not built yet. Proposing works in the meantime and lands
            in the same queue.
          </Alert>
        )}

        <ProposeCommunityForm interests={interests} />
      </div>
    </>
  )
}
