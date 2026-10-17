CREATE TYPE "public"."institution_member_role" AS ENUM('admin', 'teacher');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'institution_staff';--> statement-breakpoint
CREATE TABLE "institution_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "institution_member_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "institution_members_user_id_unique" ON "institution_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "institution_members_institution_user_unique" ON "institution_members" USING btree ("institution_id","user_id");--> statement-breakpoint
CREATE INDEX "institution_members_institution_id_idx" ON "institution_members" USING btree ("institution_id");