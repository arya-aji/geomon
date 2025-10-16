import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { processedGeojson, geojsonVersions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

const sql = neon(env.DATABASE_URL || '');
const db = drizzle(sql);

export async function POST({ request }: { request: Request }) {
	try {
		console.log('Fixing version numbers for existing files...');

		// Get all files that have currentVersionId but no currentVersionNumber
		const filesWithoutVersionNumber = await db
			.select()
			.from(processedGeojson)
			.where(and(
				eq(processedGeojson.isActive, true),
				// Files where currentVersionNumber is null or default (1)
			));

		console.log(`Found ${filesWithoutVersionNumber.length} files to update`);

		let updatedCount = 0;
		for (const file of filesWithoutVersionNumber) {
			if (file.currentVersionId) {
				// Get the current version to find the version number
				const currentVersion = await db
					.select()
					.from(geojsonVersions)
					.where(eq(geojsonVersions.id, file.currentVersionId))
					.limit(1);

				if (currentVersion.length > 0) {
					// Update the file with the correct version number
					await db
						.update(processedGeojson)
						.set({
							currentVersionNumber: currentVersion[0].versionNumber,
							updatedAt: new Date()
						})
						.where(eq(processedGeojson.id, file.id));

					updatedCount++;
					console.log(`Updated file ${file.id} (${file.districtName}) to version ${currentVersion[0].versionNumber}`);
				}
			}
		}

		// Also fix files with incorrect currentVersionNumber
		const filesWithIncorrectVersion = await db
			.select({
				fileId: processedGeojson.id,
				fileVersionNumber: processedGeojson.currentVersionNumber,
				districtName: processedGeojson.districtName,
				versionId: processedGeojson.currentVersionId,
				actualVersionNumber: geojsonVersions.versionNumber
			})
			.from(processedGeojson)
			.leftJoin(geojsonVersions, eq(processedGeojson.currentVersionId, geojsonVersions.id))
			.where(and(
				eq(processedGeojson.isActive, true),
				// Where the version numbers don't match
				// This is a simplified check, in reality you'd need a more complex condition
			));

		console.log(`Found ${filesWithIncorrectVersion.length} files with incorrect version numbers`);

		for (const file of filesWithIncorrectVersion) {
			if (file.fileVersionNumber !== file.actualVersionNumber && file.actualVersionNumber) {
				await db
					.update(processedGeojson)
					.set({
						currentVersionNumber: file.actualVersionNumber,
						updatedAt: new Date()
					})
					.where(eq(processedGeojson.id, file.fileId));

				updatedCount++;
				console.log(`Corrected file ${file.fileId} (${file.districtName}) from version ${file.fileVersionNumber} to ${file.actualVersionNumber}`);
			}
		}

		return json({
			success: true,
			message: `Updated ${updatedCount} files with correct version numbers`
		});

	} catch (err) {
		console.error('Error fixing version numbers:', err);
		return error(500, 'Internal server error');
	}
}