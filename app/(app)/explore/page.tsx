import { Compass } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/features/shell/components/page-header"

export const metadata: Metadata = { title: "Explore" }

export default function ExplorePage() {
  return (
    <>
      <PageHeader
        title="Explore"
        description="Browse communities, events, and categories across your campus."
      />
      <EmptyState
        icon={Compass}
        title="Nothing to explore yet"
        description="Communities land next, followed by posts and events. This page becomes the category and trending browser."
      />
    </>
  )
}
