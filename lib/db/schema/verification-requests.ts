import { sql } from "drizzle-orm"
import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

import { communities } from "./communities"
import { verificationRequestStatuses } from "./enums"
import { users } from "./users"

/**
 * A club asking to be recognised as real (PRD section 3, Phase 2.3).
 *
 * The request is a separate row rather than columns bolted onto `communities`
 * for the same reason a proposal is not a draft community: the evidence, the
 * reviewer, the note, and the decision timestamp are the history of one
 * decision, and a community can be asked about more than once. A rejected
 * request has to survive so a second attempt can be judged against the first,
 * and so a reviewer can be held to what they wrote.
 *
 * The verified *state* still lives on `communities.verification`, which has
 * existed since the first migration and until now was never written to. That
 * column is what every card, header, and badge already reads, so approval
 * flipping it is what makes verification visible everywhere at once. Storing
 * the state a second time here would create two sources of truth for the one
 * fact the product is most sensitive about.
 */
export const verificationRequests = pgTable(
  "verification_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    communityId: text("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    /**
     * Nullable, and `set null` rather than `cascade`: if the student who asked
     * later deletes their account, the decision an admin made must not vanish
     * with them. The audit trail outlives the requester.
     */
    requestedById: text("requested_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** What the club offered as proof. A reviewer needs something to judge. */
    evidence: text("evidence").notNull(),
    status: text("status", { enum: verificationRequestStatuses })
      .notNull()
      .default("PENDING"),
    reviewedById: text("reviewed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Why. A rejection with no reason is a rejection nobody can act on. */
    reviewerNote: text("reviewer_note"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { mode: "date" }),
  },
  (table) => [
    /**
     * One open request per community, enforced by Postgres rather than by the
     * service remembering to check. The service checks too, to return a useful
     * message - but a partial unique index is what survives two submissions
     * racing each other, which a SELECT-then-INSERT does not.
     *
     * Partial on `PENDING` so a club that was rejected can try again, and a
     * verified club's history does not block anything.
     */
    uniqueIndex("verification_requests_pending_idx")
      .on(table.communityId)
      .where(sql`${table.status} = 'PENDING'`),
    /** The reviewer's queue: oldest pending first. */
    index("verification_requests_status_idx").on(
      table.status,
      table.createdAt,
    ),
    index("verification_requests_community_idx").on(table.communityId),
  ],
)
