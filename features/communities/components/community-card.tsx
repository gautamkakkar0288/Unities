import { MapPin, Users } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { communityKindLabel, communityKindTone } from "@/lib/domain/community"
import {
  membershipBadgeLabel,
  verificationLabel,
  verificationTone,
} from "@/lib/domain/membership"
import type { CommunitySummary } from "@/lib/domain/types"
import { formatCount } from "@/lib/format"

/**
 * One community in the directory.
 *
 * A server component with no join control. Joining is Phase 1.4, and a button
 * that opens nothing is worse than no button: the student learns the platform
 * does not work. The card links to the community instead, which is a promise it
 * can keep.
 *
 * The whole card is the target via a stretched link rather than an anchor
 * wrapped around everything, so screen readers announce the community name as
 * the link text instead of reading out every badge and count in the card.
 */
export function CommunityCard({ community }: { community: CommunitySummary }) {
  const membership = membershipBadgeLabel[community.viewerMembership]

  return (
    <Card interactive className="relative gap-4">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>
            <Link
              href={`/communities/${community.slug}`}
              className="rounded-sm after:absolute after:inset-0 focus-visible:outline-none"
            >
              {community.name}
            </Link>
          </CardTitle>
          {membership && <Badge variant="brand">{membership}</Badge>}
        </div>
        <CardDescription>{community.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge variant={communityKindTone[community.kind]}>
          {communityKindLabel[community.kind]}
        </Badge>

        {/*
          Only a claim worth making gets a badge. Labelling every unverified
          community "Unverified" reads as a warning about communities that have
          simply never applied, most of which are perfectly real.
        */}
        {community.verification !== "UNVERIFIED" && (
          <Badge variant={verificationTone[community.verification]}>
            {verificationLabel[community.verification]}
          </Badge>
        )}

        <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          {formatCount(community.memberCount)}
          {community.memberCount === 1 ? " member" : " members"}
        </span>

        {community.place && (
          <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {community.place.name}
          </span>
        )}
      </CardContent>
    </Card>
  )
}
