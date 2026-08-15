import { CalendarClock, Clock, MapPin, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/auth"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RegisterButton } from "@/features/events/components/register-button"
import { PageHeader } from "@/features/shell/components/page-header"
import { eventKindLabel } from "@/lib/domain/event"
import { describeRegistration, eventModeLabel } from "@/lib/domain/registration"
import { formatDay, formatTime } from "@/lib/format"
import { getEventBySlug } from "@/lib/services/events"

type Params = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug({ slug, viewerId: null })

  return { title: event?.title ?? "Event" }
}

/**
 * One event, in full.
 *
 * This is where registering happens, rather than from a card. The venue, the
 * time, the fee and who is running it are the facts a student needs before
 * committing to a seat, and a one-tap register from a list produces exactly the
 * no-shows that make capacity meaningless.
 *
 * A cancelled event still renders. The people who need this page most are the
 * ones who already registered, and 404-ing them would leave them turning up.
 */
export default async function EventPage({ params }: { params: Params }) {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const { slug } = await params
  const now = new Date()
  const nowIso = now.toISOString()

  const event = await getEventBySlug({
    slug,
    viewerId: session.user.id,
    now,
  })

  // Drafts are not published, so to everyone but the future editing screen they
  // simply do not exist.
  if (!event || event.status === "DRAFT") notFound()

  const registration = describeRegistration(event, nowIso)
  const isCancelled = event.status === "CANCELLED"
  const isFree = event.feeInPaise === null || event.feeInPaise === 0

  return (
    <>
      <PageHeader title={event.title} />

      {isCancelled && (
        <Alert variant="error">
          This event has been cancelled. If you had registered, you do not need
          to do anything - your place has been released.
        </Alert>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <p className="text-body text-muted-foreground">
            Hosted by{" "}
            <Link
              href={`/communities/${event.community.slug}`}
              className="text-primary underline underline-offset-4"
            >
              {event.community.name}
            </Link>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{eventKindLabel[event.kind]}</Badge>
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

          {event.description && (
            <p className="text-body whitespace-pre-line">{event.description}</p>
          )}

          {event.agenda.length > 0 && (
            <section aria-labelledby="agenda">
              <h2 id="agenda" className="pb-3 text-h4">
                Agenda
              </h2>
              <ol className="flex flex-col gap-2">
                {event.agenda.map((item) => (
                  <li key={`${item.at}-${item.title}`} className="flex gap-3">
                    <span
                      className="w-20 shrink-0 text-caption text-muted-foreground"
                      data-numeric
                    >
                      {formatTime(item.at)}
                    </span>
                    <span className="text-body-sm">{item.title}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <Card className="w-full lg:max-w-sm">
          <CardContent className="flex flex-col gap-4">
            <dl className="flex flex-col gap-3 text-body-sm">
              <div className="flex items-start gap-2">
                <dt className="contents">
                  <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span className="sr-only">When</span>
                </dt>
                <dd>
                  {formatDay(event.startsAt)}
                  <br />
                  {formatTime(event.startsAt)} - {formatTime(event.endsAt)}
                </dd>
              </div>

              <div className="flex items-start gap-2">
                <dt className="contents">
                  <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span className="sr-only">Where</span>
                </dt>
                <dd>{event.venue || eventModeLabel[event.mode]}</dd>
              </div>

              <div className="flex items-start gap-2">
                <dt className="contents">
                  <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span className="sr-only">Attendance</span>
                </dt>
                <dd data-numeric>
                  {registration.capacityLabel}
                  {/*
                    Shown only when somebody is actually waiting. A standing
                    "0 on the waitlist" reads as a warning about demand that
                    does not exist.
                  */}
                  {event.waitlistCount > 0 && (
                    <>
                      <br />
                      {event.waitlistCount} waiting
                    </>
                  )}
                </dd>
              </div>

              {!isCancelled && (
                <div className="flex items-start gap-2">
                  <dt className="contents">
                    <CalendarClock
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    <span className="sr-only">Registration closes</span>
                  </dt>
                  <dd>
                    Registration closes {formatDay(event.registrationClosesAt)},{" "}
                    {formatTime(event.registrationClosesAt)}
                  </dd>
                </div>
              )}
            </dl>

            {isCancelled ? (
              <p className="text-body-sm text-muted-foreground">
                Registration is closed because the event is not going ahead.
              </p>
            ) : (
              <RegisterButton event={event} now={nowIso} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
