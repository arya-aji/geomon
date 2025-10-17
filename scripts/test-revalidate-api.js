import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function testRevalidateAPI() {
    try {
        console.log('=== TESTING REVALIDATE API ===\n');

        // Find a village with a file to test
        const testVillages = await sql`
            SELECT id, nmdesa, current_version_id, current_version_number
            FROM processed_geojson
            WHERE is_active = true AND current_version_id IS NOT NULL
            LIMIT 5
        `;

        if (testVillages.length === 0) {
            console.log('❌ No villages with files found to test');
            return;
        }

        console.log('📋 Found villages to test:');
        testVillages.forEach((village, index) => {
            console.log(`${index + 1}. ${village.nmdesa} (ID: ${village.id}, Version ID: ${village.current_version_id})`);
        });

        // Test the API endpoint with the first village
        const testVillage = testVillages[0];
        console.log(`\n🧪 Testing revalidate API with ${testVillage.nmdesa}...`);

        // Create test anomaly summary
        const testAnomalySummary = {
            total: 2,
            byType: {
                'duplicate_idsubsls': 1,
                'invalid_geometry': 1
            },
            bySeverity: {
                'High': 1,
                'Medium': 1
            },
            timestamp: new Date().toISOString(),
            revalidated: true
        };

        // Test the API endpoint
        const response = await fetch('http://localhost:5173/api/update-anomaly-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                versionId: testVillage.current_version_id,
                anomalySummary: testAnomalySummary,
                anomalies: [
                    {
                        idsubsls: 'test123',
                        type: 'duplicate_idsubsls',
                        severity: 'High',
                        description: 'Test duplicate ID'
                    },
                    {
                        idsubsls: 'test456',
                        type: 'invalid_geometry',
                        severity: 'Medium',
                        description: 'Test invalid geometry'
                    }
                ]
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ API test successful!');
            console.log('Response:', result);
        } else {
            console.log('❌ API test failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('Error:', errorText);
        }

        // Verify the data was updated
        console.log('\n🔍 Verifying data was updated...');
        const updatedVersion = await sql`
            SELECT anomaly_summary
            FROM geojson_versions
            WHERE id = ${testVillage.current_version_id}
        `;

        if (updatedVersion.length > 0) {
            console.log('✅ Data was updated in database');
            console.log('New anomaly summary:', updatedVersion[0].anomaly_summary);
        } else {
            console.log('❌ No updated data found');
        }

    } catch (error) {
        console.error('❌ Error testing API:', error);
    }
}

testRevalidateAPI();