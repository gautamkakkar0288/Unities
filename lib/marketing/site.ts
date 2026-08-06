import { env } from "@/lib/env"

/**
 * Absolute site origin, used by metadata, robots, and the sitemap.
 * Falls back to localhost so local builds and CI do not need the variable set.
 */
export const siteUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
