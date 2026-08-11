import { Clock, MapPin, Users } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  activityKindLabel,
  activityKindTone,
  describeActivity,
} from "@/lib/domain/activity"
import type { Activity, Timestamp } from "@/lib/domain/types"
import { formatRelativeTime, formatTime } from "@/lib/format"

/**
 * A student looking for people.
 *
 * Deliberately lighter than an event card: no cover image, no community
 * branding, no registration language. An activity is somebody asking, and the
 * card should read like the question they asked - the title is their own words,
 * and the heaviest element on the card is the button that says yes.
 *
 * The spots counter is a plain count rather than a progress bar. A bar implies
 * a target being filled; four people playing badminton is not a fundraiser.
 */
export function ActivityCard({
  activity,
  now,
}: {
  activity: Activity
  now: Timestamp
}) {
  const descriptor = describeActivity(activity, now)

  return (
    <Card className="h-full gap-3">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={activityKindTone[activity.kind]}>
            {activityKindLabel[activity.kind]}
          </Badge>
          {descriptor.status && (
            <Badge variant={descriptor.status.tone}>
              {descriptor.status.label}
            </Badge>
          )}
        </div>

        <p className="text-h4 text-balance">{activity.title}</p>

        <div className="flex items-center gap-2">
          <Avatar name={activity.author.name} src={activity.author.avatarUrl ?? undefined} size="xs" />
          <p className="text-caption text-muted-foreground">
            {activity.author.name}
            <span aria-hidden="true"> · </span>
            <span>{formatRelativeTime(activity.happensAt, now)}</span>
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <p className="text-body-sm text-muted-foreground">{activity.detail}</p>

        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Time</dt>
            <Clock aria-hidden="true" className="size-3.5" />
            <dd data-numeric>{formatTime(activity.happensAt)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Place</dt>
            <MapPin aria-hidden="true" className="size-3.5" />
            <dd>{activity.place}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Spots</dt>
            <Users aria-hidden="true" className="size-3.5" />
            <dd data-numeric>{descriptor.spotsLabel}</dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter className="mt-auto">
        <Button
          type="button"
          variant={descriptor.ctaVariant}
          size="sm"
          disabled={descriptor.ctaDisabled}
          aria-label={descriptor.accessibleCtaLabel}
        >
          {descriptor.ctaLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}
