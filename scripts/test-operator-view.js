// Test script to verify operator view functionality
const testOperatorView = async () => {
    try {
        console.log('=== TESTING OPERATOR VIEW FUNCTIONALITY ===\n');

        // User mapping JSON data (same as in the page)
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

        // Function to get assigned users for a village (case-insensitive)
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

        // Function to group villages by assigned users (same as in the page)
        function groupVillagesByUser(villages) {
            const userGroups = new Map();

            villages.forEach(village => {
                const users = getAssignedUsers(village.nmdesa);
                const userKey = users.join(', ');

                if (!userGroups.has(userKey)) {
                    userGroups.set(userKey, []);
                }
                userGroups.get(userKey).push(village);
            });

            // Convert to array and sort
            return Array.from(userGroups.entries())
                .map(([user, villageList]) => ({
                    user,
                    villages: villageList.sort((a, b) => a.iddesa.localeCompare(b.iddesa)),
                    count: villageList.length
                }))
                .sort((a, b) => a.user.localeCompare(b.user));
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

        // Process the same way as the page
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
                        userId: file.userId,
                        assignedUsers: getAssignedUsers(file.nmdesa)
                    });
                }
            }
        });

        const villages = Array.from(villageMap.values()).sort((a, b) => a.iddesa.localeCompare(b.iddesa));

        // Group by users
        const groupedByUser = groupVillagesByUser(villages);

        console.log(`\n📊 Operator View Results:`);
        console.log(`Total villages: ${villages.length}`);
        console.log(`Total operators: ${groupedByUser.length}`);

        console.log('\n👥 Operators and their assigned villages:');
        groupedByUser.forEach((group, index) => {
            console.log(`\n${index + 1}. ${group.user} (${group.count} villages):`);
            group.villages.forEach((village, vIndex) => {
                console.log(`   ${vIndex + 1}. ${village.iddesa} - ${village.nmdesa} (v${village.currentVersionNumber})`);
            });
        });

        // Show some statistics
        const villagesWithAssignedUsers = groupedByUser.filter(g => g.user !== 'No user assigned');
        const villagesWithoutAssignment = groupedByUser.find(g => g.user === 'No user assigned');

        console.log('\n📈 Assignment Statistics:');
        console.log(`Operators with assignments: ${villagesWithAssignedUsers.length}`);
        console.log(`Villages assigned: ${villagesWithAssignedUsers.reduce((sum, g) => sum + g.count, 0)}`);

        if (villagesWithoutAssignment) {
            console.log(`Villages without assignment: ${villagesWithoutAssignment.count}`);
        }

        console.log('\n🎉 Operator view test complete!');

    } catch (error) {
        console.error('❌ Error testing operator view:', error);
    }
};

// Run the test
setTimeout(testOperatorView, 1000);
console.log('Testing operator view functionality...');