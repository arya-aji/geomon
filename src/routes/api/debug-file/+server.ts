import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { processedGeojson, geojsonVersions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const sql = neon(env.DATABASE_URL || '');
const db = drizzle(sql);

export async function GET({ url }: { url: URL }) {
	try {
		const fileId = url.searchParams.get('fileId');

		if (!fileId) {
			return error(400, 'Missing fileId parameter');
		}

		console.log(`Debugging file ID: ${fileId}`);

		// Get file details
		const fileDetails = await db
			.select()
			.from(processedGeojson)
			.where(eq(processedGeojson.id, parseInt(fileId)))
			.limit(1);

		console.log('File details:', fileDetails[0]);

		// Get version details
		const versionDetails = await db
			.select()
			.from(geojsonVersions)
			.where(eq(geojsonVersions.fileId, parseInt(fileId)))
			.orderBy(geojsonVersions.versionNumber);

		console.log('Version details:', versionDetails);

		return json({
			success: true,
			file: fileDetails[0],
			versions: versionDetails,
			debug: {
				fileCount: fileDetails.length,
				versionCount: versionDetails.length,
				districtName: fileDetails[0]?.districtName,
				kecamatanName: fileDetails[0]?.kecamatanName,
				currentVersionId: fileDetails[0]?.currentVersionId,
				currentVersionNumber: fileDetails[0]?.currentVersionNumber
			}
		});

	} catch (err) {
		console.error('Error debugging file:', err);
		return error(500, 'Internal server error');
	}
}