// Test script to verify complete village display sorted by IDDESA
const testCompleteIdesaSorting = async () => {
    try {
        console.log('=== TESTING COMPLETE IDDESA SORTING ===\n');

        // User mapping
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

        function getAssignedUsers(villageName) {
            if (userMapping[villageName]) {
                return userMapping[villageName];
            }
            const upperCaseName = villageName.toUpperCase();
            for (const [key, users] of Object.entries(userMapping)) {
                if (key.toUpperCase() === upperCaseName) {
                    return users;
                }
            }
            return ['No user assigned'];
        }

        function getAllExpectedVillages() {
            const expectedVillages = [];

            Object.entries(userMapping).forEach(([villageName, assignedUsers]) => {
                expectedVillages.push({
                    iddesa: null,
                    nmdesa: villageName,
                    assignedUsers: assignedUsers,
                    hasFile: false
                });
            });

            return expectedVillages.sort((a, b) => {
                // For missing villages (no IDDESA), sort by name
                if (!a.iddesa && !b.iddesa) {
                    return a.nmdesa.localeCompare(b.nmdesa);
                }
                // Missing villages go last
                if (!a.iddesa) return 1;
                if (!b.iddesa) return -1;
                // Sort by IDDESA
                return a.iddesa.localeCompare(b.iddesa);
            });
        }

        // Get data from API
        console.log('🔗 Fetching data from API...');
        const response = await fetch('http://localhost:5174/api/save-geojson?userId=anonymous');
        const result = await response.json();

        if (!result.success) {
            console.error('❌ API response failed:', result);
            return;
        }

        console.log('✅ API response successful');

        // Process existing villages
        const villageMap = new Map();
        result.files.forEach((file) => {
            if (file.iddesa && file.nmdesa) {
                const existing = villageMap.get(file.iddesa);

                if (!existing ||
                    file.currentVersionNumber > existing.currentVersionNumber ||
                    (file.currentVersionNumber === existing.currentVersionNumber &&
                     new Date(file.updatedAt) > new Date(existing.updatedAt))) {

                    villageMap.set(file.iddesa, {
                        iddesa: file.iddesa,
                        nmdesa: file.nmdesa,
                        assignedUsers: getAssignedUsers(file.nmdesa),
                        hasFile: true
                    });
                }
            }
        });

        const existingVillages = Array.from(villageMap.values()).sort((a, b) => a.iddesa.localeCompare(b.iddesa));
        const expectedVillages = getAllExpectedVillages();

        // Merge villages
        const existingMap = new Map();
        existingVillages.forEach(village => {
            const upperName = village.nmdesa.toUpperCase();
            existingMap.set(upperName, village);
        });

        const allVillages = expectedVillages.map(expected => {
            const upperName = expected.nmdesa.toUpperCase();
            const existing = existingMap.get(upperName);

            if (existing) {
                return existing;
            } else {
                return expected;
            }
        });

        // Sort final list with IDDESA logic
        const sortedVillages = allVillages.sort((a, b) => {
            // For missing villages (no IDDESA), sort by name
            if (!a.iddesa && !b.iddesa) {
                return a.nmdesa.localeCompare(b.nmdesa);
            }
            // Missing villages go last
            if (!a.iddesa) return 1;
            if (!b.iddesa) return -1;
            // Sort by IDDESA
            return a.iddesa.localeCompare(b.iddesa);
        });

        console.log('\n📊 Complete Village Display (sorted by IDDESA):');
        console.log(`Total villages: ${sortedVillages.length}`);
        console.log(`With files: ${sortedVillages.filter(v => v.hasFile).length}`);
        console.log(`Without files: ${sortedVillages.filter(v => !v.hasFile).length}`);

        console.log('\n📋 Villages with files (sorted by IDDESA):');
        sortedVillages.filter(v => v.hasFile).forEach((village, index) => {
            console.log(`${index + 1}. ${village.iddesa} - ${village.nmdesa} (${village.assignedUsers.join(', ')})`);
        });

        console.log('\n⚠️ Villages without files (sorted by name):');
        sortedVillages.filter(v => !v.hasFile).forEach((village, index) => {
            console.log(`${index + 1}. ${village.nmdesa} (${village.assignedUsers.join(', ')})`);
        });

        // Verify sorting is correct for villages with files
        const villagesWithFiles = sortedVillages.filter(v => v.hasFile);
        let isSortedCorrectly = true;
        for (let i = 1; i < villagesWithFiles.length; i++) {
            if (villagesWithFiles[i].iddesa < villagesWithFiles[i-1].iddesa) {
                isSortedCorrectly = false;
                break;
            }
        }

        console.log(`\n✅ IDDESA sorting verification: ${isSortedCorrectly ? 'CORRECT' : 'INCORRECT'}`);
        console.log('\n🎉 Complete IDDESA sorting test complete!');

    } catch (error) {
        console.error('❌ Error testing complete IDDESA sorting:', error);
    }
};

// Run the test
setTimeout(testCompleteIdesaSorting, 1000);
console.log('Testing complete IDDESA sorting functionality...');