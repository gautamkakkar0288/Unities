-- Device tokens for the mobile client.
--
-- Written by hand rather than by `drizzle-kit generate`, because the tooling
-- could not be run in the environment where this change was made and a journal
-- entry without its matching snapshot would corrupt future generations. This
-- file is therefore NOT listed in drizzle/meta/_journal.json and `npm run
-- db:migrate` will not pick it up.
--
-- Two safe ways to apply it:
--   1. `npm run db:generate` - drizzle diffs lib/db/schema against snapshot
--      0002, writes its own migration plus snapshot, and this file can then be
--      deleted as a duplicate.
--   2. Run this file directly against the database. It is idempotent.

CREATE TABLE IF NOT EXISTS "device_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"platform" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "device_tokens_token_idx" ON "device_tokens" USING btree ("token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_tokens_user_idx" ON "device_tokens" USING btree ("user_id");
