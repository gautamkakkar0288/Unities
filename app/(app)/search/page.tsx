import { Search } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/features/shell/components/page-header"

export const metadata: Metadata = { title: "Search" }

export default function SearchPage() {
  return (
    <>
      <PageHeader
        title="Search"
        description="Find events, communities, people, and opportunities."
      />
      <EmptyState
        icon={Search}
        title="Search is not wired up yet"
        description="Search needs content to search. It arrives once communities, posts, and events exist."
      />
    </>
  )
}
