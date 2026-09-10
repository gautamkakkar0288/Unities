import type { getEventBySlug, listEvents } from "@/lib/services/events"

import type { EventRecordStatus } from "../projections"

type EventListItem = Awaited<ReturnType<typeof listEvents>>[number]
type EventDetail = NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>

/**
 * Events on the wire.
 *
 * Two shapes are emitted for the same relationship: the nested `community`
 * object the services produce, and a flat `communityId`. That is not
 * redundancy for its own sake - the mobile models were written against flat
 * identifiers, and the nested object is what a card needs to render a name and
 * a verification badge without a second request. Emitting both keeps a typed
 * client working without a rewrite on either side, and neither field is
 * derived from anything the client sent.
 *
 * `viewerRegistrationState` is likewise the mobile name for the service's
 * `viewerRegistration`. Both are sent; both are computed for the authenticated
 * viewer only.
 */

function registrationFields(event: { viewerRegistration: string }) {
  return {
    viewerRegistration: event.viewerRegistration,
    viewerRegistrationState: event.viewerRegistration,
  }
}

export function serializeEventSummary(
  event: EventListItem,
  status: EventRecordStatus | undefined,
) {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    kind: event.kind,
    mode: event.mode,
    // Read separately from the events table. Omitting it would let a cancelled
    // event render as if it were still happening.
    status: status ?? null,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    venue: event.venue,
    capacity: event.capacity,
    registeredCount: event.registeredCount,
    feeInPaise: event.feeInPaise,
    community: event.community,
    communityId: event.community.id,
    interest: event.interest,
    interestId: event.interest.id,
    ...registrationFields(event),
  }
}

export function serializeEventDetail(event: EventDetail) {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    kind: event.kind,
    mode: event.mode,
    status: event.status,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    registrationClosesAt: event.registrationClosesAt,
    venue: event.venue,
    capacity: event.capacity,
    registeredCount: event.registeredCount,
    waitlistCount: event.waitlistCount,
    feeInPaise: event.feeInPaise,
    agenda: event.agenda,
    community: event.community,
    communityId: event.community.id,
    interest: event.interest,
    interestId: event.interest.id,
    ...registrationFields(event),
  }
}
