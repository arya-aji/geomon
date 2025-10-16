// Test script to verify the manage-files API response
const testApi = async () => {
    try {
        console.log('Testing API endpoint...');
        const response = await fetch('http://localhost:5174/api/save-geojson?userId=anonymous');
        const result = await response.json();

        if (result.success) {
            console.log('✅ API response successful');
            console.log('Total files:', result.files.length);

            // Test filtering logic (same as in the new page)
            const villageMap = new Map();

            result.files.forEach((file) => {
				if (file.iddesa && file.nmdesa) {
					const existing = villageMap.get(file.iddesa);

					// If no existing entry or this file is newer/higher version, update
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
				}
			});

			const villages = Array.from(villageMap.values()).sort((a, b) => a.iddesa.localeCompare(b.iddesa));

			console.log('✅ Unique villages found:', villages.length);
			console.log('First 3 villages:');
			console.table(villages.slice(0, 3));

        } else {
            console.error('❌ API response failed:', result);
        }
    } catch (error) {
        console.error('❌ Error testing API:', error);
    }
};

// Wait a moment for the server to start, then test
setTimeout(testApi, 2000);

console.log('Testing API functionality for new manage-files page...');