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
		assignedUsers: string[]; // New field for assigned users
	}

	async function fetchVillages() {
		try {
			const response = await fetch('/api/save-geojson?userId=anonymous');
			const result = await response.json();

			if (result.success) {
				// Filter out records without iddesa or nmdesa, and get only the latest version for each iddesa
				const villageMap = new Map<string, Village>();

				result.files.forEach((file: any) => {
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
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h2 class="text-2xl font-semibold text-gray-900">
						{currentView === 'village' ? 'Village Files (NMDESA)' : 'Operator View'}
					</h2>
					<p class="text-sm text-gray-600">
						{currentView === 'village'
							? 'Showing latest version for each village, sorted by IDDESA'
							: 'Grouped by assigned operators'}
					</p>
				</div>
				<div class="flex items-center space-x-4">
					<!-- View Toggle Buttons -->
					<div class="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
						<button
							on:click={() => currentView = 'village'}
							class="rounded-l-lg px-4 py-2 text-sm font-medium transition-colors {currentView === 'village'
								? 'bg-blue-600 text-white'
								: 'text-gray-700 hover:bg-gray-50'}"
						>
							Village View
						</button>
						<button
							on:click={() => currentView = 'operator'}
							class="rounded-r-lg border-l border-gray-200 px-4 py-2 text-sm font-medium transition-colors {currentView === 'operator'
								? 'bg-blue-600 text-white'
								: 'text-gray-700 hover:bg-gray-50'}"
						>
							Operator View
						</button>
					</div>
					<div class="text-sm text-gray-600">
						{#if currentView === 'village'}
							{@const completedCount = villages.filter(v => v.hasFile).length}
							{@const missingCount = villages.filter(v => !v.hasFile).length}
							<div class="space-y-1">
								<p>Total: {villages.length} villages</p>
								<div class="flex space-x-3">
									<span class="text-green-600">✓ {completedCount} complete</span>
									<span class="text-red-600">⚠ {missingCount} missing</span>
								</div>
								{#if missingCount > 0}
									<button
										on:click={downloadMissingVillagesReference}
										class="mt-2 inline-flex items-center rounded-md bg-orange-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
										title="Download reference for missing villages"
									>
										<svg
											class="mr-1 h-3 w-3"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											></path>
										</svg>
										Download Missing Reference
									</button>
									{#if completedCount > 0}
										<button
											on:click={downloadAllGeoJsonInZip}
											class="mt-2 ml-2 inline-flex items-center rounded-md bg-purple-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
											title="Download all GeoJSON files in ZIP format"
										>
											<svg
												class="mr-1 h-3 w-3"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M7 16a4 4 0 01-.88 7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l5 5m5-5l-5 5"
												></path>
											</svg>
											Download All ({completedCount})
										</button>
									{/if}
								{/if}
							</div>
						{:else}
							{@const totalVillagesWithFiles = groupedByUser.reduce((sum, g) => sum + g.hasFilesCount, 0)}
							{@const totalVillagesMissing = groupedByUser.reduce((sum, g) => sum + g.missingCount, 0)}
							<div class="space-y-1">
								<p>Total: {groupedByUser.length} operators</p>
								<div class="flex space-x-3">
									<span class="text-green-600">✓ {totalVillagesWithFiles} complete</span>
									<span class="text-red-600">⚠ {totalVillagesMissing} missing</span>
								</div>
								{#if totalVillagesWithFiles > 0}
									<button
										on:click={downloadAllGeoJsonInZip}
										class="mt-2 inline-flex items-center rounded-md bg-purple-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
										title="Download all GeoJSON files in ZIP format"
									>
										<svg
											class="mr-1 h-3 w-3"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 16a4 4 0 01-.88 7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l5 5m5-5l-5 5"
											></path>
										</svg>
										Download All ({totalVillagesWithFiles})
									</button>
								{/if}
							</div>
						{/if}
					</div>
				</div>
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
									Village Name (NMDESA)
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Region Codes
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
											<div class="space-y-1">
												<div>KDKAB: <span class="font-medium text-gray-900">{village.kdkab}</span></div>
												<div>KDKEC: <span class="font-medium text-gray-900">{village.kdkec}</span></div>
												<div>KDDESA: <span class="font-medium text-gray-900">{village.kddesa}</span></div>
											</div>
										{:else}
											<span class="text-red-600">No region codes</span>
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
												Region Codes
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
														<div class="space-y-1">
															<div>KDKAB: <span class="font-medium text-gray-900">{village.kdkab}</span></div>
															<div>KDKEC: <span class="font-medium text-gray-900">{village.kdkec}</span></div>
															<div>KDDESA: <span class="font-medium text-gray-900">{village.kddesa}</span></div>
														</div>
													{:else}
														<span class="text-red-600">No region codes</span>
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