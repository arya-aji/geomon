import { db } from './index';
import { petugas } from './schema/petugas';
import { nanoid } from 'nanoid';

const samplePetugas = [
  {
    id: nanoid(),
    nip: '198001012001011001',
    nama: 'Ahmad Wijaya',
    email: 'ahmad.wijaya@bps.go.id',
    telepon: '08123456789',
    jabatan: 'Kepala Seksi Statistik Sosial',
    wilayahKerja: 'Menteng',
    status: 'aktif',
  },
  {
    id: nanoid(),
    nip: '198502022005021002',
    nama: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@bps.go.id',
    telepon: '08234567890',
    jabatan: 'Statistisi Madya',
    wilayahKerja: 'Tanah Abang',
    status: 'aktif',
  },
  {
    id: nanoid(),
    nip: '199003032010031003',
    nama: 'Budi Santoso',
    email: 'budi.santoso@bps.go.id',
    telepon: '08345678901',
    jabatan: 'Statistisi Muda',
    wilayahKerja: 'Sawah Besar',
    status: 'aktif',
  },
  {
    id: nanoid(),
    nip: '198704042008041004',
    nama: 'Dewi Lestari',
    email: 'dewi.lestari@bps.go.id',
    telepon: '08456789012',
    jabatan: 'Statistisi Pelaksana',
    wilayahKerja: 'Kemayoran',
    status: 'aktif',
  },
  {
    id: nanoid(),
    nip: '199205052015051005',
    nama: 'Rudi Hermawan',
    email: 'rudi.hermawan@bps.go.id',
    telepon: '08567890123',
    jabatan: 'Statistisi Pelaksana',
    wilayahKerja: 'Cempaka Putih',
    status: 'aktif',
  },
  {
    id: nanoid(),
    nip: '198806062009061006',
    nama: 'Indah Permata',
    email: 'indah.permata@bps.go.id',
    telepon: '08678901234',
    jabatan: 'Statistisi Muda',
    wilayahKerja: 'Johar Baru',
    status: 'aktif',
  },
  {
    id: nanoid(),
    nip: '199307072016071007',
    nama: 'Eko Prasetyo',
    email: 'eko.prasetyo@bps.go.id',
    telepon: '08789012345',
    jabatan: 'Statistisi Pelaksana',
    wilayahKerja: 'Gambir',
    status: 'aktif',
  },
  {
    id: nanoid(),
    nip: '198908082011081008',
    nama: 'Ratna Sari',
    email: 'ratna.sari@bps.go.id',
    telepon: '08890123456',
    jabatan: 'Statistisi Madya',
    wilayahKerja: 'Tanah Abang',
    status: 'aktif',
  },
];

async function seedPetugas() {
  try {
    console.log('Seeding petugas data...');
    
    // Clear existing data
    await db.delete(petugas);
    
    // Insert sample data
    await db.insert(petugas).values(samplePetugas);
    
    console.log(`Successfully seeded ${samplePetugas.length} petugas records`);
  } catch (error) {
    console.error('Error seeding petugas data:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedPetugas()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedPetugas };
