import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function addNmdesaColumn() {
    try {
        console.log('Adding nmdesa column to processed_geojson table...');

        // Add nmdesa column
        await sql`ALTER TABLE "processed_geojson" ADD COLUMN IF NOT EXISTS "nmdesa" varchar(100)`;
        console.log('Added nmdesa column successfully!');

        // Verify the column was added
        const columns = await sql`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'processed_geojson'
            AND column_name = 'nmdesa'
        `;

        console.log('nmdesa column verification:');
        console.table(columns);

    } catch (error) {
        console.error('Error adding nmdesa column:', error);
        process.exit(1);
    }
}

addNmdesaColumn();