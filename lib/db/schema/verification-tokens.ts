import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

/** Auth.js adapter table — used by email verification and magic links. */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
)
