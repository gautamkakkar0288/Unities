import { Compass } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

/**
 * Scoped to this route so a bad slug loses the community and not the shell.
 *
 * The wording covers renamed, archived, and never-existed alike, because the
 * page genuinely cannot tell the difference and guessing out loud would be
 * worse than admitting it.
 */
export default function CommunityNotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="We could not find that community"
      description="The link may be out of date, or the community may have been archived."
      action={
        <Link href="/communities" className={buttonVariants()}>
          Browse communities
        </Link>
      }
    />
  )
}
