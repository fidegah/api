ALTER TABLE "tickets" ADD COLUMN "workspace_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD COLUMN "is_banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD COLUMN "banned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD COLUMN "browser_name" text;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD COLUMN "engine_name" text;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD COLUMN "device_model" text;--> statement-breakpoint
ALTER TABLE "workspace_users" ADD COLUMN "os_name" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;