import { Users } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"

import { auth } from "@/auth"
import { VerificationBadge } from "@/components/domain/verification-badge"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { JoinButton } from "@/features/communities/components/join-button"
import { PageHeader } from "@/features/shell/components/page-header"
import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import {
  communityKindLabel,
  communityKindTone,
  communityScopeLabel,
  joinPolicyDescription,
  joinPolicyLabel,
} from "@/lib/domain/community"
import { membershipBadgeLabel } from "@/lib/domain/membership"
import { formatCount } from "@/lib/format"
import { getCommunityBySlug } from "@/lib/services/communities"
import { listCommunityLeads } from "@/lib/services/community-members"

/**
 * Memoised for the duration of one request, because `generateMetadata` and the
 * page body both need the community and would otherwise run the same query
 * twice on every single view.
 */
const loadCommunity = cache(async (slug: string, viewerId: string | null) =>
  getCommunityBySlug({ slug, viewerId }),
)

async function viewerId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const community = await loadCommunity(slug, await viewerId())

  if (!community) return { title: "Community not found" }

  return { title: community.name, description: community.tagline }
}

/**
 * A single community.
 *
 * Everything rendered here is a column that exists. The prototype version of
 * this screen shows posts, an upcoming-event count, and a founding date, all
 * from fixtures - posts and events have no tables yet, so putting them on a
 * real page would mean inventing them.
 */
export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const community = await loadCommunity(slug, await viewerId())

  // A slug that does not exist and a slug that is archived are the same answer
  // to a student: there is nothing here. The service already excludes archived.
  if (!community) notFound()

  const leads = await listCommunityLeads({ communityId: community.id })
  const membership = membershipBadgeLabel[community.viewerMembership]

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <Badge variant={communityKindTone[community.kind]}>
          {communityKindLabel[community.kind]}
        </Badge>
        <Badge variant="outline">{community.interest.label}</Badge>
        <VerificationBadge state={community.verification} />
        <Badge variant="neutral">{communityScopeLabel[community.scope]}</Badge>
        {membership && <Badge variant="brand">{membership}</Badge>}
      </div>

      <PageHeader title={community.name} description={community.tagline} />

      <dl className="flex flex-wrap gap-x-6 gap-y-2 pb-8 text-caption text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <dt className="contents">
            <Users aria-hidden="true" className="size-3.5" />
            <span className="sr-only">Members</span>
          </dt>
          <dd data-numeric>
            {formatCount(community.memberCount)}{" "}
            {community.memberCount === 1 ? "member" : "members"}
          </dd>
        </div>
        {community.place && (
          <div>
            <dt className="sr-only">Based at</dt>
            <dd>{community.place.name}</dd>
          </div>
        )}
        <div>
          <dt className="sr-only">Joining</dt>
          <dd>{joinPolicyLabel[community.joinPolicy]}</dd>
        </div>
      </dl>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="about-heading" className="flex flex-col gap-3">
            <h2 id="about-heading" className="text-h3">
              About
            </h2>
            {community.about ? (
              <p className="max-w-readable text-body whitespace-pre-line text-muted-foreground">
                {community.about}
              </p>
            ) : (
              <p className="text-body text-muted-foreground">
                This community has not written an introduction yet.
              </p>
            )}
          </section>

          {/*
            Guidelines get real estate rather than a modal, following the
            prototype's reasoning: most campus community conflict is a rule
            nobody read, and moderation is easier to defend when the rule was
            visible beforehand. Hidden entirely when there are none, because an
            empty "Guidelines" heading suggests the page is broken.
          */}
          {community.guidelines.length > 0 && (
            <section
              aria-labelledby="guidelines-heading"
              className="flex flex-col gap-3"
            >
              <h2 id="guidelines-heading" className="text-h3">
                Guidelines
              </h2>
              <ol className="flex max-w-readable list-decimal flex-col gap-2 pl-5 text-body-sm text-muted-foreground">
                {community.guidelines.map((guideline) => (
                  <li key={guideline}>{guideline}</li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4" aria-label="Community details">
          <Card>
            <CardHeader>
              <CardTitle>Joining</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/*
                The policy is stated above the control rather than left for the
                student to infer from its wording: "Request to join" does not by
                itself explain that a moderator has to approve it.
              */}
              <p className="text-body-sm text-muted-foreground">
                {joinPolicyDescription[community.joinPolicy]}
              </p>
              <JoinButton community={community} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Who runs this</CardTitle>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">
                  {community.kind === "INTEREST"
                    ? "Nobody. Interest communities belong to everyone who joins them."
                    : "No owner or moderator listed yet."}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {leads.map((lead) => {
                    const name = lead.name ?? "A Cirqles member"
                    return (
                      <li key={lead.id} className="flex items-center gap-3">
                        <Avatar size="sm" name={name} src={lead.avatarUrl} />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-body-sm font-medium">
                            {name}
                          </span>
                          <span className="text-caption text-muted-foreground">
                            {lead.state === "OWNER" ? "Owner" : "Moderator"}
                          </span>
                        </div>
                        <Badge
                          variant={roleBadgeVariant[lead.role]}
                          className="ml-auto"
                        >
                          {roleLabels[lead.role]}
                        </Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}
