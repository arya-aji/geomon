import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Read database URL from environment
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL environment variable is not set');
	process.exit(1);
}

// Create database connection
const sql = neon(databaseUrl);

async function cleanFRSData() {
	console.log('Cleaning FRS data...');

	try {
		// Delete rows where all fields are null
		const result = await sql`
			DELETE FROM frs
			WHERE idsls_before IS NULL
			OR idsls_before = ''
			OR nama_sls_before IS NULL
			OR nama_sls_before = ''
		`;

		console.log(`Cleaned ${result.rowCount} invalid records`);

		// Check remaining records
		const countResult = await sql`SELECT COUNT(*) as total FROM frs`;
		console.log(`Remaining valid records: ${countResult[0].total}`);

		// Show a few sample records
		const sampleRecords = await sql`SELECT * FROM frs LIMIT 5`;
		console.log('Sample records:');
		sampleRecords.forEach(record => {
			console.log(`- ${record.idsls_before}: ${record.nama_sls_before} -> ${record.idsls_after}: ${record.nama_sls_after}`);
		});

		console.log('\n✅ FRS data cleaning completed successfully!');
	} catch (error) {
		console.error('Error cleaning FRS data:', error);
		process.exit(1);
	}
}

// Run the cleaning
cleanFRSData();