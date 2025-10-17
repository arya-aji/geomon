import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function checkTotalRecords() {
    try {
        console.log('=== CHECKING TOTAL RECORDS IN DATABASE ===\n');

        // Count total records in processed_geojson
        const totalCount = await sql`
            SELECT COUNT(*) as count FROM processed_geojson
            WHERE is_active = true
        `;
        console.log(`📊 Total active records: ${totalCount[0].count}`);

        // Count active records with current versions
        const withVersionsCount = await sql`
            SELECT COUNT(*) as count FROM processed_geojson
            WHERE is_active = true AND current_version_id IS NOT NULL
        `;
        console.log(`📊 Active records with versions: ${withVersionsCount[0].count}`);

        // Get the most recent records (like the API does)
        const recentRecords = await sql`
            SELECT
                pg.id,
                pg.original_filename,
                pg.nmdesa,
                pg.iddesa,
                pg.kdkec,
                pg.kddesa,
                pg.is_active,
                pg.current_version_id,
                pg.current_version_number,
                pg.updated_at,
                gv.created_at as version_created_at
            FROM processed_geojson pg
            LEFT JOIN geojson_versions gv ON pg.current_version_id = gv.id
            WHERE pg.is_active = true
            ORDER BY pg.updated_at DESC
            LIMIT 50
        `;

        console.log(`\n📋 Top 50 most recently updated records:`);
        recentRecords.forEach((record, index) => {
            console.log(`${index + 1}. ${record.nmdesa} (${record.iddesa}) - Updated: ${record.updated_at} - Version: ${record.current_version_number}`);
        });

        // Check if any Gelora appears in top 50
        const geloraInTop50 = recentRecords.filter(r => r.nmdesa === 'GELORA');
        console.log(`\n🔍 Gelora records in top 50: ${geloraInTop50.length}`);
        if (geloraInTop50.length > 0) {
            geloraInTop50.forEach((record, index) => {
                console.log(`   ${index + 1}. File ID: ${record.id} - Updated: ${record.updated_at} - Version: ${record.current_version_number}`);
            });
        }

        // Get Gelora records sorted by update time
        const geloraRecords = await sql`
            SELECT
                pg.id,
                pg.original_filename,
                pg.nmdesa,
                pg.iddesa,
                pg.is_active,
                pg.current_version_id,
                pg.current_version_number,
                pg.updated_at
            FROM processed_geojson pg
            WHERE pg.nmdesa = 'GELORA' AND pg.is_active = true
            ORDER BY pg.updated_at DESC
        `;

        console.log(`\n📋 All Gelora records sorted by update time:`);
        geloraRecords.forEach((record, index) => {
            console.log(`${index + 1}. File ID: ${record.id} - Updated: ${record.updated_at} - Version: ${record.current_version_number}`);
        });

    } catch (error) {
        console.error('Error checking total records:', error);
        process.exit(1);
    }
}

checkTotalRecords();