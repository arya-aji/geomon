import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { neon } from '@neondatabase/serverless';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read database URL from environment
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL environment variable is not set');
	process.exit(1);
}

// Create database connection
const sql = neon(databaseUrl);

// Function to parse integer values safely
function parseInteger(value) {
	if (value === '' || value === null || value === undefined || value === '-') {
		return null;
	}
	const parsed = parseInt(value, 10);
	return isNaN(parsed) ? null : parsed;
}

// Function to clean string values
function cleanString(value) {
	if (value === '' || value === null || value === undefined || value === '-') {
		return null;
	}
	// Remove BOM and other invisible characters
	return value.replace(/^\uFEFF/, '').trim();
}

// Function to clean CSV field names
function cleanFieldName(fieldName) {
	if (fieldName === '' || fieldName === null || fieldName === undefined) {
		return fieldName;
	}
	// Remove BOM and other invisible characters from field names
	return fieldName.replace(/^\uFEFF/, '').trim();
}

async function importFRSData() {
	console.log('Starting FRS data import...');

	const csvFilePath = path.join(__dirname, '../data/FRS.csv');
	const results = [];
	let importedCount = 0;
	let errorCount = 0;

	try {
		// Check if CSV file exists
		if (!fs.existsSync(csvFilePath)) {
			console.error(`CSV file not found: ${csvFilePath}`);
			process.exit(1);
		}

		// Read and parse CSV file
		console.log('Reading CSV file...');

		await new Promise((resolve, reject) => {
			fs.createReadStream(csvFilePath)
				.pipe(csv({ separator: ';' }))
				.on('data', (data) => {
					results.push(data);
				})
				.on('end', resolve)
				.on('error', reject);
		});

		console.log(`Found ${results.length} records to import`);

		// Process each row and insert into database
		for (let i = 0; i < results.length; i++) {
			const row = results[i];

			try {
				// Handle BOM in field names - find the correct field name
				const idslsBeforeField = Object.keys(row).find(key => cleanFieldName(key) === 'idsls_before');
				const namaSlsBeforeField = Object.keys(row).find(key => cleanFieldName(key) === 'nama_sls_before');
				const idslsAfterField = Object.keys(row).find(key => cleanFieldName(key) === 'idsls_after');
				const namaSlsAfterField = Object.keys(row).find(key => cleanFieldName(key) === 'nama_sls_after');
				const ketuaSlsField = Object.keys(row).find(key => cleanFieldName(key) === 'ketua_sls');
				const statusField = Object.keys(row).find(key => cleanFieldName(key) === 'status');

				
				// Skip empty rows or header rows (after cleaning BOM)
				const cleanedIdslsBefore = cleanString(row[idslsBeforeField]);
				if (!cleanedIdslsBefore || cleanedIdslsBefore === 'idsls_before' || cleanedIdslsBefore === '') {
					continue;
				}

				// Transform CSV data to match database schema
				const frsData = {
					idsls_before: cleanedIdslsBefore,
					nama_sls_before: cleanString(row[namaSlsBeforeField]),
					idsls_after: cleanString(row[idslsAfterField]),
					nama_sls_after: cleanString(row[namaSlsAfterField]),
					ketua_sls: cleanString(row[ketuaSlsField]),
					status: parseInteger(row[statusField])
				};

				// Insert data into database
				await sql`
          INSERT INTO frs (
            idsls_before, nama_sls_before, idsls_after, nama_sls_after, ketua_sls, status, created_at, updated_at
          ) VALUES (
            ${frsData.idsls_before}, ${frsData.nama_sls_before}, ${frsData.idsls_after},
            ${frsData.nama_sls_after}, ${frsData.ketua_sls}, ${frsData.status}, NOW(), NOW()
          )
        `;

				importedCount++;

				// Progress indicator
				if ((i + 1) % 100 === 0) {
					console.log(`Processed ${i + 1}/${results.length} records...`);
				}
			} catch (error) {
				console.error(`Error importing row ${i + 1} (${row.idsls_before}):`, error.message);
				errorCount++;
			}
		}

		console.log('\n=== Import Summary ===');
		console.log(`Total records processed: ${results.length}`);
		console.log(`Successfully imported: ${importedCount}`);
		console.log(`Errors encountered: ${errorCount}`);

		if (importedCount > 0) {
			console.log('\n✅ Import completed successfully!');
		} else {
			console.log('\n❌ Import failed - no records were imported');
		}
	} catch (error) {
		console.error('Fatal error during import:', error);
		process.exit(1);
	}
}

// Run the import
importFRSData();