import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function runMigration() {
    try {
        console.log('Starting migration...');

        // Read the SQL file
        const migrationSQL = readFileSync('./scripts/apply-migrations-manually.sql', 'utf8');

        // Execute the migration
        console.log('Executing migration SQL...');
        await sql.unsafe(migrationSQL);

        console.log('Migration completed successfully!');

        // Verify the changes
        console.log('Verifying migration results...');
        const result = await sql`
            SELECT id, original_filename, kdkab, kdkec, kddesa, iddesa
            FROM processed_geojson
            WHERE kdkab IS NOT NULL
            ORDER BY id
            LIMIT 5
        `;

        console.log('Sample updated records:');
        console.table(result);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();