import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

import { events } from "./events"
import { users } from "./users"

/**
 * What the database stores about one person's place at one event.
 *
 * The domain's `RegistrationState` has four values and only two of them are
 * storable. `NONE` is the absence of a row. `CLOSED` is a property of the
 * clock, not of the student - it is computed in `describeRegistration` and
 * writing it down would go stale the moment the event started.
 *
 * `CANCELLED` runs the other way: it exists here but not in the domain union,
 * because a student who drops out and signs up again must not collide with the
 * unique constraint, and because an organiser looking at a half-empty room
 * deserves to know whether nobody came or forty people cancelled.
 */
export const registrationStates = [
  "REGISTERED",
  "WAITLISTED",
  "CANCELLED",
] as const

export type RegistrationRecordState = (typeof registrationStates)[number]

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    state: text("state", { enum: registrationStates })
      .notNull()
      .default("REGISTERED"),
    /**
     * When the student first joined this queue. This is the waitlist ordering
     * key, so it deliberately survives promotion - a promoted student keeps
     * the timestamp that earned them the seat.
     */
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    /** Set when a waitlist entry was promoted into a confirmed seat. */
    promotedAt: timestamp("promoted_at", { mode: "date" }),
    cancelledAt: timestamp("cancelled_at", { mode: "date" }),
  },
  (table) => [
    /**
     * One row per person per event, in every state. A student cannot be
     * registered and waitlisted at once, and re-registering after cancelling
     * updates the row they already have rather than adding a second one.
     */
    uniqueIndex("event_registrations_event_user_idx").on(
      table.eventId,
      table.userId,
    ),
    /**
     * Serves both hot reads: counting confirmed seats, and finding the oldest
     * waitlist entry to promote when someone drops out.
     */
    index("event_registrations_queue_idx").on(
      table.eventId,
      table.state,
      table.createdAt,
    ),
    index("event_registrations_user_idx").on(table.userId, table.state),
  ],
)
