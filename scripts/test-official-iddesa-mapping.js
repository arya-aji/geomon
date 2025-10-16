// Test script to verify official IDDESA mapping functionality
const testOfficialIdesaMapping = async () => {
    try {
        console.log('=== TESTING OFFICIAL IDDESA MAPPING ===\n');

        // Official village to IDDESA mapping
        const villageIdMapping = {
            "Gelora": "3173010001",
            "Bendungan Hilir": "3173010002",
            "Karet Tengsin": "3173010003",
            "Kebon Melati": "3173010004",
            "Petamburan": "3173010005",
            "Kebon Kacang": "3173010006",
            "Kampung Bali": "3173010007",
            "Menteng": "3173020001",
            "Pegangsaan": "3173020002",
            "Cikini": "3173020003",
            "Gondangdia": "3173020004",
            "Kebon Sirih": "3173020005",
            "Kenari": "3173030001",
            "Paseban": "3173030002",
            "Kramat": "3173030003",
            "Kwitang": "3173030004",
            "Senen": "3173030005",
            "Bungur": "3173030006",
            "Johar Baru": "3173040001",
            "Kampung Rawa": "3173040002",
            "Tanah Tinggi": "3173040003",
            "Galur": "3173040004",
            "Rawa Sari": "3173050001",
            "Cempaka Putih Timur": "3173050002",
            "Cempaka Putih Barat": "3173050003",
            "Harapan Mulya": "3173060001",
            "Cempaka Baru": "3173060002",
            "Sumur Batu": "3173060003",
            "Serdang": "3173060004",
            "Utan Panjang": "3173060005",
            "Kebon Kosong": "3173060006",
            "Kemayoran": "3173060007",
            "Gunung Sahari Selatan": "3173060008",
            "Pasar Baru": "3173070001",
            "Gunung Sahari Utara": "3173070002",
            "Kartini": "3173070003",
            "Karang Anyar": "3173070004",
            "Mangga Dua Selatan": "3173070005",
            "Cideng": "3173080001",
            "Petojo Selatan": "3173080002",
            "Gambir": "3173080003",
            "Kebon Kelapa": "3173080004",
            "Petojo Utara": "3173080005",
            "Duri Pulo": "3173080006"
        };

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
            "Rawasari": ["Muhammad Fadhil Amin"],
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

        // Test official mapping
        console.log('📊 Official IDDESA Mapping Test:');
        console.log(`Total official villages: ${Object.keys(villageIdMapping).length}`);

        // Get data from API
        console.log('\n🔗 Fetching data from API...');
        const response = await fetch('http://localhost:5174/api/save-geojson?userId=anonymous');
        const result = await response.json();

        if (!result.success) {
            console.error('❌ API response failed:', result);
            return;
        }

        console.log('✅ API response successful');

        // Process villages using official mapping
        const expectedVillages = Object.entries(villageIdMapping).map(([villageName, iddesa]) => {
            const assignedUsers = getAssignedUsers(villageName);
            return {
                iddesa: iddesa,
                nmdesa: villageName,
                assignedUsers: assignedUsers,
                hasFile: false
            };
        }).sort((a, b) => a.iddesa.localeCompare(b.iddesa));

        // Process existing villages
        const existingVillages = [];
        const existingMap = new Map();

        result.files.forEach((file) => {
            if (file.iddesa && file.nmdesa) {
                const existing = existingMap.get(file.iddesa);

                if (!existing ||
                    file.currentVersionNumber > existing.currentVersionNumber ||
                    (file.currentVersionNumber === existing.currentVersionNumber &&
                     new Date(file.updatedAt) > new Date(existing.updatedAt))) {

                    const villageData = {
                        iddesa: file.iddesa,
                        nmdesa: file.nmdesa,
                        assignedUsers: getAssignedUsers(file.nmdesa),
                        hasFile: true,
                        currentVersionNumber: file.currentVersionNumber,
                        updatedAt: file.updatedAt
                    };

                    existingMap.set(file.iddesa, villageData);
                }
            }
        });

        // Merge using official IDDESA mapping
        const mergedVillages = expectedVillages.map(expected => {
            const existing = existingMap.get(expected.iddesa);

            if (existing) {
                return existing;
            } else {
                return expected;
            }
        }).sort((a, b) => a.iddesa.localeCompare(b.iddesa));

        console.log(`\n📈 Results with Official Mapping:`);
        console.log(`Expected villages: ${expectedVillages.length}`);
        console.log(`Existing villages: ${existingMap.size}`);
        console.log(`Total merged villages: ${mergedVillages.length}`);
        console.log(`Villages with files: ${mergedVillages.filter(v => v.hasFile).length}`);
        console.log(`Villages without files: ${mergedVillages.filter(v => !v.hasFile).length}`);

        console.log('\n📋 First 10 villages (sorted by IDDESA):');
        mergedVillages.slice(0, 10).forEach((village, index) => {
            console.log(`${index + 1}. ${village.iddesa} - ${village.nmdesa} (${village.hasFile ? '✓' : '⚠'}) - ${village.assignedUsers.join(', ')}`);
        });

        console.log('\n⚠️ Villages without files:');
        const missingVillages = mergedVillages.filter(v => !v.hasFile);
        console.log(`Total missing: ${missingVillages.length}`);
        missingVillages.forEach((village, index) => {
            console.log(`${index + 1}. ${village.iddesa} - ${village.nmdesa} (${village.assignedUsers.join(', ')})`);
        });

        // Generate sample reference data
        console.log('\n📄 Sample Reference Data Structure:');
        const sampleReference = {
            generated_at: new Date().toISOString(),
            total_missing: missingVillages.length,
            villages: missingVillages.slice(0, 3).map(village => ({
                iddesa: village.iddesa,
                nmdesa: village.nmdesa,
                assigned_users: village.assignedUsers,
                suggested_filename: `${village.nmdesa.toLowerCase().replace(/\s+/g, '_')}.geojson`,
                geojson_template: {
                    type: "FeatureCollection",
                    features: [{
                        type: "Feature",
                        properties: {
                            id_desa: village.iddesa,
                            nm_desa: village.nmdesa,
                            kd_kab: "3173",
                            kd_kec: village.iddesa.substring(4, 7),
                            kd_desa: village.iddesa.substring(7, 10)
                        },
                        geometry: {
                            type: "Polygon",
                            coordinates: [[]]
                        }
                    }]
                }
            }))
        };

        console.log(JSON.stringify(sampleReference, null, 2));

        console.log('\n🎉 Official IDDESA mapping test complete!');

    } catch (error) {
        console.error('❌ Error testing official IDDESA mapping:', error);
    }
};

// Run the test
setTimeout(testOfficialIdesaMapping, 1000);
console.log('Testing official IDDESA mapping functionality...');