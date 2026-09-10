import { Search } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import {
  groupResultsByKind,
  searchResultKindLabel,
  searchResultKindTone,
} from "@/lib/domain/search"
import { searchQuery, searchResults } from "@/lib/prototype/fixtures"

export const metadata = { title: "Search" }

const recentSearches = [
  "placement week",
  "open mic",
  "design collective",
  "hackathon",
]

/**
 * Search as a destination, not a dropdown.
 *
 * A full route means a query is shareable, survives the back button, and has
 * room to group results. Overlay search boxes trap the result set inside a
 * transient popover that vanishes the moment attention moves.
 */
export default function PrototypeSearchPage() {
  const groups = groupResultsByKind(searchResults)

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 10"
        title="Search"
        description="One query across communities, events, posts, and people - grouped by kind, because the student already knows which one they want."
        notes={[
          "The input does not query anything; results are a fixed fixture set",
          "Debouncing, keyboard navigation, and recent-search persistence are Phase 10",
          "Postgres full-text search comes first; a search service only if it is too slow",
        ]}
      />

      <div className="flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Label htmlFor="search-input">Search campus</Label>
          <div className="border-border bg-card shadow-card focus-within:ring-ring/50 flex items-center gap-2 rounded-lg border px-3 py-2 focus-within:ring-3">
            <Search
              aria-hidden="true"
              className="text-muted-foreground size-4 shrink-0"
            />
            <input
              id="search-input"
              type="search"
              defaultValue={searchQuery}
              placeholder="Communities, events, people"
              className="text-body-sm placeholder:text-muted-foreground w-full bg-transparent outline-none"
            />
          </div>
          <p className="text-caption text-muted-foreground">
            <span data-numeric>{searchResults.length}</span> results for “
            {searchQuery}”
          </p>
        </div>

        <section
          aria-labelledby="recent-heading"
          className="flex flex-col gap-3"
        >
          <h2 id="recent-heading" className="text-h4">
            Recent searches
          </h2>
          <ul className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <li key={term}>
                <Link
                  href="/prototype/search"
                  className="border-border text-caption ease-standard hover:bg-muted focus-visible:ring-ring/50 inline-flex items-center rounded-full border px-3 py-1.5 transition-colors duration-150 focus-visible:ring-3 focus-visible:outline-none"
                >
                  {term}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {groups.map((group) => (
          <section
            key={group.kind}
            aria-labelledby={`${group.kind}-heading`}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <h2 id={`${group.kind}-heading`} className="text-h4">
                {searchResultKindLabel[group.kind]}
              </h2>
              <Badge variant={searchResultKindTone[group.kind]}>
                {group.results.length}
              </Badge>
            </div>
            <ul className="flex flex-col gap-2">
              {group.results.map((result) => (
                <li key={result.id}>
                  <Card interactive className="gap-0">
                    <CardContent className="flex flex-col gap-1">
                      <Link
                        href={result.href}
                        className="text-body-sm hover:text-primary focus-visible:ring-ring/50 rounded-sm font-medium focus-visible:ring-3 focus-visible:outline-none"
                      >
                        {result.title}
                      </Link>
                      <p className="text-caption text-muted-foreground">
                        {result.subtitle}
                      </p>
                      <p
                        className="text-caption text-muted-foreground"
                        data-numeric
                      >
                        {result.meta}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
