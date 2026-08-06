import { Users } from "lucide-react"
import Link from "next/link"

import { VerificationBadge } from "@/components/domain/verification-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { describeMembershipAction } from "@/lib/domain/membership"
import type { CommunitySummary } from "@/lib/domain/types"
import { formatCount } from "@/lib/format"

/**
 * A community in a list.
 *
 * The whole card is not a single link. A card that is one big anchor cannot
 * also contain a working Join button - nested interactive elements are invalid
 * and keyboard users end up unable to reach the inner control. Instead the
 * title is the link and the card lifts on hover, which gives the same feel with
 * two clean, separately focusable targets.
 */
export function CommunityCard({
  community,
  href,
}: {
  community: CommunitySummary
  href: string
}) {
  const action = describeMembershipAction(community)

  return (
    <Card interactive className="h-full gap-4">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{community.interest.label}</Badge>
          <VerificationBadge state={community.verification} />
          {community.joinPolicy === "REQUEST" && (
            <Badge variant="neutral">Approval needed</Badge>
          )}
        </div>
        <CardTitle>
          <Link
            href={href}
            className="rounded-sm hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {community.name}
          </Link>
        </CardTitle>
        <CardDescription>{community.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="mt-auto">
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Users aria-hidden="true" className="size-3.5" />
          <span data-numeric>{formatCount(community.memberCount)}</span>
          members
        </p>
      </CardContent>

      <CardFooter>
        <Button
          type="button"
          variant={action.variant}
          size="lg"
          disabled={action.disabled}
          aria-label={action.accessibleLabel}
        >
          {action.label}
        </Button>
      </CardFooter>
    </Card>
  )
}
