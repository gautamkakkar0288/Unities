import { Search } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { CommunityCard } from "@/features/communities/components/community-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import { canParticipate } from "@/lib/domain/membership"
import { communities } from "@/lib/prototype/fixtures"

export const metadata = { title: "Community directory" }

/**
 * The full directory.
 *
 * Split into "yours" and "everything else" rather than one alphabetical wall.
 * A directory answers two different questions - "where do I already belong?"
 * and "what else exists?" - and one flat list answers neither well.
 */
export default function PrototypeCommunitiesPage() {
  const mine = communities.filter((community) =>
    canParticipate(community.viewerMembership),
  )
  const rest = communities.filter(
    (community) => !canParticipate(community.viewerMembership),
  )

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 6"
        title="Communities"
        description="Every community at Chitkara, with the ones you belong to first."
        notes={[
          "The search field is a link to the search screen, not a live filter",
          "Sorting and interest filters arrive with the real directory",
          "Creating a community depends on the approval decision still open",
        ]}
      />

      <div className="flex flex-col gap-10">
        <Link
          href="/prototype/search"
          className="flex max-w-md items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-body-sm text-muted-foreground shadow-card transition-colors duration-150 ease-standard hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Search aria-hidden="true" className="size-4" />
          Search communities
        </Link>

        <section aria-labelledby="mine-heading" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="mine-heading" className="text-h3">
              Your communities
            </h2>
            <Badge variant="outline">{mine.length}</Badge>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mine.map((community) => (
              <li key={community.id} className="flex">
                <CommunityCard
                  community={community}
                  href="/prototype/community"
                />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="all-heading" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="all-heading" className="text-h3">
              Everything else on campus
            </h2>
            <Badge variant="outline">{rest.length}</Badge>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rest.map((community) => (
              <li key={community.id} className="flex">
                <CommunityCard
                  community={community}
                  href="/prototype/community"
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
