import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { communities, communityScopes } from "./communities"
import { reviewStatuses } from "./enums"
import { interests } from "./interests"
import { places } from "./places"
import { users } from "./users"

/**
 * The student request flow (D26).
 *
 * A proposal is not a draft community. It has no members, no slug, and no
 * posts, and approving one *creates* a community rather than flipping a status
 * column - which is why `createdCommunityId` is a separate nullable reference
 * rather than the proposal row growing into the community row. Keeping them
 * apart means a rejected proposal never has to be hidden from twelve queries.
 *
 * `normalisedName` exists so the duplicate check is a cheap indexed lookup at
 * submit time, not a reviewer noticing three days later. Most duplicates are a
 * failed search, and a student shown "Football already exists, 214 members"
 * usually joins it.
 */
export const communityProposals = pgTable(
  "community_proposals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    proposedName: text("proposed_name").notNull(),
    /** Lowercased, stripped of noise words. Matches `nameTokens` in lib/domain/community.ts. */
    normalisedName: text("normalised_name").notNull(),
    tagline: text("tagline").notNull().default(""),
    reason: text("reason").notNull().default(""),
    interestId: text("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "restrict" }),
    scope: text("scope", { enum: communityScopes })
      .notNull()
      .default("UNIVERSITY"),
    placeId: text("place_id").references(() => places.id, {
      onDelete: "set null",
    }),
    proposedById: text("proposed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: reviewStatuses }).notNull().default("PENDING"),
    /** Denormalised count of supporters; the join table is the source of truth. */
    supporterCount: integer("supporter_count").notNull().default(1),
    reviewedById: text("reviewed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewerNote: text("reviewer_note"),
    /** Set when the answer was "this already exists". */
    mergedIntoCommunityId: text("merged_into_community_id").references(
      () => communities.id,
      { onDelete: "set null" },
    ),
    /** Set when approval created a real community. */
    createdCommunityId: text("created_community_id").references(
      () => communities.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { mode: "date" }),
  },
  (table) => [
    index("community_proposals_status_idx").on(table.status, table.createdAt),
    index("community_proposals_normalised_idx").on(table.normalisedName),
  ],
)

/**
 * "I want this too." Demand, not a vote - the reviewer decides, but forty
 * supporters is a fact worth showing them.
 */
export const communityProposalSupporters = pgTable(
  "community_proposal_supporters",
  {
    proposalId: text("proposal_id")
      .notNull()
      .references(() => communityProposals.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.proposalId, table.userId] })],
)
