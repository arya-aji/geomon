-- Script to populate new columns (kdkab, kdkec, kddesa, iddesa) based on existing idkel
-- idkel contains first 10 digits from idsubsls
-- kdkab = first 4 digits
-- kdkec = next 3 digits (digits 5-7)
-- kddesa = next 3 digits (digits 8-10)
-- iddesa = concatenation of all three (10 digits)

UPDATE processed_geojson
SET
    kdkab = SUBSTRING(idkel, 1, 4),
    kdkec = SUBSTRING(idkel, 5, 3),
    kddesa = SUBSTRING(idkel, 8, 3),
    iddesa = idkel
WHERE idkel IS NOT NULL AND idkel != '';

-- Handle cases where idkel might be NULL or empty
UPDATE processed_geojson
SET
    kdkab = NULL,
    kdkec = NULL,
    kddesa = NULL,
    iddesa = NULL
WHERE idkel IS NULL OR idkel = '';