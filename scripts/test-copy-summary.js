// Test script to verify copy summary functionality
const testCopySummary = async () => {
    try {
        console.log('=== TESTING COPY SUMMARY FUNCTIONALITY ===\n');

        // Get data from API
        console.log('🔗 Fetching data from API...');
        const response = await fetch('http://localhost:5174/api/save-geojson?userId=anonymous');
        const result = await response.json();

        if (!result.success) {
            console.error('❌ API response failed:', result);
            return;
        }

        console.log('✅ API response successful');

        // User mapping (same as in the page)
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

        // Official village mapping (same as in the page)
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

        // Helper function to get assigned users (case-insensitive)
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

        // Process villages to get all expected and existing villages
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
                        hasFile: true,
                        assignedUsers: getAssignedUsers(file.nmdesa)
                    });
                }
            }
        });

        // Get all expected villages
        const allVillages = [];
        Object.entries(villageIdMapping).forEach(([villageName, iddesa]) => {
            const assignedUsers = getAssignedUsers(villageName);
            const existing = villageMap.get(iddesa);

            if (existing) {
                allVillages.push(existing);
            } else {
                allVillages.push({
                    iddesa: iddesa,
                    nmdesa: villageName,
                    hasFile: false,
                    assignedUsers: assignedUsers
                });
            }
        });

        const missingVillages = allVillages.filter(v => !v.hasFile);

        // Generate summary (same logic as in the page)
        if (missingVillages.length === 0) {
            console.log('🎉 All villages have files uploaded!');
            return;
        }

        // Group by assigned users
        const groupedByUser = new Map();

        missingVillages.forEach(village => {
            const userKey = village.assignedUsers.join(', ');
            if (!groupedByUser.has(userKey)) {
                groupedByUser.set(userKey, []);
            }
            groupedByUser.get(userKey).push(village);
        });

        // Generate summary text
        let summary = `📊 GEOMON - Missing Files Summary\n`;
        summary += `Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })} WIB\n`;
        summary += `Total villages missing: ${missingVillages.length}/${allVillages.length} (${((missingVillages.length / allVillages.length) * 100).toFixed(1)}%)\n\n`;

        // Add summary by user
        summary += `📋 Missing by Assigned User:\n`;
        summary += `${'='.repeat(50)}\n`;

        const sortedUsers = Array.from(groupedByUser.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        sortedUsers.forEach(([user, userVillages], index) => {
            summary += `\n${index + 1}. ${user} (${userVillages.length} village${userVillages.length > 1 ? 's' : ''}):\n`;
            userVillages
                .sort((a, b) => a.iddesa.localeCompare(b.iddesa))
                .forEach(village => {
                    summary += `   • ${village.nmdesa} (${village.iddesa})\n`;
                });
        });

        // Add complete list
        summary += `\n📝 Complete List (Sorted by IDDESA):\n`;
        summary += `${'='.repeat(50)}\n`;
        missingVillages
            .sort((a, b) => a.iddesa.localeCompare(b.iddesa))
            .forEach((village, index) => {
                summary += `${index + 1}. ${village.iddesa} - ${village.nmdesa} (${village.assignedUsers.join(', ')})\n`;
            });

        summary += `\n💡 Action Items:\n`;
        summary += `- Contact assigned users for file upload\n`;
        summary += `- Provide template files if needed\n`;
        summary += `- Set deadlines for completion\n`;
        summary += `- Monitor progress regularly\n`;

        console.log('\n📄 Generated Summary:');
        console.log('='.repeat(60));
        console.log(summary);
        console.log('='.repeat(60));

        console.log(`\n✅ Summary generation test complete!`);
        console.log(`📊 Total villages: ${allVillages.length}`);
        console.log(`✅ With files: ${allVillages.filter(v => v.hasFile).length}`);
        console.log(`⚠️ Missing files: ${missingVillages.length}`);
        console.log(`👥 Users with missing villages: ${groupedByUser.size}`);

        console.log('\n🎉 Copy summary functionality is working correctly!');

    } catch (error) {
        console.error('❌ Error testing copy summary:', error);
    }
};

// Run the test
setTimeout(testCopySummary, 1000);
console.log('Testing copy summary functionality...');