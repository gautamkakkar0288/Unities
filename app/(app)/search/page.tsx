import { Compass, Search as SearchIcon } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { CommunityCard } from "@/features/communities/components/community-card"
import { EventCard } from "@/features/events/components/event-card"
import { OpportunityCard } from "@/features/saved/components/opportunity-card"
import { SaveButton } from "@/features/saved/components/save-button"
import { SearchForm } from "@/features/search/components/search-form"
import { SearchTabs } from "@/features/search/components/search-tabs"
import { UpdateResultCard } from "@/features/search/components/update-result-card"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  MIN_QUERY_LENGTH,
  searchHref,
  parseSearchParams,
  type SearchTab,
} from "@/lib/domain/search"
import { getUserInterests } from "@/lib/services/interests"
import { searchAll, searchScopeFor } from "@/lib/services/search"

/**
 * `/search`.
 *
 * Everything that decides what this page shows comes from the URL, and
 * everything that decides what the viewer is allowed to see comes from the
 * session. Those are the only two inputs. There is no client state to fall out
 * of step with the address bar, which is what makes reload, back, forward and
 * link-sharing work without any code that mentions them.
 *
 * Ranking and parsing live in `lib/domain/search.ts`; matching lives in
 * `lib/services/search.ts`. This file is layout.
 */

type SearchParams = {
  q?: string | string[]
  type?: string | string[]
}

/** A section heading with a link through to the full category. */
function ResultSection({
  title,
  viewAllHref,
  viewAllLabel,
  children,
}: {
  title: string
  viewAllHref?: string
  viewAllLabel?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h4">{title}</h2>

        {viewAllHref && viewAllLabel ? (
          <Link
            href={viewAllHref}
            className="text-body-sm font-medium text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </div>

      {children}
    </section>
  )
}

function ResultGrid({ children }: { children: React.ReactNode }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</ul>
  )
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const viewerId = session.user.id
  const request = parseSearchParams(await searchParams)

  // One clock for the page: the services rank against it and the cards format
  // against it, so nothing can disagree about what "tomorrow" means.
  const now = new Date()
  const nowIso = now.toISOString()

  // A short or absent query never reaches the database. The landing state
  // instead reads the viewer's interests, which is one cheap indexed lookup and
  // gives genuinely personal starting points rather than a hardcoded term list.
  const results = request.shouldSearch
    ? await searchAll(request, await searchScopeFor({ viewerId, now }))
    : null

  const interests = request.shouldSearch ? [] : await getUserInterests(viewerId)

  const counts: Record<SearchTab, number> | undefined = results
    ? {
        ALL: results.counts.total,
        EVENTS: results.counts.events,
        COMMUNITIES: results.counts.communities,
        OPPORTUNITIES: results.counts.opportunities,
        UPDATES: results.counts.updates,
      }
    : undefined

  const showAll = request.tab === "ALL"

  const eventCards = results?.events.map((event) => (
    <li key={event.id}>
      <EventCard
        event={event}
        now={nowIso}
        href={`/events/${event.slug}`}
        action={
          <SaveButton
            targetKind="EVENT"
            targetId={event.id}
            label={event.title}
            saved={results.saved.events.has(event.id)}
            revalidate="/search"
          />
        }
      />
    </li>
  ))

  const communityCards = results?.communities.map((community) => (
    <li key={community.id}>
      <CommunityCard
        community={community}
        href={`/communities/${community.slug}`}
        action={
          <SaveButton
            targetKind="COMMUNITY"
            targetId={community.id}
            label={community.name}
            saved={results.saved.communities.has(community.id)}
            revalidate="/search"
          />
        }
      />
    </li>
  ))

  const opportunityCards = results?.opportunities.map((opportunity) => (
    <li key={opportunity.id}>
      <OpportunityCard
        opportunity={opportunity}
        now={nowIso}
        action={
          <SaveButton
            targetKind="OPPORTUNITY"
            targetId={opportunity.id}
            label={opportunity.title}
            saved={results.saved.opportunities.has(opportunity.id)}
            revalidate="/search"
          />
        }
      />
    </li>
  ))

  const updateCards = results?.updates.map((update) => (
    <li key={update.id}>
      <UpdateResultCard update={update} now={nowIso} />
    </li>
  ))

  return (
    <div className="mx-auto w-full max-w-page space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Search campus"
        description="Events, clubs, opportunities and announcements across your campus."
      />

      <SearchForm query={request.rawQuery} tab={request.tab} />

      <SearchTabs active={request.tab} query={request.rawQuery} counts={counts} />

      {/* No query yet. */}
      {request.isEmpty ? (
        <div className="space-y-6">
          <EmptyState
            icon={<SearchIcon className="size-6" aria-hidden="true" />}
            title="Search campus"
            description="Look for an event, a club, an internship, or something a club announced."
            action={
              <Link href="/explore" className={buttonVariants()}>
                Browse everything
              </Link>
            }
          />

          {interests.length > 0 ? (
            <ResultSection title="Start with your interests">
              <ul className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <li key={interest.id}>
                    <Link
                      href={searchHref({ query: interest.label, tab: "ALL" })}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      {interest.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </ResultSection>
          ) : null}
        </div>
      ) : null}

      {/* Typed, but too short to be worth a query. */}
      {request.isTooShort ? (
        <EmptyState
          icon={<SearchIcon className="size-6" aria-hidden="true" />}
          title="Keep typing"
          description={`Searches need at least ${MIN_QUERY_LENGTH} characters. One letter matches most of campus, which is not much help.`}
        />
      ) : null}

      {/* Searched, found nothing. */}
      {results && results.counts.total === 0 ? (
        <EmptyState
          icon={<Compass className="size-6" aria-hidden="true" />}
          title={`No results found for \u201c${request.rawQuery}\u201d`}
          description="Nothing on campus matches that yet. Browsing usually turns something up."
          action={
            <Link href="/events" className={buttonVariants()}>
              Browse events
            </Link>
          }
          secondaryAction={
            <Link
              href="/communities"
              className={buttonVariants({ variant: "outline" })}
            >
              Explore communities
            </Link>
          }
        />
      ) : null}

      {/* Results. */}
      {results && results.counts.total > 0 ? (
        <div className="space-y-10">
          {results.events.length > 0 ? (
            <ResultSection
              title="Events"
              viewAllHref={
                showAll && results.counts.events >= 5
                  ? searchHref({ query: request.rawQuery, tab: "EVENTS" })
                  : undefined
              }
              viewAllLabel="View all events"
            >
              <ResultGrid>{eventCards}</ResultGrid>
            </ResultSection>
          ) : null}

          {results.communities.length > 0 ? (
            <ResultSection
              title="Communities"
              viewAllHref={
                showAll && results.counts.communities >= 5
                  ? searchHref({ query: request.rawQuery, tab: "COMMUNITIES" })
                  : undefined
              }
              viewAllLabel="View all communities"
            >
              <ResultGrid>{communityCards}</ResultGrid>
            </ResultSection>
          ) : null}

          {results.opportunities.length > 0 ? (
            <ResultSection
              title="Opportunities"
              viewAllHref={
                showAll && results.counts.opportunities >= 5
                  ? searchHref({
                      query: request.rawQuery,
                      tab: "OPPORTUNITIES",
                    })
                  : undefined
              }
              viewAllLabel="View all opportunities"
            >
              <ResultGrid>{opportunityCards}</ResultGrid>
            </ResultSection>
          ) : null}

          {results.updates.length > 0 ? (
            <ResultSection
              title="Campus updates"
              viewAllHref={
                showAll && results.counts.updates >= 5
                  ? searchHref({ query: request.rawQuery, tab: "UPDATES" })
                  : undefined
              }
              viewAllLabel="View all updates"
            >
              <ResultGrid>{updateCards}</ResultGrid>
            </ResultSection>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
