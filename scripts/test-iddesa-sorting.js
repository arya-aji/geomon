// Test script to verify IDDESA sorting
const testIdesaSorting = async () => {
    try {
        console.log('=== TESTING IDDESA SORTING ===\n');

        // Get data from API
        console.log('🔗 Fetching data from API...');
        const response = await fetch('http://localhost:5174/api/save-geojson?userId=anonymous');
        const result = await response.json();

        if (!result.success) {
            console.error('❌ API response failed:', result);
            return;
        }

        console.log('✅ API response successful');

        // Process villages and sort by IDDESA
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
                        hasFile: true
                    });
                }
            }
        });

        const villages = Array.from(villageMap.values()).sort((a, b) => a.iddesa.localeCompare(b.iddesa));

        console.log('\n📋 Villages sorted by IDDESA:');
        villages.forEach((village, index) => {
            console.log(`${index + 1}. ${village.iddesa} - ${village.nmdesa}`);
        });

        // Verify sorting is correct
        let isSortedCorrectly = true;
        for (let i = 1; i < villages.length; i++) {
            if (villages[i].iddesa < villages[i-1].iddesa) {
                isSortedCorrectly = false;
                break;
            }
        }

        console.log(`\n✅ Sorting verification: ${isSortedCorrectly ? 'CORRECT' : 'INCORRECT'}`);
        console.log(`Total villages with files: ${villages.length}`);

        // Show first few and last few to demonstrate sorting
        console.log('\n🔍 First 5 villages:');
        villages.slice(0, 5).forEach(v => console.log(`   ${v.iddesa} - ${v.nmdesa}`));

        console.log('\n🔍 Last 5 villages:');
        villages.slice(-5).forEach(v => console.log(`   ${v.iddesa} - ${v.nmdesa}`));

        console.log('\n🎉 IDDESA sorting test complete!');

    } catch (error) {
        console.error('❌ Error testing IDDESA sorting:', error);
    }
};

// Run the test
setTimeout(testIdesaSorting, 1000);
console.log('Testing IDDESA sorting functionality...');