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

		console.log('SIPW API received request:', { districts, idsubslsCount: idsubsls?.length });

		if (!districts || !Array.isArray(districts) || districts.length === 0) {
			return error(400, 'Districts array is required');
		}

		let results;

		// If specific idsubsls are provided, filter by idsubsls only (ignore districts for exact match)
		if (idsubsls && Array.isArray(idsubsls) && idsubsls.length > 0) {
			console.log('Using specific idsubsls filter only');
			results = await sql`
				SELECT idsubsls, kddesa, nmdesa, semester, muatan_kk, nama_sls
				FROM sipw
				WHERE idsubsls = ANY(${idsubsls})
				ORDER BY kddesa, idsubsls
			`;
		} else {
			// Check if districts are 10-digit prefixes (more specific) or regular kddesa codes
			const isUsingPrefixes = districts.some(d => d && d.length >= 10);
			console.log('Using district filtering, isUsingPrefixes:', isUsingPrefixes);

			if (isUsingPrefixes) {
				// Filter by 10-digit prefixes of idsubsls with wildcard pattern
				const prefixPatterns = districts.map((d: string) => `${d}%`);
				console.log('Using prefix patterns:', prefixPatterns);
				results = await sql`
					SELECT idsubsls, kddesa, nmdesa, semester, muatan_kk, nama_sls
					FROM sipw
					WHERE idsubsls LIKE ANY(${prefixPatterns})
					ORDER BY kddesa, idsubsls
				`;
			} else {
				// Filter by regular kddesa codes
				console.log('Using regular kddesa filtering:', districts);
				results = await sql`
					SELECT idsubsls, kddesa, nmdesa, semester, muatan_kk, nama_sls
					FROM sipw
					WHERE kddesa = ANY(${districts})
					ORDER BY kddesa, idsubsls
				`;
			}
		}

		console.log('SIPW query returned', results?.length, 'results');

		return json(results);
	} catch (err) {
		console.error('Error fetching SIPW data:', err);
		const message = err instanceof Error ? err.message : String(err);
		return error(500, `Internal server error: ${message}`);
	}
}