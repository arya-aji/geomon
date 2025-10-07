CREATE TABLE "geojson_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" integer,
	"from_version_id" integer,
	"to_version_id" integer,
	"revision_type" varchar(50),
	"changes_summary" jsonb,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "geojson_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" integer,
	"version_number" integer,
	"geojson_data" jsonb,
	"anomaly_summary" jsonb,
	"processing_metadata" jsonb,
	"created_by" varchar(255),
	"change_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "processed_geojson" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"original_filename" varchar(255),
	"district_code" varchar(50),
	"current_version_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "geojson_revisions" ADD CONSTRAINT "geojson_revisions_file_id_processed_geojson_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."processed_geojson"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geojson_revisions" ADD CONSTRAINT "geojson_revisions_from_version_id_geojson_versions_id_fk" FOREIGN KEY ("from_version_id") REFERENCES "public"."geojson_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geojson_revisions" ADD CONSTRAINT "geojson_revisions_to_version_id_geojson_versions_id_fk" FOREIGN KEY ("to_version_id") REFERENCES "public"."geojson_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geojson_versions" ADD CONSTRAINT "geojson_versions_file_id_processed_geojson_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."processed_geojson"("id") ON DELETE no action ON UPDATE no action;