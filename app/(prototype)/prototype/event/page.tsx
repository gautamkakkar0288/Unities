import {
  ArrowLeft,
  CalendarDays,
  IndianRupee,
  MapPin,
  Users,
} from "lucide-react"
import Link from "next/link"

import { VerificationBadge } from "@/components/domain/verification-badge"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import { describeRegistration, eventModeLabel } from "@/lib/domain/registration"
import { lineFollowerDetail, prototypeNow } from "@/lib/prototype/fixtures"
import { formatDay, formatTime, formatTimeRange } from "@/lib/format"

export const metadata = { title: "Event detail" }

/**
 * A single event.
 *
 * The registration panel is sticky on desktop and sits directly under the title
 * on mobile. Registration is the only thing this page is for, so it must never
 * require scrolling to find - a detail page that hides its own call to action is
 * a brochure.
 *
 * Seats are shown as a bar and a number. The bar is scanned, the number is
 * trusted, and the bar alone would be meaningless to a screen reader.
 */
export default function PrototypeEventPage() {
  const event = lineFollowerDetail
  const registration = describeRegistration(event, prototypeNow)
  const filledPercent =
    event.capacity === null
      ? 0
      : Math.min(100, Math.round((event.registeredCount / event.capacity) * 100))

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 8"
        title="Event detail"
        description="Agenda, organisers, venue, and the registration panel that decides whether a student turns up."
        notes={[
          "Register does not submit - capacity and waitlist logic lands in Phase 8",
          "Add to calendar, share, and map links are placeholders",
          "Attendee list is a preview; the full list needs privacy rules",
        ]}
      />

      <div className="flex flex-col gap-6">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          render={<Link href="/prototype/events" />}
        >
          <ArrowLeft aria-hidden="true" />
          All events
        </Button>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{eventModeLabel[event.mode]}</Badge>
                <Badge variant="outline">{event.interest.label}</Badge>
                <Badge
                  variant={event.feeInPaise === null ? "success" : "neutral"}
                >
                  {registration.feeLabel}
                </Badge>
                {registration.status && (
                  <Badge variant={registration.status.tone}>
                    {registration.status.label}
                  </Badge>
                )}
              </div>
              <h2 className="text-h1">{event.title}</h2>
              <p className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
                <Link
                  href="/prototype/community"
                  className="rounded-sm font-medium hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {event.community.name}
                </Link>
                <VerificationBadge state={event.community.verification} />
              </p>
            </header>

            <section aria-labelledby="about-event-heading" className="flex flex-col gap-3">
              <h3 id="about-event-heading" className="text-h3">
                What this is
              </h3>
              <p className="max-w-readable text-body-sm whitespace-pre-line">
                {event.description}
              </p>
            </section>

            <Separator />

            <section aria-labelledby="agenda-heading" className="flex flex-col gap-4">
              <h3 id="agenda-heading" className="text-h3">
                Agenda
              </h3>
              <ol className="flex flex-col">
                {event.agenda.map((item, index) => (
                  <li
                    key={item.title}
                    className="flex gap-4 border-l border-border pb-4 pl-4 last:pb-0"
                  >
                    <span
                      className="w-20 shrink-0 text-caption font-medium text-primary"
                      data-numeric
                    >
                      {formatTime(item.at)}
                    </span>
                    <span className="text-body-sm">
                      {item.title}
                      {index === 0 && (
                        <span className="ml-2 text-caption text-muted-foreground">
                          Doors open 15 minutes early
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <Separator />

            <section aria-labelledby="organisers-heading" className="flex flex-col gap-4">
              <h3 id="organisers-heading" className="text-h3">
                Organised by
              </h3>
              <ul className="flex flex-col gap-3">
                {event.organisers.map((organiser) => (
                  <li key={organiser.id} className="flex items-center gap-3">
                    <Avatar
                      name={organiser.name}
                      src={organiser.avatarUrl}
                      size="sm"
                    />
                    <div className="flex min-w-0 flex-col">
                      <Link
                        href="/prototype/profile"
                        className="truncate rounded-sm text-body-sm font-medium hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {organiser.name}
                      </Link>
                      <span className="text-caption text-muted-foreground">
                        {organiser.programme}
                      </span>
                    </div>
                    <Badge
                      variant={roleBadgeVariant[organiser.role]}
                      className="ml-auto"
                    >
                      {roleLabels[organiser.role]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside aria-label="Registration" className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader className="gap-1">
                <CardTitle>Registration</CardTitle>
                <p className="text-caption text-muted-foreground">
                  Closes {formatDay(event.registrationClosesAt)},{" "}
                  {formatTime(event.registrationClosesAt)}
                </p>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <dl className="flex flex-col gap-3 text-body-sm">
                  <div className="flex items-start gap-2">
                    <dt className="contents">
                      <CalendarDays
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="sr-only">When</span>
                    </dt>
                    <dd>{formatTimeRange(event.startsAt, event.endsAt)}</dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <dt className="contents">
                      <MapPin
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="sr-only">Where</span>
                    </dt>
                    <dd>{event.venue}</dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <dt className="contents">
                      <IndianRupee
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="sr-only">Fee</span>
                    </dt>
                    <dd>{registration.feeLabel}</dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <dt className="contents">
                      <Users
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="sr-only">Seats</span>
                    </dt>
                    <dd data-numeric>{registration.capacityLabel}</dd>
                  </div>
                </dl>

                {event.capacity !== null && (
                  <div className="flex flex-col gap-1.5">
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${filledPercent}%` }}
                      />
                    </div>
                    <p className="text-caption text-muted-foreground">
                      {registration.isNearlyFull
                        ? "Almost full. Cancel early if your plans change so a waitlisted student gets in."
                        : `${filledPercent}% of seats taken.`}
                    </p>
                  </div>
                )}

                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={registration.ctaDisabled}
                  aria-label={registration.accessibleCtaLabel}
                  render={
                    registration.ctaDisabled ? undefined : (
                      <Link href="/prototype/event/register" />
                    )
                  }
                >
                  {registration.ctaLabel}
                </Button>

                <Button type="button" variant="outline" size="lg" className="w-full">
                  Add to calendar
                </Button>

                <div className="flex flex-col gap-2">
                  <p className="text-caption text-muted-foreground">
                    People you know going
                  </p>
                  <ul className="flex flex-wrap items-center gap-1">
                    {event.attendeePreview.map((attendee) => (
                      <li key={attendee.id}>
                        <Avatar
                          size="xs"
                          name={attendee.name}
                          src={attendee.avatarUrl}
                        />
                      </li>
                    ))}
                    <li className="ml-1 text-caption text-muted-foreground">
                      and {event.registeredCount - event.attendeePreview.length}{" "}
                      others
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
