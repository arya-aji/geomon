import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function verifyNmdesaPopulation() {
    try {
        console.log('=== NMDESA POPULATION VERIFICATION ===\n');

        // Count records with and without nmdesa data
        const stats = await sql`
            SELECT
                COUNT(*) as total_records,
                COUNT(nmdesa) as records_with_nmdesa,
                COUNT(CASE WHEN nmdesa IS NULL OR nmdesa = '' THEN 1 END) as records_without_nmdesa
            FROM processed_geojson
        `;

        console.log('📊 NMDESA Population Statistics:');
        console.log(`Total records: ${stats[0].total_records}`);
        console.log(`Records with nmdesa: ${stats[0].records_with_nmdesa}`);
        console.log(`Records without nmdesa: ${stats[0].records_without_nmdesa}`);
        console.log(`Population success rate: ${((stats[0].records_with_nmdesa / stats[0].total_records) * 100).toFixed(1)}%`);

        // Show unique nmdesa values
        const uniqueNmdesa = await sql`
            SELECT nmdesa, COUNT(*) as count
            FROM processed_geojson
            WHERE nmdesa IS NOT NULL AND nmdesa != ''
            GROUP BY nmdesa
            ORDER BY count DESC
            LIMIT 15
        `;

        console.log('\n🏘️  Top 15 NMDESA values (Village names):');
        console.table(uniqueNmdesa);

        // Show sample records with all data
        const sampleRecords = await sql`
            SELECT
                id,
                original_filename,
                kdkab,
                kdkec,
                kddesa,
                iddesa,
                nmdesa,
                updated_at
            FROM processed_geojson
            WHERE nmdesa IS NOT NULL AND nmdesa != ''
            ORDER BY updated_at DESC
            LIMIT 10
        `;

        console.log('\n📋 Sample records with NMDESA data:');
        console.table(sampleRecords);

        // Show records that couldn't be populated
        const emptyRecords = await sql`
            SELECT id, original_filename, district_code, kdkab, kdkec, kddesa
            FROM processed_geojson
            WHERE nmdesa IS NULL OR nmdesa = ''
            ORDER BY id
        `;

        if (emptyRecords.length > 0) {
            console.log('\n⚠️  Records without NMDESA data:');
            console.table(emptyRecords);
        } else {
            console.log('\n✅ All records have NMDESA data!');
        }

        // Show some statistics about the data quality
        const dataQuality = await sql`
            SELECT
                COUNT(*) as total_with_codes,
                COUNT(CASE WHEN kdkab IS NOT NULL AND kdkec IS NOT NULL AND kddesa IS NOT NULL AND nmdesa IS NOT NULL THEN 1 END) as complete_records,
                COUNT(CASE WHEN kdkab IS NOT NULL AND kdkec IS NOT NULL AND kddesa IS NOT NULL AND nmdesa IS NULL THEN 1 END) as missing_nmdesa_only
            FROM processed_geojson
            WHERE kdkab IS NOT NULL
        `;

        console.log('\n📈 Data Quality Analysis:');
        console.log(`Records with region codes: ${dataQuality[0].total_with_codes}`);
        console.log(`Complete records (codes + nmdesa): ${dataQuality[0].complete_records}`);
        console.log(`Missing only nmdesa: ${dataQuality[0].missing_nmdesa_only}`);

        console.log('\n🎉 NMDESA verification complete!');

    } catch (error) {
        console.error('Error verifying nmdesa population:', error);
        process.exit(1);
    }
}

verifyNmdesaPopulation();