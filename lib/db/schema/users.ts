import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { universities } from "./universities"

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
  universityId: text("university_id").references(() => universities.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})
