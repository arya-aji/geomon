import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function testApiResponse() {
    try {
        console.log('=== TESTING API RESPONSE STRUCTURE ===\n');

        // Get sample data that would be returned by the API
        const sampleData = await sql`
            SELECT
                id,
				original_filename,
				district_code,
				kdkab,
				kdkec,
				kddesa,
				iddesa,
				nmdesa,
				current_version_number,
				updated_at,
				user_id
            FROM processed_geojson
            WHERE iddesa IS NOT NULL AND nmdesa IS NOT NULL
            ORDER BY iddesa
            LIMIT 5
        `;

        console.log('Sample data that API should return:');
        console.table(sampleData);

        // Test the grouping logic (latest version per iddesa)
        const testData = await sql`
            SELECT
                iddesa,
                nmdesa,
                kdkab,
                kdkec,
                kddesa,
                COUNT(*) as total_versions,
                MAX(current_version_number) as max_version
            FROM processed_geojson
            WHERE iddesa IS NOT NULL AND nmdesa IS NOT NULL
            GROUP BY iddesa, nmdesa, kdkab, kdkec, kddesa
            ORDER BY iddesa
            LIMIT 10
        `;

        console.log('\nGrouping by IDDESA (latest version logic):');
        console.table(testData);

        // Count unique villages
        const villageCount = await sql`
            SELECT COUNT(DISTINCT iddesa) as unique_villages
            FROM processed_geojson
            WHERE iddesa IS NOT NULL AND nmdesa IS NOT NULL
        `;

        console.log(`\n📊 Expected Results:`);
        console.log(`Unique villages with NMDESA: ${villageCount[0].unique_villages}`);

    } catch (error) {
        console.error('Error testing API response:', error);
        process.exit(1);
    }
}

testApiResponse();