import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { places } from "./places"

export const userRoles = [
  "STUDENT",
  "ORGANIZER",
  "COMMUNITY_MODERATOR",
  "UNIVERSITY_ADMIN",
  "PLATFORM_ADMIN",
] as const

export type UserRole = (typeof userRoles)[number]

/**
 * Auth.js adapter-compatible users table, extended with the role and tenant
 * columns defined in docs/ENGINEERING/DATABASE.md.
 *
 * `universityId` now points at `places` rather than the removed `universities`
 * table. The column keeps its name because a user belongs to a campus, not to
 * an arbitrary place; the application only ever writes a place of kind
 * `UNIVERSITY` here. Postgres cannot express that constraint across a foreign
 * key without a trigger, so it is enforced at the single write site during
 * registration rather than scattered through the codebase.
 */
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role", { enum: userRoles }).notNull().default("STUDENT"),
  universityId: text("university_id").references(() => places.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})
