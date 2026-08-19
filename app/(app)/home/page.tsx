import {
  Bookmark,
  CalendarDays,
  Compass,
  Flame,
  Megaphone,
  Sparkles,
  Users,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { CommunityCard } from "@/features/communities/components/community-card"
import { EventCard } from "@/features/events/components/event-card"
import { RegisterButton } from "@/features/events/components/register-button"
import { FeedSection } from "@/features/feed/components/feed-section"
import { QuickActions } from "@/features/feed/components/quick-actions"
import { UpdateCard } from "@/features/feed/components/update-card"
import { OpportunityCard } from "@/features/saved/components/opportunity-card"
import { SaveButton } from "@/features/saved/components/save-button"
import { formatCount, formatRelativeTime } from "@/lib/format"
import { loadHomeFeed } from "@/lib/services/feed"

export const metadata: Metadata = { title: "Home" }

/**
 * Home.
 *
 * The page contains layout and nothing else. Every ordering decision is made by
 * a pure function in `lib/domain` and every read happens in one call to
 * `loadHomeFeed`, which fans out its queries in parallel. That split is what
 * keeps this file reviewable: it is obvious at a glance that no section fetches
 * anything, and obvious in the domain tests why the events appear in the order
 * they do.
 *
 * Section order answers "what is happening around me" in descending urgency:
 * what the student already committed to, then what is on today, then what they
 * would probably like, then what campus is excited about, then people, then
 * opportunities, then news. A student who reads only the first screen still gets
 * the two things with a deadline attached.
 *
 * Every section degrades to an empty state with a real CTA. A seeded demo will
 * never show most of them, but a brand-new account on a quiet campus is the case
 * that decides whether the product feels broken.
 */
export default async function HomePage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const feed = await loadHomeFeed({
    viewerId: session.user.id,
    viewerName: session.user.name ?? null,
  })

  const savedEvents = new Set(feed.savedEventIds)
  const savedCommunities = new Set(feed.savedCommunityIds)
  const savedOpportunities = new Set(feed.savedOpportunityIds)

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-h2">
          {feed.greeting}, {feed.firstName}
        </h1>
        <p className="text-body text-muted-foreground">
          Here&rsquo;s what&rsquo;s happening around campus.
        </p>

        <ul className="flex flex-wrap items-center gap-2">
          <li>
            <Badge variant="neutral">
              <CalendarDays aria-hidden="true" />
              {formatCount(feed.counts.upcomingEvents)} upcoming events
            </Badge>
          </li>
          <li>
            <Badge variant="neutral">
              <Users aria-hidden="true" />
              {formatCount(feed.counts.joinedCommunities)} communities joined
            </Badge>
          </li>
          <li>
            <Badge variant="neutral">
              <Bookmark aria-hidden="true" />
              {formatCount(feed.counts.savedItems)} saved
            </Badge>
          </li>
        </ul>
      </header>

      <QuickActions />

      <FeedSection
        title="Your upcoming events"
        description="Places you are holding, soonest first."
        action={
          <Link
            href="/events"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            All events
          </Link>
        }
      >
        {feed.yourUpcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nothing on your calendar yet"
            description="Register for something and it will show up here with the time and venue."
            action={
              <Link href="/events" className={buttonVariants()}>
                Browse events
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {feed.yourUpcoming.map((event) => (
              <li key={event.id} className="flex flex-col gap-2">
                <EventCard
                  event={event}
                  now={feed.now}
                  href={`/events/${event.slug}`}
                  action={
                    <div className="flex items-center gap-2">
                      <RegisterButton event={event} now={feed.now} size="sm" />
                      <SaveButton
                        targetKind="EVENT"
                        targetId={event.id}
                        label={event.title}
                        saved={savedEvents.has(event.id)}
                        revalidate="/home"
                        size="sm"
                      />
                    </div>
                  }
                />
                <p className="text-caption text-muted-foreground">
                  Starts {formatRelativeTime(event.startsAt, feed.now)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </FeedSection>

      {feed.happeningSoon.length > 0 && (
        <FeedSection
          title="Happening soon"
          description="The next few days on campus."
        >
          <div className="flex flex-col gap-6">
            {feed.happeningSoon.map((group) => (
              <div key={group.bucket} className="flex flex-col gap-3">
                <h3 className="text-label text-muted-foreground">
                  {group.label}
                </h3>
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.events.map((event) => (
                    <li key={event.id}>
                      <EventCard
                        event={event}
                        now={feed.now}
                        href={`/events/${event.slug}`}
                        action={
                          <div className="flex items-center gap-2">
                            <RegisterButton
                              event={event}
                              now={feed.now}
                              size="sm"
                            />
                            <SaveButton
                              targetKind="EVENT"
                              targetId={event.id}
                              label={event.title}
                              saved={savedEvents.has(event.id)}
                              revalidate="/home"
                              size="sm"
                            />
                          </div>
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </FeedSection>
      )}

      <FeedSection
        title="For you"
        description="Picked from your interests, your communities, and what you have saved."
        action={
          <Link
            href="/explore"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Explore
          </Link>
        }
      >
        {feed.forYou.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Join a few communities to personalise your campus"
            description="Recommendations use your interests and the clubs you follow. Pick a couple and this fills up."
            action={
              <Link href="/communities" className={buttonVariants()}>
                Find communities
              </Link>
            }
            secondaryAction={
              <Link
                href="/profile"
                className={buttonVariants({ variant: "outline" })}
              >
                Edit interests
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {feed.forYou.map((event) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  now={feed.now}
                  href={`/events/${event.slug}`}
                  action={
                    <div className="flex items-center gap-2">
                      <RegisterButton event={event} now={feed.now} size="sm" />
                      <SaveButton
                        targetKind="EVENT"
                        targetId={event.id}
                        label={event.title}
                        saved={savedEvents.has(event.id)}
                        revalidate="/home"
                        size="sm"
                      />
                    </div>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </FeedSection>

      <FeedSection
        title="Trending on campus"
        description="Filling fast, or happening imminently."
      >
        {feed.trending.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="Nothing trending yet"
            description="Trending needs a few registrations to work with. Be the first person in the room."
            action={
              <Link href="/events" className={buttonVariants()}>
                Browse events
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {feed.trending.map((event) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  now={feed.now}
                  href={`/events/${event.slug}`}
                  action={
                    <div className="flex items-center gap-2">
                      <RegisterButton event={event} now={feed.now} size="sm" />
                      <SaveButton
                        targetKind="EVENT"
                        targetId={event.id}
                        label={event.title}
                        saved={savedEvents.has(event.id)}
                        revalidate="/home"
                        size="sm"
                      />
                    </div>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </FeedSection>

      <FeedSection
        title="Communities you might like"
        description="Places you are not in yet."
        action={
          <Link
            href="/communities"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            All communities
          </Link>
        }
      >
        {feed.suggestedCommunities.length === 0 ? (
          <EmptyState
            icon={Users}
            title="You have joined everything we would suggest"
            description="Browse the full directory, or propose a community that does not exist yet."
            action={
              <Link href="/communities" className={buttonVariants()}>
                Browse the directory
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {feed.suggestedCommunities.map((community) => (
              <li key={community.id}>
                <CommunityCard
                  community={community}
                  href={`/communities/${community.slug}`}
                  action={
                    <SaveButton
                      targetKind="COMMUNITY"
                      targetId={community.id}
                      label={community.name}
                      saved={savedCommunities.has(community.id)}
                      revalidate="/home"
                      showLabel
                    />
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </FeedSection>

      <FeedSection
        title="Opportunities"
        description="Internships, competitions, and campus roles."
        action={
          <Link
            href="/explore?type=opportunities"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            See all
          </Link>
        }
      >
        {feed.opportunities.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No open opportunities right now"
            description="Internships and competitions posted by clubs and the university will appear here."
            action={
              <Link href="/explore" className={buttonVariants()}>
                Explore campus
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {feed.opportunities.map((opportunity) => (
              <li key={opportunity.id}>
                <OpportunityCard
                  opportunity={opportunity}
                  now={feed.now}
                  action={
                    <SaveButton
                      targetKind="OPPORTUNITY"
                      targetId={opportunity.id}
                      label={opportunity.title}
                      saved={savedOpportunities.has(opportunity.id)}
                      revalidate="/home"
                      showLabel
                    />
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </FeedSection>

      <FeedSection
        title="Campus updates"
        description="What clubs have been announcing."
      >
        {feed.updates.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Nothing announced yet"
            description="When the clubs you follow post an update, it will show up here."
            action={
              <Link href="/communities" className={buttonVariants()}>
                Find communities
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {feed.updates.map((post) => (
              <li key={post.id}>
                <UpdateCard post={post} now={feed.now} />
              </li>
            ))}
          </ul>
        )}
      </FeedSection>
    </div>
  )
}
