import { ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { ActivityCard } from "@/features/activities/components/activity-card"
import { CommunityCard } from "@/features/communities/components/community-card"
import { EventCard } from "@/features/events/components/event-card"
import { PostCard } from "@/features/posts/components/post-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { liveActivities } from "@/lib/domain/activity"
import { bucketLabel, groupByBucket } from "@/lib/domain/time-buckets"
import { rankTrending, recommendFor } from "@/lib/domain/trending"
import {
  activities,
  events,
  feedPosts,
  prototypeNow,
  viewer,
  viewerCommunities,
  viewerInterestSlugs,
} from "@/lib/prototype/fixtures"

/**
 * Home, in the order a student decides things.
 *
 * The ordering is the product argument. Trending answers "what is campus doing
 * this week", Happening soon answers "what can I turn up to", Recommended
 * narrows it to me, Find people covers the things that need one more person,
 * and only then does the feed appear. Every section above the feed leads to an
 * experience; the feed exists to support them, which is why it is last, quieter,
 * and capped rather than infinite.
 *
 * A feed at the top would train the opposite habit within a week. Scroll depth
 * is the easiest metric to grow and the least connected to whether anyone left
 * their room.
 */

const context = { now: prototypeNow, viewerInterestSlugs }

const trending = rankTrending(events, context, 4)
const soon = groupByBucket(events, prototypeNow, [
  "TODAY",
  "TOMORROW",
  "THIS_WEEKEND",
])
const recommended = recommendFor(events, context, 3)
const openActivities = liveActivities(activities, prototypeNow).slice(0, 3)

function Section({
  title,
  eyebrow,
  description,
  action,
  children,
}: {
  title: string
  eyebrow: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-label text-muted-foreground">{eyebrow}</p>
          <h2 className="text-h3">{title}</h2>
          {description && (
            <p className="max-w-readable text-body-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function PrototypeHomeScreen() {
  return (
    <div className="flex flex-col gap-12">
      <ScreenHeader
        phase="Phase 7"
        title={`Good morning, ${viewer.name.split(" ")[0]}`}
        description="Everything you could turn up to this week, then everything worth reading. In that order."
        notes={[
          "Trending and Recommended are computed by lib/domain/trending.ts from fixture data, not hand-picked.",
          "Section ordering is the locked decision: experiences above the feed.",
          "Join, register, and reaction controls are inert.",
        ]}
      />

      <Section
        eyebrow="Trending"
        title="Trending this week"
        description="Ranked by how fast seats are going, how soon it is, and how many people signed up - not by who shouted loudest."
        action={
          <Button variant="ghost" size="sm" render={<Link href="/prototype/events" />}>
            All events
            <ArrowRight aria-hidden="true" />
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trending.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              now={prototypeNow}
              href="/prototype/event"
            />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Happening soon"
        title="Today, tomorrow, this weekend"
        description="Calendar days in campus time, so tonight at 11 and tomorrow at 1am are not the same thing."
      >
        <div className="flex flex-col gap-6">
          {soon.map((group) => (
            <div key={group.bucket} className="flex flex-col gap-3">
              <h3 className="text-label text-muted-foreground">
                {bucketLabel[group.bucket]}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    now={prototypeNow}
                    href="/prototype/event"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {recommended.length > 0 && (
        <Section
          eyebrow="For you"
          title="Because you follow Technology, Coding, and Travel"
          description="Matched to your interests and filtered to things you have not already booked."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recommended.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                now={prototypeNow}
                href="/prototype/event"
              />
            ))}
          </div>
        </Section>
      )}

      <Section
        eyebrow="Find people"
        title="Students looking for one more"
        description="Not events. Someone needs a doubles partner, a teammate, or a study group, and it expires when it happens."
        action={
          <Button variant="outline" size="sm" render={<Link href="/prototype/activities" />}>
            <Plus aria-hidden="true" />
            Post one
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {openActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} now={prototypeNow} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Your communities"
        title="Where you belong"
        action={
          <Button variant="ghost" size="sm" render={<Link href="/prototype/communities" />}>
            Directory
            <ArrowRight aria-hidden="true" />
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {viewerCommunities.slice(0, 3).map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              href="/prototype/community"
            />
          ))}
        </div>
      </Section>

      {/*
        The feed, last and deliberately narrower. Constrained to a readable
        column and a fixed number of posts - it is a digest of what the
        communities you joined are saying, not a surface to fall into.
      */}
      <section className="flex flex-col gap-4" aria-label="Community feed">
        <div className="flex flex-col gap-1">
          <p className="text-label text-muted-foreground">Catch up</p>
          <h2 className="text-h3">From your communities</h2>
          <p className="max-w-readable text-body-sm text-muted-foreground">
            The last few posts from communities you joined. Not infinite, and not
            ranked - just what you missed.
          </p>
        </div>

        <div className="flex max-w-readable flex-col gap-4">
          {feedPosts.slice(0, 4).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              now={prototypeNow}
              href="/prototype/post"
              communityHref="/prototype/community"
            />
          ))}

          <Card>
            <CardContent className="flex flex-col items-start gap-2 py-6">
              <p className="text-body-sm font-medium">That is everything new.</p>
              <p className="text-body-sm text-muted-foreground">
                The feed ends on purpose. If you are here to decide what to do
                this week, the top of this page is the part that helps.
              </p>
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/prototype/explore" />}
              >
                Explore what is on
                <ArrowRight aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
