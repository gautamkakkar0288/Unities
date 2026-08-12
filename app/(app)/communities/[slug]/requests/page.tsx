import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/auth"
import { Alert } from "@/components/ui/alert"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RequestDecisionButtons } from "@/features/communities/components/request-decision-buttons"
import { PageHeader } from "@/features/shell/components/page-header"
import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import { getCommunityBySlug } from "@/lib/services/communities"
import { listPendingRequests } from "@/lib/services/community-members"

export const metadata: Metadata = { title: "Join requests" }

/**
 * The moderator's pending queue.
 *
 * This closes the gap 1.4 left: `reviewJoinRequest` existed, was tested, and
 * had no caller, which meant a student could request to join an approval
 * community and nobody could accept them.
 *
 * The page does not decide who may see this. It asks `listPendingRequests` and
 * renders whatever comes back, including the refusal - so the read, the write,
 * and the screen all agree about who moderates, because only one of them has an
 * opinion.
 */
export default async function CommunityRequestsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const community = await getCommunityBySlug({
    slug,
    viewerId: session.user.id,
  })
  if (!community) notFound()

  const requests = await listPendingRequests({
    moderatorId: session.user.id,
    communityId: community.id,
  })

  return (
    <>
      <PageHeader
        title="Join requests"
        description={`People waiting on a decision to join ${community.name}.`}
      />

      <div className="flex max-w-readable flex-col gap-4">
        <Link
          href={`/communities/${community.slug}`}
          className="text-body-sm text-muted-foreground underline underline-offset-2 hover:text-primary"
        >
          Back to {community.name}
        </Link>

        {!requests.ok ? (
          <Alert variant="error">{requests.message}</Alert>
        ) : requests.data.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">
            Nobody is waiting. Requests appear here as students ask to join.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {requests.data.map((request) => {
              const name = request.name ?? "A Cirqles member"

              return (
                <li
                  key={request.userId}
                  className="flex flex-wrap items-center gap-3 py-4"
                >
                  <Avatar size="sm" name={name} src={request.avatarUrl} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-body font-medium">
                      {name}
                    </span>
                    <Badge
                      variant={roleBadgeVariant[request.role]}
                      className="w-fit"
                    >
                      {roleLabels[request.role]}
                    </Badge>
                  </div>

                  <div className="ml-auto">
                    <RequestDecisionButtons
                      communityId={community.id}
                      slug={community.slug}
                      applicantId={request.userId}
                      applicantName={name}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
