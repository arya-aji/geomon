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

async function checkImport() {
	try {
		console.log('Checking SIPW table...');

		// Get total count
		const countResult = await sql`SELECT COUNT(*) as total FROM sipw`;
		console.log(`Total records in sipw table: ${countResult[0].total}`);

		if (countResult[0].total > 0) {
			// Get sample records
			const sampleRecords = await sql`
        SELECT idsubsls, kddesa, nmdesa, semester, muatan_kk
        FROM sipw
        LIMIT 5
      `;

			console.log('\nSample records:');
			sampleRecords.forEach((record, index) => {
				console.log(
					`${index + 1}. ID: ${record.idsubsls}, District: ${record.nmdesa} (${record.kddesa}), Semester: ${record.semester}, Households: ${record.muatan_kk}`
				);
			});

			// Get unique districts count
			const districtCount = await sql`SELECT COUNT(DISTINCT kddesa) as district_count FROM sipw`;
			console.log(`\nUnique districts: ${districtCount[0].district_count}`);

			// Get semester breakdown
			const semesterBreakdown = await sql`
        SELECT semester, COUNT(*) as count
        FROM sipw
        GROUP BY semester
        ORDER BY semester
      `;

			console.log('\nRecords by semester:');
			semesterBreakdown.forEach((row) => {
				console.log(`  ${row.semester}: ${row.count} records`);
			});
		}
	} catch (error) {
		console.error('Error checking import:', error);
	}
}

checkImport();
