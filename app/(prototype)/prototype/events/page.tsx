import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EventCard } from "@/features/events/components/event-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import { describeRegistration } from "@/lib/domain/registration"
import { events, prototypeNow } from "@/lib/prototype/fixtures"

export const metadata = { title: "Events" }

/**
 * The event listing.
 *
 * Past and closed events are separated rather than filtered out. A student who
 * missed something wants to know it happened and who ran it, so they can follow
 * that community before the next one - deleting the past deletes that path.
 */
export default function PrototypeEventsPage() {
  const described = events.map((event) => ({
    event,
    registration: describeRegistration(event, prototypeNow),
  }))

  const open = described.filter((item) => !item.registration.isClosed)
  const closed = described.filter((item) => item.registration.isClosed)

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 8"
        title="Events"
        description="Everything you can still attend, with fee and remaining seats on the card so the click is never wasted."
        notes={[
          "Date, interest, and mode filters are not built",
          "Calendar and map views arrive after the list view is solid",
          "Registration is static - the transactional path lands in Phase 8",
        ]}
      />

      <div className="flex flex-col gap-10">
        <section aria-labelledby="open-heading" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="open-heading" className="text-h3">
              Open for registration
            </h2>
            <Badge variant="outline">{open.length}</Badge>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {open.map(({ event }) => (
              <li key={event.id} className="flex">
                <EventCard
                  event={event}
                  now={prototypeNow}
                  href="/prototype/event"
                />
              </li>
            ))}
          </ul>
        </section>

        <Separator />

        <section aria-labelledby="closed-heading" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="closed-heading" className="text-h3">
              Already happened
            </h2>
            <Badge variant="outline">{closed.length}</Badge>
          </div>
          <p className="max-w-readable text-body-sm text-muted-foreground">
            Kept visible on purpose. Missing an event is the most common reason a
            student finds a community worth following.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {closed.map(({ event }) => (
              <li key={event.id} className="flex">
                <EventCard
                  event={event}
                  now={prototypeNow}
                  href="/prototype/event"
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
