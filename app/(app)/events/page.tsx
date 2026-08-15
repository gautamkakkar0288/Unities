import { CalendarDays, CalendarX } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { EventCard } from "@/features/events/components/event-card"
import { PageHeader } from "@/features/shell/components/page-header"
import { bucketLabel, groupByBucket, isUpcoming } from "@/lib/domain/time-buckets"
import { listEvents } from "@/lib/services/events"

export const metadata: Metadata = { title: "Events" }

/**
 * Event discovery.
 *
 * A server component that calls the service and renders what comes back. No
 * Drizzle query lives here: `listEvents` decides what this viewer sees,
 * including their own registration state, and this page cannot widen it.
 *
 * Grouped by "Today", "Tomorrow", "This weekend" rather than shown as one long
 * list, because a student deciding what to attend is asking "what is on this
 * week", not "what exists". The grouping is `groupByBucket` from the domain
 * layer, computed in IST regardless of where the server runs.
 *
 * Past events are dropped rather than greyed out. They cannot be acted on, and
 * the only thing they would do here is push this week's events below the fold.
 */
export default async function EventsPage() {
  const session = await auth()
  // The (app) layout already guarantees this. Repeated because this page reads
  // the viewer's identity, and treating a missing session as "show everything"
  // would be a leak rather than a bug.
  if (!session?.user) redirect("/sign-in")

  const now = new Date()
  const nowIso = now.toISOString()

  const events = await listEvents({ viewerId: session.user.id, now })
  const upcoming = events.filter((event) => isUpcoming(event, nowIso))
  const groups = groupByBucket(upcoming, nowIso)

  return (
    <>
      <PageHeader
        title="Events"
        description="Workshops, talks, and meetups happening around you."
      />

      {upcoming.length === 0 ? (
        <EmptyState
          icon={events.length === 0 ? CalendarDays : CalendarX}
          title={
            events.length === 0
              ? "No events yet"
              : "Nothing coming up"
          }
          description={
            events.length === 0
              ? "Nothing has been published for your campus so far. If you are running this locally, seed the database first."
              : "Every event on your campus has already happened. Join a community to hear about the next one first."
          }
          action={
            <Link href="/communities" className={buttonVariants()}>
              Browse communities
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.bucket} aria-labelledby={`bucket-${group.bucket}`}>
              <h2
                id={`bucket-${group.bucket}`}
                className="pb-3 text-h4 text-muted-foreground"
              >
                {bucketLabel[group.bucket]}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.events.map((event) => (
                  <li key={event.id}>
                    <EventCard
                      event={event}
                      now={nowIso}
                      href={`/events/${event.slug}`}
                      /*
                        A link, not a register button. Registering is a decision
                        that deserves the detail page - the venue, the agenda,
                        and who is running it - and a one-tap register from a
                        card would produce exactly the no-shows that make
                        capacity meaningless.
                      */
                      action={
                        <Link
                          href={`/events/${event.slug}`}
                          className={buttonVariants({ size: "lg" })}
                        >
                          View details
                        </Link>
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
