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
