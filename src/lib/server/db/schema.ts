import { pgTable, serial, integer, varchar, timestamp, boolean, jsonb, text } from 'drizzle-orm/pg-core';

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

// FRS (Frame Sensus) table - for tracking SLS changes
export const frs = pgTable('frs', {
	id: serial('id').primaryKey(),
	idsls_before: varchar('idsls_before', { length: 20 }),
	nama_sls_before: varchar('nama_sls_before', { length: 200 }),
	idsls_after: varchar('idsls_after', { length: 20 }),
	nama_sls_after: varchar('nama_sls_after', { length: 200 }),
	ketua_sls: varchar('ketua_sls', { length: 100 }),
	status: integer('status'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// Processed GeoJSON files table - Main file tracking
export const processedGeojson = pgTable('processed_geojson', {
	id: serial('id').primaryKey(),
	userId: varchar('user_id', { length: 255 }),
	originalFilename: varchar('original_filename', { length: 255 }),
	districtCode: varchar('district_code', { length: 50 }),
	districtName: varchar('district_name', { length: 200 }),
	kecamatanName: varchar('kecamatan_name', { length: 200 }),
	kabupatenName: varchar('kabupaten_name', { length: 200 }),
	desaaName: varchar('desa_name', { length: 200 }),
	currentVersionId: integer('current_version_id'),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// Version history table - Stores each version of the GeoJSON
export const geojsonVersions = pgTable('geojson_versions', {
	id: serial('id').primaryKey(),
	fileId: integer('file_id').references(() => processedGeojson.id),
	versionNumber: integer('version_number'),
	geojsonData: jsonb('geojson_data'),
	anomalySummary: jsonb('anomaly_summary'),
	processingMetadata: jsonb('processing_metadata'),
	createdBy: varchar('created_by', { length: 255 }),
	changeNotes: text('change_notes'),
	createdAt: timestamp('created_at').defaultNow()
});

// Revision tracking table - Tracks changes between versions
export const geojsonRevisions = pgTable('geojson_revisions', {
	id: serial('id').primaryKey(),
	fileId: integer('file_id').references(() => processedGeojson.id),
	fromVersionId: integer('from_version_id').references(() => geojsonVersions.id),
	toVersionId: integer('to_version_id').references(() => geojsonVersions.id),
	revisionType: varchar('revision_type', { length: 50 }), // 'correction', 'update', 'new_data'
	changesSummary: jsonb('changes_summary'), // What changed between versions
	createdBy: varchar('created_by', { length: 255 }),
	createdAt: timestamp('created_at').defaultNow()
});
