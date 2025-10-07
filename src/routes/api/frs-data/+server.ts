import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { frs } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

const sql = neon(env.DATABASE_URL || '');
const db = drizzle(sql);

export async function GET() {
	try {
		console.log('Fetching FRS data...');

		// Fetch all FRS data ordered by creation date (newest first)
		const results = await db
			.select()
			.from(frs)
			.orderBy(desc(frs.createdAt));

		console.log(`Found ${results.length} FRS records`);

		return json(results);
	} catch (err) {
		console.error('Error fetching FRS data:', err);
		if (err instanceof Error) {
			console.error('Error details:', err.message);
			return error(500, `Internal server error: ${err.message}`);
		} else {
			console.error('Error details:', err);
			return error(500, 'Internal server error');
		}
	}
}