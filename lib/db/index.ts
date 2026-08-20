import type { Database } from "./driver"
import { createDatabase } from "./driver"

const globalForDb = globalThis as unknown as {
  db: Database | undefined
}

export const db = globalForDb.db ?? createDatabase()

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db
}

export type { Database, DatabaseMode } from "./driver"
export { databaseMode, DEMO_DATA_DIR } from "./driver"
