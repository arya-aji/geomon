import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function populateColumns() {
    try {
        console.log('Populating new columns...');

        // First, check if we have data to work with
        const sampleData = await sql`
            SELECT id, idkel
            FROM processed_geojson
            WHERE idkel IS NOT NULL AND idkel != ''
            LIMIT 5
        `;

        console.log('Sample existing idkel data:');
        console.table(sampleData);

        if (sampleData.length === 0) {
            console.log('No idkel data found to populate new columns');
            return;
        }

        // Populate new columns based on existing idkel data
        const result = await sql`
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
            WHERE idkel IS NOT NULL AND idkel != ''
        `;

        console.log(`Updated ${result.count || 'unknown number of'} records`);

        // Verify the results
        const updatedData = await sql`
            SELECT id, original_filename, idkel, kdkab, kdkec, kddesa, iddesa
            FROM processed_geojson
            WHERE kdkab IS NOT NULL
            ORDER BY id
            LIMIT 10
        `;

        console.log('Sample updated records:');
        console.table(updatedData);

    } catch (error) {
        console.error('Error populating columns:', error);
        process.exit(1);
    }
}

populateColumns();