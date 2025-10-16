import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function removeOldColumns() {
    try {
        console.log('Removing old columns...');

        // Remove old columns one by one
        await sql`ALTER TABLE "processed_geojson" DROP COLUMN IF EXISTS "district_name"`;
        console.log('Dropped district_name column');

        await sql`ALTER TABLE "processed_geojson" DROP COLUMN IF EXISTS "kecamatan_name"`;
        console.log('Dropped kecamatan_name column');

        await sql`ALTER TABLE "processed_geojson" DROP COLUMN IF EXISTS "kabupaten_name"`;
        console.log('Dropped kabupaten_name column');

        await sql`ALTER TABLE "processed_geojson" DROP COLUMN IF EXISTS "idkel"`;
        console.log('Dropped idkel column');

        console.log('All old columns removed successfully!');

        // Verify the final schema
        const finalColumns = await sql`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'processed_geojson'
            ORDER BY ordinal_position
        `;

        console.log('Final columns in processed_geojson:');
        console.table(finalColumns);

    } catch (error) {
        console.error('Error removing old columns:', error);
        process.exit(1);
    }
}

removeOldColumns();