import { Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/features/shell/components/page-header"

export const metadata: Metadata = { title: "Communities" }

export default function CommunitiesPage() {
  return (
    <>
      <PageHeader
        title="Communities"
        description="The clubs and societies you belong to."
      />
      <EmptyState
        icon={Users}
        title="You have not joined a community yet"
        description="Communities are the centre of Cirqles. Joining one is what makes your feed useful."
        action={
          <Link href="/explore" className={buttonVariants()}>
            Discover communities
          </Link>
        }
      />
    </>
  )
}
