import { ArrowRight } from "lucide-react"
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
import { EventCard } from "@/features/events/components/event-card"
import { PostCard } from "@/features/posts/components/post-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import {
  events,
  feedPosts,
  prototypeNow,
  viewer,
  viewerCommunities,
} from "@/lib/prototype/fixtures"
import { formatCount } from "@/lib/format"

export const metadata = { title: "Home feed" }

/**
 * The screen a returning student opens.
 *
 * Events come before posts. A feed of conversation is engaging but a feed of
 * things you can still attend is useful, and the product's promise is
 * attendance, not scrolling. The two-column split keeps that promise visible on
 * desktop while collapsing to events-then-feed on mobile, which preserves the
 * same priority order.
 */
export default function PrototypeHomePage() {
  const upcoming = events.slice(0, 3)

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 7"
        title="Home"
        description="Everything happening around you, ordered by what you can still act on. Events you can attend sit above the conversation."
        notes={[
          "Likes, saves, and the composer are static - no mutations exist yet",
          "Feed ranking is fixture order, not a real algorithm",
          "Infinite scroll and new-post polling arrive with Phase 7",
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="upcoming-heading" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 id="upcoming-heading" className="text-h3">
                Happening this week
              </h2>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/prototype/events" />}
              >
                All events
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

          <Separator />

          <section aria-labelledby="feed-heading" className="flex flex-col gap-4">
            <h2 id="feed-heading" className="text-h3">
              From your communities
            </h2>

            <Card>
              <CardContent className="flex items-center gap-3">
                <Avatar size="sm" name={viewer.name} src={viewer.avatarUrl} />
                <Link
                  href="/prototype/community"
                  className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-body-sm text-muted-foreground transition-colors duration-150 ease-standard hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  Share something with your communities
                </Link>
              </CardContent>
            </Card>

            <ul className="flex flex-col gap-4">
              {feedPosts.map((post) => (
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
        </div>

        <aside className="flex flex-col gap-4" aria-label="Your campus">
          <Card>
            <CardHeader>
              <CardTitle>Your communities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {viewerCommunities.map((community) => (
                  <li key={community.id}>
                    <Link
                      href="/prototype/community"
                      className="flex items-center justify-between gap-3 rounded-md text-body-sm hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <span className="truncate">{community.name}</span>
                      <span
                        className="shrink-0 text-caption text-muted-foreground"
                        data-numeric
                      >
                        {formatCount(community.memberCount)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Waiting on you</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-body-sm">
              <p className="text-muted-foreground">
                Three seats left at the bootcamp you saved.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="warning">3 seats left</Badge>
                <Badge variant="neutral">Tomorrow</Badge>
              </div>
              <Button size="lg" render={<Link href="/prototype/event" />}>
                Open the event
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
