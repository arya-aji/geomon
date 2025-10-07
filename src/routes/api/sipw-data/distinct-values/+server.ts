import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sipw } from '$lib/server/db/schema';
import { eq, isNotNull, not, and, sql as drizzleSql } from 'drizzle-orm';

const sql = neon(env.DATABASE_URL || '');
const db = drizzle(sql);

export async function GET({ url }) {
	try {
		const nmkab = url.searchParams.get('nmkab');
		const nmkec = url.searchParams.get('nmkec');

		console.log('Fetching distinct values with filters:', { nmkab, nmkec });

		// Test connection with Drizzle
		const countResults = await db.select({ count: drizzleSql`count(*)` }).from(sipw);
		console.log('Database connection test - total records:', countResults);

		const result: { nmkab?: string[]; nmkec?: string[]; nmdesa?: string[] } = {};

		if (nmkec) {
			// Get nmdesa options based on selected nmkec (and optionally nmkab)
			const conditions = [
				isNotNull(sipw.nmdesa),
				not(eq(sipw.nmdesa, '')),
				eq(sipw.nmkec, nmkec)
			];

			if (nmkab) {
				conditions.push(eq(sipw.nmkab, nmkab));
			}

			const nmdesaResults = await db
				.selectDistinct({ nmdesa: sipw.nmdesa })
				.from(sipw)
				.where(and(...conditions))
				.orderBy(sipw.nmdesa);

			result.nmdesa = nmdesaResults.map((row) => row.nmdesa).filter(Boolean);
		} else if (nmkab) {
			// Get nmkec options based on selected nmkab
			const nmkecResults = await db
				.selectDistinct({ nmkec: sipw.nmkec })
				.from(sipw)
				.where(and(
					isNotNull(sipw.nmkec),
					not(eq(sipw.nmkec, '')),
					eq(sipw.nmkab, nmkab)
				))
				.orderBy(sipw.nmkec);

			result.nmkec = nmkecResults.map((row) => row.nmkec).filter(Boolean);
		} else {
			// Get all nmkab options (initial load)
			const nmkabResults = await db
				.selectDistinct({ nmkab: sipw.nmkab })
				.from(sipw)
				.where(and(isNotNull(sipw.nmkab), not(eq(sipw.nmkab, ''))))
				.orderBy(sipw.nmkab);

			result.nmkab = nmkabResults.map((row) => row.nmkab).filter(Boolean);
		}

		console.log('Drizzle results:', result);

		return json(result);
	} catch (err) {
		console.error('Error fetching distinct values:', err);
		if (err instanceof Error) {
			console.error('Error details:', err.message);
			return error(500, `Internal server error: ${err.message}`);
		} else {
			console.error('Error details:', err);
			return error(500, 'Internal server error');
		}
	}
}
