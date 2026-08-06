import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { users } from "./users"

/**
 * Present from day one so switching from JWT to database sessions (once OAuth /
 * magic-link providers land) is a config change, not a migration. See D8.
 */
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})
