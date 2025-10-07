import { pgTable, serial, integer, varchar, timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	age: integer('age')
});

// SIPW (SSLS) table
export const sipw = pgTable('sipw', {
	idsubsls: varchar('idsubsls', { length: 20 }).primaryKey(),
	idfrs: varchar('idfrs', { length: 20 }),
	idsls: varchar('idsls', { length: 20 }),
	kdprov: varchar('kdprov', { length: 5 }),
	kdkab: varchar('kdkab', { length: 5 }),
	kdkec: varchar('kdkec', { length: 5 }),
	kddesa: varchar('kddesa', { length: 5 }),
	kdsls: varchar('kdsls', { length: 10 }),
	klas: integer('klas'),
	nmprov: varchar('nmprov', { length: 100 }),
	nmkab: varchar('nmkab', { length: 100 }),
	nmkec: varchar('nmkec', { length: 100 }),
	nmdesa: varchar('nmdesa', { length: 100 }),
	nama_sls: varchar('nama_sls', { length: 200 }),
	jenis_sls: varchar('jenis_sls', { length: 50 }),
	ketua_sls: varchar('ketua_sls', { length: 100 }),
	semester_id: integer('semester_id'),
	semester: varchar('semester', { length: 10 }),
	j_subsls: integer('j_subsls'),
	muatan_kk: integer('muatan_kk'),
	btt: integer('btt'),
	btt_kosong: integer('btt_kosong'),
	bku: integer('bku'),
	bbtt_non_usaha: integer('bbtt_non_usaha'),
	muatan_usaha: integer('muatan_usaha'),
	muatan_total: integer('muatan_total'),
	nama_wke: varchar('nama_wke', { length: 200 }),
	jam_operasional: varchar('jam_operasional', { length: 50 }),
	jumlah_shift: integer('jumlah_shift'),
	telepon_email: varchar('telepon_email', { length: 200 }),
	muatan_dominan: integer('muatan_dominan'),
	flag_perubahan_sls: integer('flag_perubahan_sls'),
	is_deleted: integer('is_deleted'),
	kd_subsls: varchar('kd_subsls', { length: 10 }),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});
