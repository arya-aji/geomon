import { neon } from '@neondatabase/serverless';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const sql = neon(env.DATABASE_URL || '');

export async function GET() {
	try {
		const results = await sql`
			SELECT idsubsls, kddesa, nmdesa, semester, muatan_kk, nama_sls
			FROM sipw
			LIMIT 10
		`;

		return json(results);
	} catch (err) {
		console.error('Error fetching SIPW data:', err);
		const message = err instanceof Error ? err.message : String(err);
		return error(500, `Internal server error: ${message}`);
	}
}

export async function POST({ request }) {
	try {
		const { districts, idsubsls } = await request.json();

		if (!districts || !Array.isArray(districts) || districts.length === 0) {
			return error(400, 'Districts array is required');
		}

		let results;

		// If specific idsubsls are provided, filter by both districts and idsubsls
		if (idsubsls && Array.isArray(idsubsls) && idsubsls.length > 0) {
			results = await sql`
				SELECT idsubsls, kddesa, nmdesa, semester, muatan_kk, nama_sls
				FROM sipw
				WHERE kddesa = ANY(${districts}) AND idsubsls = ANY(${idsubsls})
				ORDER BY kddesa, idsubsls
			`;
		} else {
			// Filter by districts only
			results = await sql`
				SELECT idsubsls, kddesa, nmdesa, semester, muatan_kk, nama_sls
				FROM sipw
				WHERE kddesa = ANY(${districts})
				ORDER BY kddesa, idsubsls
			`;
		}

		return json(results);
	} catch (err) {
		console.error('Error fetching SIPW data:', err);
		const message = err instanceof Error ? err.message : String(err);
		return error(500, `Internal server error: ${message}`);
	}
}