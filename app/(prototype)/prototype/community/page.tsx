import { CalendarDays, Users } from "lucide-react"
import Link from "next/link"

import { VerificationBadge } from "@/components/domain/verification-badge"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EventCard } from "@/features/events/components/event-card"
import { PostCard } from "@/features/posts/components/post-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import { communityScopeLabel } from "@/lib/domain/community"
import { describeMembershipAction } from "@/lib/domain/membership"
import {
  communityPosts,
  events,
  prototypeNow,
  roboticsClubDetail,
} from "@/lib/prototype/fixtures"
import { formatCount, formatDate } from "@/lib/format"

export const metadata = { title: "Community detail" }

/**
 * A community's home.
 *
 * Guidelines are given real estate rather than buried in a modal. Most campus
 * community conflict is a guideline nobody read, and moderation is far easier to
 * defend when the rule was visible before the post.
 */
export default function PrototypeCommunityPage() {
  const community = roboticsClubDetail
  const action = describeMembershipAction(community)
  const upcoming = events.filter(
    (event) => event.community.id === community.id,
  )

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 6"
        title="Community detail"
        description="About, guidelines, moderators, posts, and upcoming events for a single community."
        notes={[
          "Join, post, and moderation controls are static",
          "The real screen is /communities/[slug]; this is one fixed example",
          "Member list, media, and pinned-post management come with Phase 6",
        ]}
      />

      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{community.interest.label}</Badge>
              <VerificationBadge state={community.verification} />
              {/* Scope is who can see and join, and it is the one fact a student
                  needs before reading anything else on the page. */}
              <Badge variant="neutral">
                {communityScopeLabel[community.scope]}
              </Badge>
            </div>
            <h2 className="text-h2">{community.name}</h2>
            <p className="max-w-readable text-body-sm text-muted-foreground">
              {community.tagline}
            </p>
            <dl className="flex flex-wrap gap-x-6 gap-y-2 text-caption text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <dt className="contents">
                  <Users aria-hidden="true" className="size-3.5" />
                  <span className="sr-only">Members</span>
                </dt>
                <dd data-numeric>{formatCount(community.memberCount)} members</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="contents">
                  <CalendarDays aria-hidden="true" className="size-3.5" />
                  <span className="sr-only">Upcoming events</span>
                </dt>
                <dd data-numeric>
                  {community.upcomingEventCount} upcoming events
                </dd>
              </div>
              <div>
                <dt className="sr-only">Created</dt>
                <dd>Since {formatDate(community.createdAt)}</dd>
              </div>
            </dl>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant={action.variant}
              size="lg"
              disabled={action.disabled}
              aria-label={action.accessibleLabel}
            >
              {action.label}
            </Button>
            <Button type="button" variant="outline" size="lg">
              Notify me about events
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-8">
            <section aria-labelledby="posts-heading" className="flex flex-col gap-4">
              <h2 id="posts-heading" className="text-h3">
                Posts
              </h2>
              <ul className="flex flex-col gap-4">
                {communityPosts.map((post) => (
                  <li key={post.id}>
                    <PostCard
                      post={post}
                      now={prototypeNow}
                      href="/prototype/post"
                      communityHref="/prototype/community"
                    />
                  </li>
                ))}
              </ul>
            </section>

            <Separator />

            <section aria-labelledby="events-heading" className="flex flex-col gap-4">
              <h2 id="events-heading" className="text-h3">
                Upcoming events
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((event) => (
                  <li key={event.id} className="flex">
                    <EventCard
                      event={event}
                      now={prototypeNow}
                      href="/prototype/event"
                    />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="flex flex-col gap-4" aria-label="About this community">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm whitespace-pre-line text-muted-foreground">
                  {community.about}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="flex list-decimal flex-col gap-2 pl-4 text-body-sm text-muted-foreground">
                  {community.guidelines.map((guideline) => (
                    <li key={guideline}>{guideline}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moderators</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3">
                  {community.moderators.map((moderator) => (
                    <li key={moderator.id} className="flex items-center gap-3">
                      <Avatar
                        size="sm"
                        name={moderator.name}
                        src={moderator.avatarUrl}
                      />
                      <div className="flex min-w-0 flex-col">
                        <Link
                          href="/prototype/profile"
                          className="truncate rounded-sm text-body-sm font-medium hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          {moderator.name}
                        </Link>
                        <span className="text-caption text-muted-foreground">
                          {moderator.programme}
                        </span>
                      </div>
                      <Badge
                        variant={roleBadgeVariant[moderator.role]}
                        className="ml-auto"
                      >
                        {roleLabels[moderator.role]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
