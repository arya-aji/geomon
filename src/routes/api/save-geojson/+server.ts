import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { processedGeojson, geojsonVersions, geojsonRevisions } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const sql = neon(env.DATABASE_URL || '');
const db = drizzle(sql);

interface SaveGeojsonRequest {
	geojsonData: any; // GeoJSON object
	anomalies: any[]; // Array of anomalies found
	anomalySummary: any; // Summary statistics
	originalFilename: string;
	districtCode: string;
	districtName?: string;
	kecamatanName?: string;
	kabupatenName?: string;
	desaaName?: string;
	userId?: string;
	changeNotes?: string;
	revisionType?: 'correction' | 'update' | 'new_data';
	existingFileId?: number; // For updating existing files
}

export async function POST({ request }: { request: Request }) {
	try {
		console.log('Saving processed GeoJSON...');

		const body: SaveGeojsonRequest = await request.json();

		if (!body.geojsonData || !body.originalFilename) {
			return error(400, 'Missing required fields: geojsonData, originalFilename');
		}

		let fileId: number;
		let versionNumber: number;
		let isNewFile = false;

		if (body.existingFileId) {
			// Update existing file
			const existingFile = await db
				.select()
				.from(processedGeojson)
				.where(eq(processedGeojson.id, body.existingFileId!))
				.limit(1);

			if (existingFile.length === 0) {
				throw new Error('Existing file not found');
			}

			fileId = existingFile[0].id;

			// Get current version number
			const latestVersion = await db
				.select()
				.from(geojsonVersions)
				.where(eq(geojsonVersions.fileId, fileId))
				.orderBy(desc(geojsonVersions.versionNumber))
				.limit(1);

			versionNumber = (latestVersion[0]?.versionNumber || 0) + 1;

			// Create revision record
			if (latestVersion.length > 0) {
				await db.insert(geojsonRevisions).values({
					fileId,
					fromVersionId: latestVersion[0].id,
					toVersionId: null, // Will be updated after creating new version
					revisionType: body.revisionType || 'update',
					changesSummary: {
						anomaliesFixed: body.anomalies.length,
						totalAnomalies: body.anomalySummary?.total || 0,
						timestamp: new Date().toISOString()
					},
					createdBy: body.userId || 'anonymous',
					createdAt: new Date()
				});
			}

			// Update file record
			await db
				.update(processedGeojson)
				.set({
					updatedAt: new Date()
				})
				.where(eq(processedGeojson.id, fileId));

		} else {
			// Create new file record
			isNewFile = true;
			const newFile = await db
				.insert(processedGeojson)
				.values({
					userId: body.userId || 'anonymous',
					originalFilename: body.originalFilename,
					districtCode: body.districtCode || 'unknown',
					districtName: body.districtName || 'unknown',
					kecamatanName: body.kecamatanName || 'unknown',
					kabupatenName: body.kabupatenName || 'unknown',
					desaaName: body.desaaName || 'unknown',
					currentVersionId: null, // Will be updated after creating version
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			fileId = newFile[0].id;
			versionNumber = 1;
		}

		// Create new version record
		const newVersion = await db
			.insert(geojsonVersions)
			.values({
				fileId,
				versionNumber,
				geojsonData: body.geojsonData,
				anomalySummary: {
					total: body.anomalySummary?.total || 0,
					byType: body.anomalySummary?.byType || {},
					bySeverity: body.anomalySummary?.bySeverity || {},
					timestamp: new Date().toISOString()
				},
				processingMetadata: {
					originalFilename: body.originalFilename,
					districtCode: body.districtCode,
					anomalies: body.anomalies,
					processedAt: new Date().toISOString(),
					featureCount: body.geojsonData?.features?.length || 0
				},
				createdBy: body.userId || 'anonymous',
				changeNotes: body.changeNotes || (isNewFile ? 'Initial upload' : 'Updated version'),
				createdAt: new Date()
			})
			.returning();

		// Update file record with current version ID
		await db
			.update(processedGeojson)
			.set({
				currentVersionId: newVersion[0].id
			})
			.where(eq(processedGeojson.id, fileId));

		// Update revision record with to_version_id if it exists
		if (!isNewFile) {
			const revision = await db
				.select()
				.from(geojsonRevisions)
				.where(and(
					eq(geojsonRevisions.fileId, fileId),
					eq(geojsonRevisions.toVersionId, null as any)
				))
				.limit(1);

			if (revision.length > 0) {
				await db
					.update(geojsonRevisions)
					.set({
						toVersionId: newVersion[0].id
					})
					.where(eq(geojsonRevisions.id, revision[0].id));
			}
		}

		console.log(`Successfully saved GeoJSON file ${fileId}, version ${versionNumber}`);

		return json({
			success: true,
			fileId,
			versionNumber,
			isNewFile,
			message: isNewFile
				? 'File uploaded successfully'
				: 'File updated successfully'
		});

	} catch (err) {
		console.error('Error saving GeoJSON:', err);
		if (err instanceof Error) {
			console.error('Error details:', err.message);
			console.error('Error stack:', err.stack);
			return error(500, `Internal server error: ${err.message}`);
		} else {
			console.error('Error details:', err);
			return error(500, 'Internal server error');
		}
	}
}

export async function GET({ url }: { url: URL }) {
	try {
		const fileId = url.searchParams.get('fileId');
		const userId = url.searchParams.get('userId');

		let query = db
			.select({
				id: processedGeojson.id,
				originalFilename: processedGeojson.originalFilename,
				districtCode: processedGeojson.districtCode,
				districtName: processedGeojson.districtName,
				kecamatanName: processedGeojson.kecamatanName,
				kabupatenName: processedGeojson.kabupatenName,
				desaaName: processedGeojson.desaaName,
				isActive: processedGeojson.isActive,
				createdAt: processedGeojson.createdAt,
				updatedAt: processedGeojson.updatedAt,
				currentVersionNumber: geojsonVersions.versionNumber,
				currentVersionCreatedAt: geojsonVersions.createdAt
			})
			.from(processedGeojson)
			.leftJoin(geojsonVersions, eq(processedGeojson.currentVersionId, geojsonVersions.id));

		if (fileId) {
			query = query.where(eq(processedGeojson.id, parseInt(fileId)));
		}

		if (userId) {
			query = query.where(eq(processedGeojson.userId, userId));
		}

		const files = await query.orderBy(desc(processedGeojson.updatedAt)).limit(50);

		return json({
			success: true,
			files
		});

	} catch (err) {
		console.error('Error fetching GeoJSON files:', err);
		return error(500, 'Internal server error');
	}
}