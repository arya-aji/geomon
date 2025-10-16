-- Apply new columns (if they don't exist)
DO $$
BEGIN
    -- Add kdkab column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='processed_geojson' AND column_name='kdkab') THEN
        ALTER TABLE "processed_geojson" ADD COLUMN "kdkab" varchar(5);
    END IF;

    -- Add kdkec column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='processed_geojson' AND column_name='kdkec') THEN
        ALTER TABLE "processed_geojson" ADD COLUMN "kdkec" varchar(5);
    END IF;

    -- Add kddesa column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='processed_geojson' AND column_name='kddesa') THEN
        ALTER TABLE "processed_geojson" ADD COLUMN "kddesa" varchar(5);
    END IF;

    -- Add iddesa column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='processed_geojson' AND column_name='iddesa') THEN
        ALTER TABLE "processed_geojson" ADD COLUMN "iddesa" varchar(10);
    END IF;
END $$;

-- Populate new columns based on existing idkel data
UPDATE processed_geojson
SET
    kdkab = CASE
        WHEN idkel IS NOT NULL AND idkel != '' AND LENGTH(idkel) >= 4
        THEN SUBSTRING(idkel, 1, 4)
        ELSE NULL
    END,
    kdkec = CASE
        WHEN idkel IS NOT NULL AND idkel != '' AND LENGTH(idkel) >= 7
        THEN SUBSTRING(idkel, 5, 3)
        ELSE NULL
    END,
    kddesa = CASE
        WHEN idkel IS NOT NULL AND idkel != '' AND LENGTH(idkel) >= 10
        THEN SUBSTRING(idkel, 8, 3)
        ELSE NULL
    END,
    iddesa = CASE
        WHEN idkel IS NOT NULL AND idkel != '' AND LENGTH(idkel) >= 10
        THEN SUBSTRING(idkel, 1, 10)
        ELSE NULL
    END
WHERE idkel IS NOT NULL AND idkel != '';

-- Remove old columns (if they exist)
DO $$
BEGIN
    -- Remove district_name column
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='processed_geojson' AND column_name='district_name') THEN
        ALTER TABLE "processed_geojson" DROP COLUMN "district_name";
    END IF;

    -- Remove kecamatan_name column
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='processed_geojson' AND column_name='kecamatan_name') THEN
        ALTER TABLE "processed_geojson" DROP COLUMN "kecamatan_name";
    END IF;

    -- Remove kabupaten_name column
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='processed_geojson' AND column_name='kabupaten_name') THEN
        ALTER TABLE "processed_geojson" DROP COLUMN "kabupaten_name";
    END IF;

    -- Remove idkel column (after we've used it to populate new columns)
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='processed_geojson' AND column_name='idkel') THEN
        ALTER TABLE "processed_geojson" DROP COLUMN "idkel";
    END IF;
END $$;

-- Show sample of updated data
SELECT id, original_filename, kdkab, kdkec, kddesa, iddesa
FROM processed_geojson
WHERE kdkab IS NOT NULL
ORDER BY id
LIMIT 5;