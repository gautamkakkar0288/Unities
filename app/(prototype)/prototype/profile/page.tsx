import { CalendarCheck, MessageSquare, Sparkles } from "lucide-react"
import Link from "next/link"

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
import { CommunityCard } from "@/features/communities/components/community-card"
import { EventCard } from "@/features/events/components/event-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import {
  prototypeNow,
  viewerEvents,
  viewerProfile,
} from "@/lib/prototype/fixtures"
import { formatDate } from "@/lib/format"

export const metadata = { title: "Profile" }

/**
 * A student's profile.
 *
 * Activity counts sit above badges. What someone actually does on campus is more
 * informative than what the system has awarded them, and badge-forward profiles
 * drift into gamification that rewards volume over usefulness.
 */
export default function PrototypeProfilePage() {
  const profile = viewerProfile

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 9"
        title="Profile"
        description="Who someone is on campus: interests, communities, activity, and the events they turn up to."
        notes={[
          "Edit profile and privacy controls live on the settings screen",
          "Viewing someone else's profile hides fields per their privacy settings",
          "Activity feed and mutual-community count arrive with Phase 9",
        ]}
      />

      <div className="flex flex-col gap-8">
        <Card>
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar
              size="xl"
              name={profile.person.name}
              src={profile.person.avatarUrl}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-h2">{profile.person.name}</h2>
                  <Badge variant={roleBadgeVariant[profile.person.role]}>
                    {roleLabels[profile.person.role]}
                  </Badge>
                </div>
                <p className="text-body-sm text-muted-foreground">
                  @{profile.person.username}
                  {profile.person.programme && ` - ${profile.person.programme}`}
                </p>
              </div>

              <p className="max-w-readable text-body-sm">{profile.bio}</p>

              <ul className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <li key={interest.id}>
                    <Badge variant="outline">{interest.label}</Badge>
                  </li>
                ))}
              </ul>

              <p className="text-caption text-muted-foreground">
                On Cirqles since {formatDate(profile.joinedAt)}
              </p>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" render={<Link href="/prototype/settings" />}>
                  Edit profile
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  render={<Link href="/prototype/messages" />}
                >
                  Messages
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <section aria-labelledby="activity-heading" className="flex flex-col gap-4">
          <h2 id="activity-heading" className="text-h3">
            Activity
          </h2>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3">
                <CalendarCheck
                  aria-hidden="true"
                  className="size-5 text-primary"
                />
                <div>
                  <dt className="text-caption text-muted-foreground">
                    Events attended
                  </dt>
                  <dd className="text-h3" data-numeric>
                    {profile.eventsAttendedCount}
                  </dd>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3">
                <MessageSquare
                  aria-hidden="true"
                  className="size-5 text-primary"
                />
                <div>
                  <dt className="text-caption text-muted-foreground">Posts</dt>
                  <dd className="text-h3" data-numeric>
                    {profile.postCount}
                  </dd>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3">
                <Sparkles aria-hidden="true" className="size-5 text-primary" />
                <div>
                  <dt className="text-caption text-muted-foreground">
                    Communities
                  </dt>
                  <dd className="text-h3" data-numeric>
                    {profile.communities.length}
                  </dd>
                </div>
              </CardContent>
            </Card>
          </dl>
        </section>

        <Separator />

        <section aria-labelledby="upcoming-heading" className="flex flex-col gap-4">
          <h2 id="upcoming-heading" className="text-h3">
            You are registered for
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {viewerEvents.map((event) => (
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

        <Separator />

        <section aria-labelledby="communities-heading" className="flex flex-col gap-4">
          <h2 id="communities-heading" className="text-h3">
            Communities
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {profile.communities.map((community) => (
              <li key={community.id} className="flex">
                <CommunityCard
                  community={community}
                  href="/prototype/community"
                />
              </li>
            ))}
          </ul>
        </section>

        <Separator />

        <section aria-labelledby="badges-heading" className="flex flex-col gap-4">
          <h2 id="badges-heading" className="text-h3">
            Badges
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {profile.badges.map((badge) => (
              <li key={badge.label} className="flex">
                <Card className="w-full gap-2">
                  <CardHeader className="gap-1">
                    <CardTitle className="text-body-sm">
                      {badge.label}
                    </CardTitle>
                    <p className="text-caption text-muted-foreground">
                      {badge.description}
                    </p>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
