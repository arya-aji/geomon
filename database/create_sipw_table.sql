-- Create SIPW table structure based on CSV data
-- SIPW (Sensus Lingkungan Sementara) data table

CREATE TABLE IF NOT EXISTS sipw (
    id_subsls VARCHAR(20) PRIMARY KEY,
    idfrs VARCHAR(20),
    idsls VARCHAR(20),
    kdprov VARCHAR(5),
    kdkab VARCHAR(5),
    kdkec VARCHAR(5),
    kddesa VARCHAR(5),
    kdsls VARCHAR(10),
    klas INTEGER,
    nmprov VARCHAR(100),
    nmkab VARCHAR(100),
    nmkec VARCHAR(100),
    nmdesa VARCHAR(100),
    nama_sls VARCHAR(200),
    jenis_sls VARCHAR(50),
    ketua_sls VARCHAR(100),
    semester_id INTEGER,
    semester VARCHAR(10),
    j_subsls INTEGER,
    muatan_kk INTEGER,
    btt INTEGER,
    btt_kosong INTEGER,
    bku INTEGER,
    bbtt_non_usaha INTEGER,
    muatan_usaha INTEGER,
    muatan_total INTEGER,
    nama_wke VARCHAR(200),
    jam_operasional VARCHAR(50),
    jumlah_shift INTEGER,
    telepon_email VARCHAR(200),
    muatan_dominan INTEGER,
    flag_perubahan_sls INTEGER,
    is_deleted INTEGER,
    kd_subsls VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sipw_kddesa ON sipw(kddesa);
CREATE INDEX IF NOT EXISTS idx_sipw_semester ON sipw(semester);
CREATE INDEX IF NOT EXISTS idx_sipw_nmprov ON sipw(nmprov);
CREATE INDEX IF NOT EXISTS idx_sipw_nmkab ON sipw(nmkab);

-- Add comments for documentation
COMMENT ON TABLE sipw IS 'Sensus Lingkungan Sementara (SLS) data for monitoring purposes';
COMMENT ON COLUMN sipw.id_subsls IS 'Unique identifier for SLS sub-unit';
COMMENT ON COLUMN sipw.kddesa IS 'District code';
COMMENT ON COLUMN sipw.nmdesa IS 'District name';
COMMENT ON COLUMN sipw.muatan_kk IS 'Number of households';
COMMENT ON COLUMN sipw.semester IS 'Survey semester period';