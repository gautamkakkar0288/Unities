CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"target_kind" text NOT NULL,
	"target_id" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"community_id" text NOT NULL,
	"requested_by_id" text,
	"evidence" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"reviewed_by_id" text,
	"reviewer_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"decided_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_target_idx" ON "audit_log" USING btree ("target_kind","target_id");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_requests_pending_idx" ON "verification_requests" USING btree ("community_id") WHERE "verification_requests"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "verification_requests_status_idx" ON "verification_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "verification_requests_community_idx" ON "verification_requests" USING btree ("community_id");