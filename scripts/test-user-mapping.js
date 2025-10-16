// Test script to verify user mapping functionality
const testUserMapping = async () => {
    try {
        console.log('=== TESTING USER MAPPING FUNCTIONALITY ===\n');

        // Test the user mapping logic (same as in the new page)
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

        console.log('📋 User Mapping Test:');
        console.log('Total villages in mapping:', Object.keys(userMapping).length);

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

        // Test some key mappings
        const testVillages = ['GELORA', 'PETAMBURAN', 'GAMBIR', 'MENTENG', 'KARTINI'];

        testVillages.forEach(village => {
            const users = getAssignedUsers(village);
            console.log(`${village}: ${users.join(', ')}`);
        });

        // Test API response with user mapping
        console.log('\n🔗 Testing API Integration...');
        const response = await fetch('http://localhost:5174/api/save-geojson?userId=anonymous');
        const result = await response.json();

        if (result.success) {
            console.log('✅ API response successful');

            // Test the same logic as in the page
            const villageMap = new Map();

            result.files.forEach((file) => {
                if (file.iddesa && file.nmdesa) {
                    const existing = villageMap.get(file.iddesa);

                    if (!existing ||
                        file.currentVersionNumber > existing.currentVersionNumber ||
                        (file.currentVersionNumber === existing.currentVersionNumber &&
                         new Date(file.updatedAt) > new Date(existing.updatedAt))) {

                        // Use the same case-insensitive logic as the main function
                        let assignedUsers;
                        if (userMapping[file.nmdesa]) {
                            assignedUsers = userMapping[file.nmdesa];
                        } else {
                            const upperCaseName = file.nmdesa.toUpperCase();
                            let found = false;
                            for (const [key, users] of Object.entries(userMapping)) {
                                if (key.toUpperCase() === upperCaseName) {
                                    assignedUsers = users;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                assignedUsers = ['No user assigned'];
                            }
                        }

                        villageMap.set(file.iddesa, {
                            iddesa: file.iddesa,
                            nmdesa: file.nmdesa,
                            assignedUsers: assignedUsers,
                            fileId: file.id,
                            originalFilename: file.originalFilename,
                            currentVersionNumber: file.currentVersionNumber,
                            updatedAt: file.updatedAt
                        });
                    }
                }
            });

            const villages = Array.from(villageMap.values()).sort((a, b) => a.iddesa.localeCompare(b.iddesa));

            console.log('✅ Found unique villages with assigned users:', villages.length);
            console.log('\n📊 Sample villages with assigned users:');
            console.table(villages.slice(0, 5).map(v => ({
                'IDDESA': v.iddesa,
                'NMDESA': v.nmdesa,
                'Assigned Users': v.assignedUsers.join(', '),
                'File': v.originalFilename,
                'Version': v.currentVersionNumber
            })));

        } else {
            console.error('❌ API response failed:', result);
        }

    } catch (error) {
        console.error('❌ Error testing user mapping:', error);
    }
};

// Run the test
setTimeout(testUserMapping, 1000);

console.log('Testing user mapping functionality for manage-files page...');