<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import AnomalyModal from '$lib/components/AnomalyModal.svelte';

	// User mapping (same as manage files page)
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

	// Official village mapping (same as manage files page)
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

	// Complete Jakarta Pusat structure (for backward compatibility)
	const jakartaPusatStructure = {
		"Cempaka Putih": ["Cempaka Putih Barat", "Cempaka Putih Timur", "Rawa Sari"],
		"Gambir": ["Cideng", "Duri Pulo", "Gambir", "Kebon Kelapa", "Petojo Selatan", "Petojo Utara"],
		"Johar Baru": ["Galur", "Johar Baru", "Kampung Rawa", "Tanah Tinggi"],
		"Kemayoran": ["Cempaka Baru", "Gunung Sahari Selatan", "Harapan Mulia", "Kebon Kosong", "Kemayoran", "Serdang", "Sumur Batu", "Utan Panjang"],
		"Menteng": ["Cikini", "Gondangdia", "Kebon Sirih", "Menteng", "Pegangsaan"],
		"Sawah Besar": ["Gunung Sahari Utara", "Kartini", "Mangga Dua Selatan", "Pasar Baru"],
		"Senen": ["Bungur", "Kwitang", "Kenari", "Kramat", "Paseban", "Senen"],
		"Tanah Abang": ["Bendungan Hilir", "Gelora", "Karet Tengsin", "Kebon Melati", "Kebon Kacang", "Petamburan"]
	};

	// Interface for Village data (same as manage files page)
	interface Village {
		iddesa: string | null;
		nmdesa: string;
		assignedUsers: string[];
		hasFile: boolean;
		fileId?: number;
		currentVersionNumber?: number;
		updatedAt?: string;
		anomalyTotal: number;
	}

	let map: any;
	let L: any;
	let uploadedGeoJSON: GeoJSON.GeoJsonObject | null = null;
	let geoJSONLayer: any = null;
	let showAnomalyModal = false;
	let showLabels = true; // Controls label visibility on map

	// Anomaly data array - will be populated dynamically
	let anomalies: any[] = [];

	// State variables for new village-based approach
	let villages: Village[] = [];
	let filteredVillages: Village[] = [];
	let selectedKecamatan: string = '';
	let selectedKelurahan: string = '';
	let selectedFile: any = null;
	let isLoading = false;
	let mapContainer: HTMLDivElement;
	let isDataLoading = false;

	// Helper functions for village-based approach
	function getAssignedUsers(villageName: string): string[] {
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

	function getAllExpectedVillages(): Village[] {
		const expectedVillages: Village[] = [];

		Object.entries(villageIdMapping).forEach(([villageName, iddesa]) => {
			const assignedUsers = getAssignedUsers(villageName);
			expectedVillages.push({
				iddesa: iddesa,
				nmdesa: villageName,
				assignedUsers: assignedUsers,
				hasFile: false,
				anomalyTotal: 0
			});
		});

		return expectedVillages.sort((a, b) => a.iddesa!.localeCompare(b.iddesa!));
	}

	// Real-time anomaly checking function (same as manage files page)
	async function checkAnomaliesForGeoJSON(geoJson: any): Promise<number> {
		if (!geoJson || geoJson.type !== 'FeatureCollection') {
			return 0;
		}

		console.log('🔍 Checking anomalies for GeoJSON...');
		let totalAnomalies = 0;

		try {
			// Clear existing anomalies
			anomalies = [];

			// Rule 1: Check for duplicate idsubsls
			await checkDuplicateIdsubsls(geoJson);

			// Rule 2 & 3: Check SLS consistency with SIPW table
			await checkSIPWConsistency(geoJson);

			// Rule 4: Check for invalid geometries
			checkInvalidGeometries(geoJson);

			// Rule 5: Check for interior rings
			checkInteriorRings(geoJson);

			// Rule 6: Check for area discrepancies
			checkAreaDiscrepancies(geoJson);

			// Rule 7: Check for merged polygon holes (district coverage gaps)
			checkMergedPolygonHoles(geoJson);

			// Rule 8: Check for single district validation
			checkSingleDistrict(geoJson);

			// Count total anomalies
			totalAnomalies = anomalies.length;

			console.log(`✅ Anomaly check completed. Found ${totalAnomalies} anomalies`);
			return totalAnomalies;

		} catch (error) {
			console.error('❌ Error checking anomalies:', error);
			return 0;
		}
	}

	async function fetchVillages() {
		if (isDataLoading) return;
		isDataLoading = true;

		try {
			console.log('📊 Fetching villages data...');
			const response = await fetch('/api/save-geojson?userId=anonymous');
			const result = await response.json();

			if (!result.success) {
				console.error('❌ Failed to fetch villages data:', result);
				return;
			}

			// Process existing villages
			const villageMap = new Map<string, Village>();
			result.files.forEach((file: any) => {
				if (file.iddesa && file.nmdesa) {
					const existing = villageMap.get(file.iddesa);

					if (!existing ||
						file.currentVersionNumber > (existing.currentVersionNumber || 0) ||
						(file.currentVersionNumber === (existing.currentVersionNumber || 0) &&
						 new Date(file.updatedAt) > new Date(existing.updatedAt || 0))) {

						const assignedUsers = getAssignedUsers(file.nmdesa);
						villageMap.set(file.iddesa, {
							iddesa: file.iddesa,
							nmdesa: file.nmdesa,
							hasFile: true,
							fileId: file.id,
							currentVersionNumber: file.currentVersionNumber,
							updatedAt: file.updatedAt,
							assignedUsers: assignedUsers,
							anomalyTotal: 0 // Will be updated later
						});
					}
				}
			});

			// Get all expected villages using official mapping
			const expectedVillages = getAllExpectedVillages();

			// Merge existing and expected villages
			const mergedVillages = expectedVillages.map(expected => {
				const existing = villageMap.get(expected.iddesa!);
				if (existing) {
					return existing;
				} else {
					return expected;
				}
			});

			// Check anomalies for villages with files (in parallel batches)
			const villagesWithFiles = mergedVillages.filter(v => v.hasFile);
			console.log(`🔍 Checking anomalies for ${villagesWithFiles.length} villages with files...`);

			// Process in batches to avoid overwhelming the system
			const batchSize = 5;
			for (let i = 0; i < villagesWithFiles.length; i += batchSize) {
				const batch = villagesWithFiles.slice(i, i + batchSize);

				await Promise.all(batch.map(async (village) => {
					try {
						const versionResponse = await fetch(`/api/geojson-versions?fileId=${village.fileId}`);
						const versionResult = await versionResponse.json();

						if (versionResult.success && versionResult.versions.length > 0) {
							const currentVersion = versionResult.versions.find((v: any) => v.id === versionResult.file.currentVersionId) || versionResult.versions[0];

							if (currentVersion && currentVersion.geojsonData) {
								const anomalyCount = await checkAnomaliesForGeoJSON(currentVersion.geojsonData);
								village.anomalyTotal = anomalyCount;
							}
						}
					} catch (error) {
						console.error(`❌ Error checking anomalies for ${village.nmdesa}:`, error);
						village.anomalyTotal = 0;
					}
				}));

				// Small delay between batches to prevent overwhelming
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			// Sort villages by IDDESA
			villages = mergedVillages.sort((a, b) => {
				if (!a.iddesa) return 1;
				if (!b.iddesa) return -1;
				return a.iddesa.localeCompare(b.iddesa);
			});

			// Initialize filtered villages
			filteredVillages = [...villages];

			console.log(`✅ Villages data loaded successfully. Total: ${villages.length}, With files: ${villages.filter(v => v.hasFile).length}`);

		} catch (error) {
			console.error('❌ Error fetching villages:', error);
		} finally {
			isDataLoading = false;
		}
	}

	// Function to add anomaly with improved duplicate checking
	function addAnomaly(anomalyData: any) {
		// Check for existing anomaly with same idsubsls and same type
		const existingAnomaly = anomalies.find(
			(a) =>
				a.idsubsls === anomalyData.idsubsls &&
				a.properties?.anomalyType === anomalyData.properties?.anomalyType
		);

		if (existingAnomaly) {
			console.warn(
				`Anomaly with idsubsls ${anomalyData.idsubsls} and type ${anomalyData.properties?.anomalyType} already exists, skipping...`
			);
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

	function zoomToAnomaly(anomaly: any) {
		if (!map || !geoJSONLayer) return;

		// Handle district coverage gaps differently
		if (anomaly.properties && anomaly.properties.anomalyType === 'district_coverage_gap') {
			zoomToDistrictCoverageGap(anomaly);
			return;
		}

		// Find the specific feature in the GeoJSON layer
		geoJSONLayer.eachLayer((layer: any) => {
			if (
				layer.feature &&
				layer.feature.properties &&
				layer.feature.properties.idsubsls === anomaly.idsubsls
			) {
				// Zoom to the feature bounds
				if (layer.getBounds && layer.getBounds().isValid()) {
					map.fitBounds(layer.getBounds(), {
						padding: [50, 50],
						maxZoom: 18
					});
				} else if (layer.getLatLng) {
					// For point features
					map.setView(layer.getLatLng(), 16);
				}

				// Highlight the layer
				layer.setStyle({
					fillColor: '#ff0000',
					fillOpacity: 0.5,
					color: '#ff0000',
					weight: 3,
					opacity: 1
				});

				// Open popup for this feature
				if (layer.feature.properties) {
					const popupContent = createPopupContent(layer.feature.properties);
					layer.bindPopup(popupContent).openPopup();
				}

				// Reset style after 3 seconds
				setTimeout(() => {
					geoJSONLayer.resetStyle(layer);
				}, 3000);
			}
		});
	}

	function zoomToDistrictCoverageGap(anomaly: any) {
		const kddesa = anomaly.properties.kddesa;
		const areaNames = anomaly.properties.areaNames || [];

		// Hide all map labels temporarily
		hideAllMapLabels();

		// Find all features in the same district
		const districtFeatures: any[] = [];
		geoJSONLayer.eachLayer((layer: any) => {
			if (layer.feature && layer.feature.properties && layer.feature.properties.kddesa === kddesa) {
				districtFeatures.push(layer);
			}
		});

		if (districtFeatures.length === 0) {
			// Restore labels if no features found
			showAllMapLabels();
			return;
		}

		// Create a merged polygon boundary (convex hull) to show the expected coverage
		const mergedBounds = createDistrictMergedBounds(districtFeatures);

		// Highlight all features in the district
		districtFeatures.forEach((layer) => {
			layer.setStyle({
				fillColor: '#ffcc00', // Yellow highlight for district features
				fillOpacity: 0.3,
				color: '#ff9900',
				weight: 2,
				opacity: 1
			});
		});

		// Add temporary layer showing the merged boundary (expected coverage)
		const mergedLayer = L.polygon(mergedBounds, {
			fillColor: '#ff0000',
			fillOpacity: 0,
			color: '#ff0000',
			weight: 3,
			dashArray: '10, 5',
			opacity: 1
		}).addTo(map);

		// Store original popup functions and disable them temporarily
		const originalPopupFunctions: any[] = [];
		districtFeatures.forEach((layer) => {
			if (layer.getPopup) {
				originalPopupFunctions.push({
					layer: layer,
					popup: layer.getPopup(),
					bindPopup: layer.bindPopup,
					openPopup: layer.openPopup
				});
				// Disable popup by removing bindPopup method temporarily
				layer.bindPopup = () => layer;
				layer.openPopup = () => layer;
				// Remove existing popup if any
				if (layer.getPopup()) {
					layer.unbindPopup();
				}
			}
		});

		// Fit map to show both the actual coverage and expected boundary
		const allBounds = L.latLngBounds();

		// Extend bounds with district coverage
		districtFeatures.forEach((layer) => {
			if (layer.getBounds && layer.getBounds().isValid()) {
				allBounds.extend(layer.getBounds());
			}
		});

		// Extend bounds with merged boundary
		mergedBounds.forEach((coord) => allBounds.extend([coord[1], coord[0]]));

		if (allBounds.isValid()) {
			map.fitBounds(allBounds, {
				padding: [100, 100],
				maxZoom: 16
			});
		}

		// Create popup showing district information
		const popupContent = `
      <div class="text-sm">
        <div><strong>District:</strong> ${kddesa}</div>
        <div><strong>Coverage Gap:</strong> ${anomaly.properties.gapPercentage.toFixed(2)}%</div>
        <div><strong>Total Areas:</strong> ${anomaly.properties.areaCount}</div>
        <div><em>Red dashed line shows expected district boundary</em></div>
      </div>
    `;

		// Clean up after 5 seconds and restore labels
		setTimeout(() => {
			map.removeLayer(mergedLayer);
			districtFeatures.forEach((layer) => {
				geoJSONLayer.resetStyle(layer);
			});

			// Restore popup functionality
			originalPopupFunctions.forEach(({ layer, bindPopup, openPopup }) => {
				layer.bindPopup = bindPopup;
				layer.openPopup = openPopup;
			});

			showAllMapLabels(); // Restore labels after cleanup

			// Show district information popup after cleanup (optional - when everything is restored)
			const center = allBounds.getCenter();
			setTimeout(() => {
				L.popup().setLatLng(center).setContent(popupContent).openOn(map);
			}, 100); // Small delay to ensure map is ready
		}, 5000);
	}

	function hideAllMapLabels() {
		if (window.mapLabels) {
			window.mapLabels.forEach((label: any) => {
				map.removeLayer(label);
			});
		}
	}

	function showAllMapLabels() {
		if (window.mapLabels) {
			window.mapLabels.forEach((label: any) => {
				label.addTo(map);
			});
		}
	}

	function createDistrictMergedBounds(districtFeatures: any[]): number[][] {
		// Collect all coordinate points from district features
		const allPoints: number[][] = [];

		districtFeatures.forEach((layer) => {
			if (layer.feature && layer.feature.geometry) {
				const geometry = layer.feature.geometry;
				if (geometry.type === 'Polygon') {
					allPoints.push(...geometry.coordinates[0]);
				} else if (geometry.type === 'MultiPolygon') {
					geometry.coordinates.forEach((polygon: any) => {
						allPoints.push(...polygon[0]);
					});
				}
			}
		});

		if (allPoints.length < 3) return allPoints;

		// Calculate convex hull
		return calculateConvexHull(allPoints);
	}

	onMount(async () => {
		if (!browser) return;

		// Dynamically import Leaflet only on client side
		const leafletModule = await import('leaflet');
		L = leafletModule.default;

		// Import Leaflet CSS
		await import('leaflet/dist/leaflet.css');

		// Fix for default markers in Leaflet
		delete (L.Icon.Default.prototype as any)._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconRetinaUrl:
				'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
			iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
			shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
		});

		// Initialize Leaflet map centered on Jakarta Pusat
		map = L.map(mapContainer).setView([-6.1944, 106.8229], 12);

		// Add OpenStreetMap tile layer with hybrid-like appearance
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors'
		}).addTo(map);

		// Add satellite layer option (using ESRI World Imagery)
		const satelliteLayer = L.tileLayer(
			'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			{
				attribution: '© Esri'
			}
		);

		// Add layer control
		const baseMaps = {
			Street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© OpenStreetMap contributors'
			}),
			Satellite: satelliteLayer
		};

		baseMaps['Street'].addTo(map);
		L.control.layers(baseMaps).addTo(map);

		// Load villages data using new approach
		await fetchVillages();
	});

	
	// Reactive filtering based on selected kecamatan/kelurahan
	$: {
		if (selectedKecamatan || selectedKelurahan) {
			filteredVillages = villages.filter(village => {
				// Get kecamatan for this village based on IDDESA mapping
				const kecamatanForVillage = getKecamatanForVillage(village.nmdesa);

				if (selectedKecamatan && selectedKelurahan) {
					return kecamatanForVillage === selectedKecamatan && village.nmdesa === selectedKelurahan;
				} else if (selectedKecamatan) {
					return kecamatanForVillage === selectedKecamatan;
				}
				return false;
			});
		} else {
			filteredVillages = [...villages];
		}
	}

	// Get available kelurahan for selected kecamatan
	$: availableKelurahan = selectedKecamatan ? jakartaPusatStructure[selectedKecamatan] : [];

	// Get latest file for selected area (for backward compatibility)
	$: latestFileForArea = filteredVillages.filter(v => v.hasFile).length > 0
		? filteredVillages.filter(v => v.hasFile).sort((a, b) => {
			if ((b.currentVersionNumber || 0) !== (a.currentVersionNumber || 0)) {
				return (b.currentVersionNumber || 0) - (a.currentVersionNumber || 0);
			}
			return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
		})[0]
		: null;

	// Helper function to get kecamatan for a village
	function getKecamatanForVillage(villageName: string): string {
		for (const [kecamatan, kelurahanList] of Object.entries(jakartaPusatStructure)) {
			if (kelurahanList.includes(villageName)) {
				return kecamatan;
			}
		}
		return '';
	}

	// Load GeoJSON from saved file
	async function loadGeoJSONToMap(village: Village) {
		console.log('🗺️ loadGeoJSONToMap called with village:', village);

		if (!village || !village.fileId || !map) {
			console.log('❌ Cannot load GeoJSON - missing data:', {
				village: !!village,
				fileId: village?.fileId,
				map: !!map
			});
			return;
		}

		console.log('✅ Starting GeoJSON load for village:', {
			nmdesa: village.nmdesa,
			iddesa: village.iddesa,
			fileId: village.fileId,
			hasFile: village.hasFile
		});

		isLoading = true;
		selectedFile = { id: village.fileId, originalFilename: `${village.nmdesa}.geojson`, currentVersionNumber: village.currentVersionNumber };

		// Clear existing layers
		if (geoJSONLayer) {
			map.removeLayer(geoJSONLayer);
		}
		clearAnomalyMarkers();

		try {
			console.log('📡 Fetching geojson-versions API...');
			const apiUrl = `/api/geojson-versions?fileId=${village.fileId}`;
			console.log('API URL:', apiUrl);

			const response = await fetch(apiUrl);
			console.log('📡 API Response status:', response.status);

			const result = await response.json();
			console.log('📡 API Response result:', result);

			if (result.success && result.versions.length > 0) {
				console.log('✅ Found versions:', result.versions.length);

				// Find current version
				const currentVersion = result.versions.find((v: any) => v.id === result.file.currentVersionId) || result.versions[0];
				console.log('📋 Current version:', currentVersion?.id, 'has geojson:', !!currentVersion?.geojsonData);

				if (currentVersion && currentVersion.geojsonData) {
					console.log('✅ GeoJSON data found, processing...');

					// Store uploaded GeoJSON for anomaly checking
					uploadedGeoJSON = currentVersion.geojsonData;

					// Clear existing anomalies
					anomalies = [];

					// Run anomaly checker on the loaded GeoJSON
					console.log('🔍 Running anomaly checker on loaded GeoJSON...');

					// Rule 1: Check for duplicate idsubsls
					await checkDuplicateIdsubsls(uploadedGeoJSON);

					// Rule 2 & 3: Check SLS consistency with SIPW table
					await checkSIPWConsistency(uploadedGeoJSON);

					console.log(`✅ Anomaly checking completed. Found ${anomalies.length} anomalies`);

					// Add GeoJSON to map
					console.log('🗺️ Adding GeoJSON to map...');
					geoJSONLayer = L.geoJSON(currentVersion.geojsonData, {
						style: {
							fillColor: '#3b82f6',
							fillOpacity: 0.3,
							color: '#1d4ed8',
							weight: 2,
							opacity: 0.8
						},
						onEachFeature: (feature: any, layer: any) => {
							// Add popup with feature information
							if (feature.properties) {
								const popupContent = createPopupContent(feature.properties);
								layer.bindPopup(popupContent);

								// Add label showing idsubsls and nmsls
								addLabelToFeature(feature, layer);
							}
						}
					}).addTo(map);

					console.log('✅ GeoJSON added to map');

					// Fit map to bounds
					if (geoJSONLayer.getBounds().isValid()) {
						console.log('📐 Fitting map to bounds...');
						map.fitBounds(geoJSONLayer.getBounds());
					}

					// Load existing anomalies from version if any, but prefer newly detected ones
					const existingAnomalies = currentVersion.anomalySummary ?
						(currentVersion.anomalySummary.anomalies || []) : [];

					// Use detected anomalies if available, otherwise fall back to existing/sample anomalies
					if (anomalies.length > 0) {
						console.log('✅ Using newly detected anomalies');
					} else if (existingAnomalies.length > 0) {
						console.log('📋 Using existing anomalies from version');
						anomalies = existingAnomalies;
					}

					console.log('🎉 GeoJSON loading completed successfully!');
				} else {
					console.error('❌ No GeoJSON data found in current version');
				}
			} else {
				console.error('❌ API call failed:', result);
			}
		} catch (err) {
			console.error('❌ Error loading GeoJSON:', err);
		} finally {
			isLoading = false;
		}
	}

	function clearAnomalyMarkers() {
		if (window.mapLabels) {
			window.mapLabels.forEach((label: any) => {
				map.removeLayer(label);
			});
			window.mapLabels = [];
		}
	}

	function resetFilters() {
		selectedKecamatan = '';
		selectedKelurahan = '';
		selectedFile = null;
		anomalies = [];
		if (geoJSONLayer && map) {
			map.removeLayer(geoJSONLayer);
		}
		clearAnomalyMarkers();
	}

	
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

	function createPopupContent(properties: any): string {
		let content = '<div class="text-sm space-y-1">';

		// Important fields first
		const importantFields = [
			{ key: 'nmsls', label: 'Kelurahan/Desa' },
			{ key: 'nmkec', label: 'Kecamatan' },
			{ key: 'nmkab', label: 'Kabupaten/Kota' },
			{ key: 'nmprov', label: 'Provinsi' },
			{ key: 'luas', label: 'Luas (km²)' },
			{ key: 'khusus', label: 'Khusus' },
			{ key: 'nm_gedung', label: 'Gedung' },
			{ key: 'segmen', label: 'Segmen' },
			{ key: 'idsubsls', label: 'ID SLS' }
		];

		// Display important fields
		importantFields.forEach((field) => {
			if (properties[field.key] && properties[field.key] !== '') {
				let value = properties[field.key];
				if (field.key === 'luas') {
					value = parseFloat(value).toFixed(6);
				}
				content += `<div><strong>${field.label}:</strong> ${value}</div>`;
			}
		});

		content += '</div>';
		return content;
	}

	function addLabelToFeature(feature: any, layer: any) {
		const props = feature.properties;
		if (!props || !props.idsubsls) return;

		// Create label text
		const idsubsls = props.idsubsls;
		const nmsls = props.nmsls || 'Unknown';
		const labelText = `${idsubsls}\n${nmsls}`;

		// Calculate centroid for label position
		const centroid = getCentroid(feature.geometry);
		if (!centroid) return;

		// Create a marker with label
		const labelIcon = L.divIcon({
			className: 'map-label',
			html: `
        <div style="
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          color: #000;
          white-space: nowrap;
          text-shadow: 1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8);
          line-height: 1.3;
        ">
          <div style="font-size: 11px; margin-bottom: 1px;">${idsubsls}</div>
          <div style="font-size: 12px;">${nmsls}</div>
        </div>
      `,
			iconSize: [150, 30],
			iconAnchor: [75, 15]
		});

		// Create label marker
		const labelMarker = L.marker([centroid.lat, centroid.lng], { icon: labelIcon });

		// Only add to map if labels are currently visible
		if (showLabels) {
			labelMarker.addTo(map);
		}

		// Store reference to label for later removal/toggling
		if (!window.mapLabels) {
			window.mapLabels = [];
		}
		window.mapLabels.push(labelMarker);

		// Clean up labels when layer is removed
		layer.on('remove', () => {
			if (window.mapLabels) {
				const index = window.mapLabels.indexOf(labelMarker);
				if (index > -1) {
					window.mapLabels.splice(index, 1);
				}
				map.removeLayer(labelMarker);
			}
		});
	}

	function getCentroid(geometry: any): { lat: number; lng: number } | null {
		try {
			let coords: number[][] = [];

			if (geometry.type === 'Polygon' && geometry.coordinates[0]) {
				coords = geometry.coordinates[0];
			} else if (
				geometry.type === 'MultiPolygon' &&
				geometry.coordinates[0] &&
				geometry.coordinates[0][0]
			) {
				coords = geometry.coordinates[0][0];
			} else {
				return null;
			}

			// Calculate proper centroid using the polygon centroid formula
			return calculatePolygonCentroid(coords);
		} catch (error) {
			console.error('Error calculating centroid:', error);
			return null;
		}
	}

	function calculatePolygonCentroid(coords: number[][]): { lat: number; lng: number } | null {
		if (coords.length < 3) return null;

		let area = 0;
		let centroidX = 0;
		let centroidY = 0;

		// Calculate centroid using the shoelace formula
		for (let i = 0; i < coords.length - 1; i++) {
			const xi = coords[i][0];
			const yi = coords[i][1];
			const xi1 = coords[i + 1][0];
			const yi1 = coords[i + 1][1];

			const a = xi * yi1 - xi1 * yi;
			area += a;
			centroidX += (xi + xi1) * a;
			centroidY += (yi + yi1) * a;
		}

		// Close the polygon
		const first = coords[0];
		const last = coords[coords.length - 1];
		const a = last[0] * first[1] - first[0] * last[1];
		area += a;
		centroidX += (last[0] + first[0]) * a;
		centroidY += (last[1] + first[1]) * a;

		area *= 0.5;

		if (Math.abs(area) < 0.0000001) {
			// For degenerate polygons, use simple average
			let sumLng = 0,
				sumLat = 0;
			coords.forEach((coord) => {
				sumLng += coord[0];
				sumLat += coord[1];
			});
			return {
				lat: sumLat / coords.length,
				lng: sumLng / coords.length
			};
		}

		const factor = 1 / (6 * area);
		centroidX *= factor;
		centroidY *= factor;

		return {
			lat: centroidY,
			lng: centroidX
		};
	}

	function checkTopologyIssues(geoJson: any) {
		if (geoJson.type !== 'FeatureCollection') return;

		const features = geoJson.features.filter(
			(f: any) =>
				f.geometry &&
				(f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') &&
				f.properties
		);

		// Simple overlap detection using bounding boxes first
		const overlaps = detectOverlaps(features);

		// Report overlapping areas
		overlaps.forEach((overlap) => {
			const anomalyData = {
				idsubsls: `OVERLAP_${overlap.feature1.properties.idsubsls}_${overlap.feature2.properties.idsubsls}`,
				title: 'Polygon Overlap Detected',
				severity: 'High',
				description: `Overlap between ${overlap.feature1.properties.nmsls || overlap.feature1.properties.idsubsls} and ${overlap.feature2.properties.nmsls || overlap.feature2.properties.idsubsls}`,
				coordinates: overlap.coordinates,
				properties: {
					type: 'overlap',
					feature1: overlap.feature1.properties,
					feature2: overlap.feature2.properties
				}
			};
			addAnomaly(anomalyData);
		});

		// Check for gaps by analyzing adjacency
		const gaps = detectGaps(features);

		// Report gap areas
		gaps.forEach((gap, index) => {
			let description = 'Gap area detected';
			let title = 'Gap Detected';

			if (gap.type === 'hole_in_polygon') {
				title = 'Hole in Polygon Detected';
				description = `Empty space/hole found inside ${gap.adjacentFeatures[0].properties.nmsls || gap.adjacentFeatures[0].properties.idsubsls}`;
			} else if (gap.type === 'gap_between_polygons') {
				title = 'Gap Between Polygons';
				const feature1Name =
					gap.adjacentFeatures[0].properties.nmsls || gap.adjacentFeatures[0].properties.idsubsls;
				const feature2Name =
					gap.adjacentFeatures[1].properties.nmsls || gap.adjacentFeatures[1].properties.idsubsls;
				description = `Empty space detected between ${feature1Name} and ${feature2Name}`;
			} else if (gap.type === 'coverage_gap') {
				title = 'Coverage Gap Detected';
				description = `Empty area found within collective polygon coverage (${gap.size} test points)`;
			}

			const anomalyData = {
				idsubsls: `GAP_${index}_${Math.random().toString(36).substr(2, 9)}`,
				title: title,
				severity: 'Medium',
				description: description,
				coordinates: gap.coordinates,
				properties: {
					type: gap.type,
					adjacentFeatures: gap.adjacentFeatures.map((f: any) => f.properties),
					size: gap.size || undefined
				}
			};
			addAnomaly(anomalyData);
		});
	}

	function detectOverlaps(features: any[]): any[] {
		const overlaps: any[] = [];

		for (let i = 0; i < features.length; i++) {
			for (let j = i + 1; j < features.length; j++) {
				const feature1 = features[i];
				const feature2 = features[j];

				// Simple bounding box overlap check
				const bounds1 = getFeatureBounds(feature1);
				const bounds2 = getFeatureBounds(feature2);

				if (boundsIntersect(bounds1, bounds2)) {
					// Found potential overlap, use coordinates of one feature
					const coords = extractCoordinates(feature1.geometry);

					overlaps.push({
						feature1,
						feature2,
						coordinates: coords
					});
				}
			}
		}

		return overlaps;
	}

	function detectGaps(features: any[]): any[] {
		const gaps: any[] = [];

		// Check for actual holes in polygons (interior rings)
		features.forEach((feature, index) => {
			if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates.length > 1) {
				// This polygon has holes (interior rings)
				for (let ringIndex = 1; ringIndex < feature.geometry.coordinates.length; ringIndex++) {
					const holeCoords = feature.geometry.coordinates[ringIndex];
					if (holeCoords.length > 3) {
						// Valid hole ring
						const centroid = calculatePolygonCentroid(holeCoords);
						if (centroid) {
							gaps.push({
								coordinates: `${centroid.lat.toFixed(6)}, ${centroid.lng.toFixed(6)}`,
								adjacentFeatures: [feature],
								type: 'hole_in_polygon',
								holeRing: ringIndex
							});
						}
					}
				}
			}
		});

		// Check for gaps between adjacent polygons by finding shared boundaries
		for (let i = 0; i < features.length; i++) {
			for (let j = i + 1; j < features.length; j++) {
				const feature1 = features[i];
				const feature2 = features[j];

				// Check if these polygons should be adjacent but have gaps
				const gapInfo = findGapBetweenPolygons(feature1, feature2);
				if (gapInfo) {
					gaps.push({
						coordinates: gapInfo.coordinates,
						adjacentFeatures: [feature1, feature2],
						type: 'gap_between_polygons',
						distance: gapInfo.distance
					});
				}
			}
		}

		// Check for coverage gaps - empty spaces within the collective area of all polygons
		const coverageGaps = detectCoverageGaps(features);
		gaps.push(...coverageGaps);

		return gaps;
	}

	function detectCoverageGaps(features: any[]): any[] {
		const coverageGaps: any[] = [];

		// Find the overall bounds of all features
		const overallBounds = getOverallBounds(features);
		if (!overallBounds) return coverageGaps;

		// Create a grid of test points within the overall bounds
		const gridSize = 0.0001; // Small grid for precision (about 10-15 meters)
		const testPoints: { lat: number; lng: number }[] = [];

		for (let lng = overallBounds.minLng; lng <= overallBounds.maxLng; lng += gridSize) {
			for (let lat = overallBounds.minLat; lat <= overallBounds.maxLat; lat += gridSize) {
				testPoints.push({ lat, lng });
			}
		}

		// Test each point to see if it's inside any polygon
		const uncoveredPoints: { lat: number; lng: number }[] = [];
		testPoints.forEach((point) => {
			const isInsideAnyPolygon = features.some((feature) => {
				return isPointInPolygon(point, feature.geometry);
			});

			// If point is not inside any polygon, it's a potential gap
			if (!isInsideAnyPolygon) {
				uncoveredPoints.push(point);
			}
		});

		// Group nearby uncovered points to identify gap areas
		const gapAreas = groupNearbyPoints(uncoveredPoints, 0.0002);

		// Create anomalies for significant gap areas
		gapAreas.forEach((gapArea, index) => {
			if (gapArea.points.length > 3) {
				// Only report gaps with multiple points
				const center = calculateAreaCenter(gapArea.points);
				coverageGaps.push({
					coordinates: `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`,
					adjacentFeatures: gapArea.nearbyFeatures || [],
					type: 'coverage_gap',
					size: gapArea.points.length,
					center: center
				});
			}
		});

		return coverageGaps;
	}

	function isPointInPolygon(point: { lat: number; lng: number }, geometry: any): boolean {
		if (geometry.type !== 'Polygon') return false;

		const coords = geometry.coordinates[0];
		let inside = false;

		for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
			const xi = coords[i][0],
				yi = coords[i][1];
			const xj = coords[j][0],
				yj = coords[j][1];

			const intersect =
				yi > point.lat !== yj > point.lat &&
				point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
			if (intersect) inside = !inside;
		}

		return inside;
	}

	function groupNearbyPoints(points: { lat: number; lng: number }[], threshold: number): any[] {
		const groups: any[] = [];
		const used = new Set<number>();

		points.forEach((point, index) => {
			if (used.has(index)) return;

			const group = {
				points: [point],
				nearbyFeatures: []
			};

			used.add(index);

			// Find nearby points
			points.forEach((otherPoint, otherIndex) => {
				if (index === otherIndex || used.has(otherIndex)) return;

				const distance = calculateDistance(point.lat, point.lng, otherPoint.lat, otherPoint.lng);
				if (distance < threshold * 111000) {
					// Convert to meters roughly
					group.points.push(otherPoint);
					used.add(otherIndex);
				}
			});

			groups.push(group);
		});

		return groups;
	}

	function calculateAreaCenter(points: { lat: number; lng: number }[]): {
		lat: number;
		lng: number;
	} {
		let sumLat = 0,
			sumLng = 0;
		points.forEach((point) => {
			sumLat += point.lat;
			sumLng += point.lng;
		});

		return {
			lat: sumLat / points.length,
			lng: sumLng / points.length
		};
	}

	function findGapBetweenPolygons(feature1: any, feature2: any): any | null {
		const coords1 = feature1.geometry.type === 'Polygon' ? feature1.geometry.coordinates[0] : [];
		const coords2 = feature2.geometry.type === 'Polygon' ? feature2.geometry.coordinates[0] : [];

		if (coords1.length === 0 || coords2.length === 0) return null;

		let minDistance = Infinity;
		let closestPoint1: number[] | null = null;
		let closestPoint2: number[] | null = null;

		// Find the closest points between the two polygons
		for (let i = 0; i < coords1.length - 1; i++) {
			for (let j = 0; j < coords2.length - 1; j++) {
				const point1 = coords1[i];
				const point2 = coords2[j];

				const distance = calculateDistance(point1[1], point1[0], point2[1], point2[0]);

				if (distance < minDistance) {
					minDistance = distance;
					closestPoint1 = point1;
					closestPoint2 = point2;
				}
			}
		}

		// Check if they're close enough to potentially be adjacent but not touching
		const maxGapDistance = 0.0005; // About 50-60 meters
		const touchingThreshold = 0.00001; // Very small distance for touching

		if (
			minDistance > touchingThreshold &&
			minDistance < maxGapDistance &&
			closestPoint1 &&
			closestPoint2
		) {
			// Calculate midpoint for label positioning
			const midpoint = [
				(closestPoint1[0] + closestPoint2[0]) / 2,
				(closestPoint1[1] + closestPoint2[1]) / 2
			];

			return {
				coordinates: `${midpoint[1].toFixed(6)}, ${midpoint[0].toFixed(6)}`,
				distance: minDistance
			};
		}

		return null;
	}

	function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371; // Earth's radius in km
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLon = ((lon2 - lon1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((lat1 * Math.PI) / 180) *
				Math.cos((lat2 * Math.PI) / 180) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	function getOverallBounds(features: any[]) {
		let minLng = Infinity,
			maxLng = -Infinity;
		let minLat = Infinity,
			maxLat = -Infinity;

		features.forEach((feature) => {
			const bounds = getFeatureBounds(feature);
			if (bounds) {
				minLng = Math.min(minLng, bounds.minLng);
				maxLng = Math.max(maxLng, bounds.maxLng);
				minLat = Math.min(minLat, bounds.minLat);
				maxLat = Math.max(maxLat, bounds.maxLat);
			}
		});

		return { minLng, maxLng, minLat, maxLat };
	}

	function findNeighbors(feature: any, allFeatures: any[]) {
		const neighbors: any[] = [];
		const bounds = getFeatureBounds(feature);

		allFeatures.forEach((otherFeature) => {
			if (otherFeature !== feature) {
				const otherBounds = getFeatureBounds(otherFeature);
				if (featuresNearby(bounds, otherBounds, 0.01)) {
					// Larger threshold for neighbors
					neighbors.push(otherFeature);
				}
			}
		});

		return neighbors;
	}

	function hasGapBetween(feature1: any, feature2: any) {
		const bounds1 = getFeatureBounds(feature1);
		const bounds2 = getFeatureBounds(feature2);

		// Check if polygons are close enough to potentially be adjacent
		const distance = getDistanceBetweenBounds(bounds1, bounds2);

		// If they're very close but not touching, there might be a gap
		const touchingThreshold = 0.00001;
		const maxGapDistance = 0.001;

		return distance > touchingThreshold && distance < maxGapDistance;
	}

	function getDistanceBetweenBounds(bounds1: any, bounds2: any) {
		if (!bounds1 || !bounds2) return Infinity;

		// Calculate minimum distance between two bounding boxes
		const lngDist = Math.max(
			0,
			Math.max(bounds1.minLng - bounds2.maxLng, bounds2.minLng - bounds1.maxLng)
		);
		const latDist = Math.max(
			0,
			Math.max(bounds1.minLat - bounds2.maxLat, bounds2.minLat - bounds1.maxLat)
		);

		return Math.sqrt(lngDist * lngDist + latDist * latDist);
	}

	function getFeatureBounds(feature: any) {
		if (feature.geometry.type === 'Polygon') {
			const coords = feature.geometry.coordinates[0];
			return {
				minLng: Math.min(...coords.map((c: any) => c[0])),
				maxLng: Math.max(...coords.map((c: any) => c[0])),
				minLat: Math.min(...coords.map((c: any) => c[1])),
				maxLat: Math.max(...coords.map((c: any) => c[1]))
			};
		}
		return null;
	}

	function boundsIntersect(bounds1: any, bounds2: any) {
		return (
			bounds1 &&
			bounds2 &&
			!(
				bounds1.maxLng < bounds2.minLng ||
				bounds2.maxLng < bounds1.minLng ||
				bounds1.maxLat < bounds2.minLat ||
				bounds2.maxLat < bounds1.minLat
			)
		);
	}

	function featuresNearby(bounds1: any, bounds2: any, threshold = 0.001) {
		if (!bounds1 || !bounds2) return false;

		const lngDiff = Math.abs(
			(bounds1.minLng + bounds1.maxLng) / 2 - (bounds2.minLng + bounds2.maxLng) / 2
		);
		const latDiff = Math.abs(
			(bounds1.minLat + bounds1.maxLat) / 2 - (bounds2.minLat + bounds2.maxLat) / 2
		);

		return lngDiff < threshold && latDiff < threshold;
	}

	function featuresTouching(bounds1: any, bounds2: any) {
		if (!bounds1 || !bounds2) return false;

		const touchThreshold = 0.0001;

		return (
			Math.abs(bounds1.maxLng - bounds2.minLng) < touchThreshold ||
			Math.abs(bounds2.maxLng - bounds1.minLng) < touchThreshold ||
			Math.abs(bounds1.maxLat - bounds2.minLat) < touchThreshold ||
			Math.abs(bounds2.maxLat - bounds1.minLat) < touchThreshold
		);
	}

	function checkInteriorRings(geoJson: any) {
		if (geoJson.type !== 'FeatureCollection') return;

		const features = geoJson.features.filter(
			(f: any) =>
				f.geometry &&
				(f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') &&
				f.properties
		);

		// Check each polygon for interior rings
		features.forEach((feature: any) => {
			const geometry = feature.geometry;
			const props = feature.properties;

			if (geometry.type === 'Polygon') {
				// For Polygon type, check if coordinates have more than one ring
				if (geometry.coordinates.length > 1) {
					createInteriorRingAnomaly(feature, geometry.coordinates.length - 1);
				}
			} else if (geometry.type === 'MultiPolygon') {
				// For MultiPolygon type, check each polygon for interior rings
				geometry.coordinates.forEach((polygonCoords: any[], polygonIndex: number) => {
					if (polygonCoords.length > 1) {
						createInteriorRingAnomaly(feature, polygonCoords.length - 1, polygonIndex);
					}
				});
			}
		});
	}

	function createInteriorRingAnomaly(feature: any, holeCount: number, polygonIndex?: number) {
		const props = feature.properties;
		const coordinates = extractCoordinates(feature.geometry);

		// Create description based on polygon type
		let description = `Polygon contains ${holeCount} interior ring${holeCount > 1 ? 's' : ''} (holes)`;
		if (polygonIndex !== undefined) {
			description = `MultiPolygon part ${polygonIndex + 1} contains ${holeCount} interior ring${holeCount > 1 ? 's' : ''} (holes)`;
		}

		const anomalyData = {
			idsubsls: props.idsubsls,
			title: 'Polygon Contains Interior Rings',
			severity: 'High', // Interior rings are considered high severity anomalies
			description: description,
			coordinates: coordinates,
			properties: {
				...props,
				anomalyType: 'interior_rings',
				holeCount: holeCount,
				polygonIndex: polygonIndex
			}
		};

		addAnomaly(anomalyData);
	}

	function checkAreaDiscrepancies(geoJson: any) {
		if (geoJson.type !== 'FeatureCollection') return;

		const features = geoJson.features.filter(
			(f: any) =>
				f.geometry &&
				(f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') &&
				f.properties
		);

		// Check each feature for area discrepancies
		features.forEach((feature: any) => {
			const geometry = feature.geometry;
			const props = feature.properties;

			if (geometry.type === 'Polygon') {
				checkPolygonAreaDiscrepancy(feature);
			} else if (geometry.type === 'MultiPolygon') {
				// For MultiPolygon, check each polygon part
				geometry.coordinates.forEach((polygonCoords: any[], polygonIndex: number) => {
					const tempFeature = {
						...feature,
						geometry: {
							type: 'Polygon',
							coordinates: polygonCoords
						}
					};
					checkPolygonAreaDiscrepancy(tempFeature, polygonIndex);
				});
			}
		});
	}

	function checkPolygonAreaDiscrepancy(feature: any, polygonIndex?: number) {
		const geometry = feature.geometry;
		const props = feature.properties;

		if (geometry.type !== 'Polygon' || geometry.coordinates.length === 0) return;

		// Calculate area of outer ring (exterior boundary)
		const outerRing = geometry.coordinates[0];
		const outerArea = calculatePolygonArea(outerRing);

		// Calculate total area of all rings (including interior rings)
		let totalArea = 0;
		geometry.coordinates.forEach((ring: number[][], ringIndex: number) => {
			const ringArea = Math.abs(calculatePolygonArea(ring));
			if (ringIndex === 0) {
				// Exterior ring - add positive area
				totalArea += ringArea;
			} else {
				// Interior ring - subtract area (holes)
				totalArea -= ringArea;
			}
		});

		// Calculate discrepancy
		const discrepancy = Math.abs(outerArea - totalArea);
		const discrepancyPercentage = outerArea > 0 ? (discrepancy / outerArea) * 100 : 0;

		// Use a threshold to avoid false positives due to floating point precision
		const threshold = 0.001; // 0.1% threshold

		if (discrepancyPercentage > threshold) {
			createAreaDiscrepancyAnomaly(
				feature,
				outerArea,
				totalArea,
				discrepancyPercentage,
				polygonIndex
			);
		}
	}

	function calculatePolygonArea(coords: number[][]): number {
		// Use the Shoelace formula to calculate polygon area
		let area = 0;
		const n = coords.length;

		if (n < 3) return 0;

		for (let i = 0; i < n - 1; i++) {
			const xi = coords[i][0];
			const yi = coords[i][1];
			const xi1 = coords[i + 1][0];
			const yi1 = coords[i + 1][1];

			area += xi * yi1 - xi1 * yi;
		}

		// Close the polygon
		const first = coords[0];
		const last = coords[n - 1];
		area += last[0] * first[1] - first[0] * last[1];

		return Math.abs(area) / 2; // Convert to positive area
	}

	function createAreaDiscrepancyAnomaly(
		feature: any,
		outerArea: number,
		totalArea: number,
		discrepancyPercentage: number,
		polygonIndex?: number
	) {
		const props = feature.properties;
		const coordinates = extractCoordinates(feature.geometry);

		// Create description based on polygon type and discrepancy
		let description = `Area discrepancy detected: outer boundary (${outerArea.toFixed(2)} sq units) ≠ actual area (${totalArea.toFixed(2)} sq units) - ${discrepancyPercentage.toFixed(2)}% difference`;

		if (polygonIndex !== undefined) {
			description = `MultiPolygon part ${polygonIndex + 1}: ${description}`;
		}

		const anomalyData = {
			idsubsls: props.idsubsls,
			title: 'Area Discrepancy Detected',
			severity: discrepancyPercentage > 5 ? 'High' : 'Medium', // High severity for >5% discrepancy
			description: description,
			coordinates: coordinates,
			properties: {
				...props,
				anomalyType: 'area_discrepancy',
				outerArea: outerArea,
				totalArea: totalArea,
				discrepancyPercentage: discrepancyPercentage,
				polygonIndex: polygonIndex
			}
		};

		addAnomaly(anomalyData);
	}

	function checkMergedPolygonHoles(geoJson: any) {
		if (geoJson.type !== 'FeatureCollection') return;

		// Group features by kddesa (district code)
		const featuresByKddesa: { [key: string]: any[] } = {};

		geoJson.features.forEach((feature: any) => {
			if (feature.geometry && feature.properties && feature.properties.kddesa) {
				const kddesa = feature.properties.kddesa;
				if (!featuresByKddesa[kddesa]) {
					featuresByKddesa[kddesa] = [];
				}
				featuresByKddesa[kddesa].push(feature);
			}
		});

		// Process each district group
		Object.keys(featuresByKddesa).forEach((kddesa) => {
			const features = featuresByKddesa[kddesa];
			if (features.length > 1) {
				// Merge all polygons in this district
				const mergedGeometry = mergePolygons(features);
				if (mergedGeometry) {
					// Check for holes in the merged polygon
					checkForHolesInMergedPolygon(mergedGeometry, kddesa, features);
				}
			}
		});
	}

	function mergePolygons(features: any[]): any | null {
		try {
			// Collect all coordinates from all polygons
			const allCoordinates: number[][][] = [];

			features.forEach((feature) => {
				if (feature.geometry.type === 'Polygon') {
					allCoordinates.push(...feature.geometry.coordinates);
				} else if (feature.geometry.type === 'MultiPolygon') {
					allCoordinates.push(...feature.geometry.coordinates.flat());
				}
			});

			if (allCoordinates.length === 0) return null;

			// Create a convex hull as approximation of merged polygon
			// For simplicity, we'll use the convex hull of all exterior points
			const exteriorPoints: number[][] = [];

			allCoordinates.forEach((ring) => {
				if (ring.length > 0) {
					exteriorPoints.push(...ring);
				}
			});

			if (exteriorPoints.length < 3) return null;

			// Calculate convex hull (simplified version)
			const hull = calculateConvexHull(exteriorPoints);
			if (hull.length < 3) return null;

			return {
				type: 'Polygon',
				coordinates: [hull]
			};
		} catch (error) {
			console.error('Error merging polygons:', error);
			return null;
		}
	}

	function calculateConvexHull(points: number[][]): number[][] {
		if (points.length < 3) return points;

		// Remove duplicate points
		const uniquePoints = Array.from(new Set(points.map((p) => `${p[0]},${p[1]}`))).map((str) =>
			str.split(',').map(Number)
		);

		if (uniquePoints.length < 3) return uniquePoints;

		// Sort points by x-coordinate, then by y-coordinate
		uniquePoints.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

		// Build lower hull
		const lower: number[][] = [];
		for (const point of uniquePoints) {
			while (lower.length >= 2) {
				const p1 = lower[lower.length - 2];
				const p2 = lower[lower.length - 1];
				if (crossProduct(p1, p2, point) <= 0) {
					lower.pop();
				} else {
					break;
				}
			}
			lower.push(point);
		}

		// Build upper hull
		const upper: number[][] = [];
		for (let i = uniquePoints.length - 1; i >= 0; i--) {
			const point = uniquePoints[i];
			while (upper.length >= 2) {
				const p1 = upper[upper.length - 2];
				const p2 = upper[upper.length - 1];
				if (crossProduct(p1, p2, point) <= 0) {
					upper.pop();
				} else {
					break;
				}
			}
			upper.push(point);
		}

		// Remove last point of each half because it's repeated
		lower.pop();
		upper.pop();

		// Combine hulls
		const hull = lower.concat(upper);

		// Close the polygon by adding the first point at the end
		if (
			hull.length > 0 &&
			(hull[0][0] !== hull[hull.length - 1][0] || hull[0][1] !== hull[hull.length - 1][1])
		) {
			hull.push([...hull[0]]);
		}

		return hull;
	}

	function crossProduct(o: number[], a: number[], b: number[]): number {
		return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	}

	function checkForHolesInMergedPolygon(
		mergedGeometry: any,
		kddesa: string,
		originalFeatures: any[]
	) {
		// Calculate the total area of merged polygon (convex hull)
		const mergedArea = calculatePolygonArea(mergedGeometry.coordinates[0]);

		// Calculate the total area of all original polygons
		let originalTotalArea = 0;
		originalFeatures.forEach((feature) => {
			if (feature.geometry.type === 'Polygon') {
				originalTotalArea += calculateActualPolygonArea(feature.geometry);
			} else if (feature.geometry.type === 'MultiPolygon') {
				feature.geometry.coordinates.forEach((polygon: any) => {
					originalTotalArea += calculateActualPolygonArea({
						type: 'Polygon',
						coordinates: polygon
					});
				});
			}
		});

		// Calculate coverage percentage
		const coveragePercentage = (originalTotalArea / mergedArea) * 100;
		const gapPercentage = 100 - coveragePercentage;

		// Only report as anomaly if gap is significant (>1%)
		if (gapPercentage > 1) {
			createMergedPolygonHoleAnomaly(
				kddesa,
				mergedArea,
				originalTotalArea,
				gapPercentage,
				originalFeatures,
				mergedGeometry
			);
		}
	}

	function calculateActualPolygonArea(geometry: any): number {
		if (geometry.type !== 'Polygon') return 0;

		let totalArea = 0;
		geometry.coordinates.forEach((ring: number[][], ringIndex: number) => {
			const ringArea = Math.abs(calculatePolygonArea(ring));
			if (ringIndex === 0) {
				// Exterior ring - add positive area
				totalArea += ringArea;
			} else {
				// Interior ring - subtract area (holes)
				totalArea -= ringArea;
			}
		});

		return totalArea;
	}

	function createMergedPolygonHoleAnomaly(
		kddesa: string,
		mergedArea: number,
		originalArea: number,
		gapPercentage: number,
		originalFeatures: any[],
		mergedGeometry: any
	) {
		// Get representative properties from first feature
		const representativeFeature = originalFeatures[0];
		const props = representativeFeature.properties;

		// Get center of merged polygon for coordinates
		const centroid = calculatePolygonCentroid(mergedGeometry.coordinates[0]);
		const coordinates = centroid
			? `${centroid.lat.toFixed(6)}, ${centroid.lng.toFixed(6)}`
			: 'Unknown';

		// Get area name from original features
		const areaNames = [...new Set(originalFeatures.map((f) => f.properties.nmsls).filter(Boolean))];
		const areaNamesStr =
			areaNames.length > 3
				? `${areaNames.slice(0, 3).join(', ')} +${areaNames.length - 3} more`
				: areaNames.join(', ');

		const anomalyData = {
			idsubsls: `MERGED_${kddesa}`,
			title: 'District Coverage Gap Detected',
			severity: gapPercentage > 10 ? 'High' : 'Medium', // High severity for >10% gap
			description: `District ${kddesa} has ${gapPercentage.toFixed(2)}% uncovered area (${originalArea.toFixed(2)} sq units covered out of ${mergedArea.toFixed(2)} sq units total). Areas: ${areaNamesStr}`,
			coordinates: coordinates,
			properties: {
				...props,
				anomalyType: 'district_coverage_gap',
				kddesa: kddesa,
				mergedArea: mergedArea,
				originalArea: originalArea,
				gapPercentage: gapPercentage,
				areaCount: originalFeatures.length,
				areaNames: areaNames
			}
		};

		addAnomaly(anomalyData);
	}

	function checkInvalidGeometries(geoJson: any) {
		if (geoJson.type !== 'FeatureCollection') return;

		geoJson.features.forEach((feature: any, featureIndex: number) => {
			if (!feature.geometry) {
				// Null geometry check
				addAnomaly({
					idsubsls: feature.properties?.idsubsls || `feature_${featureIndex}`,
					title: 'Null Geometry Detected',
					severity: 'High',
					description: 'Feature has null or undefined geometry',
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString()
				});
				return;
			}

			const geometry = feature.geometry;
			const props = feature.properties;

			// Check different geometry types
			if (geometry.type === 'Polygon') {
				checkPolygonGeometryValidity(geometry, props, featureIndex);
			} else if (geometry.type === 'MultiPolygon') {
				geometry.coordinates.forEach((polygon: any, polygonIndex: number) => {
					checkPolygonGeometryValidity(
						{ type: 'Polygon', coordinates: polygon },
						props,
						featureIndex,
						polygonIndex
					);
				});
			}
		});
	}

	function checkPolygonGeometryValidity(
		geometry: any,
		props: any,
		featureIndex: number,
		polygonIndex: number = 0
	) {
		const coordinates = geometry.coordinates;
		const featureId = props?.idsubsls || `feature_${featureIndex}`;

		coordinates.forEach((ring: number[][], ringIndex: number) => {
			// Check for non-closed rings
			if (ring.length < 4) {
				addAnomaly({
					idsubsls: featureId,
					title: 'Invalid Ring - Too Few Points',
					severity: 'High',
					description: `Ring ${ringIndex + 1} has only ${ring.length} points (minimum 4 required)`,
					coordinates: extractCoordinates(geometry),
					detectedAt: new Date().toLocaleString()
				});
				return;
			}

			// Check if ring is properly closed
			const first = ring[0];
			const last = ring[ring.length - 1];
			if (first[0] !== last[0] || first[1] !== last[1]) {
				addAnomaly({
					idsubsls: featureId,
					title: 'Non-Closed Ring Detected',
					severity: 'High',
					description: `Ring ${ringIndex + 1} is not properly closed (first and last points don't match)`,
					coordinates: extractCoordinates(geometry),
					detectedAt: new Date().toLocaleString()
				});
			}

			// Check for duplicate vertices
			const duplicateVertices = findDuplicateVertices(ring);
			if (duplicateVertices.length > 0) {
				addAnomaly({
					idsubsls: featureId,
					title: 'Duplicate Vertices Detected',
					severity: 'Medium',
					description: `Ring ${ringIndex + 1} contains ${duplicateVertices.length} duplicate vertices`,
					coordinates: extractCoordinates(geometry),
					detectedAt: new Date().toLocaleString()
				});
			}

			// Check for self-intersections (only for exterior rings)
			if (ringIndex === 0) {
				const intersections = findSelfIntersections(ring);
				if (intersections.length > 0) {
					addAnomaly({
						idsubsls: featureId,
						title: 'Self-Intersection Detected',
						severity: 'High',
						description: `Polygon self-intersects at ${intersections.length} point(s)`,
						coordinates: extractCoordinates(geometry),
						detectedAt: new Date().toLocaleString()
					});
				}
			}
		});
	}

	function findDuplicateVertices(ring: number[][]): number[] {
		const duplicates: number[] = [];
		const seen = new Set<string>();

		for (let i = 0; i < ring.length - 1; i++) {
			// Skip last vertex as it's same as first
			const key = `${ring[i][0]},${ring[i][1]}`;
			if (seen.has(key)) {
				duplicates.push(i);
			} else {
				seen.add(key);
			}
		}

		return duplicates;
	}

	function findSelfIntersections(ring: number[][]): number[][] {
		const intersections: number[][] = [];
		const n = ring.length - 1; // Skip last vertex as it's same as first

		for (let i = 0; i < n; i++) {
			const seg1Start = ring[i];
			const seg1End = ring[(i + 1) % n];

			for (let j = i + 2; j < n; j++) {
				// Skip adjacent segments and shared vertices
				if (j === i || (j + 1) % n === i) continue;

				const seg2Start = ring[j];
				const seg2End = ring[(j + 1) % n];

				const intersection = getLineIntersection(seg1Start, seg1End, seg2Start, seg2End);

				if (intersection) {
					intersections.push(intersection);
				}
			}
		}

		return intersections;
	}

	function getLineIntersection(
		p1: number[],
		p2: number[],
		p3: number[],
		p4: number[]
	): number[] | null {
		const x1 = p1[0],
			y1 = p1[1];
		const x2 = p2[0],
			y2 = p2[1];
		const x3 = p3[0],
			y3 = p3[1];
		const x4 = p4[0],
			y4 = p4[1];

		const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
		if (Math.abs(denom) < 1e-10) return null; // Lines are parallel

		const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
		const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

		// Check if intersection is within both line segments
		if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
			const intersectionX = x1 + t * (x2 - x1);
			const intersectionY = y1 + t * (y2 - y1);
			return [intersectionX, intersectionY];
		}

		return null;
	}

	function checkSingleDistrict(geoJson: any) {
		const result = checkSingleDistrictWithReturn(geoJson);
		if (!result.passed) {
			// Add the anomaly if check failed
			addAnomaly(result.anomalyData!);
		}
	}

	function checkSingleDistrictWithReturn(geoJson: any): { passed: boolean; anomalyData?: any } {
		if (geoJson.type !== 'FeatureCollection') return { passed: true };

		const districts = new Set<string>();
		const featuresByDistrict: { [key: string]: any[] } = {};
		let hasValidDistrictInfo = false;

		// Collect all unique districts and group features by district
		geoJson.features.forEach((feature: any, featureIndex: number) => {
			if (feature.properties) {
				const nmdesa = feature.properties.nmdesa;
				const kddesa = feature.properties.kddesa;

				// Use nmdesa as primary district identifier, fallback to kddesa
				const districtId = nmdesa || kddesa;

				if (districtId) {
					hasValidDistrictInfo = true;
					districts.add(districtId);

					if (!featuresByDistrict[districtId]) {
						featuresByDistrict[districtId] = [];
					}
					featuresByDistrict[districtId].push(feature);
				}
			}
		});

		// If no district information found, pass validation
		if (!hasValidDistrictInfo) {
			return { passed: true };
		}

		// If more than one district found, return failure with anomaly data
		if (districts.size > 1) {
			const districtList = Array.from(districts);
			const firstFeature = geoJson.features[0];
			const coordinates = firstFeature?.geometry
				? extractCoordinates(firstFeature.geometry)
				: 'Unknown';

			const anomalyData = {
				idsubsls: 'MULTI_DISTRICT_FILE',
				title: 'Multiple Districts in Single File',
				severity: 'High',
				description: `File contains features from ${districts.size} different districts: ${districtList.join(', ')}. Each file should contain only one district.`,
				coordinates: coordinates,
				detectedAt: new Date().toLocaleString(),
				additionalInfo: {
					districts: districtList,
					featureCounts: districtList.map((district) => ({
						district: district,
						count: featuresByDistrict[district]?.length || 0
					}))
				}
			};

			return { passed: false, anomalyData };
		}

		return { passed: true };
	}

	async function checkSIPWDataConsistency(geoJson: any) {
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
					title: 'No idsubsls Found in GeoJSON',
					severity: 'High',
					description: 'The uploaded GeoJSON file does not contain any idsubsls identifiers',
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString()
				});
				return;
			}

			// Extract district codes from GeoJSON to filter SIPW data
			const geoJsonDistricts = new Set<string>();
			geoJson.features.forEach((feature: any) => {
				if (feature.properties && feature.properties.kddesa) {
					geoJsonDistricts.add(feature.properties.kddesa.toString());
				}
			});

			// Fetch SIPW data from database (filtered by districts in GeoJSON)
			let sipwResponse;
			try {
				sipwResponse = await fetch('/api/sipw-data', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						districts: Array.from(geoJsonDistricts),
						idsubsls: Array.from(geoJsonIds)
					}),
					signal: AbortSignal.timeout(10000) // 10 second timeout
				});
			} catch (fetchError) {
				console.error('SIPW API call failed:', fetchError);
				addAnomaly({
					idsubsls: 'SIPW_TIMEOUT_ERROR',
					title: 'SIPW Data Timeout Error',
					severity: 'Medium',
					description: 'Request to fetch SIPW reference data timed out or failed',
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString()
				});
				return;
			}

			if (!sipwResponse.ok) {
				console.error('Failed to fetch SIPW data, status:', sipwResponse.status);
				addAnomaly({
					idsubsls: 'SIPW_DATA_ERROR',
					title: 'SIPW Data Fetch Error',
					severity: 'Medium',
					description: `Unable to fetch SIPW reference data for validation (Status: ${sipwResponse.status})`,
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString()
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
					title: 'SIPW Data Parse Error',
					severity: 'Medium',
					description: 'Unable to parse SIPW reference data response',
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString()
				});
				return;
			}

			if (!Array.isArray(sipwData)) {
				console.error('SIPW data is not an array:', sipwData);
				addAnomaly({
					idsubsls: 'SIPW_FORMAT_ERROR',
					title: 'SIPW Data Format Error',
					severity: 'Medium',
					description: 'SIPW reference data is not in expected format',
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString()
				});
				return;
			}

			const sipwIds = new Set<string>(sipwData.map((item: any) => item.idsubsls));

			// Rule 8.1: Check count mismatch
			if (geoJsonIds.size !== sipwIds.size) {
				addAnomaly({
					idsubsls: 'COUNT_MISMATCH',
					title: 'SIPW Count Mismatch',
					severity: 'High',
					description: `GeoJSON contains ${geoJsonIds.size} idsubsls, but SIPW table contains ${sipwIds.size} idsubsls for these districts`,
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString(),
					additionalInfo: {
						geojsonCount: geoJsonIds.size,
						sipwCount: sipwIds.size,
						difference: Math.abs(geoJsonIds.size - sipwIds.size)
					}
				});
			}

			// Rule 8.2: Find missing IDs (in SIPW but not in GeoJSON) - Create individual anomalies
			const missingIds = [...sipwIds].filter((id) => !geoJsonIds.has(id));
			if (missingIds.length > 0) {
				const missingFeatures = sipwData.filter((item: any) => missingIds.includes(item.idsubsls));

				// Create individual anomaly for each missing idsubsls
				missingFeatures.forEach((item: any) => {
					addAnomaly({
						idsubsls: item.idsubsls,
						title: 'Missing idsubsls in GeoJSON',
						severity: 'High',
						description: `idsubsls ${item.idsubsls} found in SIPW table but missing from GeoJSON (District: ${item.nmdesa || 'Unknown'}, ${item.kddesa || 'Unknown'})`,
						coordinates: 'Unknown',
						detectedAt: new Date().toLocaleString(),
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
			}

			// Rule 8.3: Find extra IDs (in GeoJSON but not in SIPW) - Create individual anomalies
			const extraIds = [...geoJsonIds].filter((id) => !sipwIds.has(id));
			if (extraIds.length > 0) {
				// Create individual anomaly for each extra idsubsls
				extraIds.forEach((id) => {
					const feature = featuresById[id];
					if (feature && feature.properties) {
						const props = feature.properties;
						addAnomaly({
							idsubsls: id,
							title: 'Extra idsubsls in GeoJSON',
							severity: 'Medium',
							description: `idsubsls ${id} found in GeoJSON but not in SIPW table (District: ${props.nmdesa || 'Unknown'}, ${props.kddesa || 'Unknown'})`,
							coordinates: extractCoordinates(feature.geometry),
							detectedAt: new Date().toLocaleString(),
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

			console.log(
				`SIPW consistency check completed. GeoJSON: ${geoJsonIds.size}, SIPW: ${sipwIds.size}, Missing: ${missingIds.length}, Extra: ${extraIds.length}`
			);
		} catch (error) {
			console.error('Error checking SIPW data consistency:', error);
			addAnomaly({
				idsubsls: 'SIPW_CHECK_ERROR',
				title: 'SIPW Validation Error',
				severity: 'Medium',
				description: 'Error occurred while validating GeoJSON against SIPW data',
				coordinates: 'Unknown',
				detectedAt: new Date().toLocaleString()
			});
		}
	}

	// Rule 1: Check for duplicate idsubsls in GeoJSON
	async function checkDuplicateIdsubsls(geoJson: any) {
		if (geoJson.type !== 'FeatureCollection') return;

		const uploadedIds = new Set();
		const duplicateFeatures: any[] = [];

		geoJson.features.forEach((feature: any) => {
			if (feature.properties && feature.properties.idsubsls) {
				if (uploadedIds.has(feature.properties.idsubsls)) {
					duplicateFeatures.push(feature);
				} else {
					uploadedIds.add(feature.properties.idsubsls);
				}
			}
		});

		// Add duplicate idsubsls as anomalies
		duplicateFeatures.forEach((feature: any) => {
			const props = feature.properties;
			const coordinates = extractCoordinates(feature.geometry);

			const anomalyData = {
				idsubsls: props.idsubsls,
				title: `ID Duplikat: ${props.idsubsls}`,
				severity: 'High',
				description: `Duplikasi idsubsls ditemukan di ${props.nmsls || 'area tidak diketahui'}`,
				coordinates: coordinates,
				properties: {
					...props,
					anomalyType: 'duplicate_idsubsls'
				}
			};

			addAnomaly(anomalyData);
		});

		console.log(`Duplicate idsubsls check completed. Found ${duplicateFeatures.length} duplicates`);
	}

	// Rule 2 & 3: Check SLS consistency with SIPW table (extra and missing SLS)
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
					title: 'Tidak Ada idsubsls Ditemukan di GeoJSON',
					severity: 'High',
					description: 'File GeoJSON yang diunggah tidak mengandung identifier idsubsls apa pun',
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString(),
					properties: {
						anomalyType: 'no_idsubsls'
					}
				});
				return;
			}

			// Extract district codes from GeoJSON - use first 10 digits of idsubsls for more specific filtering
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

			console.log('Using district codes for SIPW filtering:', Array.from(geoJsonDistricts));

			// Step 1: Get SIPW data for the specific GeoJSON IDs (for Rules 2 & 4)
			let specificSipwResponse;
			try {
				const requestBody = {
					districts: Array.from(geoJsonDistricts),
					idsubsls: Array.from(geoJsonIds)
				};
				console.log('Sending SIPW request with body:', requestBody);

				specificSipwResponse = await fetch('/api/sipw-data', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(requestBody),
					signal: AbortSignal.timeout(10000) // 10 second timeout
				});
			} catch (fetchError) {
				console.error('SIPW API call failed:', fetchError);
				addAnomaly({
					idsubsls: 'SIPW_TIMEOUT_ERROR',
					title: 'Kesalahan Timeout Data SIPW',
					severity: 'Medium',
					description: 'Permintaan untuk mengambil data referensi SIPW timeout atau gagal',
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString(),
					properties: {
						anomalyType: 'sipw_timeout'
					}
				});
				return;
			}

			if (!specificSipwResponse.ok) {
				console.error('Failed to fetch SIPW data, status:', specificSipwResponse.status);
				addAnomaly({
					idsubsls: 'SIPW_DATA_ERROR',
					title: 'Kesalahan Pengambilan Data SIPW',
					severity: 'Medium',
					description: `Tidak dapat mengambil data referensi SIPW untuk validasi (Status: ${specificSipwResponse.status})`,
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString(),
					properties: {
						anomalyType: 'sipw_fetch_error'
					}
				});
				return;
			}

			let specificSipwData;
			try {
				specificSipwData = await specificSipwResponse.json();
			} catch (jsonError) {
				console.error('Failed to parse SIPW data JSON:', jsonError);
				addAnomaly({
					idsubsls: 'SIPW_JSON_ERROR',
					title: 'Kesalahan Parsing Data SIPW',
					severity: 'Medium',
					description: 'Tidak dapat memparsing respon data referensi SIPW',
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString(),
					properties: {
						anomalyType: 'sipw_parse_error'
					}
				});
				return;
			}

			if (!Array.isArray(specificSipwData)) {
				console.error('SIPW data is not an array:', specificSipwData);
				addAnomaly({
					idsubsls: 'SIPW_FORMAT_ERROR',
					title: 'Kesalahan Format Data SIPW',
					severity: 'Medium',
					description: 'Data referensi SIPW tidak dalam format yang diharapkan',
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString(),
					properties: {
						anomalyType: 'sipw_format_error'
					}
				});
				return;
			}

			const specificSipwIds = new Set<string>(specificSipwData.map((item: any) => item.idsubsls));

			// Debug: Show what GeoJSON IDs were not found in SIPW
			const notFoundInSIPW = [...geoJsonIds].filter((id) => !specificSipwIds.has(id));
			console.log('GeoJSON IDs not found in SIPW database:', notFoundInSIPW);
			console.log('Sample of returned SIPW IDs:', [...specificSipwIds].slice(0, 5));

			// Rule 2: Find extra idsubsls (in GeoJSON but not in SIPW)
			const extraIds = [...geoJsonIds].filter((id) => !specificSipwIds.has(id));

			if (extraIds.length > 0) {
				// Create individual anomaly for each extra idsubsls
				extraIds.forEach((id) => {
					const feature = featuresById[id];
					if (feature && feature.properties) {
						const props = feature.properties;
						addAnomaly({
							idsubsls: id,
							title: 'idsubsls Ekstra di GeoJSON',
							severity: 'Medium',
							description: `idsubsls ${id} ditemukan di GeoJSON tapi tidak ada di tabel SIPW (Distrik: ${props.nmdesa || 'Tidak Diketahui'}, ${props.kddesa || 'Tidak Diketahui'})`,
							coordinates: extractCoordinates(feature.geometry),
							properties: {
								anomalyType: 'extra_idsubsls',
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

			// Step 2: For Rule 3 (missing IDs), fetch broader SIPW data and compare directly
			try {
				console.log('Fetching broader SIPW data for missing ID detection...');

				const allSipwResponse = await fetch('/api/sipw-data', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						districts: Array.from(geoJsonDistricts)
						// Get ALL SIPW data for these districts (no idsubsls filter)
					}),
					signal: AbortSignal.timeout(10000)
				});

				if (allSipwResponse.ok) {
					const allSipwData = await allSipwResponse.json();
					const allSipwIds = new Set<string>(allSipwData.map((item: any) => item.idsubsls));

					console.log(`SIPW data returned: ${allSipwData.length} records`);

					// Rule 3: Find missing idsubsls (in SIPW but not in GeoJSON)
					const missingIds = [...allSipwIds].filter((id) => !geoJsonIds.has(id));
					console.log(`Found ${missingIds.length} missing IDs in SIPW compared to GeoJSON`);

					// Only report missing IDs if there are fewer than 100 (to avoid overwhelming)
					if (missingIds.length > 0 && missingIds.length < 100) {
						const missingFeatures = allSipwData.filter((item: any) =>
							missingIds.includes(item.idsubsls)
						);

						// Create individual anomaly for each missing idsubsls (limit to first 20)
						const limitedMissingFeatures = missingFeatures.slice(0, 20);
						limitedMissingFeatures.forEach((item: any) => {
							addAnomaly({
								idsubsls: item.idsubsls,
								title: 'idsubsls Hilang dari GeoJSON',
								severity: 'High',
								description: `idsubsls ${item.idsubsls} ditemukan di tabel SIPW tapi hilang dari GeoJSON (Distrik: ${item.nmdesa || 'Tidak Diketahui'}, ${item.kddesa || 'Tidak Diketahui'})`,
								coordinates: 'Unknown',
								properties: {
									anomalyType: 'missing_idsubsls',
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
								title: 'Beberapa idsubsls Hilang dari GeoJSON',
								severity: 'High',
								description: `Ditemukan ${missingIds.length} idsubsls di tabel SIPW tapi hilang dari GeoJSON. Menampilkan 20 pertama. Silakan periksa apakah file GeoJSON Anda lengkap.`,
								coordinates: 'Unknown',
								properties: {
									anomalyType: 'multiple_missing_ids',
									totalMissing: missingIds.length,
									districts: Array.from(geoJsonDistricts)
								}
							});
						}
					} else if (missingIds.length >= 100) {
						console.log(
							`Terlalu banyak missing IDs (${missingIds.length}), menampilkan ringkasan saja`
						);
						addAnomaly({
							idsubsls: 'TOO_MANY_MISSING',
							title: 'Terlalu Banyak idsubsls yang Hilang',
							severity: 'Medium',
							description: `Ditemukan ${missingIds.length} idsubsls di SIPW tapi hilang dari GeoJSON. Ini mungkin menunjukkan ketidakcocokan scope data atau file GeoJSON tidak lengkap.`,
							coordinates: 'Unknown',
							properties: {
								anomalyType: 'too_many_missing',
								totalMissing: missingIds.length,
								districts: Array.from(geoJsonDistricts)
							}
						});
					}
				} else {
					console.error('Failed to fetch broader SIPW data, status:', allSipwResponse.status);
				}
			} catch (error) {
				console.warn('Could not fetch broader SIPW data for missing ID comparison:', error);
			}

			// Rule 4: Find mismatched idsubsls (exist in both but with different properties)
			const commonIds = [...geoJsonIds].filter((id) => specificSipwIds.has(id));
			let mismatchCount = 0;

			if (commonIds.length > 0) {
				commonIds.forEach((id) => {
					const feature = featuresById[id];
					const sipwItem = specificSipwData.find((item: any) => item.idsubsls === id);

					if (feature && feature.properties && sipwItem) {
						const props = feature.properties;
						const mismatches: string[] = [];

						// Check for property mismatches
						if (
							props.kddesa &&
							sipwItem.kddesa &&
							props.kddesa.toString() !== sipwItem.kddesa.toString()
						) {
							mismatches.push(`kddesa: GeoJSON(${props.kddesa}) vs SIPW(${sipwItem.kddesa})`);
						}

						if (props.nmsls && sipwItem.nmsls && props.nmsls.trim() !== sipwItem.nmsls.trim()) {
							mismatches.push(`nmsls: GeoJSON("${props.nmsls}") vs SIPW("${sipwItem.nmsls}")`);
						}

						if (props.nmkec && sipwItem.nmkec && props.nmkec.trim() !== sipwItem.nmkec.trim()) {
							mismatches.push(`nmkec: GeoJSON("${props.nmkec}") vs SIPW("${sipwItem.nmkec}")`);
						}

						if (props.nmkab && sipwItem.nmkab && props.nmkab.trim() !== sipwItem.nmkab.trim()) {
							mismatches.push(`nmkab: GeoJSON("${props.nmkab}") vs SIPW("${sipwItem.nmkab}")`);
						}

						// If any mismatches found, create anomaly
						if (mismatches.length > 0) {
							mismatchCount++;
							addAnomaly({
								idsubsls: id,
								title: 'Data idsubsls Tidak Cocok',
								severity: 'Medium',
								description: `idsubsls ${id} memiliki properti yang berbeda antara GeoJSON dan tabel SIPW. Ketidakcocokan: ${mismatches.join(', ')}`,
								coordinates: extractCoordinates(feature.geometry),
								properties: {
									anomalyType: 'mismatched_idsubsls',
									geojsonFeature: feature,
									sipwData: sipwItem,
									mismatches: mismatches,
									geojsonProps: {
										kddesa: props.kddesa,
										nmsls: props.nmsls,
										nmkec: props.nmkec,
										nmkab: props.nmkab
									},
									sipwProps: {
										kddesa: sipwItem.kddesa,
										nmsls: sipwItem.nmsls,
										nmkec: sipwItem.nmkec,
										nmkab: sipwItem.nmkab
									}
								}
							});
						}
					}
				});
			}

			console.log(
				`SIPW consistency check completed. GeoJSON: ${geoJsonIds.size}, Specific SIPW: ${specificSipwIds.size}, Extra: ${extraIds.length}, Mismatched: ${mismatchCount}`
			);
		} catch (error) {
			console.error('Error checking SIPW data consistency:', error);
			addAnomaly({
				idsubsls: 'SIPW_CHECK_ERROR',
				title: 'Kesalahan Validasi SIPW',
				severity: 'Medium',
				description: 'Terjadi kesalahan saat memvalidasi GeoJSON terhadap data SIPW',
				coordinates: 'Unknown',
				detectedAt: new Date().toLocaleString(),
				properties: {
					anomalyType: 'sipw_check_error'
				}
			});
		}
	}

	function openAnomalyModal() {
		showAnomalyModal = true;
	}

	function closeAnomalyModal() {
		showAnomalyModal = false;
	}

	function toggleLabels() {
		showLabels = !showLabels;

		// Toggle visibility of existing labels
		if (window.mapLabels) {
			window.mapLabels.forEach((label: any) => {
				if (showLabels) {
					label.addTo(map);
				} else {
					map.removeLayer(label);
				}
			});
		}
	}

	</script>

<svelte:head>
	<title>GEOMON - Geospasial Monitoring</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col">
	<!-- Header -->
	<header class="bg-white shadow-sm border-b border-gray-200">
		<div class="px-4 py-4">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-gray-900">GEOMON Monitoring</h1>
					<p class="text-sm text-gray-600">Geospasial Monitoring System</p>
				</div>
				<nav class="flex space-x-1">
					<a href="/" class="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">Pengecekan</a>
					<a href="/monitoring" class="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-md">Monitoring</a>
					<a href="/data-sls" class="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">Data SLS</a>
					<a href="/perubahan" class="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">Perubahan</a>
		<a href="/manage-files" class="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">Manage Files</a>
				</nav>
			</div>
		</div>
	</header>

	<!-- Main Content Grid -->
	<div class="flex-1 lg:grid lg:grid-cols-4 lg:gap-6 p-4 lg:p-6">
		<!-- Left Column (1 column wide) -->
		<aside class="lg:col-span-1 space-y-6">
			<!-- Header Section -->
			<div class="mb-6">
				<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
					<!-- View Toggle Buttons -->
					<div class="flex flex-wrap gap-2">
						<button
							class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
						>
							🗺️ Map View
						</button>
						<button
							class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
							on:click={() => window.location.href = '/manage-files'}
						>
							📋 Table View
						</button>
					</div>
				</div>

				<!-- Statistics Bar -->
				<div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white shadow-lg">
					<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
						<div class="text-center">
							<div class="text-2xl font-bold">{villages.length}</div>
							<div class="text-xs opacity-90">Total Villages</div>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold">{villages.filter(v => v.hasFile).length}</div>
							<div class="text-xs opacity-90">With Files</div>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold">{villages.filter(v => !v.hasFile).length}</div>
							<div class="text-xs opacity-90">Missing Files</div>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold">{villages.reduce((sum, v) => sum + v.anomalyTotal, 0)}</div>
							<div class="text-xs opacity-90">Total Anomalies</div>
						</div>
					</div>

					<!-- Progress Bar -->
					<div class="mt-4">
						<div class="flex justify-between text-xs mb-1">
							<span>Completion Progress</span>
							<span>{villages.length > 0 ? Math.round((villages.filter(v => v.hasFile).length / villages.length) * 100) : 0}%</span>
						</div>
						<div class="w-full bg-white/20 rounded-full h-2">
							<div
								class="bg-white rounded-full h-2 transition-all duration-300"
								style="width: {villages.length > 0 ? (villages.filter(v => v.hasFile).length / villages.length) * 100 : 0}%"
							></div>
						</div>
					</div>
				</div>
			</div>

			<!-- Filters Panel -->
			<div class="bg-white rounded-lg shadow-sm p-4">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

				<!-- Kecamatan Filter -->
				<div class="mb-4">
					<label for="kecamatan-select" class="block text-sm font-medium text-gray-700 mb-2">Kecamatan</label>
					<select
						id="kecamatan-select"
						bind:value={selectedKecamatan}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Pilih Kecamatan</option>
						{#each Object.keys(jakartaPusatStructure) as kecamatan}
							<option value={kecamatan}>{kecamatan}</option>
						{/each}
					</select>
				</div>

				<!-- Kelurahan Filter -->
				{#if selectedKecamatan}
					<div class="mb-4">
						<label for="kelurahan-select" class="block text-sm font-medium text-gray-700 mb-2">Kelurahan</label>
						<select
							id="kelurahan-select"
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

				<!-- Load Button -->
				{#if (selectedKecamatan && selectedKelurahan) || (selectedKecamatan && !selectedKelurahan && latestFileForArea)}
					<div class="mb-4">
						<button
							on:click={() => {
								console.log('🔘 Button clicked!');
								console.log('📍 Selected filters:', {
									selectedKecamatan,
									selectedKelurahan,
									hasLatestFile: !!latestFileForArea
								});

								console.log('🔍 Searching for village to show...');
								const villageToShow = selectedKelurahan
									? filteredVillages.find(v => v.nmdesa === selectedKelurahan && v.hasFile)
									: latestFileForArea;

								console.log('🎯 Village found:', villageToShow);
								console.log('📊 Filtered villages with files:', filteredVillages.filter(v => v.hasFile).map(v => ({ nmdesa: v.nmdesa, fileId: v.fileId })));

								if (villageToShow) {
									console.log('✅ Loading GeoJSON for village:', villageToShow.nmdesa);
									loadGeoJSONToMap(villageToShow);
								} else {
									console.warn('❌ No village found to show');
									console.log('📋 Available villages:', filteredVillages.filter(v => v.hasFile).map(v => v.nmdesa));
								}
							}}
							disabled={isLoading}
							class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
						>
							{#if isLoading}
								Loading...
							{:else}
								Show {selectedKelurahan || selectedKecamatan}
							{/if}
						</button>
					</div>
				{/if}

				<!-- Reset Button -->
				{#if selectedKecamatan || selectedKelurahan}
					<div class="mb-4">
						<button
							on:click={resetFilters}
							class="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
						>
							Reset Filters
						</button>
					</div>
				{/if}
			</div>

			<!-- Filter Results Summary -->
			{#if selectedKecamatan || selectedKelurahan}
				<div class="bg-blue-50 rounded-lg shadow-sm p-4">
					<h3 class="text-sm font-medium text-blue-900 mb-2">Filter Results</h3>
					<p class="text-xs text-blue-800">
						Showing {filteredVillages.length} of {villages.length} villages
					</p>
					<p class="text-xs text-blue-800">
						With files: {filteredVillages.filter(v => v.hasFile).length}
					</p>
					<p class="text-xs text-blue-800">
						Total anomalies: {filteredVillages.reduce((sum, v) => sum + v.anomalyTotal, 0)}
					</p>
				</div>
			{/if}

			<!-- Selected File Info -->
			{#if selectedFile}
				<div class="bg-blue-50 rounded-lg shadow-sm p-4">
					<h3 class="text-sm font-medium text-blue-900 mb-2">Selected File</h3>
					<p class="text-sm text-blue-800">{selectedFile.originalFilename}</p>
					<p class="text-xs text-blue-600">Version: {selectedFile.currentVersionNumber}</p>
				</div>
			{/if}

			<!-- Anomaly Detection Panel -->
			{#if selectedFile}
				<div class="bg-white rounded-lg shadow-sm p-4">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Anomaly Detection</h3>

					<!-- Anomaly Summary -->
					<div class="mb-4 p-3 bg-blue-50 rounded-md">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-blue-900">Total Anomalies</span>
							<span class="text-lg font-bold text-blue-600">{anomalies.length}</span>
						</div>
						{#if anomalies.length > 0}
							<div class="mt-2 text-xs text-blue-700">
								Click on anomalies to zoom to location
							</div>
						{/if}
					</div>

					<!-- Anomaly List -->
					{#if anomalies.length > 0}
						<div class="space-y-2 max-h-64 overflow-y-auto">
							<h4 class="text-sm font-medium text-gray-700">Detected Anomalies</h4>
							{#each anomalies.slice(0, 5) as anomaly, index}
								<div
									class="p-2 border rounded-md cursor-pointer hover:bg-gray-50"
									class:border-red-200={anomaly.severity === 'High'}
									class:border-yellow-200={anomaly.severity === 'Medium'}
									class:border-blue-200={anomaly.severity === 'Low'}
									class:bg-red-50={anomaly.severity === 'High'}
									class:bg-yellow-50={anomaly.severity === 'Medium'}
									class:bg-blue-50={anomaly.severity === 'Low'}
									on:click={() => zoomToAnomaly(anomaly)}
								>
									<div class="flex items-center justify-between">
										<span class="text-xs font-medium">
											⚠️ #{index + 1}
										</span>
										<span class="text-xs px-2 py-1 rounded"
											class:bg-red-100={anomaly.severity === 'High'}
											class:bg-yellow-100={anomaly.severity === 'Medium'}
											class:bg-blue-100={anomaly.severity === 'Low'}
											class:text-red-800={anomaly.severity === 'High'}
											class:text-yellow-800={anomaly.severity === 'Medium'}
											class:text-blue-800={anomaly.severity === 'Low'}
										>
											{anomaly.severity}
										</span>
									</div>
									<div class="mt-1">
										<p class="text-xs font-medium text-gray-900 truncate">
											{anomaly.title || anomaly.type || 'Unknown Anomaly'}
										</p>
										<p class="text-xs text-gray-600 truncate">
											ID: {anomaly.idsubsls}
										</p>
									</div>
								</div>
							{/each}
							{#if anomalies.length > 5}
								<p class="text-xs text-gray-500 text-center mt-2">
									... and {anomalies.length - 5} more
								</p>
							{/if}
						</div>
					{:else}
						<div class="text-center py-4">
							<p class="text-sm text-gray-500">No anomalies detected</p>
							<p class="text-xs text-gray-400 mt-1">File appears to be clean</p>
						</div>
					{/if}

					<!-- View All Button -->
					{#if anomalies.length > 0}
						<button
							on:click={openAnomalyModal}
							class="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm font-medium"
						>
							View All Anomalies ({anomalies.length})
						</button>
					{/if}

					<!-- Toggle Labels Button -->
					<button
						on:click={toggleLabels}
						class="mt-2 w-full bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 text-sm font-medium"
					>
						{showLabels ? '👁️ Hide Labels' : '👁️‍🗨️ Show Labels'}
					</button>
				</div>
			{/if}
		</aside>

		<!-- Right Column (3 columns wide) - Map -->
		<main class="lg:col-span-3">
			<div class="bg-white rounded-lg shadow-sm h-full min-h-[600px] relative">
				{#if isDataLoading}
					<div class="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
						<div class="text-center">
							<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
							<p class="text-gray-600 font-medium">Loading villages data...</p>
							<p class="text-gray-500 text-sm">Checking anomalies for uploaded files</p>
						</div>
					</div>
				{/if}
				<div bind:this={mapContainer} class="w-full h-full rounded-lg"></div>
			</div>
		</main>
	</div>
</div>

<!-- Anomaly Modal -->
<AnomalyModal
	isOpen={showAnomalyModal}
	{anomalies}
	on:close={closeAnomalyModal}
	on:zoom={(e) => zoomToAnomaly(e.detail)}
/>
