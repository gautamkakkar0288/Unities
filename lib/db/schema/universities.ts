import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Tenant root. Modelled explicitly from day one per
 * docs/ENGINEERING/DATABASE.md so multi-university scaling is additive.
 */
export const universities = pgTable("universities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: ["ACTIVE", "PENDING", "SUSPENDED"] })
    .notNull()
    .default("PENDING"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})
