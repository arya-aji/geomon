import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sipw } from '$lib/server/db/schema';
import { eq, and, sql as drizzleSql } from 'drizzle-orm';

const sql = neon(env.DATABASE_URL || '');
const db = drizzle(sql);

export async function POST({ request }) {
	try {
		const filters = await request.json();

		if (!filters || Object.keys(filters).length === 0) {
			return error(400, 'At least one filter is required');
		}

		console.log('Filter API called with:', filters);

		// Build the where conditions using Drizzle operators
		const conditions = [];

		if (filters.nmkab) {
			conditions.push(eq(sipw.nmkab, filters.nmkab));
		}

		if (filters.nmkec) {
			conditions.push(eq(sipw.nmkec, filters.nmkec));
		}

		if (filters.nmdesa) {
			conditions.push(eq(sipw.nmdesa, filters.nmdesa));
		}

		try {
			const results = await db
				.select({
					idsubsls: sipw.idsubsls,
					nmkab: sipw.nmkab,
					nmkec: sipw.nmkec,
					nmdesa: sipw.nmdesa,
					nama_sls: sipw.nama_sls,
					kd_subsls: sipw.kd_subsls,
					nama_wke: sipw.nama_wke,
					muatan_dominan: sipw.muatan_dominan
				})
				.from(sipw)
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(sipw.nmkab, sipw.nmkec, sipw.nmdesa, sipw.idsubsls);

			console.log('Drizzle filter results:', results);
			return json(results);
		} catch (drizzleError) {
			console.error('Drizzle Error:', drizzleError);
			return json([]);
		}
	} catch (err) {
		console.error('Error filtering SIPW data:', err);
		return error(500, `Internal server error: ${err.message}`);
	}
}
