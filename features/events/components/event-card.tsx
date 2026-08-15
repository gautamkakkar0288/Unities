import { Clock, MapPin, Users } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { describeRegistration, eventModeLabel } from "@/lib/domain/registration"
import type { EventSummary } from "@/lib/domain/types"
import { formatDay, formatTime } from "@/lib/format"

/**
 * An event in a list.
 *
 * The date sits in a fixed-width block on the left because scanning a column of
 * aligned dates is far faster than reading dates embedded in prose - and
 * choosing what to attend is fundamentally a scanning task. Fee and seats are
 * always visible: they are the two facts that decide whether a student clicks,
 * and hiding them behind a detail page wastes the trip.
 *
 * `action` replaces the footer control. The default is a button that only
 * reports state and does nothing, which is honest in the prototype where no
 * registration exists to perform. Any real surface must pass something that
 * works - a link that navigates, or the register button from the events
 * feature - because a button that looks live and is not is worse than no
 * button at all.
 */
export function EventCard({
  event,
  now,
  href,
  action,
}: {
  event: EventSummary
  now: string
  href: string
  action?: ReactNode
}) {
  const registration = describeRegistration(event, now)
  const isFree = event.feeInPaise === null || event.feeInPaise === 0

  return (
    <Card interactive className="h-full gap-4">
      <CardHeader className="gap-3">
        <div className="flex items-start gap-4">
          <div
            className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-primary-border bg-primary-subtle px-2 py-1.5 text-primary"
            aria-hidden="true"
          >
            <span className="text-caption font-medium uppercase">
              {formatDay(event.startsAt).split(", ")[1]?.split(" ")[1]}
            </span>
            <span className="text-h4 leading-tight" data-numeric>
              {formatDay(event.startsAt).split(", ")[1]?.split(" ")[0]}
            </span>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle className="text-h4">
              <Link
                href={href}
                className="rounded-sm hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {event.title}
              </Link>
            </CardTitle>
            <p className="text-caption text-muted-foreground">
              {event.community.name}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{eventModeLabel[event.mode]}</Badge>
              <Badge variant={isFree ? "success" : "neutral"}>
                {registration.feeLabel}
              </Badge>
              {registration.status && (
                <Badge variant={registration.status.tone}>
                  {registration.status.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="mt-auto">
        <dl className="flex flex-col gap-1.5 text-caption text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt className="contents">
              <Clock aria-hidden="true" className="size-3.5" />
              <span className="sr-only">Time</span>
            </dt>
            <dd>
              {formatDay(event.startsAt)}, {formatTime(event.startsAt)} -{" "}
              {formatTime(event.endsAt)}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="contents">
              <MapPin aria-hidden="true" className="size-3.5" />
              <span className="sr-only">Venue</span>
            </dt>
            <dd className="truncate">{event.venue}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="contents">
              <Users aria-hidden="true" className="size-3.5" />
              <span className="sr-only">Attendance</span>
            </dt>
            <dd data-numeric>{registration.capacityLabel}</dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter>
        {action ?? (
          <Button
            type="button"
            size="lg"
            variant={
              registration.ctaDisabled
                ? "outline"
                : event.viewerRegistration === "NONE"
                  ? "default"
                  : "secondary"
            }
            disabled={registration.ctaDisabled}
            aria-label={registration.accessibleCtaLabel}
          >
            {registration.ctaLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
