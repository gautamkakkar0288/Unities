import { Users } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

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
  action,
}: {
  community: CommunitySummary
  href: string
  /**
   * Whether to render the card's own static join control.
   *
   * Defaults to true so the prototype screens this card was built for are
   * untouched. That button has no handler - it is prototype furniture - so real
   * screens pass false and supply `action` instead.
   */
  joinAction?: boolean
  /**
   * A working control, supplied by the caller.
   *
   * The card stays a server component this way. The real join control needs
   * state and an event handler, and hoisting it in as a prop keeps the browser
   * bundle to the button rather than every card in the directory.
   */
  action?: ReactNode
}) {
  const staticAction = describeMembershipAction(community)

  /**
   * Without the static button, nothing else on the card would tell a student
   * they are already a member - the button was carrying that. The badge says the
   * same thing without pretending to be actionable, and it still earns its place
   * next to a real control, which says "Leave" rather than naming the state.
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

      {action ? (
        <CardFooter>{action}</CardFooter>
      ) : (
        joinAction && (
          <CardFooter>
            <Button
              type="button"
              variant={staticAction.variant}
              size="lg"
              disabled={staticAction.disabled}
              aria-label={staticAction.accessibleLabel}
            >
              {staticAction.label}
            </Button>
          </CardFooter>
        )
      )}
    </Card>
  )
}
