import { CalendarDays, Compass, Megaphone, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { CommunityCard } from "@/features/communities/components/community-card"
import { EventCard } from "@/features/events/components/event-card"
import { RegisterButton } from "@/features/events/components/register-button"
import { EventFilterChips } from "@/features/explore/components/event-filter-chips"
import { ExploreSearch } from "@/features/explore/components/explore-search"
import { ExploreTabs } from "@/features/explore/components/explore-tabs"
import { UpdateCard } from "@/features/feed/components/update-card"
import { OpportunityCard } from "@/features/saved/components/opportunity-card"
import { SaveButton } from "@/features/saved/components/save-button"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  applyEventFilters,
  matchesQuery,
  readEventFilters,
  readExploreTab,
  type ExploreTab,
} from "@/lib/domain/explore"
import { loadExploreData } from "@/lib/services/feed"

export const metadata: Metadata = { title: "Explore" }

/**
 * Explore.
 *
 * One batched read, then filtering in pure domain functions. Every choice the
 * student makes is a URL parameter, so the whole screen is reproducible from its
 * address - which is what makes it shareable, back-button-correct, and reloadable
 * without losing the view.
 *
 * The counts on the tabs are computed from the same arrays the tabs render, after
 * the text filter but before the event chips. That means the Events tab count
 * answers "how many events match your search" rather than "how many survived your
 * chips", which is the number that helps when a chip combination has emptied the
 * list.
 *
 * Every card carries a working save control and events carry a working register
 * button, because a discovery page whose cards cannot be acted on just sends the
 * student somewhere else to do the obvious thing.
 */
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string
    when?: string
    free?: string
    online?: string
    kind?: string
    q?: string
  }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const params = await searchParams
  const tab = readExploreTab(params.type)
  const filters = readEventFilters(params)
  const query = (params.q ?? "").trim()

  const data = await loadExploreData({ viewerId: session.user.id })

  const savedEvents = new Set(data.savedEventIds)
  const savedCommunities = new Set(data.savedCommunityIds)
  const savedOpportunities = new Set(data.savedOpportunityIds)

  // Text filter first, so the tab counts describe the search the student typed.
  const events = data.events.filter((event) =>
    matchesQuery([event.title, event.community.name, event.venue], query),
  )
  const communities = data.communities.filter((community) =>
    matchesQuery(
      [community.name, community.tagline, community.interest.label],
      query,
    ),
  )
  const opportunities = data.opportunities.filter((opportunity) =>
    matchesQuery(
      [
        opportunity.title,
        opportunity.description,
        opportunity.community?.name ?? null,
      ],
      query,
    ),
  )
  const updates = data.updates.filter((post) =>
    matchesQuery([post.title, post.body, post.community.name], query),
  )

  const counts: Record<ExploreTab, number> = {
    EVENTS: events.length,
    COMMUNITIES: communities.length,
    OPPORTUNITIES: opportunities.length,
    UPDATES: updates.length,
  }

  const visibleEvents = applyEventFilters(events, filters, data.now)

  return (
    <>
      <PageHeader
        title="Explore"
        description="Everything happening on campus - events, communities, opportunities, and announcements."
      />

      <div className="flex flex-col gap-6">
        <ExploreSearch tab={tab} query={query} />
        <ExploreTabs active={tab} counts={counts} query={query} />

        {tab === "EVENTS" && (
          <div className="flex flex-col gap-6">
            <EventFilterChips filters={filters} query={query} />

            {visibleEvents.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nothing happening here yet"
                description="No upcoming events match these filters. Try clearing them, or look a little further ahead."
                action={
                  <Link href="/explore?type=events" className={buttonVariants()}>
                    Clear filters
                  </Link>
                }
                secondaryAction={
                  <Link
                    href="/communities"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Browse communities
                  </Link>
                }
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleEvents.map((event) => (
                  <li key={event.id}>
                    <EventCard
                      event={event}
                      now={data.now}
                      href={`/events/${event.slug}`}
                      action={
                        <div className="flex items-center gap-2">
                          <RegisterButton
                            event={event}
                            now={data.now}
                            size="sm"
                          />
                          <SaveButton
                            targetKind="EVENT"
                            targetId={event.id}
                            label={event.title}
                            saved={savedEvents.has(event.id)}
                            revalidate="/explore"
                            size="sm"
                          />
                        </div>
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "COMMUNITIES" && (
          <>
            {communities.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No communities match that"
                description="Try a different word, or browse the full directory."
                action={
                  <Link href="/communities" className={buttonVariants()}>
                    Browse the directory
                  </Link>
                }
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {communities.map((community) => (
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
                          revalidate="/explore"
                          showLabel
                        />
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "OPPORTUNITIES" && (
          <>
            {opportunities.length === 0 ? (
              <EmptyState
                icon={Compass}
                title="No open opportunities match that"
                description="Internships, competitions and campus roles show up here as clubs post them."
                action={
                  <Link
                    href="/explore?type=opportunities"
                    className={buttonVariants()}
                  >
                    Show all opportunities
                  </Link>
                }
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {opportunities.map((opportunity) => (
                  <li key={opportunity.id}>
                    <OpportunityCard
                      opportunity={opportunity}
                      now={data.now}
                      action={
                        <SaveButton
                          targetKind="OPPORTUNITY"
                          targetId={opportunity.id}
                          label={opportunity.title}
                          saved={savedOpportunities.has(opportunity.id)}
                          revalidate="/explore"
                          showLabel
                        />
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "UPDATES" && (
          <>
            {updates.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No announcements match that"
                description="Club announcements appear here as they are posted."
                action={
                  <Link href="/explore?type=updates" className={buttonVariants()}>
                    Show all updates
                  </Link>
                }
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {updates.map((post) => (
                  <li key={post.id}>
                    <UpdateCard post={post} now={data.now} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  )
}
