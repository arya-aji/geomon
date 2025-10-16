-- Update existing records to set currentVersionNumber based on the latest version
UPDATE processed_geojson
SET current_version_number = (
    SELECT COALESCE(
        (SELECT gv.version_number
         FROM geojson_versions gv
         WHERE gv.file_id = processed_geojson.id
         ORDER BY gv.version_number DESC
         LIMIT 1), 1
    )
)
WHERE current_version_number IS NULL OR current_version_number = 1;

-- For files that have versions but incorrect currentVersionNumber
UPDATE processed_geojson
SET current_version_number = (
    SELECT gv.version_number
    FROM geojson_versions gv
    WHERE gv.id = processed_geojson.current_version_id
)
WHERE current_version_number != (
    SELECT gv.version_number
    FROM geojson_versions gv
    WHERE gv.id = processed_geojson.current_version_id
)
AND current_version_id IS NOT NULL;