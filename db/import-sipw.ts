import * as XLSX from 'xlsx';
import { db } from './index.js';
import { daftarSipw } from './schema/daftar_sipw.js';
import { nanoid } from 'nanoid';

async function importSipwFromExcel() {
  try {
    console.log('Reading SIPW Excel file...');
    
    // Read the Excel file
    const workbook = XLSX.readFile('data/export_sipw.xlsx');
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
    
    console.log(`Found ${data.length} rows in SIPW Excel file`);
    console.log('Sample data:', data[0]);
    
    // Process and insert data
    const sipwData = data.map((row) => {
      return {
        id: nanoid(),
        id_subsls: row['id_subsls'] || '',
        idfrs: row['idfrs'] || null,
        idsls: row['idsls'] || '',
        kdprov: row['kdprov'] || '',
        kdkab: row['kdkab'] || '',
        kdkec: row['kdkec'] || '',
        kddesa: row['kddesa'] || '',
        kdsls: row['kdsls'] || '',
        klas: row['klas'] || '',
        nmprov: row['nmprov'] || '',
        nmkab: row['nmkab'] || '',
        nmkec: row['nmkec'] || '',
        nmdesa: row['nmdesa'] || '',
        nama_sls: row['nama_sls'] || '',
        jenis_sls: row['jenis_sls'] || '',
        ketua_sls: row['ketua_sls'] || '',
        semester_id: row['semester_id'] || '',
        semester: row['semester'] || '',
        j_subsls: row['j_subsls'] || '',
        muatan_kk: row['muatan_kk'] || '',
        btt: row['btt'] || '',
        btt_kosong: row['btt_kosong'] || '',
        bku: row['bku'] || '',
        bbtt_non_usaha: row['bbtt_non_usaha'] || '',
        muatan_usaha: row['muatan_usaha'] || '',
        muatan_total: row['muatan_total'] || '',
        nama_wke: row['nama_wke'] || '',
        jam_operasional: row['jam_operasional'] || '',
        jumlah_shift: row['jumlah_shift'] || '',
        telepon_email: row['telepon_email'] || '',
        muatan_dominan: row['muatan_dominan'] || '',
        flag_perubahan_sls: row['flag_perubahan_sls'] || '',
        is_deleted: row['is_deleted'] || '',
        kd_subsls: row['kd_subsls'] || '',
      };
    }).filter(p => p.id_subsls); // Filter out empty rows
    
    console.log(`Processed ${sipwData.length} valid records`);
    
    // Insert into database in batches
    const batchSize = 10;
    let totalInserted = 0;
    
    for (let i = 0; i < sipwData.length; i += batchSize) {
      const batch = sipwData.slice(i, i + batchSize);
      await db.insert(daftarSipw).values(batch);
      totalInserted += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
    }
    
    console.log(`Successfully imported ${totalInserted} daftar_sipw records`);
    
    // Display sample imported data
    console.log('\nSample imported data:');
    sipwData.slice(0, 5).forEach((p, index) => {
      console.log(`${index + 1}. ${p.nmkab} - ${p.nmkec} - ${p.nmdesa} - ${p.nama_sls} (${p.kd_subsls})`);
    });
    
  } catch (error) {
    console.error('Error importing SIPW Excel data:', error);
    throw error;
  }
}

// Run import if this file is executed directly
if (require.main === module) {
  importSipwFromExcel()
    .then(() => {
      console.log('SIPW Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('SIPW Import failed:', error);
      process.exit(1);
    });
}

export { importSipwFromExcel };
