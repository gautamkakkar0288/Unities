import { Bookmark } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { CommunityCard } from "@/features/communities/components/community-card"
import { EventCard } from "@/features/events/components/event-card"
import { RegisterButton } from "@/features/events/components/register-button"
import { OpportunityCard } from "@/features/saved/components/opportunity-card"
import { SavedFilters } from "@/features/saved/components/saved-filters"
import { SaveButton } from "@/features/saved/components/save-button"
import { PageHeader } from "@/features/shell/components/page-header"
import { auth } from "@/auth"
import { countSaved, readSavedFilter, savedEmptyState } from "@/lib/domain/saved"
import { listSavedItems } from "@/lib/services/saved"

export const metadata: Metadata = { title: "Saved" }

/**
 * Saved.
 *
 * The whole list is loaded once and filtered in memory rather than queried per
 * tab, because the counts on the tabs have to agree with the cards underneath
 * them. Two queries - one for counts, one for the visible kind - can disagree
 * across a save that lands between them, and a tab that says 4 above three cards
 * is the kind of small wrongness that makes a product feel unreliable.
 *
 * Every card carries a working control. A saved event shows register or cancel,
 * because the reason to keep a list of events is to act on them, and a saved
 * page full of inert cards would send the student to four other pages to do the
 * thing they saved it for.
 */
export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const { tab } = await searchParams
  const filter = readSavedFilter(tab?.toUpperCase())

  const now = new Date()
  const nowIso = now.toISOString()

  const items = await listSavedItems({ viewerId: session.user.id, now })
  const counts = countSaved(items)

  const visible =
    filter === "ALL" ? items : items.filter((item) => item.kind === filter)

  const empty = savedEmptyState[filter]

  return (
    <>
      <PageHeader
        title="Saved"
        description="Keep the events, communities, and opportunities you want to come back to."
      />

      <div className="flex flex-col gap-6">
        <SavedFilters active={filter} counts={counts} />

        {visible.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={empty.title}
            description={empty.description}
            action={
              <Link href="/explore" className={buttonVariants()}>
                Explore campus
              </Link>
            }
            secondaryAction={
              <Link
                href="/events"
                className={buttonVariants({ variant: "outline" })}
              >
                Browse events
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => {
              if (item.kind === "EVENT") {
                return (
                  <li key={`event-${item.event.id}`}>
                    <EventCard
                      event={item.event}
                      now={nowIso}
                      href={item.href}
                      action={
                        <div className="flex items-center gap-2">
                          <RegisterButton
                            event={item.event}
                            now={nowIso}
                            size="sm"
                          />
                          <SaveButton
                            targetKind="EVENT"
                            targetId={item.event.id}
                            label={item.event.title}
                            saved
                            revalidate="/saved"
                            size="sm"
                          />
                        </div>
                      }
                    />
                  </li>
                )
              }

              if (item.kind === "COMMUNITY") {
                return (
                  <li key={`community-${item.community.id}`}>
                    <CommunityCard
                      community={item.community}
                      href={item.href}
                      joinAction={false}
                      action={
                        <SaveButton
                          targetKind="COMMUNITY"
                          targetId={item.community.id}
                          label={item.community.name}
                          saved
                          revalidate="/saved"
                          showLabel
                        />
                      }
                    />
                  </li>
                )
              }

              return (
                <li key={`opportunity-${item.opportunity.id}`}>
                  <OpportunityCard
                    opportunity={item.opportunity}
                    now={nowIso}
                    action={
                      <SaveButton
                        targetKind="OPPORTUNITY"
                        targetId={item.opportunity.id}
                        label={item.opportunity.title}
                        saved
                        revalidate="/saved"
                        showLabel
                      />
                    }
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
