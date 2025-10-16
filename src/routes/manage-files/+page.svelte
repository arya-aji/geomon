<script lang="ts">
	import { onMount } from 'svelte';
import JSZip from 'jszip';

	let villages: any[] = [];
	let groupedByUser: any[] = [];
	let isLoading = true;
	let error: string | null = null;
	let currentView: 'village' | 'operator' = 'village';

	// Official village to IDDESA mapping
	const villageIdMapping: { [key: string]: string } = {
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

	// User mapping JSON data
	const userMapping: { [key: string]: string[] } = {
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
		"Petamburan": ["Novaldi Endrawan"],
		"Gondangdia": ["Luli huriah"],
		"Gunung Sahari Selatan": ["Lusia Puji Astuti"],
		"Karet Tengsin": ["Lusia Puji Astuti"],
		"Serdang": ["Meiriana Hudanti Perdhani"],
		"Pegangsaan": ["Meiriana Hudanti Perdhani"],
		"Rawa Sari": ["Muhammad Fadhil Amin"],
		"Bendungan Hilir": ["Muhammad Fadhil Amin"],
		"Paseban": ["Luli huriah"],
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
	function getAssignedUsers(villageName: string): string[] {
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

	// Function to display assigned users as a formatted string
	function getAssignedUsersDisplay(villageName: string): string {
		const users = getAssignedUsers(villageName);
		return users.join(', ');
	}

	// Function to get all expected villages from user mapping
	function getAllExpectedVillages(): any[] {
		const expectedVillages: any[] = [];

		Object.entries(villageIdMapping).forEach(([villageName, iddesa]) => {
			const assignedUsers = getAssignedUsers(villageName);
			expectedVillages.push({
				iddesa: iddesa, // Use official IDDESA mapping
				nmdesa: villageName,
				kdkab: null,
				kdkec: null,
				kddesa: null,
				fileId: null,
				originalFilename: null,
				currentVersionNumber: null,
				updatedAt: null,
				userId: null,
				anomalyTotal: 0,
				assignedUsers: assignedUsers,
				hasFile: false
			});
		});

		return expectedVillages.sort((a, b) => a.iddesa.localeCompare(b.iddesa));
	}

	// Function to merge existing villages with expected ones
	function mergeAllVillages(existingVillages: any[]): any[] {
		const expectedVillages = getAllExpectedVillages();
		const existingMap = new Map();

		// Create map of existing villages by IDDESA (more reliable than name matching)
		existingVillages.forEach(village => {
			if (village.iddesa) {
				existingMap.set(village.iddesa, { ...village, hasFile: true });
			}
		});

		// Merge expected villages with existing ones using IDDESA
		const mergedVillages = expectedVillages.map(expected => {
			const existing = existingMap.get(expected.iddesa);

			if (existing) {
				return existing;
			} else {
				return expected;
			}
		});

		// Sort the final merged list by IDDESA
		return mergedVillages.sort((a, b) => a.iddesa.localeCompare(b.iddesa));
	}

	// Function to group villages by assigned users (including missing ones)
	function groupVillagesByUser(allVillages: any[]): any[] {
		const userGroups = new Map<string, any[]>();

		allVillages.forEach(village => {
			const users = village.assignedUsers || ['No user assigned'];
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
				villages: villageList.sort((a, b) => {
					// Sort by hasFile (true first), then by IDDESA
					if (a.hasFile !== b.hasFile) {
						return b.hasFile - a.hasFile;
					}
					// All villages now have IDDESA, so just sort by IDDESA
					return a.iddesa.localeCompare(b.iddesa);
				}),
				count: villageList.length,
				hasFilesCount: villageList.filter(v => v.hasFile).length,
				missingCount: villageList.filter(v => !v.hasFile).length
			}))
			.sort((a, b) => a.user.localeCompare(b.user));
	}

	interface Village {
		iddesa: string;
		nmdesa: string;
		kdkab: string;
		kdkec: string;
		kddesa: string;
		fileId: number;
		originalFilename: string;
		currentVersionNumber: number;
		updatedAt: string;
		userId: string;
		anomalyTotal: number; // Number of anomalies found
		assignedUsers: string[]; // New field for assigned users
	}

	// Real-time anomaly checking function (same logic as main page)
	async function checkAnomaliesForGeoJSON(geoJson: any): Promise<any[]> {
		const anomalies: any[] = [];

		if (!geoJson || geoJson.type !== 'FeatureCollection') {
			return anomalies;
		}

		// Add anomaly function
		function addAnomaly(anomalyData: any) {
			const newAnomaly = {
				...anomalyData,
				detectedAt: new Date().toLocaleString(),
				uniqueId: `${anomalyData.idsubsls}_${anomalyData.properties?.anomalyType || 'unknown'}_${Date.now()}`
			};
			anomalies.push(newAnomaly);
		}

		// Helper function to extract coordinates
		function extractCoordinates(geometry: any): string {
			try {
				if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates[0] && geometry.coordinates[0][0]) {
					const coords = geometry.coordinates[0][0];
					return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
				} else if (geometry.type === 'MultiPolygon' && geometry.coordinates && geometry.coordinates[0] && geometry.coordinates[0][0] && geometry.coordinates[0][0][0]) {
					const coords = geometry.coordinates[0][0][0];
					return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
				}
				return 'Unknown coordinates';
			} catch (error) {
				return 'Error extracting coordinates';
			}
		}

		// Rule 1: Check for duplicate idsubsls
		const uploadedIds = new Set();
		geoJson.features.forEach((feature: any) => {
			if (feature.properties && feature.properties.idsubsls) {
				if (uploadedIds.has(feature.properties.idsubsls)) {
					addAnomaly({
						idsubsls: feature.properties.idsubsls,
						title: `ID Duplikat: ${feature.properties.idsubsls}`,
						severity: 'High',
						description: `Duplikasi idsubsls ditemukan di ${feature.properties.nmsls || 'area tidak diketahui'}`,
						coordinates: extractCoordinates(feature.geometry),
						properties: {
							...feature.properties,
							anomalyType: 'duplicate_idsubsls'
						}
					});
				} else {
					uploadedIds.add(feature.properties.idsubsls);
				}
			}
		});

		// Rule 2 & 3: Check SLS consistency with SIPW table (simplified version)
		try {
			const geoJsonIds = new Set<string>();
			const featuresById: { [key: string]: any } = {};

			geoJson.features.forEach((feature: any) => {
				if (feature.properties && feature.properties.idsubsls) {
					const id = feature.properties.idsubsls.toString();
					geoJsonIds.add(id);
					featuresById[id] = feature;
				}
			});

			if (geoJsonIds.size > 0) {
				// Extract district codes for filtering
				const geoJsonDistricts = new Set<string>();
				geoJson.features.forEach((feature: any) => {
					if (feature.properties && feature.properties.idsubsls) {
						const idsubsls = feature.properties.idsubsls.toString();
						if (idsubsls.length >= 10) {
							const districtCode = idsubsls.substring(0, 10);
							geoJsonDistricts.add(districtCode);
						}
					}
				});

				// Get SIPW data for comparison
				const sipwResponse = await fetch('/api/sipw-data', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						districts: Array.from(geoJsonDistricts),
						idsubsls: Array.from(geoJsonIds)
					}),
					signal: AbortSignal.timeout(10000)
				});

				if (sipwResponse.ok) {
					const sipwData = await sipwResponse.json();
					if (Array.isArray(sipwData)) {
						const sipwIds = new Set<string>(sipwData.map((item: any) => item.idsubsls));

						// Find extra IDs (in GeoJSON but not in SIPW)
						const extraIds = [...geoJsonIds].filter((id) => !sipwIds.has(id));
						extraIds.forEach((id) => {
							const feature = featuresById[id];
							if (feature && feature.properties) {
								addAnomaly({
									idsubsls: id,
									title: 'idsubsls Ekstra di GeoJSON',
									severity: 'Medium',
									description: `idsubsls ${id} ditemukan di GeoJSON tapi tidak ada di tabel SIPW`,
									coordinates: extractCoordinates(feature.geometry),
									properties: {
										anomalyType: 'extra_idsubsls',
										geojsonFeature: feature,
										...feature.properties
									}
								});
							}
						});
					}
				}
			}
		} catch (error) {
			console.warn('SIPW consistency check failed:', error);
		}

		// Rule 4: Check for invalid geometries
		geoJson.features.forEach((feature: any, featureIndex: number) => {
			if (!feature.geometry) {
				addAnomaly({
					idsubsls: feature.properties?.idsubsls || `feature_${featureIndex}`,
					title: 'Null Geometry Detected',
					severity: 'High',
					description: 'Feature has null or undefined geometry',
					coordinates: 'Unknown'
				});
				return;
			}

			const geometry = feature.geometry;
			const props = feature.properties;

			if (geometry.type === 'Polygon') {
				geometry.coordinates.forEach((ring: number[][], ringIndex: number) => {
					if (ring.length < 4) {
						addAnomaly({
							idsubsls: props?.idsubsls || `feature_${featureIndex}`,
							title: 'Invalid Ring - Too Few Points',
							severity: 'High',
							description: `Ring ${ringIndex + 1} has only ${ring.length} points (minimum 4 required)`,
							coordinates: extractCoordinates(geometry)
						});
					}

					// Check if ring is properly closed
					const first = ring[0];
					const last = ring[ring.length - 1];
					if (first[0] !== last[0] || first[1] !== last[1]) {
						addAnomaly({
							idsubsls: props?.idsubsls || `feature_${featureIndex}`,
							title: 'Non-Closed Ring Detected',
							severity: 'High',
							description: `Ring ${ringIndex + 1} is not properly closed`,
							coordinates: extractCoordinates(geometry)
						});
					}
				});
			}
		});

		return anomalies;
	}

	async function fetchVillages() {
		try {
			const response = await fetch('/api/save-geojson?userId=anonymous');
			const result = await response.json();

			if (result.success) {
				// Filter out records without iddesa or nmdesa, and get only the latest version for each iddesa
				const villageMap = new Map<string, Village>();

				// Fetch anomaly data for each file using real-time checking
				const filesWithAnomalies = await Promise.all(
					result.files.map(async (file: any) => {
						if (file.iddesa && file.nmdesa && file.currentVersionId) {
							try {
								// Get the current GeoJSON data for this file
								const versionResponse = await fetch(`/api/geojson-versions?versionId=${file.currentVersionId}`);
								const versionResult = await versionResponse.json();

								if (versionResult.success && versionResult.version && versionResult.version.geojsonData) {
									// Perform real-time anomaly checking on the current GeoJSON data
									const anomalies = await checkAnomaliesForGeoJSON(versionResult.version.geojsonData);

									return {
										...file,
										anomalyTotal: anomalies.length
									};
								}
							} catch (error) {
								console.warn(`Failed to fetch or check anomalies for file ${file.id}:`, error);
							}
						}
						return {
							...file,
							anomalyTotal: 0
						};
					})
				);

				filesWithAnomalies.forEach((file: any) => {
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
								userId: file.userId,
								anomalyTotal: file.anomalyTotal || 0,
								assignedUsers: getAssignedUsers(file.nmdesa)
							});
						}
					}
				});

				// Convert map to array and sort by iddesa
				const existingVillages = Array.from(villageMap.values()).sort((a, b) => a.iddesa.localeCompare(b.iddesa));

				// Merge with expected villages to include missing ones
				villages = mergeAllVillages(existingVillages);

				// Group villages by assigned users for operator view (including missing)
				groupedByUser = groupVillagesByUser(villages);

				console.log('Fetched villages:', existingVillages.length);
				console.log('Total expected villages:', villages.length);
				console.log('Villages with files:', villages.filter(v => v.hasFile).length);
				console.log('Villages without files:', villages.filter(v => !v.hasFile).length);
				console.log('Grouped by user:', groupedByUser);
			} else {
				throw new Error('Failed to fetch files');
			}
		} catch (err) {
			error = 'Failed to load village data';
			console.error('Error fetching files:', err);
		} finally {
			isLoading = false;
		}
	}

	async function downloadGeoJson(village: Village) {
		try {
			const response = await fetch(`/api/geojson-versions?fileId=${village.fileId}`);
			const result = await response.json();

			if (result.success && result.versions.length > 0) {
				// Get the current version (first in array should be the latest)
				const currentVersion =
					result.versions.find((v: any) => v.id === result.file.currentVersionId) ||
					result.versions[0];

				if (currentVersion && currentVersion.geojsonData) {
					// Create a Blob with the GeoJSON data
					const blob = new Blob([JSON.stringify(currentVersion.geojsonData, null, 2)], {
						type: 'application/json'
					});

					// Create a download link
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;

					// Use the village name in filename
					const safeVillageName = village.nmdesa.replace(/[^a-zA-Z0-9]/g, '_');
					const downloadFilename = `${safeVillageName}.geojson`;
					a.download = downloadFilename;

					// Trigger the download
					document.body.appendChild(a);
					a.click();

					// Clean up
					document.body.removeChild(a);
					window.URL.revokeObjectURL(url);
				} else {
					throw new Error('No GeoJSON data found for this village');
				}
			} else {
				throw new Error('Failed to fetch file data');
			}
		} catch (err) {
			console.error('Error downloading file:', err);
			alert('Failed to download file. Please try again.');
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		// Convert to WIB (UTC+7) timezone
		const wibOffset = 7 * 60; // 7 hours in minutes
		const localOffset = date.getTimezoneOffset(); // minutes from UTC (negative for WIB)
		const wibTime = new Date(date.getTime() + (localOffset + wibOffset) * 60 * 1000);

		// Format: DD/MM/YYYY HH:mm:ss (WIB)
		const day = String(wibTime.getDate()).padStart(2, '0');
		const month = String(wibTime.getMonth() + 1).padStart(2, '0');
		const year = wibTime.getFullYear();
		const hours = String(wibTime.getHours()).padStart(2, '0');
		const minutes = String(wibTime.getMinutes()).padStart(2, '0');
		const seconds = String(wibTime.getSeconds()).padStart(2, '0');

		return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
	}

	// Function to generate reference for villages without files
	function generateMissingVillagesReference() {
		const missingVillages = villages.filter(v => !v.hasFile);

		const referenceData = {
			generated_at: new Date().toISOString(),
			total_missing: missingVillages.length,
			villages: missingVillages.map(village => ({
				iddesa: village.iddesa,
				nmdesa: village.nmdesa,
				assigned_users: village.assignedUsers,
				suggested_filename: `${village.nmdesa.toLowerCase().replace(/\s+/g, '_')}.geojson`,
				geojson_template: {
					type: "FeatureCollection",
					features: [
						{
							type: "Feature",
							properties: {
								id_desa: village.iddesa,
								nm_desa: village.nmdesa,
								kd_kab: "3173", // Jakarta Pusat
								kd_kec: village.iddesa.substring(4, 7), // Extract kecamatan code
								kd_desa: village.iddesa.substring(7, 10) // Extract desa code
							},
							geometry: {
								type: "Polygon",
								coordinates: [
									[
										// Add coordinates here
									]
								]
							}
						}
					]
				}
			})).sort((a, b) => a.iddesa.localeCompare(b.iddesa))
		};

		return referenceData;
	}

	// Function to download missing villages reference
	function downloadMissingVillagesReference() {
		const referenceData = generateMissingVillagesReference();

		// Create JSON content
		const jsonContent = JSON.stringify(referenceData, null, 2);

		// Create Blob
		const blob = new Blob([jsonContent], { type: 'application/json' });

		// Create download link
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `missing_villages_reference_${new Date().toISOString().split('T')[0]}.json`;

		// Trigger download
		document.body.appendChild(a);
		a.click();

		// Clean up
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}

	// Function to generate summary of missing villages
	function generateMissingVillagesSummary(): string {
		const missingVillages = villages.filter(v => !v.hasFile);

		if (missingVillages.length === 0) {
			return "🎉 All villages have files uploaded!";
		}

		// Group by assigned users
		const groupedByUser = new Map<string, any[]>();

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
		summary += `Total villages missing: ${missingVillages.length}/${villages.length} (${((missingVillages.length / villages.length) * 100).toFixed(1)}%)\n\n`;

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

		return summary;
	}

	// Function to copy missing villages summary to clipboard
	async function copyMissingVillagesSummary() {
		try {
			const summary = generateMissingVillagesSummary();

			// Use modern clipboard API if available
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(summary);
			} else {
				// Fallback for older browsers
				const textArea = document.createElement('textarea');
				textArea.value = summary;
				textArea.style.position = 'fixed';
				textArea.style.left = '-999999px';
				textArea.style.top = '-999999px';
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();

				const result = document.execCommand('copy');
				document.body.removeChild(textArea);

				if (!result) {
					throw new Error('Failed to copy to clipboard');
				}
			}

			// Show success message
			const missingCount = villages.filter(v => !v.hasFile).length;
			alert(`✅ Summary of ${missingCount} missing villages copied to clipboard!\n\nYou can now paste it in your preferred application.`);

		} catch (error) {
			console.error('Error copying to clipboard:', error);

			// Fallback: show the summary in a modal/popup
			const summary = generateMissingVillagesSummary();

			// Create a simple modal with the text
			const modal = document.createElement('div');
			modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
			modal.innerHTML = `
				<div class="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
					<h3 class="text-lg font-semibold mb-4">Missing Villages Summary</h3>
					<p class="text-sm text-gray-600 mb-4">Clipboard access denied. Copy the text below manually:</p>
					<textarea class="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-xs" readonly>${summary}</textarea>
					<div class="mt-4 flex justify-end">
						<button onclick="this.closest('.fixed').remove()" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Close</button>
					</div>
				</div>
			`;
			document.body.appendChild(modal);
		}
	}

	// Function to download all GeoJSON files in ZIP format
	async function downloadAllGeoJsonInZip() {
		try {
			const villagesWithFiles = villages.filter(v => v.hasFile);

			if (villagesWithFiles.length === 0) {
				alert('No files available to download');
				return;
			}

			// Create a new ZIP file
			const zip = new JSZip();

			// Add a README file with information
			const readmeContent = `GEOMON GeoJSON Files Archive
Generated: ${new Date().toISOString()}

Total files: ${villagesWithFiles.length}
Completion rate: ${((villagesWithFiles.length / villages.length) * 100).toFixed(1)}%

Files in this archive:
${villagesWithFiles.map(v => `- ${v.nmdesa} (${v.iddesa}) - Version ${v.currentVersionNumber}`).join('\n')}

For missing villages, download the missing villages reference from the manage-files page.

© GEOMON - Geospasial Monitoring System
`;

			zip.file('README.txt', readmeContent);

			// Download each GeoJSON file and add to ZIP
			const downloadPromises = villagesWithFiles.map(async (village) => {
				try {
					const response = await fetch(`/api/geojson-versions?fileId=${village.fileId}`);
					const result = await response.json();

					if (result.success && result.versions.length > 0) {
						const currentVersion = result.versions.find((v: any) => v.id === result.file.currentVersionId) || result.versions[0];

						if (currentVersion && currentVersion.geojsonData) {
							// Create a formatted GeoJSON file
							const geoJsonContent = {
								type: "FeatureCollection",
								generator: "GEOMON - Geospasial Monitoring",
								timestamp: new Date().toISOString(),
								village: {
									iddesa: village.iddesa,
									nmdesa: village.nmdesa,
									kdkab: village.kdkab,
									kdkec: village.kdkec,
									kddesa: village.kddesa,
									version: village.currentVersionNumber,
									updated_at: village.updatedAt,
									assigned_users: village.assignedUsers
								},
								features: currentVersion.geojsonData.features || []
							};

							// Add to ZIP with safe filename
							const safeVillageName = village.nmdesa.replace(/[^a-zA-Z0-9]/g, '_');
							const filename = `${safeVillageName}_${village.iddesa}_v${village.currentVersionNumber}.geojson`;
							zip.file(filename, JSON.stringify(geoJsonContent, null, 2));

							return { success: true, village: village.nmdesa };
						}
					}

					return { success: false, village: village.nmdesa, error: 'No GeoJSON data found' };
				} catch (error) {
					console.error(`Error downloading ${village.nmdesa}:`, error);
					return { success: false, village: village.nmdesa, error: error.message };
				}
			});

			// Wait for all downloads to complete
			const results = await Promise.all(downloadPromises);

			// Log results
			console.log('Download results:', results);
			const successful = results.filter(r => r.success);
			const failed = results.filter(r => r.success === false);

			if (failed.length > 0) {
				console.warn('Failed to download some files:', failed);
			}

			// Generate the ZIP file
			const zipBlob = await zip.generateAsync({ type: 'blob' });

			// Create download link
			const url = window.URL.createObjectURL(zipBlob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `geomon_geojson_files_${new Date().toISOString().split('T')[0]}.zip`;

			// Trigger download
			document.body.appendChild(a);
			a.click();

			// Clean up
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			// Show completion message
			const message = `Successfully downloaded ${successful.length} GeoJSON files${failed.length > 0 ? ` (${failed.length} failed)` : ''} in ZIP archive.`;
			console.log(message);

		} catch (error) {
			console.error('Error creating ZIP file:', error);
			alert('Failed to create ZIP file. Please try again.');
		}
	}

	onMount(() => {
		fetchVillages();
	});
</script>

<svelte:head>
	<title>GEOMON - Manage Files</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8">
	<!-- Header -->
	<header class="mb-8 text-center">
		<h1 class="mb-2 text-6xl font-bold text-gray-900">GEOMON</h1>
		<p class="mb-6 text-xl text-gray-600">Geospasial Monitoring</p>

		<!-- Navigation Menu -->
		<nav class="flex justify-center">
			<div class="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
				<a
					href="/"
					class="rounded-l-lg px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Pengecekan
				</a>
				<a
					href="/monitoring"
					class="border-l border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Monitoring
				</a>
				<a
					href="/data-sls"
					class="border-l border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Data SLS
				</a>
				<a
					href="/perubahan"
					class="border-l border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Perubahan
				</a>
				<a
					href="/manage-files"
					class="rounded-r-lg border-l border-gray-200 bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors"
				>
					Manage Files
				</a>
			</div>
		</nav>
	</header>

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl">
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<!-- Header Section -->
			<div class="mb-6">
				<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
					<div>
						<h2 class="text-2xl font-semibold text-gray-900">
							{currentView === 'village' ? 'Nama Kelurahan' : 'Operator View'}
						</h2>
						<p class="text-sm text-gray-600">
							{currentView === 'village'
								? 'Showing latest version for each village, sorted by IDDESA'
								: 'Grouped by assigned operators'}
						</p>
					</div>

					<!-- View Toggle Buttons - Prominently Placed -->
					<div class="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
						<button
							on:click={() => currentView = 'village'}
							class="rounded-l-lg px-6 py-2.5 text-sm font-medium transition-colors {currentView === 'village'
								? 'bg-blue-600 text-white'
								: 'text-gray-700 hover:bg-gray-50'}"
						>
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
							</svg>
							<span class="hidden sm:inline">Village View</span>
							<span class="sm:hidden">Villages</span>
						</button>
						<button
							on:click={() => currentView = 'operator'}
							class="rounded-r-lg border-l border-gray-200 px-6 py-2.5 text-sm font-medium transition-colors {currentView === 'operator'
								? 'bg-blue-600 text-white'
								: 'text-gray-700 hover:bg-gray-50'}"
						>
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
							</svg>
							<span class="hidden sm:inline">Operator View</span>
							<span class="sm:hidden">Operators</span>
						</button>
					</div>
				</div>

				<!-- Statistics Bar -->
				<div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
					<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
						<div class="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
							{#if currentView === 'village'}
								{@const completedCount = villages.filter(v => v.hasFile).length}
								{@const missingCount = villages.filter(v => !v.hasFile).length}
								<div class="text-center">
									<div class="text-2xl font-bold text-gray-900">{villages.length}</div>
									<div class="text-sm text-gray-600">Total Villages</div>
								</div>
								<div class="flex flex-wrap items-center gap-2">
									<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
										<svg class="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
										</svg>
										{completedCount} Complete
									</span>
									<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
										<svg class="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
										</svg>
										{missingCount} Missing
									</span>
								</div>
							{:else}
								{@const totalVillagesWithFiles = groupedByUser.reduce((sum, g) => sum + g.hasFilesCount, 0)}
								{@const totalVillagesMissing = groupedByUser.reduce((sum, g) => sum + g.missingCount, 0)}
								<div class="text-center">
									<div class="text-2xl font-bold text-gray-900">{groupedByUser.length}</div>
									<div class="text-sm text-gray-600">Total Operators</div>
								</div>
								<div class="flex flex-wrap items-center gap-2">
									<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
										<svg class="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
										</svg>
										{totalVillagesWithFiles} Complete
									</span>
									<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
										<svg class="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
										</svg>
										{totalVillagesMissing} Missing
									</span>
								</div>
							{/if}
						</div>

						<!-- Action Buttons Group -->
						<div class="flex flex-wrap items-center gap-2">
							{#if currentView === 'village'}
								{@const completedCount = villages.filter(v => v.hasFile).length}
								{@const missingCount = villages.filter(v => !v.hasFile).length}
								{#if missingCount > 0}
									<button
										on:click={copyMissingVillagesSummary}
										class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
									>
										<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
										</svg>
										<span class="hidden sm:inline">Copy Summary</span>
										<span class="sm:hidden">Copy</span>
									</button>
									<button
										on:click={downloadMissingVillagesReference}
										class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors shadow-sm"
									>
										<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
										</svg>
										<span class="hidden sm:inline">Missing Reference</span>
										<span class="sm:hidden">Reference</span>
									</button>
								{/if}
								{#if completedCount > 0}
									<button
										on:click={downloadAllGeoJsonInZip}
										class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors shadow-sm"
									>
										<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88 7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l5 5m5-5l-5 5"></path>
										</svg>
										<span class="hidden sm:inline">Download All ({completedCount})</span>
										<span class="sm:hidden">Download ({completedCount})</span>
									</button>
								{/if}
							{:else}
								{@const totalVillagesWithFiles = groupedByUser.reduce((sum, g) => sum + g.hasFilesCount, 0)}
								{@const totalVillagesMissing = groupedByUser.reduce((sum, g) => sum + g.missingCount, 0)}
								{#if totalVillagesMissing > 0}
									<button
										on:click={copyMissingVillagesSummary}
										class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
									>
										<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
										</svg>
										<span class="hidden sm:inline">Copy Summary</span>
										<span class="sm:hidden">Copy</span>
									</button>
								{/if}
								{#if totalVillagesWithFiles > 0}
									<button
										on:click={downloadAllGeoJsonInZip}
										class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors shadow-sm"
									>
										<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88 7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l5 5m5-5l-5 5"></path>
										</svg>
										<span class="hidden sm:inline">Download All ({totalVillagesWithFiles})</span>
										<span class="sm:hidden">Download ({totalVillagesWithFiles})</span>
									</button>
								{/if}
							{/if}
						</div>
					</div>
				</div>

				<!-- Progress Indicator -->
				{#if currentView === 'village'}
					{@const completionRate = (villages.filter(v => v.hasFile).length / villages.length) * 100}
					<div class="mb-4">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm font-medium text-gray-700">Completion Progress</span>
							<span class="text-sm font-medium text-gray-900">{completionRate.toFixed(1)}%</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300" style="width: {completionRate}%"></div>
						</div>
					</div>
				{:else}
					{@const completionRate = (groupedByUser.reduce((sum, g) => sum + g.hasFilesCount, 0) / villages.length) * 100}
					<div class="mb-4">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm font-medium text-gray-700">Overall Completion Progress</span>
							<span class="text-sm font-medium text-gray-900">{completionRate.toFixed(1)}%</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300" style="width: {completionRate}%"></div>
						</div>
					</div>
				{/if}
			</div>

			{#if isLoading}
				<div class="py-12 text-center">
					<div
						class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
					></div>
					<p class="mt-4 text-sm text-gray-600">Loading village data...</p>
				</div>
			{:else if error}
				<div class="py-12 text-center">
					<div class="mx-auto h-12 w-12 text-red-400">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
					</div>
					<p class="mt-2 text-sm text-gray-600">Error: {error}</p>
				</div>
			{:else if villages.length === 0}
				<div class="py-12 text-center">
					<div class="mx-auto h-12 w-12 text-gray-400">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							></path>
						</svg>
					</div>
					<p class="mt-2 text-sm text-gray-600">No village files found</p>
					<p class="mt-1 text-xs text-gray-500">Upload GeoJSON files with village data to see them here</p>
				</div>
			{:else if currentView === 'village'}
				<!-- Village List -->
				<div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
					<table class="min-w-full divide-y divide-gray-300">
						<thead class="bg-gray-50">
							<tr>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Status
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									IDDESA
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Nama Kelurahan
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Anomaly Number
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									File Info
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Updated
								</th>
								<th scope="col" class="relative px-6 py-3">
									<span class="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each villages as village (village.nmdesa)}
								<tr class="{village.hasFile ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'}">
									<td class="whitespace-nowrap px-6 py-4 text-sm">
										{#if village.hasFile}
											<span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
												<svg class="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
												</svg>
												Complete
											</span>
										{:else}
											<span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
												<svg class="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
												</svg>
												Missing
											</span>
										{/if}
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
										{village.iddesa || '-'}
									</td>
									<td class="whitespace-nowrap px-6 py-4">
										<div class="text-sm font-medium {village.hasFile ? 'text-gray-900' : 'text-red-900'}">{village.nmdesa}</div>
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
										{#if village.hasFile}
											<div class="text-center">
												<span class="inline-flex items-center rounded-full {village.anomalyTotal > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'} px-2.5 py-0.5 text-xs font-medium">
													{village.anomalyTotal}
												</span>
												{#if village.anomalyTotal > 0}
													<div class="text-xs text-gray-500 mt-1">anomalies</div>
												{:else}
													<div class="text-xs text-green-600 mt-1">clean</div>
												{/if}
											</div>
										{:else}
											<span class="text-red-600">No data</span>
										{/if}
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
										{#if village.hasFile}
											<div class="space-y-1">
												<div>Version: <span class="font-medium text-gray-900">{village.currentVersionNumber}</span></div>
												<div>Assigned: <span class="font-medium text-gray-900">{getAssignedUsersDisplay(village.nmdesa)}</span></div>
											</div>
										{:else}
											<div class="space-y-1">
												<div>Version: <span class="font-medium text-red-900">No file</span></div>
												<div>Assigned: <span class="font-medium text-gray-900">{getAssignedUsersDisplay(village.nmdesa)}</span></div>
											</div>
										{/if}
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
										{#if village.hasFile}
											{formatDate(village.updatedAt)}
										{:else}
											<span class="text-red-600">No file uploaded</span>
										{/if}
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
										{#if village.hasFile}
											<button
												on:click={() => downloadGeoJson(village)}
												class="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
												title="Download GeoJSON file"
											>
												<svg
													class="mr-2 h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
													></path>
												</svg>
												Download
											</button>
										{:else}
											<button
												disabled
												class="inline-flex items-center rounded-md bg-gray-300 px-3 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
												title="No file available"
											>
												<svg
													class="mr-2 h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
													></path>
												</svg>
												No File
											</button>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<!-- Operator View -->
				<div class="space-y-6">
					{#each groupedByUser as group (group.user)}
						<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
							<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
								<div class="flex items-center justify-between">
									<div>
										<h3 class="text-lg font-semibold text-gray-900">{group.user}</h3>
										<div class="flex items-center space-x-4 text-sm text-gray-600">
											<p>{group.count} village{group.count > 1 ? 's' : ''} assigned</p>
											<p class="text-green-600">✓ {group.hasFilesCount} with files</p>
											{#if group.missingCount > 0}
												<p class="text-red-600">⚠ {group.missingCount} missing files</p>
											{/if}
										</div>
									</div>
									<div class="flex space-x-2">
										{#if group.hasFilesCount > 0}
											<button
												on:click={() => {
													group.villages.filter(v => v.hasFile).forEach(village => downloadGeoJson(village));
												}}
												class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
												title="Download all available GeoJSON files for this operator"
											>
												<svg
													class="mr-2 h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
													></path>
												</svg>
												Download All ({group.hasFilesCount})
											</button>
										{/if}
									</div>
								</div>
							</div>
							<div class="overflow-hidden">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
												Status
											</th>
											<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
												IDDESA
											</th>
											<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
												Village Name
											</th>
											<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
												Anomaly Number
											</th>
											<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
												Version
											</th>
											<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
												Updated
											</th>
											<th scope="col" class="relative px-6 py-3">
												<span class="sr-only">Actions</span>
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 bg-white">
										{#each group.villages as village (village.nmdesa)}
											<tr class="{village.hasFile ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'}">
												<td class="whitespace-nowrap px-6 py-4 text-sm">
													{#if village.hasFile}
														<span class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
															Complete
														</span>
													{:else}
														<span class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
															Missing
														</span>
													{/if}
												</td>
												<td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
													{village.iddesa || '-'}
												</td>
												<td class="whitespace-nowrap px-6 py-4 text-sm {village.hasFile ? 'text-gray-900' : 'text-red-900'}">
													{village.nmdesa}
												</td>
												<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
													{#if village.hasFile}
														<div class="text-center">
															<span class="inline-flex items-center rounded-full {village.anomalyTotal > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'} px-2 py-0.5 text-xs font-medium">
																{village.anomalyTotal}
															</span>
															{#if village.anomalyTotal > 0}
																<div class="text-xs text-gray-500 mt-1">anomalies</div>
															{:else}
																<div class="text-xs text-green-600 mt-1">clean</div>
															{/if}
														</div>
													{:else}
														<span class="text-red-600">No data</span>
													{/if}
												</td>
												<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
													{#if village.hasFile}
														{village.currentVersionNumber}
													{:else}
														<span class="text-red-600">No file</span>
													{/if}
												</td>
												<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
													{#if village.hasFile}
														{formatDate(village.updatedAt)}
													{:else}
														<span class="text-red-600">No file uploaded</span>
													{/if}
												</td>
												<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
													{#if village.hasFile}
														<button
															on:click={() => downloadGeoJson(village)}
															class="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
															title="Download GeoJSON file"
														>
															<svg
																class="mr-2 h-4 w-4"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
																></path>
															</svg>
															Download
														</button>
													{:else}
														<button
															disabled
															class="inline-flex items-center rounded-md bg-gray-300 px-3 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
															title="No file available"
														>
															<svg
																class="mr-2 h-4 w-4"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
																></path>
															</svg>
															No File
														</button>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>