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
	return value.trim();
}

async function importSIPWData() {
	console.log('Starting SIPW data import...');

	const csvFilePath = path.join(__dirname, '../data/SIPW.csv');
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
				.pipe(csv({ separator: ',' }))
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
				// Transform CSV data to match database schema
				const sipwData = {
					idsubsls: cleanString(row.id_subsls),
					idfrs: cleanString(row.idfrs),
					idsls: cleanString(row.idsls),
					kdprov: cleanString(row.kdprov),
					kdkab: cleanString(row.kdkab),
					kdkec: cleanString(row.kdkec),
					kddesa: cleanString(row.kddesa),
					kdsls: cleanString(row.kdsls),
					klas: parseInteger(row.klas),
					nmprov: cleanString(row.nmprov),
					nmkab: cleanString(row.nmkab),
					nmkec: cleanString(row.nmkec),
					nmdesa: cleanString(row.nmdesa),
					nama_sls: cleanString(row.nama_sls),
					jenis_sls: cleanString(row.jenis_sls),
					ketua_sls: cleanString(row.ketua_sls),
					semester_id: parseInteger(row.semester_id),
					semester: cleanString(row.semester),
					j_subsls: parseInteger(row.j_subsls),
					muatan_kk: parseInteger(row.muatan_kk),
					btt: parseInteger(row.btt),
					btt_kosong: parseInteger(row.btt_kosong),
					bku: parseInteger(row.bku),
					bbtt_non_usaha: parseInteger(row.bbtt_non_usaha),
					muatan_usaha: parseInteger(row.muatan_usaha),
					muatan_total: parseInteger(row.muatan_total),
					nama_wke: cleanString(row.nama_wke),
					jam_operasional: cleanString(row.jam_operasional),
					jumlah_shift: parseInteger(row.jumlah_shift),
					telepon_email: cleanString(row.telepon_email),
					muatan_dominan: parseInteger(row.muatan_dominan),
					flag_perubahan_sls: parseInteger(row.flag_perubahan_sls),
					is_deleted: parseInteger(row.is_deleted),
					kd_subsls: cleanString(row.kd_subsls)
				};

				// Insert data into database
				await sql`
          INSERT INTO sipw (
            idsubsls, idfrs, idsls, kdprov, kdkab, kdkec, kddesa, kdsls, klas,
            nmprov, nmkab, nmkec, nmdesa, nama_sls, jenis_sls, ketua_sls,
            semester_id, semester, j_subsls, muatan_kk, btt, btt_kosong, bku,
            bbtt_non_usaha, muatan_usaha, muatan_total, nama_wke, jam_operasional,
            jumlah_shift, telepon_email, muatan_dominan, flag_perubahan_sls,
            is_deleted, kd_subsls, created_at, updated_at
          ) VALUES (
            ${sipwData.idsubsls}, ${sipwData.idfrs}, ${sipwData.idsls},
            ${sipwData.kdprov}, ${sipwData.kdkab}, ${sipwData.kdkec},
            ${sipwData.kddesa}, ${sipwData.kdsls}, ${sipwData.klas},
            ${sipwData.nmprov}, ${sipwData.nmkab}, ${sipwData.nmkec},
            ${sipwData.nmdesa}, ${sipwData.nama_sls}, ${sipwData.jenis_sls},
            ${sipwData.ketua_sls}, ${sipwData.semester_id}, ${sipwData.semester},
            ${sipwData.j_subsls}, ${sipwData.muatan_kk}, ${sipwData.btt},
            ${sipwData.btt_kosong}, ${sipwData.bku}, ${sipwData.bbtt_non_usaha},
            ${sipwData.muatan_usaha}, ${sipwData.muatan_total}, ${sipwData.nama_wke},
            ${sipwData.jam_operasional}, ${sipwData.jumlah_shift},
            ${sipwData.telepon_email}, ${sipwData.muatan_dominan},
            ${sipwData.flag_perubahan_sls}, ${sipwData.is_deleted},
            ${sipwData.kd_subsls}, NOW(), NOW()
          )
          ON CONFLICT (idsubsls) DO UPDATE SET
            idfrs = EXCLUDED.idfrs,
            idsls = EXCLUDED.idsls,
            kdprov = EXCLUDED.kdprov,
            kdkab = EXCLUDED.kdkab,
            kdkec = EXCLUDED.kdkec,
            kddesa = EXCLUDED.kddesa,
            kdsls = EXCLUDED.kdsls,
            klas = EXCLUDED.klas,
            nmprov = EXCLUDED.nmprov,
            nmkab = EXCLUDED.nmkab,
            nmkec = EXCLUDED.nmkec,
            nmdesa = EXCLUDED.nmdesa,
            nama_sls = EXCLUDED.nama_sls,
            jenis_sls = EXCLUDED.jenis_sls,
            ketua_sls = EXCLUDED.ketua_sls,
            semester_id = EXCLUDED.semester_id,
            semester = EXCLUDED.semester,
            j_subsls = EXCLUDED.j_subsls,
            muatan_kk = EXCLUDED.muatan_kk,
            btt = EXCLUDED.btt,
            btt_kosong = EXCLUDED.btt_kosong,
            bku = EXCLUDED.bku,
            bbtt_non_usaha = EXCLUDED.bbtt_non_usaha,
            muatan_usaha = EXCLUDED.muatan_usaha,
            muatan_total = EXCLUDED.muatan_total,
            nama_wke = EXCLUDED.nama_wke,
            jam_operasional = EXCLUDED.jam_operasional,
            jumlah_shift = EXCLUDED.jumlah_shift,
            telepon_email = EXCLUDED.telepon_email,
            muatan_dominan = EXCLUDED.muatan_dominan,
            flag_perubahan_sls = EXCLUDED.flag_perubahan_sls,
            is_deleted = EXCLUDED.is_deleted,
            kd_subsls = EXCLUDED.kd_subsls,
            updated_at = NOW()
        `;

				importedCount++;

				// Progress indicator
				if ((i + 1) % 100 === 0) {
					console.log(`Processed ${i + 1}/${results.length} records...`);
				}
			} catch (error) {
				console.error(`Error importing row ${i + 1} (${row.idsubsls}):`, error.message);
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
importSIPWData();
