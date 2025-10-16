import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function checkData() {
    try {
        console.log('Checking existing data in processed_geojson table...');

        // Get all columns in the table
        const columns = await sql`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'processed_geojson'
            ORDER BY ordinal_position
        `;

        console.log('Current columns in processed_geojson:');
        console.table(columns);

        // Get sample records
        const records = await sql`
            SELECT *
            FROM processed_geojson
            LIMIT 5
        `;

        console.log('Sample records:');
        console.table(records);

        // Count total records
        const count = await sql`SELECT COUNT(*) as total FROM processed_geojson`;
        console.log(`Total records: ${count[0].total}`);

    } catch (error) {
        console.error('Error checking data:', error);
        process.exit(1);
    }
}

checkData();