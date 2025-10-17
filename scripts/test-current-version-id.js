import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function testCurrentVersionId() {
    try {
        console.log('=== CHECKING CURRENT VERSION ID USAGE ===\n');

        // Check that villages have currentVersionId field populated
        const villagesWithVersionId = await sql`
            SELECT id, nmdesa, original_filename, current_version_id, current_version_number
            FROM processed_geojson
            WHERE is_active = true AND current_version_id IS NOT NULL
            LIMIT 10
        `;

        console.log('📋 Villages with currentVersionId:');
        villagesWithVersionId.forEach((village, index) => {
            console.log(`${index + 1}. ${village.nmdesa}: file=${village.original_filename}, current_version_id=${village.current_version_id}, current_version_number=${village.current_version_number}`);
        });

        // Check one version to ensure it has geojson data
        if (villagesWithVersionId.length > 0) {
            const firstVillage = villagesWithVersionId[0];
            console.log(`\n🔍 Checking version ${firstVillage.current_version_id} for ${firstVillage.nmdesa}...`);

            const versionData = await sql`
                SELECT id, file_id, geojson_data, anomaly_summary
                FROM geojson_versions
                WHERE id = ${firstVillage.current_version_id}
            `;

            if (versionData.length > 0) {
                const version = versionData[0];
                console.log('✅ Version found in database');
                console.log(`- Version ID: ${version.id}`);
                console.log(`- File ID: ${version.file_id}`);
                console.log(`- Has GeoJSON data: ${!!version.geojson_data}`);
                console.log(`- Has anomaly summary: ${!!version.anomaly_summary}`);

                if (version.anomaly_summary) {
                    console.log(`- Current anomaly count: ${version.anomaly_summary.total || 0}`);
                }
            } else {
                console.log('❌ Version not found in database');
            }
        }

    } catch (error) {
        console.error('❌ Error checking version IDs:', error);
    }
}

testCurrentVersionId();