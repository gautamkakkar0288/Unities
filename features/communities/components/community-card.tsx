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
import {
  communityKindLabel,
  communityKindTone,
  joinPolicyLabel,
} from "@/lib/domain/community"
import {
  describeMembershipAction,
  membershipBadgeLabel,
} from "@/lib/domain/membership"
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
 *
 * The kind badge is shown only for official communities. Labelling every
 * student-run community "Student-run" would read as a demotion, while marking
 * the official ones carries the useful information.
 */
export function CommunityCard({
  community,
  href,
  joinAction = true,
}: {
  community: CommunitySummary
  href: string
  /**
   * Whether to render the join control.
   *
   * Defaults to true so the prototype screens this card was built for are
   * untouched. The real directory passes false: the button below has no
   * handler, and a control that looks actionable and silently does nothing is
   * worse on a live screen than no control at all. When joining actually works
   * (Phase 1.4) this becomes a real client control and the flag goes away.
   */
  joinAction?: boolean
}) {
  const action = describeMembershipAction(community)

  /**
   * Without the button, nothing else on the card would tell a student they are
   * already a member - the button was carrying that. The badge says the same
   * thing without pretending to be actionable.
   */
  const membership = membershipBadgeLabel[community.viewerMembership]

  return (
    <Card interactive className="h-full gap-4">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {community.kind === "OFFICIAL" && (
            <Badge variant={communityKindTone.OFFICIAL}>
              {communityKindLabel.OFFICIAL}
            </Badge>
          )}
          <Badge variant="outline">{community.interest.label}</Badge>
          <VerificationBadge state={community.verification} />
          {community.joinPolicy !== "OPEN" && (
            <Badge variant="neutral">
              {joinPolicyLabel[community.joinPolicy]}
            </Badge>
          )}
          {!joinAction && membership && (
            <Badge variant="brand">{membership}</Badge>
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

      <CardContent className="mt-auto flex flex-col gap-1">
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Users aria-hidden="true" className="size-3.5" />
          <span data-numeric>{formatCount(community.memberCount)}</span>{" "}
          {community.memberCount === 1 ? "member" : "members"}
        </p>
        {community.place && (
          <p className="text-caption text-muted-foreground">
            {community.place.name}
          </p>
        )}
      </CardContent>

      {joinAction && (
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
      )}
    </Card>
  )
}
