import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

// `prepare: false` keeps this compatible with connection poolers (pgBouncer,
// Neon/Supabase pooled endpoints) used in serverless deployments.
const client = postgres(process.env.DATABASE_URL ?? "", { prepare: false })

export const db = drizzle(client, { schema })
