import { z } from "zod"

import { eventKinds, eventModes } from "@/lib/db/schema"

/**
 * Validation for event input.
 *
 * Timestamps are validated with `Date.parse` rather than a format helper so
 * that the accepted set is exactly what the domain layer can read - a string
 * that passes here and throws in `refuseEventTiming` would be a validator that
 * lies.
 */
const timestamp = z
  .string()
  .trim()
  .min(1, "Pick a date and time.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "That is not a date.")

export const createEventSchema = z.object({
  communitySlug: z.string().trim().min(1),
  title: z
    .string()
    .trim()
    .min(4, "Give the event a title students will recognise.")
    .max(120, "Titles have to be under 120 characters."),
  description: z
    .string()
    .trim()
    .max(4000, "That description is too long.")
    .default(""),
  kind: z.enum(eventKinds),
  mode: z.enum(eventModes),
  venue: z.string().trim().max(200).default(""),
  startsAt: timestamp,
  endsAt: timestamp,
  registrationClosesAt: timestamp.nullable().default(null),
  /** Null means unlimited. Zero seats is a mistake, not an event. */
  capacity: z
    .number()
    .int()
    .positive("An event with no seats cannot be registered for.")
    .max(100000)
    .nullable()
    .default(null),
  /** Integer paise. Recorded for display only; nothing collects it. */
  feeInPaise: z.number().int().nonnegative().max(10000000).nullable().default(null),
})

export type CreateEventInput = z.infer<typeof createEventSchema>

export const cancelEventSchema = z.object({
  eventId: z.string().trim().min(1),
  reason: z.string().trim().max(500).default(""),
})

export type CancelEventInput = z.infer<typeof cancelEventSchema>

/**
 * What the create form holds, which is not what the service takes.
 *
 * Every field is a string here because that is what an input element produces.
 * The conversions - local time to an absolute instant, rupees to paise, blank
 * to null - happen in the browser through `lib/domain/event-input`, and the
 * result is validated again by `createEventSchema` on the server. Two schemas
 * rather than one shared schema with transforms, because the form needs to
 * report "that is not a whole number" against a specific field while the
 * service needs to refuse a value regardless of which form produced it.
 */
const localDateTime = z
  .string()
  .trim()
  .min(1, "Pick a date and time.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "That is not a date.")

export const createEventFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Give the event a title students will recognise.")
    .max(120, "Titles have to be under 120 characters."),
  description: z.string().trim().max(4000, "That description is too long."),
  kind: z.enum(eventKinds),
  mode: z.enum(eventModes),
  venue: z.string().trim().max(200, "That venue is too long."),
  startsAt: localDateTime,
  endsAt: localDateTime,
  /** Blank is allowed: it means "closes when the event starts". */
  registrationClosesAt: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || !Number.isNaN(Date.parse(value)),
      "That is not a date.",
    ),
  /** Blank is allowed: it means unlimited. */
  capacity: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d+$/.test(value),
      "Seats have to be a whole number.",
    )
    .refine(
      (value) => value !== "0",
      "An event with no seats cannot be registered for. Leave it blank for no limit.",
    ),
  /** Blank is allowed: it means free. */
  feeInRupees: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d+(\.\d{1,2})?$/.test(value),
      "Enter an amount in rupees, like 150 or 99.50.",
    ),
})

export type CreateEventFormInput = z.infer<typeof createEventFormSchema>
