import { execSync } from "node:child_process"
import { existsSync, rmSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Create or reset the local demo database.
 *
 *   npm run db:setup   # create it if it is not there, then seed
 *   npm run db:reset   # throw it away and rebuild from scratch
 *
 * This is a wrapper, not a second migration system. It applies the same
 * migrations in `drizzle/` that a real Postgres gets, through the same Drizzle
 * migrator, because the demo database *is* Postgres - see `driver.ts`. If this
 * script and a production deployment ever disagree about the schema, that is a
 * bug in this script.
 *
 * Run with `--reset` to delete the data directory first. Destructive, and only
 * ever to a directory under `data/`, which is gitignored.
 */

const RESET = process.argv.includes("--reset")

async function main() {
  // Imported here rather than at the top so the script fails with the message
  // below instead of an unresolved-module stack trace on a fresh clone.
  let PGlite: typeof import("@electric-sql/pglite").PGlite
  try {
    ;({ PGlite } = await import("@electric-sql/pglite"))
  } catch {
    throw new Error(
      "@electric-sql/pglite is not installed. Run `npm install` first.",
    )
  }

  const { drizzle } = await import("drizzle-orm/pglite")
  const { migrate } = await import("drizzle-orm/pglite/migrator")

  const { DEMO_DATA_DIR } = await import("./driver")
  const schema = await import("./schema")

  const dataDir = resolve(process.cwd(), DEMO_DATA_DIR)

  if (RESET && existsSync(dataDir)) {
    console.info(`Removing ${DEMO_DATA_DIR}...`)
    rmSync(dataDir, { recursive: true, force: true })
  }

  console.info(`Starting the demo database in ${DEMO_DATA_DIR}...`)
  const client = new PGlite(dataDir)
  const db = drizzle(client, { schema })

  console.info("Applying migrations from drizzle/...")
  await migrate(db, { migrationsFolder: "drizzle" })

  await client.close()

  console.info("\nSchema is ready. Seeding...\n")

  // The seed is a separate process on purpose: it must run identically against
  // the demo database and against a real one, so it is not special-cased here.
  execSync("npm run db:seed", {
    stdio: "inherit",
    env: { ...process.env, CIRQLES_DB: "demo" },
  })
}

main()
  .then(() => {
    console.info("\nDone. Start the app with `npm run dev`.")
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
