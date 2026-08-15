import { sql } from "drizzle-orm"
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { communities } from "./communities"
import { interests } from "./interests"
import { users } from "./users"

/**
 * What kind of thing this is. Explore is organised by these, so they are
 * product vocabulary rather than decoration.
 *
 * `TRIP` is listed because the domain union lists it and the two must agree -
 * but nothing in this phase can create one. A trip carries obligations no
 * workshop has (an emergency contact, parental consent, an itemised refund
 * policy), and those live in a `trip_details` table that is deliberately not
 * part of this slice. Until it exists, the create form does not offer `TRIP`.
 */
export const eventKinds = [
  "WORKSHOP",
  "TALK",
  "TOURNAMENT",
  "PERFORMANCE",
  "TRIP",
  "MEETUP",
  "DRIVE",
] as const

export type EventKind = (typeof eventKinds)[number]

export const eventModes = ["IN_PERSON", "ONLINE", "HYBRID"] as const

export type EventMode = (typeof eventModes)[number]

/**
 * Lifecycle, which has no domain counterpart because the prototype never saw
 * an unpublished event.
 *
 * `CANCELLED` is a status rather than a deletion. Fifty students registered
 * for a thing that is no longer happening still need to be told, and a deleted
 * row cannot notify anyone. Cancelled events keep their registrations for
 * exactly that reason.
 */
export const eventStatuses = ["DRAFT", "PUBLISHED", "CANCELLED"] as const

export type EventStatus = (typeof eventStatuses)[number]

export const events = pgTable(
  "events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    kind: text("kind", { enum: eventKinds }).notNull(),
    mode: text("mode", { enum: eventModes }).notNull().default("IN_PERSON"),
    /** Free text. A room number is not worth a places row. */
    venue: text("venue").notNull().default(""),
    status: text("status", { enum: eventStatuses }).notNull().default("DRAFT"),
    /**
     * Ordered running order. JSONB for the same reason as community
     * guidelines: always read whole, never queried, never referenced.
     */
    agenda: jsonb("agenda")
      .$type<Array<{ at: string; title: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
    /**
     * Null means "closes when the event starts", which is what
     * `describeRegistration` already assumes and what almost every event
     * wants. Storing the default explicitly on every row would mean an
     * organiser who moves the start time silently keeps a stale close time.
     */
    registrationClosesAt: timestamp("registration_closes_at", { mode: "date" }),
    /** Null means unlimited seats, matching `EventSummary.capacity`. */
    capacity: integer("capacity"),
    /**
     * Denormalised, and counts confirmed registrations only - never waitlist
     * entries. Every card in every list shows it, and the seat maths in
     * `describeRegistration` compares it against capacity, so it has to be
     * cheap. Maintained transactionally alongside registration writes, the
     * same way `communities.memberCount` is.
     */
    registeredCount: integer("registered_count").notNull().default(0),
    /**
     * Integer paise, null for free. Recorded so a listing can say what a thing
     * costs; nothing in the platform collects it. Payments are explicitly out
     * of scope until the core product works, and a fee field is not a payment
     * system - no screen may imply money has changed hands.
     */
    feeInPaise: integer("fee_in_paise"),
    communityId: text("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    interestId: text("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "restrict" }),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    cancelledAt: timestamp("cancelled_at", { mode: "date" }),
  },
  (table) => [
    /** The discovery query: published events, soonest first. */
    index("events_status_starts_idx").on(table.status, table.startsAt),
    index("events_community_starts_idx").on(table.communityId, table.startsAt),
    index("events_interest_idx").on(table.interestId),
  ],
)
