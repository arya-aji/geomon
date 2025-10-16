-- Add new columns one by one
ALTER TABLE "processed_geojson" ADD COLUMN IF NOT EXISTS "kdkab" varchar(5);
ALTER TABLE "processed_geojson" ADD COLUMN IF NOT EXISTS "kdkec" varchar(5);
ALTER TABLE "processed_geojson" ADD COLUMN IF NOT EXISTS "kddesa" varchar(5);
ALTER TABLE "processed_geojson" ADD COLUMN IF NOT EXISTS "iddesa" varchar(10);