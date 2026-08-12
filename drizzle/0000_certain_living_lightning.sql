CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"about" text DEFAULT '' NOT NULL,
	"guidelines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"kind" text NOT NULL,
	"scope" text DEFAULT 'UNIVERSITY' NOT NULL,
	"place_id" text,
	"interest_id" text NOT NULL,
	"join_policy" text DEFAULT 'OPEN' NOT NULL,
	"verification" text DEFAULT 'UNVERIFIED' NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	CONSTRAINT "communities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "community_proposal_supporters" (
	"proposal_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_proposal_supporters_proposal_id_user_id_pk" PRIMARY KEY("proposal_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "community_proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"proposed_name" text NOT NULL,
	"normalised_name" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"interest_id" text NOT NULL,
	"scope" text DEFAULT 'UNIVERSITY' NOT NULL,
	"place_id" text,
	"proposed_by_id" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"supporter_count" integer DEFAULT 1 NOT NULL,
	"reviewed_by_id" text,
	"reviewer_note" text,
	"merged_into_community_id" text,
	"created_community_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"decided_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "interest_suggestion_supporters" (
	"suggestion_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "interest_suggestion_supporters_suggestion_id_user_id_pk" PRIMARY KEY("suggestion_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "interest_suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"normalised_label" text NOT NULL,
	"suggested_by_id" text,
	"demand_count" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"maps_to_interest_id" text,
	"promoted_interest_id" text,
	"reviewed_by_id" text,
	"reviewer_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"decided_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "interests" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "interests_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_interests" (
	"user_id" text NOT NULL,
	"interest_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_interests_user_id_interest_id_pk" PRIMARY KEY("user_id","interest_id")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"community_id" text NOT NULL,
	"user_id" text NOT NULL,
	"state" text DEFAULT 'MEMBER' NOT NULL,
	"requested_at" timestamp,
	"joined_at" timestamp,
	"invited_by_id" text,
	"decided_by_id" text,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"parent_place_id" text,
	"email_domain" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "places_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password_hash" text,
	"role" text DEFAULT 'STUDENT' NOT NULL,
	"university_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_interest_id_interests_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_proposal_supporters" ADD CONSTRAINT "community_proposal_supporters_proposal_id_community_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."community_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_proposal_supporters" ADD CONSTRAINT "community_proposal_supporters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_proposals" ADD CONSTRAINT "community_proposals_interest_id_interests_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_proposals" ADD CONSTRAINT "community_proposals_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_proposals" ADD CONSTRAINT "community_proposals_proposed_by_id_users_id_fk" FOREIGN KEY ("proposed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_proposals" ADD CONSTRAINT "community_proposals_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_proposals" ADD CONSTRAINT "community_proposals_merged_into_community_id_communities_id_fk" FOREIGN KEY ("merged_into_community_id") REFERENCES "public"."communities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_proposals" ADD CONSTRAINT "community_proposals_created_community_id_communities_id_fk" FOREIGN KEY ("created_community_id") REFERENCES "public"."communities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_suggestion_supporters" ADD CONSTRAINT "interest_suggestion_supporters_suggestion_id_interest_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."interest_suggestions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_suggestion_supporters" ADD CONSTRAINT "interest_suggestion_supporters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_suggestions" ADD CONSTRAINT "interest_suggestions_suggested_by_id_users_id_fk" FOREIGN KEY ("suggested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_suggestions" ADD CONSTRAINT "interest_suggestions_maps_to_interest_id_interests_id_fk" FOREIGN KEY ("maps_to_interest_id") REFERENCES "public"."interests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_suggestions" ADD CONSTRAINT "interest_suggestions_promoted_interest_id_interests_id_fk" FOREIGN KEY ("promoted_interest_id") REFERENCES "public"."interests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_suggestions" ADD CONSTRAINT "interest_suggestions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_interest_id_interests_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_parent_place_id_places_id_fk" FOREIGN KEY ("parent_place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_university_id_places_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "communities_scope_place_idx" ON "communities" USING btree ("scope","place_id");--> statement-breakpoint
CREATE INDEX "communities_interest_idx" ON "communities" USING btree ("interest_id");--> statement-breakpoint
CREATE INDEX "communities_kind_idx" ON "communities" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "community_proposals_status_idx" ON "community_proposals" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "community_proposals_normalised_idx" ON "community_proposals" USING btree ("normalised_name");--> statement-breakpoint
CREATE UNIQUE INDEX "interest_suggestions_normalised_idx" ON "interest_suggestions" USING btree ("normalised_label");--> statement-breakpoint
CREATE INDEX "interest_suggestions_status_idx" ON "interest_suggestions" USING btree ("status","demand_count");--> statement-breakpoint
CREATE INDEX "user_interests_interest_idx" ON "user_interests" USING btree ("interest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_community_user_idx" ON "memberships" USING btree ("community_id","user_id");--> statement-breakpoint
CREATE INDEX "memberships_user_state_idx" ON "memberships" USING btree ("user_id","state");--> statement-breakpoint
CREATE INDEX "memberships_community_state_idx" ON "memberships" USING btree ("community_id","state");--> statement-breakpoint
CREATE INDEX "places_kind_idx" ON "places" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "places_parent_idx" ON "places" USING btree ("parent_place_id");