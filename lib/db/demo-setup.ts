import { execSync } from "node:child_process"
import { existsSync, rmSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Create or reset the local demo database.
 *
 *   npm run db:setup   # create if absent, migrate, seed
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

  console.info("\nSchema is ready.\n")

  /**
   * All three seeds, in order, as separate processes.
   *
   * `db:seed` is the day-one data a real deployment also needs - the campus,
   * the taxonomy, the interest communities. `db:seed:demo` is the showcase
   * population on top of it, and it depends on the first having run. Keeping
   * them separate is what stops demo students ending up in a real database.
   *
   * `db:seed:activity` is third because it is the only one that reads what the
   * others wrote: it attaches announcements, comments, likes and a few example
   * reports to communities, events and students that already exist. It has no
   * fixtures of its own, so running it against an unseeded database would
   * simply find nothing to attach to.
   *
   * Every stage is idempotent, so `db:setup` on an existing database tops it up
   * rather than doubling it. Only `db:reset` deletes anything.
   */
  const env = { ...process.env, CIRQLES_DB: "demo" }

  execSync("npm run db:seed", { stdio: "inherit", env })
  execSync("npm run db:seed:demo", { stdio: "inherit", env })
  execSync("npm run db:seed:activity", { stdio: "inherit", env })
}

main()
  .then(() => {
    console.info("Start the app with `npm run dev`.")
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
