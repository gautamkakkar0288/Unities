import { Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/auth"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { CancelEventButton } from "@/features/events/components/cancel-event-button"
import { PageHeader } from "@/features/shell/components/page-header"
import { formatDay, formatTime } from "@/lib/format"
import { getEventBySlug, listRegistrations } from "@/lib/services/events"

export const metadata: Metadata = { title: "Manage event" }

/**
 * The organiser's view of one event.
 *
 * Who is coming, who is waiting, and the ability to call it off. The attendee
 * list comes from the service, which refuses anyone who is not running this
 * community - and returns names without email addresses, so this screen cannot
 * be turned into a mailing list by reading it.
 */
export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const { slug } = await params
  const event = await getEventBySlug({ slug, viewerId: session.user.id })

  if (!event) notFound()

  const registrations = await listRegistrations({
    organiserId: session.user.id,
    eventId: event.id,
  })

  // The service decides who may see this. A refusal renders as nothing here
  // rather than as an explanation, for the same reason as the create screen.
  if (!registrations.ok) notFound()

  const going = registrations.data.filter(
    (entry) => entry.state === "REGISTERED",
  )
  const waiting = registrations.data.filter(
    (entry) => entry.state === "WAITLISTED",
  )

  return (
    <>
      <PageHeader
        title={event.title}
        description={`${formatDay(event.startsAt)}, ${formatTime(event.startsAt)}`}
        action={
          <Link
            href={`/events/${event.slug}`}
            className={buttonVariants({ variant: "outline" })}
          >
            View as a student
          </Link>
        }
      />

      {event.status === "CANCELLED" && (
        <Alert variant="error">
          This event is cancelled. The list below is kept so you can tell the
          people who had registered.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Going ({going.length}
                {event.capacity === null ? "" : ` of ${event.capacity}`})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {going.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Nobody yet"
                  description="Registrations will appear here as students sign up."
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {going.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="truncate text-body-sm">
                        {entry.person?.name ?? "A student"}
                      </span>
                      <span className="shrink-0 text-caption text-muted-foreground">
                        {formatDay(entry.registeredAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/*
            Shown only when somebody is actually waiting, and in queue order.
            The order is the promise: when a seat is freed, the top of this list
            is who gets it, automatically.
          */}
          {waiting.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Waiting ({waiting.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="flex flex-col gap-2">
                  {waiting.map((entry, index) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="truncate text-body-sm">
                        <span
                          className="mr-2 text-muted-foreground"
                          data-numeric
                        >
                          {index + 1}
                        </span>
                        {entry.person?.name ?? "A student"}
                      </span>
                      <Badge variant="neutral">Waitlisted</Badge>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        {event.status !== "CANCELLED" && (
          <aside aria-label="Event controls">
            <Card>
              <CardHeader>
                <CardTitle>Calling it off</CardTitle>
              </CardHeader>
              <CardContent>
                <CancelEventButton
                  eventId={event.id}
                  slug={event.slug}
                  attendeeCount={going.length}
                />
              </CardContent>
            </Card>
          </aside>
        )}
      </div>
    </>
  )
}
