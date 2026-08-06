import { Bookmark } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/features/shell/components/page-header"

export const metadata: Metadata = { title: "Saved" }

export default function SavedPage() {
  return (
    <>
      <PageHeader
        title="Saved"
        description="Events, communities, and organisers you bookmarked."
      />
      {/* Empty navigation states must point somewhere useful (docs/UX/02). */}
      <EmptyState
        icon={Bookmark}
        title="Nothing saved yet"
        description="Save anything you want to come back to and it shows up here."
        action={
          <Link href="/explore" className={buttonVariants()}>
            Explore campus
          </Link>
        }
      />
    </>
  )
}
