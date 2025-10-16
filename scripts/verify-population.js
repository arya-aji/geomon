import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function verifyPopulation() {
    try {
        console.log('=== DATABASE POPULATION VERIFICATION ===\n');

        // Count records with and without data
        const stats = await sql`
            SELECT
                COUNT(*) as total_records,
                COUNT(kdkab) as records_with_kdkab,
                COUNT(kdkec) as records_with_kdkec,
                COUNT(kddesa) as records_with_kddesa,
                COUNT(iddesa) as records_with_iddesa
            FROM processed_geojson
        `;

        console.log('📊 Population Statistics:');
        console.log(`Total records: ${stats[0].total_records}`);
        console.log(`Records with kdkab: ${stats[0].records_with_kdkab}`);
        console.log(`Records with kdkec: ${stats[0].records_with_kdkec}`);
        console.log(`Records with kddesa: ${stats[0].records_with_kddesa}`);
        console.log(`Records with iddesa: ${stats[0].records_with_iddesa}`);

        // Show unique values for each column
        const uniqueKdkab = await sql`SELECT DISTINCT kdkab, COUNT(*) as count FROM processed_geojson WHERE kdkab IS NOT NULL GROUP BY kdkab ORDER BY kdkab`;
        const uniqueKdkec = await sql`SELECT DISTINCT kdkec, COUNT(*) as count FROM processed_geojson WHERE kdkec IS NOT NULL GROUP BY kdkec ORDER BY kdkec LIMIT 10`;

        console.log('\n🏢 Unique KDKAB values (Kabupaten codes):');
        console.table(uniqueKdkab);

        console.log('\n🏘️  Sample KDEC values (Kecamatan codes - first 10):');
        console.table(uniqueKdkec);

        // Show sample records
        const sampleRecords = await sql`
            SELECT
                id,
                original_filename,
                kdkab,
                kdkec,
                kddesa,
                iddesa,
                updated_at
            FROM processed_geojson
            WHERE kdkab IS NOT NULL
            ORDER BY updated_at DESC
            LIMIT 10
        `;

        console.log('\n📋 Sample recently updated records:');
        console.table(sampleRecords);

        // Show records that couldn't be populated
        const emptyRecords = await sql`
            SELECT id, original_filename, district_code
            FROM processed_geojson
            WHERE kdkab IS NULL
            ORDER BY id
        `;

        if (emptyRecords.length > 0) {
            console.log('\n⚠️  Records that could not be populated:');
            console.table(emptyRecords);
        } else {
            console.log('\n✅ All records were successfully populated!');
        }

        console.log('\n🎉 Population verification complete!');

    } catch (error) {
        console.error('Error verifying population:', error);
        process.exit(1);
    }
}

verifyPopulation();