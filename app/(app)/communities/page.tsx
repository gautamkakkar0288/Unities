import { Compass, SearchX, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { CommunityCard } from "@/features/communities/components/community-card"
import { DirectoryFilters } from "@/features/communities/components/directory-filters"
import { JoinButton } from "@/features/communities/components/join-button"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  communityScopeLabel,
  filterCommunities,
  groupByScope,
  parseCommunityScope,
} from "@/lib/domain/community"
import { listCommunitiesForViewer } from "@/lib/services/communities"

export const metadata: Metadata = { title: "Communities" }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/** Query strings can repeat a key; take the first and ignore the rest. */
function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? ""
}

/**
 * The community directory.
 *
 * A server component that calls the service and renders the result. It holds no
 * Drizzle query of its own - `listCommunitiesForViewer` decides what this viewer
 * may see, including whether they are signed in, and this page cannot widen
 * that. Filtering below is `filterCommunities` from the domain layer, so "what
 * counts as a match" is tested without a browser.
 *
 * Grouped by scope when no scope is chosen, because an ungrouped list buries the
 * student's own campus among global communities that will never affect their
 * week. When a scope is chosen the grouping is redundant, so it collapses to a
 * single grid.
 */
export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await auth()
  // The (app) layout already guarantees this. Repeated here because this page
  // reads the viewer's identity, and defaulting a missing session to "show
  // everything" would be a leak rather than a bug.
  if (!session?.user) redirect("/sign-in")

  const params = await searchParams
  const scope = parseCommunityScope(firstValue(params.scope))
  const query = firstValue(params.q).trim()

  const visible = await listCommunitiesForViewer({ viewerId: session.user.id })
  const results = filterCommunities(visible, { scope, query })
  const groups = scope
    ? [{ scope, communities: results }]
    : groupByScope(results)

  return (
    <>
      <PageHeader
        title="Communities"
        description="Clubs, societies, and interest groups on your campus and around it."
      />

      <DirectoryFilters activeScope={scope} query={query} />

      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No communities yet"
          description="Nothing has been set up for your campus so far. If you are running this locally, seed the database first."
          action={
            <Link href="/explore" className={buttonVariants()}>
              Explore Cirqles
            </Link>
          }
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nothing matches that"
          description={
            query
              ? `No community matches "${query}"${scope ? " in this scope" : ""}. Try a broader search, or ask for a new community.`
              : "No communities in this scope yet. Try another one."
          }
          action={
            <Link href="/communities" className={buttonVariants({ variant: "outline" })}>
              Clear filters
            </Link>
          }
          secondaryAction={
            /*
              Straight to the form. This pointed at /create until 1.5 built the
              proposal form: a student who has just been told nothing matches
              does not need to be shown a chooser first.
            */
            <Link
              href="/communities/propose"
              className={buttonVariants({ variant: "ghost" })}
            >
              Propose a community
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.scope} aria-labelledby={`scope-${group.scope}`}>
              <h2
                id={`scope-${group.scope}`}
                className="pb-3 text-h4 text-muted-foreground"
              >
                {communityScopeLabel[group.scope]}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.communities.map((community) => (
                  <li key={community.id}>
                    <CommunityCard
                      community={community}
                      href={`/communities/${community.slug}`}
                      joinAction={false}
                      action={<JoinButton community={community} size="sm" />}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <p className="pt-8 text-center text-body-sm text-muted-foreground">
          <Compass className="mr-1 inline size-4 align-text-bottom" aria-hidden="true" />
          Cannot find what you are looking for?{" "}
          <Link
            href="/communities/propose"
            className="text-primary underline underline-offset-4"
          >
            Propose a community
          </Link>
        </p>
      )}
    </>
  )
}
