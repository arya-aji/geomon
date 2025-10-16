import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function addColumns() {
    try {
        console.log('Adding new columns...');

        // Add columns one by one
        await sql`ALTER TABLE "processed_geojson" ADD COLUMN IF NOT EXISTS "kdkab" varchar(5)`;
        console.log('Added kdkab column');

        await sql`ALTER TABLE "processed_geojson" ADD COLUMN IF NOT EXISTS "kdkec" varchar(5)`;
        console.log('Added kdkec column');

        await sql`ALTER TABLE "processed_geojson" ADD COLUMN IF NOT EXISTS "kddesa" varchar(5)`;
        console.log('Added kddesa column');

        await sql`ALTER TABLE "processed_geojson" ADD COLUMN IF NOT EXISTS "iddesa" varchar(10)`;
        console.log('Added iddesa column');

        console.log('All columns added successfully!');

        // Check if columns exist
        const columns = await sql`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'processed_geojson'
            AND column_name IN ('kdkab', 'kdkec', 'kddesa', 'iddesa')
            ORDER BY column_name
        `;

        console.log('New columns created:');
        console.table(columns);

    } catch (error) {
        console.error('Error adding columns:', error);
        process.exit(1);
    }
}

addColumns();