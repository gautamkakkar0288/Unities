import { defineConfig } from "drizzle-kit"

/**
 * `schema` must point at a file, not a directory.
 *
 * Given a bare directory, drizzle-kit matches nothing, builds an empty model,
 * and then reports success for both `generate` and `push` because an empty
 * model genuinely has no work to do. The failure is silent and downstream:
 * migrations are never written and tables are never created, and the first
 * error you see is `relation "places" does not exist` from the seed.
 *
 * The barrel re-exports every table, so one entry point covers the schema.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
})
