import { z } from "zod"

import { createEventFormSchema, createEventSchema } from "@/lib/schemas/event"

/**
 * Validation for editing an event that already exists.
 *
 * Derived from the create schemas rather than restated. A second copy of
 * "titles are under 120 characters" is a copy that eventually disagrees with
 * the first, and the disagreement would show up as a title that can be created
 * but not edited.
 *
 * `communitySlug` is dropped because an event does not move between
 * communities: the registration list belongs to the club that took it, and
 * reassigning it would hand one club's attendees to another.
 *
 * `kind` is dropped for two reasons. A workshop turning into a tournament is a
 * different event rather than an edited one, and an editable kind would be a
 * way to reach TRIP, which `createEvent` refuses on purpose because nothing can
 * yet collect an emergency contact or a refund policy.
 */
export const updateEventSchema = createEventSchema
  .omit({ communitySlug: true, kind: true })
  .extend({
    eventId: z.string().trim().min(1),
  })

export type UpdateEventInput = z.infer<typeof updateEventSchema>

/**
 * What the edit form holds: the create form without the kind selector.
 *
 * Every field is a string, as it comes out of an input element, and the
 * conversions back to instants and paise are the same ones the create form
 * uses.
 */
export const editEventFormSchema = createEventFormSchema.omit({ kind: true })

export type EditEventFormInput = z.infer<typeof editEventFormSchema>
