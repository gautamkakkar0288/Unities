import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

import { users } from "./users"

/**
 * Where to reach one installation of the app.
 *
 * Nothing sends to these yet. There is no FCM credential, no APNs key and no
 * queue in this project, and writing a sender against infrastructure that does
 * not exist would produce code that has never once delivered a notification.
 * What this table does is settle the contract, so the client can register on
 * first launch and the day push is wired up there is already a population of
 * devices to send to.
 *
 * The unique constraint is on the token alone, not on the pair with a user.
 * A push token identifies an app installation, not a person: when a student
 * signs out of a shared phone and someone else signs in, the same token must
 * move to the new account rather than existing twice. Keying on the pair would
 * leave the previous student silently subscribed to alerts on a handset they no
 * longer hold, which is the worst outcome available.
 *
 * `lastUsedAt` exists so dead tokens can eventually be pruned. Push providers
 * reject stale tokens rather than reporting them, so the only way to find them
 * is to notice one that has not been seen for months.
 */

export const devicePlatforms = ["ANDROID", "IOS"] as const

export type DevicePlatform = (typeof devicePlatforms)[number]

export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /**
     * The provider's token. Long, opaque, and never returned to a client -
     * it is a capability to interrupt somebody's phone.
     */
    token: text("token").notNull(),
    platform: text("platform", { enum: devicePlatforms }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    /** Last time the app announced this token. Null until it re-registers. */
    lastUsedAt: timestamp("last_used_at", { mode: "date" }),
  },
  (table) => [
    uniqueIndex("device_tokens_token_idx").on(table.token),
    /** Every send starts from "which devices does this student have". */
    index("device_tokens_user_idx").on(table.userId),
  ],
)
