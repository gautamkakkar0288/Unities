import { Compass } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/features/shell/components/page-header"

export const metadata: Metadata = { title: "Home" }

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Home"
        description="Your personalised feed of events, communities, and opportunities."
      />
      <EmptyState
        icon={Compass}
        title="Your feed starts filling up once you join a community"
        description="The recommendation feed arrives with communities and posts. Until then, browse what is on campus."
        action={
          <Link href="/explore" className={buttonVariants()}>
            Explore campus
          </Link>
        }
      />
    </>
  )
}
