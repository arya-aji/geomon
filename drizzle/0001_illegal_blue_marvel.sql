CREATE TABLE "frs" (
	"id" serial PRIMARY KEY NOT NULL,
	"idsls_before" varchar(20),
	"nama_sls_before" varchar(200),
	"idsls_after" varchar(20),
	"nama_sls_after" varchar(200),
	"ketua_sls" varchar(100),
	"status" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
