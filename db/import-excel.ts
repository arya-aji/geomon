import * as XLSX from 'xlsx';
import { db } from './index';
import { petugas } from './schema/petugas';
import { nanoid } from 'nanoid';

async function importFromExcel() {
  try {
    console.log('Reading Excel file...');
    
    // Read the Excel file
    const workbook = XLSX.readFile('data/user_sipw.xlsx');
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} rows in Excel file`);
    console.log('Sample data:', data[0]);
    
    // Clear existing data
    await db.delete(petugas);
    console.log('Cleared existing petugas data');
    
    // Process and insert data
    const petugasData = data.map((row: any) => {
      // Map Excel columns to database fields based on actual data structure
      
      return {
        id: nanoid(),
        nama: row['nama'] || '',
        email: row['email'] || '',
        telepon: row['no_telp'] || '',
        jabatan: row['nama_pos'] || row['nama_keg'] || '',
        wilayahKerja: 'Kota Jakarta Pusat', // Set to Kota Jakarta Pusat
        status: row['is_pegawai'] === '1' ? 'aktif' : 'aktif', // Both are considered active
      };
    }).filter(p => p.nama); // Filter out empty rows (only require nama)
    
    console.log(`Processed ${petugasData.length} valid records`);
    
    // Insert into database
    await db.insert(petugas).values(petugasData);
    
    console.log(`Successfully imported ${petugasData.length} petugas records`);
    
    // Display imported data
    console.log('\nImported data:');
    petugasData.forEach((p, index) => {
      console.log(`${index + 1}. ${p.nama} - ${p.wilayahKerja}`);
    });
    
  } catch (error) {
    console.error('Error importing Excel data:', error);
    throw error;
  }
}

// Run import if this file is executed directly
if (require.main === module) {
  importFromExcel()
    .then(() => {
      console.log('Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

export { importFromExcel };
