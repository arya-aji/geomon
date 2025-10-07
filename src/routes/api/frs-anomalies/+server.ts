import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sipw, frs } from '$lib/server/db/schema';
import { eq, and, not } from 'drizzle-orm';

const neonSql = neon(env.DATABASE_URL || '');
const db = drizzle(neonSql);

// FRS status type mapping
const statusTypes: Record<number, string> = {
	1: 'Pemekaran SLS',
	2: 'Penggabungan SLS',
	3: 'Perubahan Jenis SLS',
	4: 'Perubahan Tingkatan SLS',
	5: 'Perubahan Kode SLS',
	6: 'Perubahan Ketua SLS/Perubahan Nama SLS'
};

export async function POST({ request }: { request: Request }) {
	try {
		console.log('Fetching FRS-related anomalies for uploaded GeoJSON...');

		const body = await request.json();
		const { geoJsonIdsls } = body; // Array of idsubsls from uploaded GeoJSON

		if (!geoJsonIdsls || !Array.isArray(geoJsonIdsls)) {
			return error(400, 'Missing or invalid geoJsonIdsls array');
		}

		console.log(`Checking FRS anomalies for ${geoJsonIdsls.length} GeoJSON features`);

		// Get SIPW records that match the GeoJSON idsubsls (LEFT JOIN logic)
		let allMatchingSipwRecords = [];
		for (const idsubsls of geoJsonIdsls) {
			const records = await db
				.select()
				.from(sipw)
				.where(eq(sipw.idsubsls, idsubsls));
			allMatchingSipwRecords.push(...records);
		}

		console.log(`Found ${allMatchingSipwRecords.length} SIPW records matching GeoJSON`);

		const anomalies = [];

		// Get all FRS records (excluding status 6)
		const frsRecords = await db.select().from(frs).where(not(eq(frs.status, 6)));
		console.log(`Found ${frsRecords.length} FRS records (excluding status 6)`);

		for (const sipwRecord of allMatchingSipwRecords) {
			// Find FRS records that match this SLS ID
			const matchingFrsRecords = frsRecords.filter(
				frs => frs.idsls_before === sipwRecord.idsls
			);

			for (const frsRecord of matchingFrsRecords) {
				// Determine what action the user should take based on FRS status
				let actionRequired = '';
				let severity = 'medium';

				switch (frsRecord.status) {
					case 1: // Pemekaran SLS
						actionRequired = `SLS ${frsRecord.idsls_before} telah dimekarkan. Periksa data dan pastikan pembagian area sudah sesuai dengan ${frsRecord.idsls_after} (${frsRecord.nama_sls_after})`;
						severity = 'high';
						break;
					case 2: // Penggabungan SLS
						actionRequired = `SLS ${frsRecord.idsls_before} akan digabungkan dengan ${frsRecord.idsls_after}. Data lama akan dihapus. Siapkan untuk migrasi ke ${frsRecord.nama_sls_after}`;
						severity = 'high';
						break;
					case 3: // Perubahan Jenis SLS
						actionRequired = `Jenis SLS ${frsRecord.idsls_before} telah berubah. Perbarui klasifikasi data sesuai dengan ketentuan baru`;
						severity = 'medium';
						break;
					case 4: // Perubahan Tingkatan SLS
						actionRequired = `Tingkatan SLS ${frsRecord.idsls_before} telah berubah. Sesuaikan data administratif sesuai level baru`;
						severity = 'medium';
						break;
					case 5: // Perubahan Kode SLS
						actionRequired = `Kode SLS berubah dari ${frsRecord.idsls_before} menjadi ${frsRecord.idsls_after}. Update semua referensi data`;
						severity = 'low';
						break;
				}

				anomalies.push({
					id: sipwRecord.id,
					idsubsls: sipwRecord.idsubsls,
					nmsls: sipwRecord.nmsls,
					idsls: sipwRecord.idsls,
					kdprov: sipwRecord.kdprov,
					kdkab: sipwRecord.kdkab,
					nmkab: sipwRecord.nmkab,
					type: 'frs_change',
					title: `${statusTypes[frsRecord.status]} - ${frsRecord.idsls_before}`,
					description: actionRequired,
					severity: severity,
					frsData: {
						status: frsRecord.status,
						statusText: statusTypes[frsRecord.status],
						idsls_before: frsRecord.idsls_before,
						nama_sls_before: frsRecord.nama_sls_before,
						idsls_after: frsRecord.idsls_after,
						nama_sls_after: frsRecord.nama_sls_after,
						ketua_sls: frsRecord.ketua_sls,
						createdAt: frsRecord.createdAt
					},
					sipwData: {
						nks: sipwRecord.nks,
						geometry: sipwRecord.geometry
					},
					createdAt: frsRecord.createdAt
				});
			}
		}

		// Rule: Check for idsls mismatches between GeoJSON and FRS
		for (const frsRecord of frsRecords) {
			// Check if idsls_after should exist in GeoJSON but doesn't
			if (frsRecord.idsls_after) {
				const idslsAfterInGeoJson = allMatchingSipwRecords.some(
					sipw => sipw.idsls === frsRecord.idsls_after
				);

				if (!idslsAfterInGeoJson) {
					// This is an anomaly: idsls_after from FRS should be in GeoJSON but isn't
					anomalies.push({
						id: `mismatch-idsls-after-${frsRecord.idsls_after}`,
						idsubsls: null,
						nmsls: frsRecord.nama_sls_after,
						idsls: frsRecord.idsls_after,
						kdprov: allMatchingSipwRecords[0]?.kdprov || null,
						kdkab: allMatchingSipwRecords[0]?.kdkab || null,
						nmkab: allMatchingSipwRecords[0]?.nmkab || null,
						type: 'idsls_mismatch_after',
						title: `ID SLS Baru Tidak Ada di GeoJSON - ${frsRecord.idsls_after}`,
						description: `SLS ${frsRecord.idsls_after} (${frsRecord.nama_sls_after}) seharusnya ada di GeoJSON sebagai hasil ${statusTypes[frsRecord.status].toLowerCase()} dari ${frsRecord.idsls_before}, tapi tidak ditemukan. Periksa apakah data GeoJSON sudah diperbarui.`,
						severity: 'high',
						frsData: {
							status: frsRecord.status,
							statusText: statusTypes[frsRecord.status],
							idsls_before: frsRecord.idsls_before,
							nama_sls_before: frsRecord.nama_sls_before,
							idsls_after: frsRecord.idsls_after,
							nama_sls_after: frsRecord.nama_sls_after,
							ketua_sls: frsRecord.ketua_sls,
							createdAt: frsRecord.createdAt
						},
						sipwData: null,
						createdAt: frsRecord.createdAt
					});
				}
			}

			// Check if idsls_before still exists in GeoJSON when it shouldn't (for certain statuses)
			if (frsRecord.idsls_before && [1, 2].includes(frsRecord.status)) { // Pemekaran or Penggabungan
				const idslsBeforeInGeoJson = allMatchingSipwRecords.some(
					sipw => sipw.idsls === frsRecord.idsls_before
				);

				if (idslsBeforeInGeoJson) {
					let actionRequired = '';
					switch (frsRecord.status) {
						case 1: // Pemekaran
							actionRequired = `SLS ${frsRecord.idsls_before} sudah dimekarkan menjadi ${frsRecord.idsls_after}. Hapus atau perbarui data lama di GeoJSON.`;
							break;
						case 2: // Penggabungan
							actionRequired = `SLS ${frsRecord.idsls_before} sudah digabungkan ke ${frsRecord.idsls_after}. Hapus data lama di GeoJSON.`;
							break;
					}

					// This is an anomaly: idsls_before should not exist in GeoJSON anymore
					const oldSlsRecords = allMatchingSipwRecords.filter(
						sipw => sipw.idsls === frsRecord.idsls_before
					);

					for (const oldSlsRecord of oldSlsRecords) {
						anomalies.push({
							id: `mismatch-idsls-before-${oldSlsRecord.idsubsls}`,
							idsubsls: oldSlsRecord.idsubsls,
							nmsls: oldSlsRecord.nmsls,
							idsls: oldSlsRecord.idsls,
							kdprov: oldSlsRecord.kdprov,
							kdkab: oldSlsRecord.kdkab,
							nmkab: oldSlsRecord.nmkab,
							type: 'idsls_mismatch_before',
							title: `ID SLS Lama Masih Ada - ${frsRecord.idsls_before}`,
							description: actionRequired,
							severity: 'medium',
							frsData: {
								status: frsRecord.status,
								statusText: statusTypes[frsRecord.status],
								idsls_before: frsRecord.idsls_before,
								nama_sls_before: frsRecord.nama_sls_before,
								idsls_after: frsRecord.idsls_after,
								nama_sls_after: frsRecord.nama_sls_after,
								ketua_sls: frsRecord.ketua_sls,
								createdAt: frsRecord.createdAt
							},
							sipwData: {
								nks: oldSlsRecord.nks,
								geometry: oldSlsRecord.geometry
							},
							createdAt: frsRecord.createdAt
						});
					}
				}
			}
		}

		// Also check for missing SLS after merges (status 2) for the uploaded area
		for (const frsRecord of frsRecords) {
			if (frsRecord.status === 2 && frsRecord.idsls_after) {
				// Check if this merge affects any of our uploaded areas
				const affectedAreas = allMatchingSipwRecords.filter(
					sipw => sipw.idsls === frsRecord.idsls_before
				);

				if (affectedAreas.length > 0) {
					// Check if the new SLS exists in SIPW
					const newSlsExists = await db
						.select()
						.from(sipw)
						.where(eq(sipw.idsls, frsRecord.idsls_after));

					if (newSlsExists.length === 0) {
						anomalies.push({
							id: `missing-${frsRecord.idsls_after}`,
							idsubsls: null,
							nmsls: frsRecord.nama_sls_after,
							idsls: frsRecord.idsls_after,
							kdprov: affectedAreas[0].kdprov,
							kdkab: affectedAreas[0].kdkab,
							nmkab: affectedAreas[0].nmkab,
							type: 'missing_sls_after_merge',
							title: `SLS Baru Belum Ada di SIPW - ${frsRecord.idsls_after}`,
							description: `SLS ${frsRecord.idsls_after} (${frsRecord.nama_sls_after}) seharusnya ada setelah penggabungan ${frsRecord.idsls_before}, tapi belum ditemukan dalam data SIPW. Segera tambahkan data SLS baru ini.`,
							severity: 'high',
							frsData: {
								status: frsRecord.status,
								statusText: statusTypes[frsRecord.status],
								idsls_before: frsRecord.idsls_before,
								nama_sls_before: frsRecord.nama_sls_before,
								idsls_after: frsRecord.idsls_after,
								nama_sls_after: frsRecord.nama_sls_after,
								ketua_sls: frsRecord.ketua_sls,
								createdAt: frsRecord.createdAt
							},
							sipwData: null,
							createdAt: frsRecord.createdAt
						});
					}
				}
			}
		}

		console.log(`Found ${anomalies.length} FRS-related anomalies for uploaded GeoJSON`);
		return json(anomalies);
	} catch (err) {
		console.error('Error fetching FRS anomalies:', err);
		if (err instanceof Error) {
			console.error('Error details:', err.message);
			return error(500, `Internal server error: ${err.message}`);
		} else {
			console.error('Error details:', err);
			return error(500, 'Internal server error');
		}
	}
}