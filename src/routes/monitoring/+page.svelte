<script lang="ts">
	import { browser } from '$app/environment';
	import dynamicLeaflet from '$lib/components/Leaflet.js';

	// Map and GeoJSON variables
	let mapContainer: HTMLDivElement;
	let map: any;
	let geoJSONLayer: any;
	let Leaflet: any = {};


	// UI State
	let selectedKecamatan: string = '';
	let selectedKelurahan: string = '';
	let isLoading: boolean = false;
	let currentGeoJSON: any = null;
	let anomalies: any[] = [];

	// Jakarta Pusat Structure
	const jakartaPusatStructure = {
		"Tanah Abang": ["Bendungan Hilir", "Gelora", "Karet Tengsin", "Kebon Kacang", "Kebon Melati", "Petamburan", "Kampung Bali"],
		"Menteng": ["Cikini", "Gondangdia", "Kebon Sirih", "Menteng", "Pegangsaan"],
		"Senen": ["Bungur", "Kenari", "Kramat", "Kwitang", "Paseban", "Senen"],
		"Cempaka Putih": ["Cempaka Putih Barat", "Cempaka Putih Timur", "Rawa Sari"],
		"Johar Baru": ["Galur", "Johar Baru", "Kampung Rawa", "Tanah Tinggi"],
		"Kemayoran": ["Cempaka Baru", "Gunung Sahari Selatan", "Harapan Mulya", "Kebon Kosong", "Kemayoran", "Serdang", "Sumur Batu", "Utan Panjang"],
		"Sawah Besar": ["Gunung Sahari Utara", "Karang Anyar", "Kartini", "Mangga Dua Selatan", "Pasar Baru"],
		"Gambir": ["Cideng", "Duri Pulo", "Gambir", "Kebon Kelapa", "Petojo Selatan", "Petojo Utara"]
	};

	// Get available kelurahan for selected kecamatan
	$: availableKelurahan = selectedKecamatan ? jakartaPusatStructure[selectedKecamatan] : [];

	// Initialize map when component is mounted
	if (browser) {
		(async () => {
			// Load Leaflet dynamically
			Leaflet = await dynamicLeaflet();

			if (!Leaflet || Object.keys(Leaflet).length === 0) {
				console.error('Failed to load Leaflet');
				return;
			}

			// Wait for DOM to be ready
			await new Promise(resolve => {
				if (document.readyState === 'loading') {
					document.addEventListener('DOMContentLoaded', resolve);
				} else {
					resolve(true);
				}
			});

			// Initialize map
			map = Leaflet.map(mapContainer).setView([-6.1944, 106.8229], 12); // Jakarta Pusat coordinates

			// Add tile layer
			Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© OpenStreetMap contributors'
			}).addTo(map);

			// Add base maps
			const baseMaps = {
				'Street': Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '© OpenStreetMap contributors'
				}),
				'Satellite': Leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
					attribution: '© Esri'
				})
			};

			baseMaps['Street'].addTo(map);
			Leaflet.control.layers(baseMaps).addTo(map);
		})();
	}

	// Search and load latest GeoJSON
	async function searchAndLoadGeoJSON() {
		if (!selectedKecamatan || !selectedKelurahan) {
			alert('Silakan pilih kecamatan dan kelurahan terlebih dahulu');
			return;
		}

		isLoading = true;

		try {
			console.log(`🔍 Searching GeoJSON for ${selectedKelurahan}, ${selectedKecamatan}`);
			console.log(`🔍 Kecamatan code: ${getKecamatanCode(selectedKecamatan)}`);

			// Fetch from processed_geojson API
			const response = await fetch(`/api/save-geojson?userId=anonymous`);
			const result = await response.json();

			if (!result.success) {
				throw new Error('Failed to fetch GeoJSON data');
			}

			console.log(`📁 Total files found: ${result.files.length}`);
			console.log(`📁 Sample files:`, result.files.slice(0, 3).map(f => ({
				nmdesa: f.nmdesa,
				kdkec: f.kdkec,
				kddesa: f.kddesa
			})));

			// Find the latest file for selected kelurahan (case-insensitive matching)
			const kecamatanCode = getKecamatanCode(selectedKecamatan);
			console.log(`🔍 Looking for: ${selectedKelurahan} (any case), kecamatan code: ${kecamatanCode}`);

			const targetFiles = result.files.filter((file: any) => {
				const matchKelurahan = file.nmdesa && file.nmdesa.toLowerCase() === selectedKelurahan.toLowerCase();
				const matchKecamatan = file.kdkec === kecamatanCode;

				console.log(`🔍 Checking file: ${file.nmdesa} (${file.kdkec}) - Match: ${matchKelurahan && matchKecamatan}`);

				return matchKelurahan && matchKecamatan;
			});

			console.log(`📁 Target files found: ${targetFiles.length}`);

			if (targetFiles.length === 0) {
				// Show more helpful error message
				const kelurahanOptions = [...new Set(result.files.map(f => f.nmdesa).filter(Boolean))];
				console.log(`📁 Available kelurahan:`, kelurahanOptions.slice(0, 10));
				alert(`Tidak ada file GeoJSON untuk kelurahan ${selectedKelurahan} (${getKecamatanCode(selectedKecamatan)}).`);
				return;
			}

			// Get the latest file (highest version or most recent)
			const latestFile = targetFiles.sort((a: any, b: any) => {
				if (a.currentVersionNumber !== b.currentVersionNumber) {
					return (b.currentVersionNumber || 0) - (a.currentVersionNumber || 0);
				}
				return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
			})[0];

			console.log(`📁 Found latest file for ${selectedKelurahan}:`, latestFile);

			// Get the actual GeoJSON data
			const versionResponse = await fetch(`/api/geojson-versions?fileId=${latestFile.id}`);
			const versionResult = await versionResponse.json();

			if (!versionResult.success || !versionResult.versions.length) {
				throw new Error('Failed to fetch GeoJSON version data');
			}

			const currentVersion = versionResult.versions.find((v: any) =>
				v.id === latestFile.currentVersionId
			) || versionResult.versions[0];

			if (!currentVersion || !currentVersion.geojsonData) {
				throw new Error('No GeoJSON data found');
			}

			console.log(`✅ Loading GeoJSON for ${selectedKelurahan}`);

			// Clear existing layer
			if (geoJSONLayer) {
				map.removeLayer(geoJSONLayer);
			}

			// Add new GeoJSON layer
			geoJSONLayer = Leaflet.geoJSON(currentVersion.geojsonData, {
				style: {
					color: '#3388ff',
					weight: 2,
					opacity: 0.8,
					fillOpacity: 0.3
				}
			}).addTo(map);

			// Fit map to GeoJSON bounds
			if (geoJSONLayer.getBounds().isValid()) {
				map.fitBounds(geoJSONLayer.getBounds(), { padding: [50, 50] });
			}

			currentGeoJSON = currentVersion.geojsonData;

			// Check for anomalies
			await checkAnomalies(currentVersion.geojsonData, latestFile);

		} catch (error) {
			console.error('Error loading GeoJSON:', error);
			alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			isLoading = false;
		}
	}

	// Get kecamatan code (using 3-digit codes from database)
	function getKecamatanCode(kecamatanName: string): string {
		const codes: { [key: string]: string } = {
			"Tanah Abang": "010",
			"Menteng": "020",
			"Senen": "030",
			"Cempaka Putih": "050",
			"Johar Baru": "040",
			"Kemayoran": "060",
			"Sawah Besar": "070",
			"Gambir": "080"
		};
		return codes[kecamatanName] || '';
	}

	// Check anomalies (similar logic from /pages)
	async function checkAnomalies(geojsonData: any, fileInfo: any) {
		anomalies = [];

		if (!geojsonData || !geojsonData.features) {
			return;
		}

		console.log('🔍 Checking anomalies...');

		// Rule 1: Check for duplicate idsubsls
		const idsubslsSet = new Set();
		geojsonData.features.forEach((feature: any, index: number) => {
			const idsubsls = feature.properties?.idsubsls;
			if (idsubsls) {
				if (idsubslsSet.has(idsubsls)) {
					anomalies.push({
						type: 'Duplicate idsubsls',
						severity: 'High',
						description: `Duplicate idsubsls: ${idsubsls}`,
						featureIndex: index,
						featureId: feature.id || index
					});
				}
				idsubslsSet.add(idsubsls);
			}
		});

		// Rule 2: Check for missing required properties
		geojsonData.features.forEach((feature: any, index: number) => {
			const props = feature.properties || {};
			const requiredProps = ['idsubsls', 'nmdesa', 'nmkec', 'nmkab'];

			const missingProps = requiredProps.filter(prop => !props[prop]);
			if (missingProps.length > 0) {
				anomalies.push({
					type: 'Missing Properties',
					severity: 'Medium',
					description: `Missing properties: ${missingProps.join(', ')}`,
					featureIndex: index,
					featureId: feature.id || index
				});
			}
		});

		// Rule 3: Check geometry validity
		geojsonData.features.forEach((feature: any, index: number) => {
			if (!feature.geometry) {
				anomalies.push({
					type: 'Missing Geometry',
					severity: 'High',
					description: 'Feature has no geometry',
					featureIndex: index,
					featureId: feature.id || index
				});
			}
		});

		// Rule 4 & 5: Check SIPW consistency (extra and missing)
		await checkSIPWConsistency(geojsonData);

		console.log(`📊 Found ${anomalies.length} anomalies`);
	}

	// Function to add anomaly (similar to +page.svelte)
	function addAnomaly(anomalyData: any) {
		// Check for existing anomaly with same idsubsls and same type
		const existingAnomaly = anomalies.find((a) =>
			a.idsubsls === anomalyData.idsubsls &&
			a.properties?.anomalyType === anomalyData.properties?.anomalyType
		);

		if (existingAnomaly) {
			console.warn(`Anomaly with idsubsls ${anomalyData.idsubsls} and type ${anomalyData.properties?.anomalyType} already exists, skipping...`);
			return false;
		}

		// Add new anomaly with timestamp and unique ID
		const newAnomaly = {
			...anomalyData,
			detectedAt: new Date().toLocaleString(),
			uniqueId: `${anomalyData.idsubsls}_${anomalyData.properties?.anomalyType || 'unknown'}_${Date.now()}`
		};

		anomalies = [...anomalies, newAnomaly];
		return true;
	}

	// Function to extract coordinates (similar to +page.svelte)
	function extractCoordinates(geometry: any): string {
		try {
			if (
				geometry.type === 'Polygon' &&
				geometry.coordinates &&
				geometry.coordinates[0] &&
				geometry.coordinates[0][0]
			) {
				const coords = geometry.coordinates[0][0];
				return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
			} else if (
				geometry.type === 'MultiPolygon' &&
				geometry.coordinates &&
				geometry.coordinates[0] &&
				geometry.coordinates[0][0] &&
				geometry.coordinates[0][0][0]
			) {
				const coords = geometry.coordinates[0][0][0];
				return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
			} else if (geometry.type === 'Point' && geometry.coordinates) {
				return `${geometry.coordinates[1].toFixed(4)}, ${geometry.coordinates[0].toFixed(4)}`;
			}
			return 'Unknown coordinates';
		} catch (error) {
			return 'Error extracting coordinates';
		}
	}

	// Check SIPW consistency (extra and missing) - similar to +page.svelte
	async function checkSIPWConsistency(geoJson: any) {
		if (geoJson.type !== 'FeatureCollection') return;

		try {
			// Extract idsubsls from GeoJSON
			const geoJsonIds = new Set<string>();
			const featuresById: { [key: string]: any } = {};

			geoJson.features.forEach((feature: any) => {
				if (feature.properties && feature.properties.idsubsls) {
					const id = feature.properties.idsubsls.toString();
					geoJsonIds.add(id);
					featuresById[id] = feature;
				}
			});

			if (geoJsonIds.size === 0) {
				// No idsubsls found in GeoJSON
				addAnomaly({
					idsubsls: 'NO_IDSUBSLS_FOUND',
					type: 'No idsubsls Found',
					severity: 'High',
					description: 'The GeoJSON file does not contain any idsubsls identifiers',
					featureIndex: 0,
					featureId: 'no_idsubsls'
				});
				return;
			}

			// Extract district codes from GeoJSON
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

			console.log('🔍 Checking SIPW consistency for districts:', Array.from(geoJsonDistricts));

			// Fetch SIPW data
			let sipwResponse;
			try {
				const requestBody = {
					districts: Array.from(geoJsonDistricts),
					idsubsls: Array.from(geoJsonIds)
				};

				sipwResponse = await fetch('/api/sipw-data', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(requestBody),
					signal: AbortSignal.timeout(10000)
				});
			} catch (fetchError) {
				console.error('SIPW API call failed:', fetchError);
				addAnomaly({
					idsubsls: 'SIPW_TIMEOUT_ERROR',
					type: 'SIPW Data Timeout Error',
					severity: 'Medium',
					description: 'Request to fetch SIPW reference data timed out or failed',
					featureIndex: 0,
					featureId: 'sipw_timeout'
				});
				return;
			}

			if (!sipwResponse.ok) {
				console.error('Failed to fetch SIPW data, status:', sipwResponse.status);
				addAnomaly({
					idsubsls: 'SIPW_DATA_ERROR',
					type: 'SIPW Data Fetch Error',
					severity: 'Medium',
					description: `Unable to fetch SIPW reference data for validation (Status: ${sipwResponse.status})`,
					featureIndex: 0,
					featureId: 'sipw_fetch_error'
				});
				return;
			}

			let sipwData;
			try {
				sipwData = await sipwResponse.json();
			} catch (jsonError) {
				console.error('Failed to parse SIPW data JSON:', jsonError);
				addAnomaly({
					idsubsls: 'SIPW_JSON_ERROR',
					type: 'SIPW Data Parse Error',
					severity: 'Medium',
					description: 'Unable to parse SIPW reference data response',
					featureIndex: 0,
					featureId: 'sipw_parse_error'
				});
				return;
			}

			if (!Array.isArray(sipwData)) {
				console.error('SIPW data is not an array:', sipwData);
				addAnomaly({
					idsubsls: 'SIPW_FORMAT_ERROR',
					type: 'SIPW Data Format Error',
					severity: 'Medium',
					description: 'SIPW reference data is not in expected format',
					featureIndex: 0,
					featureId: 'sipw_format_error'
				});
				return;
			}

			const sipwIds = new Set<string>(sipwData.map((item: any) => item.idsubsls));

			// Rule 4: Find extra idsubsls (in GeoJSON but not in SIPW)
			const extraIds = [...geoJsonIds].filter((id) => !sipwIds.has(id));

			if (extraIds.length > 0) {
				extraIds.forEach((id) => {
					const feature = featuresById[id];
					if (feature && feature.properties) {
						const props = feature.properties;
						addAnomaly({
							idsubsls: id,
							type: 'Extra idsubsls in GeoJSON',
							severity: 'Medium',
							description: `idsubsls ${id} found in GeoJSON but not in SIPW table (District: ${props.nmdesa || 'Unknown'}, ${props.kddesa || 'Unknown'})`,
							featureIndex: geoJson.features.indexOf(feature),
							featureId: feature.id || id,
							properties: {
								anomalyType: 'extra_in_geojson',
								geojsonFeature: feature,
								nmdesa: props.nmdesa,
								kddesa: props.kddesa,
								nmkec: props.nmkec,
								nmkab: props.nmkab,
								nmsls: props.nmsls
							}
						});
					}
				});
			}

			// Rule 5: Find missing idsubsls (in SIPW but not in GeoJSON)
			// Fetch broader SIPW data for missing detection
			try {
				const allSipwResponse = await fetch('/api/sipw-data', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						districts: Array.from(geoJsonDistricts)
					}),
					signal: AbortSignal.timeout(10000)
				});

				if (allSipwResponse.ok) {
					const allSipwData = await allSipwResponse.json();
					const allSipwIds = new Set<string>(allSipwData.map((item: any) => item.idsubsls));

					const missingIds = [...allSipwIds].filter((id) => !geoJsonIds.has(id));

					// Only report missing IDs if there are fewer than 50 (to avoid overwhelming)
					if (missingIds.length > 0 && missingIds.length < 50) {
						const missingFeatures = allSipwData.filter((item: any) => missingIds.includes(item.idsubsls));

						// Create individual anomaly for each missing idsubsls (limit to first 20)
						const limitedMissingFeatures = missingFeatures.slice(0, 20);
						limitedMissingFeatures.forEach((item: any) => {
							addAnomaly({
								idsubsls: item.idsubsls,
								type: 'Missing idsubsls in GeoJSON',
								severity: 'High',
								description: `idsubsls ${item.idsubsls} found in SIPW table but missing from GeoJSON (District: ${item.nmdesa || 'Unknown'}, ${item.kddesa || 'Unknown'})`,
								featureIndex: 0,
								featureId: `missing_${item.idsubsls}`,
								properties: {
									anomalyType: 'missing_in_geojson',
									sipwData: item,
									nmdesa: item.nmdesa,
									kddesa: item.kddesa,
									nmkec: item.nmkec,
									nmkab: item.nmkab
								}
							});
						});

						// If there are many missing IDs, create a summary anomaly
						if (missingIds.length > 20) {
							addAnomaly({
								idsubsls: 'MULTIPLE_MISSING_IDS',
								type: 'Multiple Missing idsubsls',
								severity: 'High',
								description: `Found ${missingIds.length} idsubsls in SIPW table but missing from GeoJSON. Showing first 20. Please check if your GeoJSON file is complete.`,
								featureIndex: 0,
								featureId: 'multiple_missing',
								properties: {
									anomalyType: 'multiple_missing_ids',
									totalMissing: missingIds.length,
									districts: Array.from(geoJsonDistricts)
								}
							});
						}
					} else if (missingIds.length >= 50) {
						addAnomaly({
							idsubsls: 'TOO_MANY_MISSING',
							type: 'Too Many Missing idsubsls',
							severity: 'Medium',
							description: `Found ${missingIds.length} idsubsls in SIPW but missing from GeoJSON. This may indicate data scope mismatch or incomplete GeoJSON file.`,
							featureIndex: 0,
							featureId: 'too_many_missing',
							properties: {
								anomalyType: 'too_many_missing',
								totalMissing: missingIds.length,
								districts: Array.from(geoJsonDistricts)
							}
						});
					}
				}
			} catch (error) {
				console.warn('Could not fetch broader SIPW data for missing ID comparison:', error);
			}

			console.log(`🔍 SIPW consistency check completed. GeoJSON: ${geoJsonIds.size}, SIPW: ${sipwIds.size}, Extra: ${extraIds.length}`);

		} catch (error) {
			console.error('Error checking SIPW data consistency:', error);
			addAnomaly({
				idsubsls: 'SIPW_CHECK_ERROR',
				type: 'SIPW Validation Error',
				severity: 'Medium',
				description: 'Error occurred while validating GeoJSON against SIPW data',
				featureIndex: 0,
				featureId: 'sipw_check_error'
			});
		}
	}

	// Format anomaly severity
	function getSeverityColor(severity: string): string {
		switch (severity) {
			case 'High': return 'text-red-600 bg-red-50 border-red-200';
			case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'Low': return 'text-blue-600 bg-blue-50 border-blue-200';
			default: return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	}

	// Reset selection
	function resetSelection() {
		selectedKecamatan = '';
		selectedKelurahan = '';
		currentGeoJSON = null;
		anomalies = [];

		if (geoJSONLayer) {
			map.removeLayer(geoJSONLayer);
			geoJSONLayer = null;
		}

		// Reset map view
		map.setView([-6.1944, 106.8229], 12);
	}
</script>

<svelte:head>
	<title>Monitoring - Geomonitor</title>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="mb-8 text-center">
		<h1 class="mb-2 text-6xl font-bold text-gray-900">GEOMON</h1>
		<p class="mb-6 text-xl text-gray-600">Geospasial Monitoring</p>

		<!-- Navigation Menu -->
		<nav class="flex justify-center">
			<div class="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
				<a
					href="/"
					class="border-l border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Pengecekan
				</a>
				<a
					href="/monitoring"
					class="rounded-l-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors"
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
					class="rounded-r-lg border-l border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Manage Files
				</a>
			</div>
		</nav>
	</header>

	<div class="flex h-screen bg-gray-100">
		<!-- Left Sidebar -->
	<aside class="w-96 bg-white shadow-lg overflow-y-auto">
		<div class="p-6">
			<h1 class="text-2xl font-bold text-gray-800 mb-6">🗺️ Monitoring</h1>

			<!-- Kecamatan Dropdown -->
			<div class="mb-4">
				<label for="kecamatan" class="block text-sm font-medium text-gray-700 mb-2">
					Kecamatan
				</label>
				<select
					id="kecamatan"
					bind:value={selectedKecamatan}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">Pilih Kecamatan</option>
					{#each Object.keys(jakartaPusatStructure) as kecamatan}
						<option value={kecamatan}>{kecamatan}</option>
					{/each}
				</select>
			</div>

			<!-- Kelurahan Dropdown -->
			{#if selectedKecamatan}
				<div class="mb-6">
					<label for="kelurahan" class="block text-sm font-medium text-gray-700 mb-2">
						Kelurahan
					</label>
					<select
						id="kelurahan"
						bind:value={selectedKelurahan}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Pilih Kelurahan</option>
						{#each availableKelurahan as kelurahan}
							<option value={kelurahan}>{kelurahan}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="space-y-3 mb-6">
				<button
					on:click={searchAndLoadGeoJSON}
					disabled={isLoading || !selectedKecamatan || !selectedKelurahan}
					class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
				>
					{#if isLoading}
						<span class="inline-flex items-center">
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Searching...
						</span>
					{:else}
						🔍 Search & Show GeoJSON
					{/if}
				</button>

				<button
					on:click={resetSelection}
					class="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
				>
					🔄 Reset
				</button>
			</div>

			<!-- Current File Info -->
			{#if currentGeoJSON}
				<div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
					<h3 class="text-sm font-medium text-green-800 mb-2">📁 Current File</h3>
					<p class="text-xs text-green-700">
						<strong>Kelurahan:</strong> {selectedKelurahan}<br>
						<strong>Kecamatan:</strong> {selectedKecamatan}<br>
						<strong>Features:</strong> {currentGeoJSON.features.length}<br>
						<strong>Updated:</strong> {new Date().toLocaleString('id-ID')}
					</p>
				</div>
			{/if}

			<!-- Anomaly Cards -->
			{#if anomalies.length > 0}
				<div class="mb-6">
					<h3 class="text-lg font-medium text-gray-800 mb-3">
						⚠️ Anomalies ({anomalies.length})
					</h3>
					<div class="space-y-2">
						{#each anomalies as anomaly}
							<div class="p-3 border rounded-lg {getSeverityColor(anomaly.severity)}">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<p class="text-sm font-medium">
											{anomaly.type}
										</p>
										<p class="text-xs mt-1 opacity-75">
											{anomaly.description}
										</p>
									</div>
									<span class="text-xs font-medium px-2 py-1 rounded bg-white bg-opacity-60">
										{anomaly.severity}
									</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if currentGeoJSON}
				<div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
					<h3 class="text-sm font-medium text-green-800 mb-1">✅ No Anomalies</h3>
					<p class="text-xs text-green-700">GeoJSON passed all validation checks</p>
				</div>
			{/if}
		</div>
	</aside>

		<!-- Map Container -->
		<main class="flex-1 relative">
			<div bind:this={mapContainer} class="w-full h-full"></div>
		</main>
	</div>
</div>

<style>
	/* Leaflet styles */
	:global(.leaflet-container) {
		font-family: inherit;
	}
</style>