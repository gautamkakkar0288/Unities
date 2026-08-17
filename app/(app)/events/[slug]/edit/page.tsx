import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/auth"
import { Alert } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { EditEventForm } from "@/features/events/components/edit-event-form"
import { PageHeader } from "@/features/shell/components/page-header"
import { eventKindLabel } from "@/lib/domain/event"
import { editRefusalMessage, refuseEventEdit } from "@/lib/domain/event-edit"
import { getEventForEdit } from "@/lib/services/event-editing"

export const metadata: Metadata = { title: "Edit event" }

/**
 * Correcting a published event.
 *
 * Three outcomes, decided here rather than by showing a form that cannot save.
 * A cancelled or finished event says so; a community that has lost its
 * verification says that instead; otherwise the form.
 *
 * None of this is the protection. `updateEventAction` is a public endpoint and
 * asks the service the same questions again. This only avoids wasting the
 * organiser's time filling in a form whose answer is already no.
 */
export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const { slug } = await params
  const result = await getEventForEdit({ actorId: session.user.id, slug })

  // The service decides who may see this. A refusal renders as nothing rather
  // than as an explanation, the same way the manage screen handles it.
  if (!result.ok) notFound()

  const event = result.data

  // Asked with the capacity unchanged, so this reports only the reasons the
  // event itself cannot be edited - not a capacity the organiser has not
  // proposed yet.
  const refusal = refuseEventEdit({
    status: event.status,
    startsAt: event.startsAt,
    registeredCount: event.registeredCount,
    nextCapacity: event.capacity,
    now: new Date().toISOString(),
  })

  return (
    <>
      <PageHeader
        title={`Edit ${event.title}`}
        description="Students who have already registered keep their places."
        action={
          <Link
            href={`/events/${event.slug}/manage`}
            className={buttonVariants({ variant: "outline" })}
          >
            Back to the event
          </Link>
        }
      />

      {refusal ? (
        <Alert variant="warning" title="This event cannot be changed">
          {editRefusalMessage[refusal]}
        </Alert>
      ) : !event.communityVerified ? (
        <Alert variant="warning" title="This community is not verified">
          Events can only be changed while the community running them is
          verified. Ask for verification from the community page, and this event
          stays exactly as it is in the meantime.
        </Alert>
      ) : (
        <EditEventForm
          eventId={event.id}
          slug={event.slug}
          kindLabel={eventKindLabel[event.kind]}
          waitlistCount={event.waitlistCount}
          event={{
            title: event.title,
            description: event.description,
            mode: event.mode,
            venue: event.venue,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            registrationClosesAt: event.registrationClosesAt,
            capacity: event.capacity,
            feeInPaise: event.feeInPaise,
          }}
        />
      )}
    </>
  )
}
