import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CommunityCard } from "@/features/communities/components/community-card"
import { EventCard } from "@/features/events/components/event-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import {
  communities,
  events,
  interests,
  prototypeNow,
} from "@/lib/prototype/fixtures"

export const metadata = { title: "Explore" }

/**
 * Discovery for someone who has joined nothing yet.
 *
 * Interest chips come first because the fastest way out of an empty campus is
 * to say what you care about. They are links rather than buttons so a filtered
 * view is shareable and survives the back button - the same reasoning behind
 * making search a destination instead of a top-bar input.
 */
export default function PrototypeExplorePage() {
  const suggested = communities.filter(
    (community) => community.viewerMembership === "NONE",
  )

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 6"
        title="Explore"
        description="Find your people by what you care about. Built for the student who signed up yesterday and has joined nothing."
        notes={[
          "Interest chips do not filter yet - each would be its own route",
          "Ranking is fixture order; real ranking needs interests and Phase 14",
        ]}
      />

      <div className="flex flex-col gap-10">
        <section aria-labelledby="interests-heading" className="flex flex-col gap-4">
          <h2 id="interests-heading" className="text-h3">
            Browse by interest
          </h2>
          <ul className="flex flex-wrap gap-2">
            {interests.map((interest, index) => (
              <li key={interest.id}>
                <Link
                  href="/prototype/explore"
                  aria-current={index === 0 ? "page" : undefined}
                  className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-body-sm transition-colors duration-150 ease-standard hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-[current=page]:border-primary-border aria-[current=page]:bg-primary-subtle aria-[current=page]:font-medium aria-[current=page]:text-primary"
                >
                  {interest.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <Separator />

        <section aria-labelledby="suggested-heading" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="suggested-heading" className="text-h3">
              Communities you have not joined
            </h2>
            <Badge variant="outline">{suggested.length} shown</Badge>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {suggested.map((community) => (
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

        <section aria-labelledby="open-events-heading" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="open-events-heading" className="text-h3">
              Open to everyone
            </h2>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/prototype/events" />}
            >
              All events
            </Button>
          </div>
          <p className="max-w-readable text-body-sm text-muted-foreground">
            You do not have to join a community to attend its open events. That
            is deliberate - membership should follow interest, not gate it.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {events.slice(0, 3).map((event) => (
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
    </div>
  )
}
