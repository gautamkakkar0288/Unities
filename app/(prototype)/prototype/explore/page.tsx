import {
  ArrowRight,
  Code2,
  Compass,
  MapPinned,
  Trophy,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

import { CommunityCard } from "@/features/communities/components/community-card"
import { EventCard } from "@/features/events/components/event-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { communityScopeLabel, groupByScope } from "@/lib/domain/community"
import { isUpcoming } from "@/lib/domain/time-buckets"
import type { EventKind } from "@/lib/domain/types"
import {
  communities,
  events,
  interests,
  prototypeNow,
  viewerInterestSlugs,
} from "@/lib/prototype/fixtures"

/**
 * Explore, for the student who has joined nothing.
 *
 * Organised by what a thing *is* before what it is *about*. "Trips" and
 * "Sports" are how students describe what they want to do; "Technology" is how
 * a taxonomy describes it. Categories first, interests second.
 *
 * Counts are computed from the fixture data rather than written by hand, so an
 * empty category shows as empty instead of quietly lying.
 */

const upcoming = events.filter((event) => isUpcoming(event, prototypeNow))

const categories: Array<{
  label: string
  description: string
  icon: typeof Compass
  kinds: EventKind[]
  interestSlugs?: string[]
}> = [
  {
    label: "Trips",
    description: "Weekends away, treks, and everything that leaves campus.",
    icon: MapPinned,
    kinds: ["TRIP"],
  },
  {
    label: "Sports",
    description: "Tournaments, matches, and anything with a scoreboard.",
    icon: Trophy,
    kinds: ["TOURNAMENT"],
    interestSlugs: ["sports", "fitness"],
  },
  {
    label: "Tech",
    description: "Workshops, hackathons, and build nights.",
    icon: Code2,
    kinds: ["WORKSHOP", "DRIVE"],
    interestSlugs: ["technology", "coding"],
  },
  {
    label: "Everything else",
    description: "Talks, gigs, meetups, and the things that fit nowhere.",
    icon: Sparkles,
    kinds: ["TALK", "PERFORMANCE", "MEETUP"],
  },
]

const countFor = (kinds: EventKind[]) =>
  upcoming.filter((event) => kinds.includes(event.kind)).length

const trips = upcoming.filter((event) => event.kind === "TRIP")

export default function PrototypeExploreScreen() {
  return (
    <div className="flex flex-col gap-10">
      <ScreenHeader
        phase="Phase 6"
        title="Explore"
        description="Start with what you feel like doing. Interests narrow it down; they are not the front door."
        notes={[
          "Category counts are computed from fixture events, so they cannot drift from the data.",
          "Category tiles and interest chips do not filter yet.",
          "Suggesting an interest does not submit.",
        ]}
      />

      <section className="flex flex-col gap-4" aria-label="Categories">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon
            const count = countFor(category.kinds)

            return (
              <Card key={category.label} interactive className="h-full">
                <CardHeader className="gap-2">
                  <span
                    aria-hidden="true"
                    className="flex size-9 items-center justify-center rounded-lg bg-primary-subtle text-primary"
                  >
                    <Icon className="size-4" />
                  </span>
                  <CardTitle className="text-h4">{category.label}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <p className="text-caption text-muted-foreground">
                    <span data-numeric>{count}</span>{" "}
                    {count === 1 ? "thing" : "things"} coming up
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {trips.length > 0 && (
        <section className="flex flex-col gap-4" aria-label="Trips">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3">Trips</h2>
            <p className="max-w-readable text-body-sm text-muted-foreground">
              Off campus and overnight. These carry a fee, a cancellation
              policy, and a named contact - see the trip detail for what that
              means.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {trips.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                now={prototypeNow}
                href="/prototype/event"
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4" aria-label="Interests">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">Browse by interest</h2>
          <p className="max-w-readable text-body-sm text-muted-foreground">
            A curated list, not a free-text field. One "Coding" beats six
            spellings of it.
          </p>
        </div>

        <ul className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <li key={interest.id}>
              <Link
                href="/prototype/explore"
                className="inline-flex rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Badge
                  variant={
                    viewerInterestSlugs.includes(interest.slug)
                      ? "brand"
                      : "outline"
                  }
                >
                  {interest.label}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>

        <Card className="max-w-readable">
          <CardContent className="flex flex-col items-start gap-2 py-5">
            <p className="text-body-sm font-medium">Something missing?</p>
            <p className="text-body-sm text-muted-foreground">
              Suggest it. When enough students ask for the same thing, it becomes
              an official interest - Cricket got added that way after 96
              requests.
            </p>
            <div className="flex w-full flex-wrap gap-2">
              <input
                type="text"
                aria-label="Suggest an interest"
                placeholder="Padel"
                className="h-9 min-w-40 flex-1 rounded-lg border border-input bg-background px-3 text-body-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              />
              <Button type="button" size="sm" variant="outline">
                Suggest
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {groupByScope(communities).map((group) => (
        <section key={group.scope} className="flex flex-col gap-4">
          <h2 className="text-h3">{communityScopeLabel[group.scope]}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.communities.slice(0, 3).map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                href="/prototype/community"
              />
            ))}
          </div>
        </section>
      ))}

      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={<Link href="/prototype/communities" />}
      >
        See every community
        <ArrowRight aria-hidden="true" />
      </Button>
    </div>
  )
}
