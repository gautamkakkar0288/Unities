import { sql } from "drizzle-orm"
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { verificationStates } from "./enums"
import { interests } from "./interests"
import { places } from "./places"
import { users } from "./users"

/**
 * Who brought a community into existence, which decides who may run it (D26).
 *
 * `INTEREST` communities are seeded and ownerless on purpose: "Football" should
 * not belong to whoever typed it first.
 */
export const communityKinds = ["OFFICIAL", "INTEREST", "STUDENT"] as const

export type CommunityKind = (typeof communityKinds)[number]

/** Campus, then city, then interest, then everywhere (D28). */
export const communityScopes = [
  "UNIVERSITY",
  "CITY",
  "INTEREST",
  "GLOBAL",
] as const

export type CommunityScope = (typeof communityScopes)[number]

/**
 * Three levels, defaulting to open (D29). Friction at the join step is
 * invisible in the metrics and fatal to growth: a student who cannot get in
 * cannot see the events, which is the thing the product is actually measured
 * on.
 */
export const joinPolicies = ["OPEN", "APPROVAL", "INVITE"] as const

export type JoinPolicy = (typeof joinPolicies)[number]

export const communities = pgTable(
  "communities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull().default(""),
    about: text("about").notNull().default(""),
    /**
     * Ordered list of house rules. Stored as JSONB rather than a child table
     * because guidelines are always read as a whole, never queried, and never
     * referenced by anything - a table here would buy a join and nothing else.
     */
    guidelines: jsonb("guidelines")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    kind: text("kind", { enum: communityKinds }).notNull(),
    scope: text("scope", { enum: communityScopes })
      .notNull()
      .default("UNIVERSITY"),
    /** The campus or city this belongs to. Null for interest and global. */
    placeId: text("place_id").references(() => places.id, {
      onDelete: "set null",
    }),
    interestId: text("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "restrict" }),
    joinPolicy: text("join_policy", { enum: joinPolicies })
      .notNull()
      .default("OPEN"),
    verification: text("verification", { enum: verificationStates })
      .notNull()
      .default("UNVERIFIED"),
    /**
     * Denormalised. Member counts appear on every card in every list, and
     * counting membership rows per card is the query that kills the directory
     * page. Maintained transactionally alongside membership writes.
     */
    memberCount: integer("member_count").notNull().default(0),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    /** Archived rather than deleted: posts and events outlive the community. */
    archivedAt: timestamp("archived_at", { mode: "date" }),
  },
  (table) => [
    index("communities_scope_place_idx").on(table.scope, table.placeId),
    index("communities_interest_idx").on(table.interestId),
    index("communities_kind_idx").on(table.kind),
  ],
)
