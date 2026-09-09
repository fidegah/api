CREATE TABLE "changelog_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"icon" varchar(100),
	"color" varchar(50),
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "changelog_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "device_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" text NOT NULL,
	"workspace_id" uuid NOT NULL,
	"external_user_id" uuid,
	"browser_name" text,
	"os_name" text,
	"device_model" text,
	"engine_name" text,
	"ip_address" text,
	"current_url" text,
	CONSTRAINT "device_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "external_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"full_name" text,
	"email" text,
	"avatar_url" text,
	"is_banned" boolean DEFAULT false NOT NULL,
	"banned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comment_likes" DROP CONSTRAINT "comment_likes_comment_id_user_id_unique";--> statement-breakpoint
ALTER TABLE "changelogs" ALTER COLUMN "content" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "comment_likes" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "post_comments" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "post_votes" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roadmap_items" ALTER COLUMN "eta" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD COLUMN "external_user_id" uuid;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD COLUMN "session_id" text;--> statement-breakpoint
ALTER TABLE "post_comments" ADD COLUMN "external_user_id" uuid;--> statement-breakpoint
ALTER TABLE "post_votes" ADD COLUMN "external_user_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "external_user_id" uuid;--> statement-breakpoint
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_external_user_id_external_users_id_fk" FOREIGN KEY ("external_user_id") REFERENCES "public"."external_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_users" ADD CONSTRAINT "external_users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_external_user_id_external_users_id_fk" FOREIGN KEY ("external_user_id") REFERENCES "public"."external_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_external_user_id_external_users_id_fk" FOREIGN KEY ("external_user_id") REFERENCES "public"."external_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_external_user_id_external_users_id_fk" FOREIGN KEY ("external_user_id") REFERENCES "public"."external_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_external_user_id_external_users_id_fk" FOREIGN KEY ("external_user_id") REFERENCES "public"."external_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_comment_user_like" ON "comment_likes" USING btree ("comment_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_comment_external_user_like" ON "comment_likes" USING btree ("comment_id","external_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_comment_session_like" ON "comment_likes" USING btree ("comment_id","session_id");