import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { geojsonVersions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const sql = neon(env.DATABASE_URL || '');
const db = drizzle(sql);

interface UpdateAnomalySummaryRequest {
	versionId: number;
	anomalySummary: {
		total: number;
		byType: { [key: string]: number };
		bySeverity: { [key: string]: number };
		timestamp: string;
		revalidated: boolean;
	};
	anomalies: any[];
}

export async function POST({ request }: { request: Request }) {
	try {
		console.log('Updating anomaly summary for version...');

		const body: UpdateAnomalySummaryRequest = await request.json();

		if (!body.versionId || !body.anomalySummary) {
			return error(400, 'Missing required fields: versionId, anomalySummary');
		}

		// Update the version record with new anomaly summary
		const updatedVersion = await db
			.update(geojsonVersions)
			.set({
				anomalySummary: body.anomalySummary
			})
			.where(eq(geojsonVersions.id, body.versionId))
			.returning();

		if (updatedVersion.length === 0) {
			return error(404, 'Version not found');
		}

		console.log(`Successfully updated anomaly summary for version ${body.versionId}: ${body.anomalySummary.total} anomalies`);

		return json({
			success: true,
			versionId: body.versionId,
			anomalyTotal: body.anomalySummary.total,
			message: `Updated anomaly summary: ${body.anomalySummary.total} anomalies found`
		});

	} catch (err) {
		console.error('Error updating anomaly summary:', err);
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