import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { reviewStatuses } from "./enums"
import { users } from "./users"

/**
 * The interest taxonomy (D27).
 *
 * Interests are rows with stable IDs, never a string column on the user and
 * never free text. Free text produces `Coding`, `coding`, `DSA`, `Leetcode`,
 * and `Competitive Programming` as five categories inside a month, and the
 * damage is invisible: nothing errors, recommendations just quietly stop
 * working because the population is split five ways.
 *
 * `RETIRED` rather than deletion, because an interest with communities and
 * events attached cannot be removed without orphaning them.
 */
export const interestStatuses = ["ACTIVE", "RETIRED"] as const

export type InterestStatus = (typeof interestStatuses)[number]

export const interests = pgTable("interests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  /** Display order in the picker. Curated, not alphabetical. */
  sortOrder: integer("sort_order").notNull().default(0),
  status: text("status", { enum: interestStatuses })
    .notNull()
    .default("ACTIVE"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})

/** Which interests a student picked at onboarding, and can change later. */
export const userInterests = pgTable(
  "user_interests",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    interestId: text("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.interestId] }),
    index("user_interests_interest_idx").on(table.interestId),
  ],
)

/**
 * A student asking for an interest that does not exist yet.
 *
 * `normalisedLabel` is unique, so "Padel", "padel", and "PADEL " collapse into
 * one row whose demand count rises. Without normalisation the queue fills with
 * the same word in five casings and the reviewer cannot see that forty people
 * asked for the same thing.
 *
 * `mapsToInterestId` records "this is the existing Coding interest" without
 * discarding the signal that a student went looking under another name - that
 * is search-synonym data the product will want later.
 */
export const interestSuggestions = pgTable(
  "interest_suggestions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    label: text("label").notNull(),
    normalisedLabel: text("normalised_label").notNull(),
    suggestedById: text("suggested_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /**
     * Denormalised count of `interest_suggestion_supporters`, kept because the
     * reviewer queue sorts by it on every page load and a count(*) per row does
     * not survive a real queue. The supporters table remains the source of
     * truth, so it can be recomputed if it ever drifts.
     */
    demandCount: integer("demand_count").notNull().default(1),
    status: text("status", { enum: reviewStatuses }).notNull().default("PENDING"),
    /** Set when a reviewer says "we already call this something else". */
    mapsToInterestId: text("maps_to_interest_id").references(
      () => interests.id,
      { onDelete: "set null" },
    ),
    /** Set when the suggestion was promoted into a real interest. */
    promotedInterestId: text("promoted_interest_id").references(
      () => interests.id,
      { onDelete: "set null" },
    ),
    reviewedById: text("reviewed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewerNote: text("reviewer_note"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { mode: "date" }),
  },
  (table) => [
    uniqueIndex("interest_suggestions_normalised_idx").on(table.normalisedLabel),
    index("interest_suggestions_status_idx").on(table.status, table.demandCount),
  ],
)

/** One row per student who asked, so demand cannot be inflated by refreshing. */
export const interestSuggestionSupporters = pgTable(
  "interest_suggestion_supporters",
  {
    suggestionId: text("suggestion_id")
      .notNull()
      .references(() => interestSuggestions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.suggestionId, table.userId] })],
)
