// Script to find villages that don't have files yet
const findMissingVillages = async () => {
    try {
        console.log('=== FINDING VILLAGES WITHOUT FILES ===\n');

        // Complete village list from user mapping
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

        console.log('📋 Expected villages from user mapping:');
        const expectedVillages = Object.keys(userMapping);
        console.log(`Total expected villages: ${expectedVillages.length}`);
        expectedVillages.forEach((village, index) => {
            console.log(`${index + 1}. ${village} -> ${userMapping[village].join(', ')}`);
        });

        // Get actual villages from API
        console.log('\n🔗 Fetching actual villages from API...');
        const response = await fetch('http://localhost:5174/api/save-geojson?userId=anonymous');
        const result = await response.json();

        if (!result.success) {
            console.error('❌ API response failed:', result);
            return;
        }

        console.log('✅ API response successful');

        // Process actual villages
        const actualVillages = new Set();
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
                        kdkab: file.kdkab,
                        kdkec: file.kdkec,
                        kddesa: file.kddesa,
                        fileId: file.id,
                        originalFilename: file.originalFilename,
                        currentVersionNumber: file.currentVersionNumber,
                        updatedAt: file.updatedAt,
                        userId: file.userId
                    });
                }
                actualVillages.add(file.nmdesa);
            }
        });

        const actualVillageNames = Array.from(actualVillages);
        console.log(`\n📊 Actual villages found: ${actualVillageNames.length}`);
        actualVillageNames.sort().forEach((village, index) => {
            console.log(`${index + 1}. ${village}`);
        });

        // Find missing villages
        const missingVillages = expectedVillages.filter(village => !actualVillages.has(village));

        console.log(`\n❌ Villages without files (${missingVillages.length}):`);
        missingVillages.forEach((village, index) => {
            console.log(`${index + 1}. ${village} -> ${userMapping[village].join(', ')}`);
        });

        // Show completion percentage
        const completionRate = ((actualVillageNames.length / expectedVillages.length) * 100).toFixed(1);
        console.log(`\n📈 Completion Rate: ${completionRate}% (${actualVillageNames.length}/${expectedVillages.length} villages)`);

        if (missingVillages.length > 0) {
            console.log('\n🎯 Missing villages by operator:');
            const missingByOperator = new Map();
            missingVillages.forEach(village => {
                const operator = userMapping[village].join(', ');
                if (!missingByOperator.has(operator)) {
                    missingByOperator.set(operator, []);
                }
                missingByOperator.get(operator).push(village);
            });

            Array.from(missingByOperator.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .forEach(([operator, villages]) => {
                    console.log(`- ${operator}: ${villages.length} village(s) - ${villages.join(', ')}`);
                });
        }

        console.log('\n🎉 Missing villages analysis complete!');

    } catch (error) {
        console.error('❌ Error finding missing villages:', error);
    }
};

// Run the analysis
setTimeout(findMissingVillages, 1000);
console.log('Analyzing missing villages...');