import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function checkGeloraInDatabase() {
    try {
        console.log('=== CHECKING GELORA (3173010001) IN DATABASE ===\n');

        // Check if 3173010001 exists in processed_geojson table
        console.log('1. Checking processed_geojson table for 3173010001:');
        const processedGeojson = await sql`
            SELECT * FROM processed_geojson
            WHERE iddesa = '3173010001'
        `;

        if (processedGeojson.length > 0) {
            console.log('✅ Found in processed_geojson:');
            processedGeojson.forEach((record, index) => {
                console.log(`   Record ${index + 1}:`, {
                    id: record.id,
                    originalFilename: record.original_filename,
                    nmdesa: record.nmdesa,
                    iddesa: record.iddesa,
                    isActive: record.is_active,
                    currentVersionId: record.current_version_id,
                    currentVersionNumber: record.current_version_number,
                    createdAt: record.created_at,
                    updatedAt: record.updated_at
                });
            });
        } else {
            console.log('❌ Not found in processed_geojson table');
        }

        // Check geojson_versions table for any files related to this processed_geojson
        if (processedGeojson.length > 0) {
            const fileIds = processedGeojson.map(record => record.id);
            console.log('\n2. Checking geojson_versions for these file IDs:');

            for (const fileId of fileIds) {
                const versions = await sql`
                    SELECT * FROM geojson_versions
                    WHERE file_id = ${fileId}
                    ORDER BY version_number DESC
                `;

                console.log(`   File ID ${fileId} versions:`, versions.length);
                versions.forEach((version, index) => {
                    console.log(`     Version ${index + 1}:`, {
                        id: version.id,
                        versionNumber: version.version_number,
                        fileId: version.file_id,
                        createdAt: version.created_at,
                        hasGeojsonData: !!version.geojson_data
                    });
                });
            }
        }

        // Check all records for Tanah Abang (kdkec = 010)
        console.log('\n3. All records for Tanah Abang (kdkec = 010):');
        const tanahAbangRecords = await sql`
            SELECT id, original_filename, nmdesa, iddesa, kddesa,
                   is_active, current_version_id, current_version_number
            FROM processed_geojson
            WHERE kdkec = '010'
            ORDER BY kddesa
        `;

        console.log(`   Found ${tanahAbangRecords.length} records for Tanah Abang:`);
        tanahAbangRecords.forEach((record) => {
            console.log(`   - ${record.nmdesa} (${record.iddesa}) - Active: ${record.is_active} - Version: ${record.current_version_number}`);
        });

        // Check if there are any inactive records for Gelora
        console.log('\n4. Checking for any Gelora records (including inactive):');
        const allGeloraRecords = await sql`
            SELECT * FROM processed_geojson
            WHERE nmdesa ILIKE '%GELORA%'
        `;

        console.log(`   Found ${allGeloraRecords.length} records with 'GELORA' in name:`);
        allGeloraRecords.forEach((record) => {
            console.log(`   - ${record.nmdesa} (${record.iddesa}) - Active: ${record.is_active}`);
        });

    } catch (error) {
        console.error('Error checking Gelora in database:', error);
        process.exit(1);
    }
}

checkGeloraInDatabase();