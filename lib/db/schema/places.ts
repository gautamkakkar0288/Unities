import {
  type AnyPgColumn,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

/**
 * Universities and cities in one table.
 *
 * This replaces the Phase 2 `universities` table. A city is not a tenant, but
 * it is a discovery scope in exactly the same way a campus is - a Chitkara
 * student sees Chitkara, then Tricity, then their interests (D28). Two tables
 * would mean every scope-aware query is a union, and every join needs to know
 * which of the two it is joining to.
 *
 * `parentPlaceId` is what makes the hierarchy real rather than implied:
 * Chitkara's parent is Tricity, so "events near me" walks one edge instead of
 * consulting a hardcoded map. It is self-referencing, hence `AnyPgColumn` -
 * Drizzle cannot infer the type of a table that is still being defined.
 *
 * The second university is a row, not a migration. That is the entire point.
 */
export const placeKinds = ["UNIVERSITY", "CITY"] as const

export type PlaceKind = (typeof placeKinds)[number]

export const placeStatuses = ["ACTIVE", "PENDING", "SUSPENDED"] as const

export type PlaceStatus = (typeof placeStatuses)[number]

export const places = pgTable(
  "places",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    kind: text("kind", { enum: placeKinds }).notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    status: text("status", { enum: placeStatuses })
      .notNull()
      .default("PENDING"),
    /** A campus sits inside a city. A city sits inside nothing, for now. */
    parentPlaceId: text("parent_place_id").references(
      (): AnyPgColumn => places.id,
      { onDelete: "set null" },
    ),
    /**
     * The email domain that proves someone studies here, e.g.
     * `chitkara.edu.in`. Null for cities, which nobody is a member of by
     * virtue of an inbox.
     */
    emailDomain: text("email_domain"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("places_kind_idx").on(table.kind),
    index("places_parent_idx").on(table.parentPlaceId),
  ],
)
