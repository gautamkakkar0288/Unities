import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { communities } from "./communities"
import { interests } from "./interests"
import { places } from "./places"
import { users } from "./users"

/**
 * Opportunities - internships, competitions, scholarships, volunteering.
 *
 * The PRD's promise is "discovers opportunities, communities, events, and
 * activities", and this is the noun with no table behind it. It is not an
 * event: it has a deadline rather than a start time, nobody registers through
 * Cirqles, and it usually lives on someone else's website.
 *
 * Which is the honest limit of this table. It is a listing that points
 * elsewhere, so it carries `url` and no application flow. Pretending otherwise
 * would mean tracking applications the platform cannot see the outcome of.
 */
export const opportunityKinds = [
  "INTERNSHIP",
  "COMPETITION",
  "VOLUNTEERING",
  "SCHOLARSHIP",
  "CAMPUS",
  "STARTUP",
] as const

export type OpportunityKind = (typeof opportunityKinds)[number]

export const opportunities = pgTable(
  "opportunities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    kind: text("kind", { enum: opportunityKinds }).notNull(),
    /**
     * Categorised by the same seventeen interests as everything else, so one
     * interest choice at onboarding ranks events, communities and
     * opportunities together instead of three separate taxonomies.
     */
    interestId: text("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "restrict" }),
    /** Where to actually apply. This is a signpost, not an application form. */
    url: text("url").notNull().default(""),
    /** Null means rolling. */
    deadline: timestamp("deadline", { mode: "date" }),
    /**
     * Both optional, and they mean different things. A community means a club
     * is offering it; a place scopes it to one campus or city. A national
     * competition has neither, and is still worth listing.
     */
    communityId: text("community_id").references(() => communities.id, {
      onDelete: "cascade",
    }),
    placeId: text("place_id").references(() => places.id, {
      onDelete: "set null",
    }),
    postedById: text("posted_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    /** Same reasoning as posts: removal is reviewable, deletion is not. */
    removedAt: timestamp("removed_at", { mode: "date" }),
  },
  (table) => [
    /** Discovery: open opportunities, closest deadline first. */
    index("opportunities_deadline_idx").on(table.deadline),
    index("opportunities_interest_idx").on(table.interestId),
    index("opportunities_community_idx").on(table.communityId),
  ],
)
