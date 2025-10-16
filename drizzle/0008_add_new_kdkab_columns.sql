-- Adding new columns kdkab, kdkec, kddesa, iddesa to processed_geojson table
ALTER TABLE "processed_geojson" ADD COLUMN "kdkab" varchar(5);
ALTER TABLE "processed_geojson" ADD COLUMN "kdkec" varchar(5);
ALTER TABLE "processed_geojson" ADD COLUMN "kddesa" varchar(5);
ALTER TABLE "processed_geojson" ADD COLUMN "iddesa" varchar(10);