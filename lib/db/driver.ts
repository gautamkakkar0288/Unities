import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

/**
 * Which database the application talks to, decided in exactly one place.
 *
 * The showcase prototype needs a database a judge can run without installing
 * Postgres. The obvious route was SQLite, and it is the wrong one here: this
 * schema uses jsonb with `'[]'::jsonb` defaults, `onConflictDoNothing` with
 * conflict targets, and a `FOR UPDATE` row lock that the waitlist depends on
 * for correctness under concurrent registration. SQLite has none of those. It
 * would mean a second dialect, a second set of migrations, and a weaker
 * concurrency story - a rewrite of the data layer to avoid an install.
 *
 * PGlite is Postgres itself compiled to WASM, running in-process against a
 * directory. Same SQL, same migrations, same locking. Nothing to install,
 * nothing to start, and resetting is deleting a folder.
 *
 * The important property is that this is the only file that knows. Services
 * import `db` from `lib/db` and are written against Drizzle's Postgres API, so
 * the same query builder, the same transactions and the same `FOR UPDATE` work
 * on both. Moving to a hosted Postgres later is setting DATABASE_URL, not a
 * migration of application code.
 */

export type Database = PostgresJsDatabase<typeof schema>

export type DatabaseMode = "demo" | "postgres"

/**
 * Where the demo database lives. A directory, not a file - PGlite keeps a
 * whole Postgres data directory, so this is closer to `data/postgres` than to
 * `data/cirqles.db`.
 */
export const DEMO_DATA_DIR = process.env.CIRQLES_DEMO_DB_DIR ?? "data/cirqles-demo"

/**
 * Demo unless told otherwise.
 *
 * Defaulting the other way would mean a fresh clone with no `.env.local`
 * crashes on the first query, which is precisely the first-run experience the
 * prototype is meant to fix. An explicit `CIRQLES_DB` wins over both, so a
 * developer with a local Postgres can point at the demo database to reproduce
 * something without unsetting their connection string.
 */
export function databaseMode(): DatabaseMode {
  const explicit = process.env.CIRQLES_DB
  if (explicit === "demo" || explicit === "postgres") return explicit

  return process.env.DATABASE_URL ? "postgres" : "demo"
}

function postgresDatabase(): Database {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      "CIRQLES_DB=postgres but DATABASE_URL is not set. Set it, or unset" +
        " CIRQLES_DB to use the local demo database.",
    )
  }

  // `prepare: false` keeps this compatible with connection poolers (pgBouncer,
  // Neon/Supabase pooled endpoints) used in serverless deployments.
  const client = postgres(connectionString, { prepare: false })

  return drizzlePostgres(client, { schema })
}

/**
 * Loaded through `createRequire` rather than imported at the top of the file.
 *
 * A static import would pull the entire WASM build of Postgres into the bundle
 * of every deployment, including the ones that talk to a real database and will
 * never touch it. This keeps the demo driver's cost confined to demo mode.
 *
 * The cast is deliberate and is the one place the two drivers are reconciled.
 * Both are Drizzle Postgres databases over the same schema and the same
 * dialect; their generated types differ only in the driver's own result
 * wrapper, which nothing above the data layer refers to.
 */
function demoDatabase(): Database {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createRequire } = require("node:module") as typeof import("node:module")
  const load = createRequire(__filename)

  const { PGlite } = load("@electric-sql/pglite")
  const { drizzle: drizzlePglite } = load("drizzle-orm/pglite")

  const client = new PGlite(DEMO_DATA_DIR)

  return drizzlePglite(client, { schema }) as unknown as Database
}

export function createDatabase(): Database {
  return databaseMode() === "postgres" ? postgresDatabase() : demoDatabase()
}
