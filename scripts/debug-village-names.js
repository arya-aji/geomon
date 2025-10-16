import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function debugVillageNames() {
    try {
        console.log('=== DEBUGGING VILLAGE NAMES ===\n');

        // Get all unique village names from database
        const villages = await sql`
            SELECT DISTINCT iddesa, nmdesa
            FROM processed_geojson
            WHERE iddesa IS NOT NULL AND nmdesa IS NOT NULL
            ORDER BY iddesa
        `;

        console.log('📋 Village names in database:');
        villages.forEach((village, index) => {
            console.log(`${index + 1}. IDDESA: ${village.iddesa}, NMDESA: "${village.nmdesa}" (length: ${village.nmdesa.length})`);
        });

        // Test our mapping against actual names
        const userMapping = {
            "Senen": ["agustina rahmani ulva"],
            "Gelora": ["agustina rahmani ulva"],
            "Kartini": ["Ahmad Naufal"],
            "Cempaka Putih Timur": ["Ahmad Naufal"],
            "Kebon Sirih": ["Ajrina Shafa Ananda"],
            "Cideng": ["Ajrina Shafa Ananda"],
            "Kwitang": ["Amara Husna"],
            "Cikini": ["Amara Husna"],
            "Bungur": ["Auliatunnisa"],
            "Duri Pulo": ["Auliatunnisa"],
            "Galur": ["Ayu susetyaning"],
            "Kebon Melati": ["Ayu susetyaning"],
            "Utan Panjang": ["Bayu Adi Nugroho"],
            "Petojo Utara": ["Bayu Adi Nugroho"],
            "Kebon Kosong": ["febry ramadhianti"],
            "Kampung Bali": ["febry ramadhianti"],
            "Kebon Kelapa": ["Guntur Gunawan"],
            "Sumur Batu": ["Guntur Gunawan"],
            "Kemayoran": ["Khadija Izzati"],
            "Petojo Selatan": ["Khadija Izzati"],
            "Petamburan": ["Luli huriah"],
            "Gondangdia": ["Luli huriah"],
            "Gunung Sahari Selatan": ["Lusia Puji Astuti"],
            "Karet Tengsin": ["Lusia Puji Astuti"],
            "Serdang": ["Meiriana Hudanti Perdhani"],
            "Pegangsaan": ["Meiriana Hudanti Perdhani"],
            "Rawa Sari": ["Muhammad Fadhil Amin"],
            "Bendungan Hilir": ["Muhammad Fadhil Amin"],
            "Paseban": ["Novaldi Endrawan"],
            "Gambir": ["Novaldi Endrawan"],
            "Cempaka Putih Barat": ["Nurhaliza Laila Arman"],
            "Gunung Sahari Utara": ["Nurhaliza Laila Arman"],
            "Kampung Rawa": ["Revina Ananda Hardiyanto"],
            "Karang Anyar": ["Revina Ananda Hardiyanto"],
            "Cempaka Baru": ["Shintia Nikita Zen"],
            "Kebon Kacang": ["Shintia Nikita Zen"],
            "Johar Baru": ["Siti Fitriyani"],
            "Kenari": ["Siti Fitriyani"],
            "Harapan Mulya": ["Siti Humaira"],
            "Kramat": ["Siti Humaira"],
            "Tanah Tinggi": ["Siti Nurlenia"],
            "Pasar Baru": ["Wafa Nazifah"],
            "Menteng": ["Wafa Nazifah"],
            "Mangga Dua Selatan": ["Kurnia Hidayati"]
        };

        // Function to get assigned users for a village (case-insensitive)
        function getAssignedUsers(villageName) {
            // Try exact match first
            if (userMapping[villageName]) {
                return userMapping[villageName];
            }

            // Try case-insensitive match
            const upperCaseName = villageName.toUpperCase();
            for (const [key, users] of Object.entries(userMapping)) {
                if (key.toUpperCase() === upperCaseName) {
                    return users;
                }
            }

            return ['No user assigned'];
        }

        console.log('\n🔍 Testing mapping against database names:');
        villages.forEach((village, index) => {
            const users = getAssignedUsers(village.nmdesa);
            console.log(`${index + 1}. "${village.nmdesa}" → ${users.join(', ')}`);
        });

        // Find villages that don't match our mapping
        const unmatched = villages.filter(village => {
            const users = getAssignedUsers(village.nmdesa);
            return users[0] === 'No user assigned';
        });

        if (unmatched.length > 0) {
            console.log('\n⚠️  Villages not found in mapping:');
            unmatched.forEach(village => {
                console.log(`- "${village.nmdesa}" (IDDESA: ${village.iddesa})`);
            });
        } else {
            console.log('\n✅ All villages found in mapping!');
        }

    } catch (error) {
        console.error('Error debugging village names:', error);
        process.exit(1);
    }
}

debugVillageNames();