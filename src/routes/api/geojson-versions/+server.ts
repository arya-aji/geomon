import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { geojsonVersions, geojsonRevisions, processedGeojson } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const sql = neon(env.DATABASE_URL || '');
const db = drizzle(sql);

export async function GET({ url }: { url: URL }) {
	try {
		const fileId = url.searchParams.get('fileId');
		const versionId = url.searchParams.get('versionId');

		if (!fileId && !versionId) {
			return error(400, 'Either fileId or versionId is required');
		}

		if (versionId) {
			// Get specific version details
			const version = await db
				.select({
					id: geojsonVersions.id,
					fileId: geojsonVersions.fileId,
					versionNumber: geojsonVersions.versionNumber,
					geojsonData: geojsonVersions.geojsonData,
					anomalySummary: geojsonVersions.anomalySummary,
					processingMetadata: geojsonVersions.processingMetadata,
					createdBy: geojsonVersions.createdBy,
					changeNotes: geojsonVersions.changeNotes,
					createdAt: geojsonVersions.createdAt,
					originalFilename: processedGeojson.originalFilename,
					districtCode: processedGeojson.districtCode,
					districtName: processedGeojson.districtName,
					kecamatanName: processedGeojson.kecamatanName,
					kabupatenName: processedGeojson.kabupatenName
				})
				.from(geojsonVersions)
				.leftJoin(processedGeojson, eq(geojsonVersions.fileId, processedGeojson.id))
				.where(eq(geojsonVersions.id, parseInt(versionId)))
				.limit(1);

			if (version.length === 0) {
				return error(404, 'Version not found');
			}

			return json({
				success: true,
				version: version[0]
			});
		}

		if (fileId) {
			// Get all versions for a file
			const versions = await db
				.select({
					id: geojsonVersions.id,
					versionNumber: geojsonVersions.versionNumber,
					anomalySummary: geojsonVersions.anomalySummary,
					processingMetadata: geojsonVersions.processingMetadata,
					createdBy: geojsonVersions.createdBy,
					changeNotes: geojsonVersions.changeNotes,
					createdAt: geojsonVersions.createdAt
				})
				.from(geojsonVersions)
				.where(eq(geojsonVersions.fileId, parseInt(fileId)))
				.orderBy(desc(geojsonVersions.versionNumber));

			// Get revision history
			const revisions = await db
				.select({
					id: geojsonRevisions.id,
					revisionType: geojsonRevisions.revisionType,
					changesSummary: geojsonRevisions.changesSummary,
					createdBy: geojsonRevisions.createdBy,
					createdAt: geojsonRevisions.createdAt,
					fromVersionNumber: geojsonVersions.versionNumber
				})
				.from(geojsonRevisions)
				.leftJoin(geojsonVersions, eq(geojsonRevisions.fromVersionId, geojsonVersions.id))
				.where(eq(geojsonRevisions.fileId, parseInt(fileId)))
				.orderBy(desc(geojsonRevisions.createdAt));

			// Get file details
			const file = await db
				.select({
					id: processedGeojson.id,
					originalFilename: processedGeojson.originalFilename,
					districtCode: processedGeojson.districtCode,
					districtName: processedGeojson.districtName,
					kecamatanName: processedGeojson.kecamatanName,
					kabupatenName: processedGeojson.kabupatenName,
					isActive: processedGeojson.isActive,
					createdAt: processedGeojson.createdAt,
					updatedAt: processedGeojson.updatedAt
				})
				.from(processedGeojson)
				.where(eq(processedGeojson.id, parseInt(fileId)))
				.limit(1);

			if (file.length === 0) {
				return error(404, 'File not found');
			}

			return json({
				success: true,
				file: file[0],
				versions,
				revisions
			});
		}

		return error(400, 'Invalid request');

	} catch (err) {
		console.error('Error fetching version history:', err);
		if (err instanceof Error) {
			console.error('Error details:', err.message);
			return error(500, `Internal server error: ${err.message}`);
		} else {
			console.error('Error details:', err);
			return error(500, 'Internal server error');
		}
	}
}

export async function POST({ request }: { request: Request }) {
	try {
		const body = await request.json();
		const { fileId, versionId } = body;

		if (!fileId || !versionId) {
			return error(400, 'fileId and versionId are required');
		}

		// Get the specific version
		const version = await db
			.select()
			.from(geojsonVersions)
			.where(eq(geojsonVersions.id, parseInt(versionId)))
			.limit(1);

		if (version.length === 0) {
			return error(404, 'Version not found');
		}

		// Update the file to point to this version
		await db
			.update(processedGeojson)
			.set({
				currentVersionId: parseInt(versionId),
				updatedAt: new Date()
			})
			.where(eq(processedGeojson.id, parseInt(fileId)));

		// Create a revision record for the rollback
		await db.insert(geojsonRevisions).values({
			fileId: parseInt(fileId),
			fromVersionId: null, // This is a rollback to a previous version
			toVersionId: parseInt(versionId),
			revisionType: 'rollback',
			changesSummary: {
				rollbackToVersion: version[0].versionNumber,
				timestamp: new Date().toISOString()
			},
			createdBy: 'system',
			createdAt: new Date()
		});

		return json({
			success: true,
			message: `Successfully rolled back to version ${version[0].versionNumber}`
		});

	} catch (err) {
		console.error('Error rolling back version:', err);
		return error(500, 'Internal server error');
	}
}