-- Removing old columns district_name, kecamatan_name, kabupaten_name, idkel from processed_geojson table
ALTER TABLE "processed_geojson" DROP COLUMN IF EXISTS "district_name";
ALTER TABLE "processed_geojson" DROP COLUMN IF EXISTS "kecamatan_name";
ALTER TABLE "processed_geojson" DROP COLUMN IF EXISTS "kabupaten_name";
ALTER TABLE "processed_geojson" DROP COLUMN IF EXISTS "idkel";