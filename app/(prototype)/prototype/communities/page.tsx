import { ArrowRight, Building2, Plus } from "lucide-react"
import Link from "next/link"

import { CommunityCard } from "@/features/communities/components/community-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { communityScopeLabel, groupByScope } from "@/lib/domain/community"
import { describeMembershipAction } from "@/lib/domain/membership"
import { formatCount } from "@/lib/format"
import {
  campusOverview,
  chitkaraCommunity,
  communities,
  viewerCommunities,
} from "@/lib/prototype/fixtures"

/**
 * The directory, ordered campus outwards.
 *
 * University, then city, then interest, then everywhere. A Chitkara student
 * sees Chitkara first, and the same structure works unchanged for the second
 * university - which is the entire reason scope is a place on the row rather
 * than a default buried in a query.
 */

const scopeDescription: Record<string, string> = {
  UNIVERSITY: "Clubs, societies, and official bodies at Chitkara.",
  CITY: "Open to students across Chandigarh, Mohali, and Panchkula.",
  INTEREST: "Nationwide interest communities. No campus, no owner.",
  GLOBAL: "Everywhere else.",
}

const campusAction = describeMembershipAction(chitkaraCommunity)

const discoverable = communities.filter(
  (community) =>
    community.id !== chitkaraCommunity.id &&
    !viewerCommunities.some((joined) => joined.id === community.id),
)

export default function PrototypeCommunitiesScreen() {
  return (
    <div className="flex flex-col gap-10">
      <ScreenHeader
        phase="Phase 6"
        title="Communities"
        description="Your campus first, then your city, then your interests. Joining is immediate unless a community says otherwise."
        notes={[
          "Scope grouping comes from lib/domain/community.ts, not from hand-sorted lists.",
          "Chitkara University is seeded, not created by a student.",
          "Join, request, and propose controls are inert.",
        ]}
      />

      {/* The seeded campus. Nobody has to create this, and it is never empty. */}
      <Card className="border-primary-border bg-primary-subtle">
        <CardContent className="flex flex-col gap-4 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              >
                <Building2 className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-h3">{campusOverview.university.name}</h2>
                  <Badge variant="info">Official</Badge>
                </div>
                <p className="max-w-readable text-body-sm text-muted-foreground">
                  {chitkaraCommunity.tagline}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant={campusAction.variant}
              disabled={campusAction.disabled}
              aria-label={campusAction.accessibleLabel}
            >
              {campusAction.label}
            </Button>
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            {[
              { label: "Students", value: formatCount(campusOverview.studentCount) },
              {
                label: "Upcoming events",
                value: formatCount(campusOverview.upcomingEventCount),
              },
              { label: "Active clubs", value: formatCount(campusOverview.clubCount) },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <dt className="text-caption text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="text-h4" data-numeric>
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-h3">Yours</h2>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/prototype/community/propose" />}
          >
            <Plus aria-hidden="true" />
            Propose a community
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {viewerCommunities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              href="/prototype/community"
            />
          ))}
        </div>
      </section>

      {groupByScope(discoverable).map((group) => (
        <section key={group.scope} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3">{communityScopeLabel[group.scope]}</h2>
            <p className="max-w-readable text-body-sm text-muted-foreground">
              {scopeDescription[group.scope]}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.communities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                href="/prototype/community"
              />
            ))}
          </div>
        </section>
      ))}

      <Card>
        <CardContent className="flex flex-col items-start gap-2 py-6">
          <p className="text-body-sm font-medium">
            Cannot find what you are looking for?
          </p>
          <p className="max-w-readable text-body-sm text-muted-foreground">
            Propose it. A reviewer checks whether it already exists under another
            name, and approves it if it does not - which is how the platform grows
            without ending up with four football communities.
          </p>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/prototype/community/propose" />}
          >
            Propose a community
            <ArrowRight aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
