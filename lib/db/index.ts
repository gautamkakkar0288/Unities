import { createDatabase } from "./driver"

/**
 * The application's database handle.
 *
 * Deliberately unchanged as an export: every service imports `db` from here,
 * and which engine backs it is `driver.ts`'s decision alone. Nothing above the
 * data layer - no service, no server action, no component - should ever need to
 * know whether this is a hosted Postgres or the local demo database.
 *
 * Never closed. The pool lives as long as the process; a script that needs to
 * terminate should open its own connection instead, the way `seed.ts` does.
 */
export const db = createDatabase()

export type { Database, DatabaseMode } from "./driver"
export { databaseMode, DEMO_DATA_DIR } from "./driver"
