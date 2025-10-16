import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

function extractRegionCodesFromGeojson(geojsonData) {
    try {
        if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
            return { kdkab: '', kdkec: '', kddesa: '', iddesa: '' };
        }

        // Get the first feature and extract idsubsls
        const firstFeature = geojsonData.features[0];
        const idsubsls = firstFeature?.properties?.idsubsls;

        if (!idsubsls || typeof idsubsls !== 'string' || idsubsls.length < 10) {
            return { kdkab: '', kdkec: '', kddesa: '', iddesa: '' };
        }

        // Extract region codes from idsubsls
        const kdkab = idsubsls.substring(0, 4);    // First 4 digits
        const kdkec = idsubsls.substring(4, 7);    // Next 3 digits
        const kddesa = idsubsls.substring(7, 10);  // Next 3 digits
        const iddesa = idsubsls.substring(0, 10);  // First 10 digits

        return { kdkab, kdkec, kddesa, iddesa };
    } catch (error) {
        console.error('Error extracting region codes from GeoJSON:', error);
        return { kdkab: '', kdkec: '', kddesa: '', iddesa: '' };
    }
}

async function populateFromGeojson() {
    try {
        console.log('Getting files with GeoJSON data...');

        // Get all files with their current version GeoJSON data
        const files = await sql`
            SELECT
                pg.id,
                pg.original_filename,
                gv.geojson_data,
                gv.version_number
            FROM processed_geojson pg
            LEFT JOIN geojson_versions gv ON pg.current_version_id = gv.id
            WHERE pg.current_version_id IS NOT NULL
            ORDER BY pg.id
        `;

        console.log(`Found ${files.length} files with GeoJSON data`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            try {
                if (!file.geojson_data) {
                    console.log(`Skipping file ${file.id} (${file.original_filename}) - no GeoJSON data`);
                    skippedCount++;
                    continue;
                }

                // Parse the GeoJSON data
                let geojsonData;
                if (typeof file.geojson_data === 'string') {
                    geojsonData = JSON.parse(file.geojson_data);
                } else {
                    geojsonData = file.geojson_data;
                }

                // Extract region codes
                const regionCodes = extractRegionCodesFromGeojson(geojsonData);

                if (!regionCodes.kdkab) {
                    console.log(`Skipping file ${file.id} (${file.original_filename}) - no idsubsls found`);
                    skippedCount++;
                    continue;
                }

                // Update the processed_geojson table
                await sql`
                    UPDATE processed_geojson
                    SET
                        kdkab = ${regionCodes.kdkab},
                        kdkec = ${regionCodes.kdkec},
                        kddesa = ${regionCodes.kddesa},
                        iddesa = ${regionCodes.iddesa},
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ${file.id}
                `;

                console.log(`Updated file ${file.id} (${file.original_filename}): kdkab=${regionCodes.kdkab}, kdkec=${regionCodes.kdkec}, kddesa=${regionCodes.kddesa}, iddesa=${regionCodes.iddesa}`);
                updatedCount++;

            } catch (fileError) {
                console.error(`Error processing file ${file.id} (${file.original_filename}):`, fileError);
                skippedCount++;
            }
        }

        console.log(`\nPopulation complete!`);
        console.log(`Updated: ${updatedCount} files`);
        console.log(`Skipped: ${skippedCount} files`);

    } catch (error) {
        console.error('Error populating from GeoJSON:', error);
        process.exit(1);
    }
}

populateFromGeojson();