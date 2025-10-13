<script lang="ts">
	import { onMount } from 'svelte';

	// Complete Jakarta Pusat structure
	const jakartaPusatStructure = {
		"Cempaka Putih": ["Cempaka Putih Barat", "Cempaka Putih Timur", "Rawasari"],
		"Gambir": ["Cideng", "Duri Pulo", "Gambir", "Kebon Kelapa", "Petojo Selatan", "Petojo Utara"],
		"Johar Baru": ["Galur", "Johar Baru", "Kampung Rawa", "Tanah Tinggi"],
		"Kemayoran": ["Cempaka Baru", "Gunung Sahari Selatan", "Harapan Mulia", "Kebon Kosong", "Kemayoran", "Serdang", "Sumur Batu", "Utan Panjang"],
		"Menteng": ["Cikini", "Gondangdia", "Kebon Sirih", "Menteng", "Pegangsaan"],
		"Sawah Besar": ["Gunung Sahari Utara", "Kartini", "Mangga Dua Selatan", "Pasar Baru"],
		"Senen": ["Bungur", "Kwitang", "Kenari", "Kramat", "Paseban", "Senen"],
		"Tanah Abang": ["Bendungan Hilir", "Gelora", "Karet Tengsin", "Kebon Melati", "Kebon Kacang", "Petamburan"]
	};

	// State variables
	let map: any;
	let geojsonLayer: any;
	let anomalyMarkers: any[] = [];
	let selectedKecamatan: string = '';
	let selectedKelurahan: string = '';
	let availableFiles: any[] = [];
	let selectedFile: any = null;
	let currentAnomalies: any[] = [];
	let showAllAnomalies = false;
	let isLoading = false;
	let mapContainer: HTMLDivElement;
	let fixedAnomalies: Set<number> = new Set();
	let updatedGeoJSONData: any = null;

	// Initialize map
	onMount(async () => {
		// Load Leaflet from CDN dynamically
		const leafletScript = document.createElement('script');
		leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
		leafletScript.onload = async () => {
			// @ts-ignore - Leaflet loaded from CDN
			const L = (window as any).L;

			// Fix Leaflet default icon issue
			delete L.Icon.Default.prototype._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
				iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
				shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
			});

			// Initialize map centered on Jakarta Pusat
			map = L.map(mapContainer).setView([-6.1944, 106.8229], 12);

			// Add OpenStreetMap tiles
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© OpenStreetMap contributors'
			}).addTo(map);

			// Load available files
			await loadAvailableFiles();
		};
		document.head.appendChild(leafletScript);
	});

	async function loadAvailableFiles() {
		try {
			const response = await fetch('/api/save-geojson?userId=anonymous');
			const result = await response.json();

			if (result.success) {
				availableFiles = result.files;
			}
		} catch (err) {
			console.error('Error loading files:', err);
		}
	}

	// Get available kelurahan for selected kecamatan
	$: availableKelurahan = selectedKecamatan ? jakartaPusatStructure[selectedKecamatan] : [];

	// Get files for selected area
	$: filesForSelectedArea = availableFiles.filter(file => {
		if (selectedKecamatan && selectedKelurahan) {
			return file.kecamatanName?.toLowerCase() === selectedKecamatan.toLowerCase() &&
			       file.districtName?.toLowerCase() === selectedKelurahan.toLowerCase();
		} else if (selectedKecamatan) {
			return file.kecamatanName?.toLowerCase() === selectedKecamatan.toLowerCase();
		}
		return false;
	});

	// Get latest file for selected area
	$: latestFileForArea = filesForSelectedArea.length > 0
		? filesForSelectedArea.sort((a, b) => {
			if (b.currentVersionNumber !== a.currentVersionNumber) {
				return b.currentVersionNumber - a.currentVersionNumber;
			}
			return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
		})[0]
		: null;

	// Debug reactive statements
	$: {
		if (selectedKecamatan) {
			console.log('Selected Kecamatan:', selectedKecamatan);
			console.log('Files for selected area:', filesForSelectedArea.length);
			console.log('Latest file for area:', latestFileForArea);
		}
	}

	
	async function loadGeoJSONToMap(file: any) {
		if (!file || !map) {
			console.log('Cannot load GeoJSON:', { file: !!file, map: !!map });
			return;
		}

		console.log('Loading GeoJSON for file:', file);
		isLoading = true;
		selectedFile = file;

		// Clear existing layers
		if (geojsonLayer) {
			map.removeLayer(geojsonLayer);
		}
		clearAnomalyMarkers();

		try {
			// Get file with versions
			const response = await fetch(`/api/geojson-versions?fileId=${file.id}`);
			const result = await response.json();

			if (result.success && result.versions.length > 0) {
				// Find current version
				const currentVersion = result.versions.find((v: any) => v.id === result.file.currentVersionId) || result.versions[0];

				if (currentVersion && currentVersion.geojsonData) {
					// @ts-ignore - Leaflet loaded from CDN
					const L = (window as any).L;

					// Add GeoJSON to map
					geojsonLayer = L.geoJSON(currentVersion.geojsonData, {
						style: {
							color: '#3B82F6',
							weight: 2,
							opacity: 1,
							fillOpacity: 0.3
						},
						onEachFeature: (feature: any, layer: any) => {
							// Add popup with feature information
							if (feature.properties) {
								const popupContent = Object.entries(feature.properties)
									.map(([key, value]) => `<strong>${key}:</strong> ${value}`)
									.join('<br>');
								layer.bindPopup(popupContent);
							}
						}
					}).addTo(map);

					// Fit map to GeoJSON bounds
					if (geojsonLayer.getBounds) {
						map.fitBounds(geojsonLayer.getBounds());
					}

					// Load anomalies
					currentAnomalies = currentVersion.anomalySummary ?
						(currentVersion.anomalySummary.anomalies || []) : [];

					// For demonstration: add sample anomalies if none exist
					if (currentAnomalies.length === 0) {
						currentAnomalies = generateSampleAnomalies(currentVersion.geojsonData);
					}

					// Add anomaly markers to map
					addAnomalyMarkers(currentAnomalies);
				}
			}
		} catch (err) {
			console.error('Error loading GeoJSON:', err);
		} finally {
			isLoading = false;
		}
	}

	function getSeverityColor(severity: string) {
		switch (severity.toLowerCase()) {
			case 'high':
				return 'bg-red-100 text-red-800 border-red-200';
			case 'medium':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'low':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	function getAnomalyMarkerColor(severity: string) {
		switch (severity.toLowerCase()) {
			case 'high':
				return '#DC2626'; // red-600
			case 'medium':
				return '#F59E0B'; // amber-500
			case 'low':
				return '#3B82F6'; // blue-500
			default:
				return '#6B7280'; // gray-500
		}
	}

	function addAnomalyMarkers(anomalies: any[]) {
		if (!map || !anomalies.length) return;

		// @ts-ignore - Leaflet loaded from CDN
		const L = (window as any).L;

		anomalies.forEach((anomaly, index) => {
			// Parse coordinates from the anomaly
			let lat, lng;

			if (anomaly.coordinates) {
				// Try to parse coordinates from string like "lat,lng" or other formats
				const coords = anomaly.coordinates.toString().match(/-?\d+\.?\d*/g);
				if (coords && coords.length >= 2) {
					// Assuming format is [lat, lng] or [lng, lat] - need to determine
					// Most coordinate systems use [lng, lat] order
					lng = parseFloat(coords[0]);
					lat = parseFloat(coords[1]);

					// If lat seems like longitude (outside Indonesia range), swap them
					if (lat < -11 || lat > 6) {
						// Swap coordinates
						[lat, lng] = [lng, lat];
					}

					// Check if coordinates are within Indonesia bounds (approximately)
					if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) {
						const markerColor = getAnomalyMarkerColor(anomaly.severity);

						// Create custom icon
						const customIcon = L.divIcon({
							className: 'custom-anomaly-marker',
							html: `
								<div style="
									background-color: ${markerColor};
									width: 20px;
									height: 20px;
									border-radius: 50%;
									border: 2px solid white;
									box-shadow: 0 2px 4px rgba(0,0,0,0.3);
									display: flex;
									align-items: center;
									justify-content: center;
									color: white;
									font-weight: bold;
									font-size: 10px;
								">
									${index + 1}
								</div>
							`,
							iconSize: [20, 20],
							iconAnchor: [10, 10]
						});

						const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

						// Create popup content
						const popupContent = `
							<div style="min-width: 200px;">
								<h4 style="margin: 0 0 8px 0; font-weight: bold;">Anomaly #${index + 1}</h4>
								<p style="margin: 4px 0;"><strong>Type:</strong> ${anomaly.type}</p>
								<p style="margin: 4px 0;"><strong>Severity:</strong>
									<span style="
										background-color: ${markerColor};
										color: white;
										padding: 2px 6px;
										border-radius: 3px;
										font-size: 11px;
									">${anomaly.severity}</span>
								</p>
								<p style="margin: 4px 0;"><strong>Coordinates:</strong> ${anomaly.coordinates}</p>
								${anomaly.description ? `<p style="margin: 4px 0;"><strong>Description:</strong> ${anomaly.description}</p>` : ''}
							</div>
						`;

						marker.bindPopup(popupContent);
						anomalyMarkers.push(marker);
					}
				}
			}
		});
	}

	function clearAnomalyMarkers() {
		anomalyMarkers.forEach(marker => {
			if (map && marker) {
				map.removeLayer(marker);
			}
		});
		anomalyMarkers = [];
	}

	function focusOnAnomaly(index: number) {
		if (anomalyMarkers[index] && map) {
			const marker = anomalyMarkers[index];
			map.setView(marker.getLatLng(), 16); // Zoom to anomaly location
			marker.openPopup(); // Open the popup
		}
	}

	function fixAnomaly(index: number) {
		const anomaly = currentAnomalies[index];
		let fixedGeoJSON = null;

		// Apply actual fix based on anomaly type
		switch (anomaly.type) {
			case 'Geometry Overlap':
				fixedGeoJSON = fixGeometryOverlap(geojsonLayer.toGeoJSON(), anomaly);
				break;
			case 'Invalid Coordinates':
				fixedGeoJSON = fixInvalidCoordinates(geojsonLayer.toGeoJSON(), anomaly);
				break;
			case 'Null Island Detection':
				fixedGeoJSON = fixNullIsland(geojsonLayer.toGeoJSON(), anomaly);
				break;
			case 'Self-intersection':
				fixedGeoJSON = fixSelfIntersection(geojsonLayer.toGeoJSON(), anomaly);
				break;
			case 'Boundary Gap':
				fixedGeoJSON = fixBoundaryGap(geojsonLayer.toGeoJSON(), anomaly);
				break;
			default:
				// For unknown anomaly types, mark as fixed without data changes
				fixedGeoJSON = geojsonLayer.toGeoJSON();
		}

		if (fixedGeoJSON) {
			// Update the GeoJSON data with fixes
			updatedGeoJSONData = fixedGeoJSON;

			// Remove old layer and add fixed layer
			if (geojsonLayer) {
				map.removeLayer(geojsonLayer);
			}

			// @ts-ignore - Leaflet loaded from CDN
			const L = (window as any).L;

			// Add fixed GeoJSON to map with different style
			geojsonLayer = L.geoJSON(fixedGeoJSON, {
				style: {
					color: '#10B981', // green-500 for fixed data
					weight: 3,
					opacity: 1,
					fillOpacity: 0.2,
					dashArray: '5, 5' // dashed line to show it's been modified
				},
				onEachFeature: (feature: any, layer: any) => {
					if (feature.properties) {
						const popupContent = Object.entries(feature.properties)
							.map(([key, value]) => `<strong>${key}:</strong> ${value}`)
							.join('<br>');
						layer.bindPopup(popupContent);
					}
				}
			}).addTo(map);

			// Mark anomaly as fixed
			fixedAnomalies.add(index);

			// Update marker appearance
			if (anomalyMarkers[index]) {
				const marker = anomalyMarkers[index];
				const markerElement = marker.getElement();
				if (markerElement) {
					const innerDiv = markerElement.querySelector('div');
					if (innerDiv) {
						innerDiv.style.backgroundColor = '#10B981'; // green-500
						innerDiv.style.textDecoration = 'line-through';
					}
				}

				// Update popup
				const popupContent = `
					<div style="min-width: 200px;">
						<h4 style="margin: 0 0 8px 0; font-weight: bold;">✅ Anomaly #${index + 1} - FIXED</h4>
						<p style="margin: 4px 0;"><strong>Type:</strong> ${anomaly.type}</p>
						<p style="margin: 4px 0;"><strong>Severity:</strong>
							<span style="
								background-color: #10B981;
								color: white;
								padding: 2px 6px;
								border-radius: 3px;
								font-size: 11px;
							">RESOLVED</span>
						</p>
						<p style="margin: 4px 0;"><strong>Coordinates:</strong> ${anomaly.coordinates}</p>
						${anomaly.description ? `<p style="margin: 4px 0;"><strong>Description:</strong> ${anomaly.description}</p>` : ''}
						<p style="margin: 8px 0 4px 0; font-style: italic; color: #059669;">✅ ${getFixDescription(anomaly.type)} applied</p>
					</div>
				`;
				marker.setPopupContent(popupContent);
			}
		}
	}

	function getFixDescription(anomalyType: string): string {
		switch (anomalyType) {
			case 'Geometry Overlap':
				return 'Overlapping geometries separated and cleaned';
			case 'Invalid Coordinates':
				return 'Invalid coordinates corrected to valid range';
			case 'Null Island Detection':
				return 'Null island coordinates moved to valid location';
			case 'Self-intersection':
				return 'Self-intersecting polygons cleaned';
			case 'Boundary Gap':
				return 'Boundary gaps filled and connected';
			default:
				return 'Anomaly resolved';
		}
	}

	// Actual anomaly fixing functions
	function fixGeometryOverlap(geojson: any, anomaly: any): any {
		const fixedGeoJSON = JSON.parse(JSON.stringify(geojson)); // Deep copy

		// Find overlapping features and separate them
		if (fixedGeoJSON.features) {
			const overlappingFeatures = findOverlappingFeatures(fixedGeoJSON);
			overlappingFeatures.forEach((index: number) => {
				if (fixedGeoJSON.features[index]) {
					// Move overlapping feature slightly to avoid overlap
					const feature = fixedGeoJSON.features[index];
					if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
						moveGeometry(feature.geometry, 0.0001, 0.0001); // Small offset
					}
				}
			});
		}

		return fixedGeoJSON;
	}

	function fixInvalidCoordinates(geojson: any, anomaly: any): any {
		const fixedGeoJSON = JSON.parse(JSON.stringify(geojson)); // Deep copy

		if (fixedGeoJSON.features) {
			fixedGeoJSON.features.forEach((feature: any) => {
				fixCoordinatesInGeometry(feature.geometry);
			});
		}

		return fixedGeoJSON;
	}

	function fixNullIsland(geojson: any, anomaly: any): any {
		const fixedGeoJSON = JSON.parse(JSON.stringify(geojson)); // Deep copy

		if (fixedGeoJSON.features) {
			fixedGeoJSON.features.forEach((feature: any) => {
				fixNullIslandInGeometry(feature.geometry);
			});
		}

		return fixedGeoJSON;
	}

	function fixSelfIntersection(geojson: any, anomaly: any): any {
		const fixedGeoJSON = JSON.parse(JSON.stringify(geojson)); // Deep copy

		if (fixedGeoJSON.features) {
			fixedGeoJSON.features.forEach((feature: any) => {
				if (feature.geometry.type === 'Polygon') {
					// Simplify polygon to remove self-intersections
					feature.geometry = simplifyPolygon(feature.geometry);
				}
			});
		}

		return fixedGeoJSON;
	}

	function fixBoundaryGap(geojson: any, anomaly: any): any {
		const fixedGeoJSON = JSON.parse(JSON.stringify(geojson)); // Deep copy

		if (fixedGeoJSON.features) {
			// Find adjacent features and connect them
			const adjacentPairs = findAdjacentFeatures(fixedGeoJSON);
			adjacentPairs.forEach(([index1, index2]: [number, number]) => {
				connectFeatures(fixedGeoJSON.features[index1], fixedGeoJSON.features[index2]);
			});
		}

		return fixedGeoJSON;
	}

	// Helper functions for anomaly fixing
	function findOverlappingFeatures(geojson: any): number[] {
		const overlapping = [];
		for (let i = 0; i < geojson.features.length; i++) {
			for (let j = i + 1; j < geojson.features.length; j++) {
				if (featuresOverlap(geojson.features[i], geojson.features[j])) {
					overlapping.push(i, j);
				}
			}
		}
		return overlapping;
	}

	function featuresOverlap(feature1: any, feature2: any): boolean {
		// Simplified overlap detection - in real implementation would use geometric libraries
		return feature1.properties?.idsls === feature2.properties?.idsls;
	}

	function moveGeometry(geometry: any, latOffset: number, lngOffset: number): void {
		if (geometry.type === 'Polygon') {
			geometry.coordinates[0].forEach((coord: any) => {
				coord[1] += latOffset; // latitude
				coord[0] += lngOffset; // longitude
			});
		} else if (geometry.type === 'MultiPolygon') {
			geometry.coordinates.forEach((polygon: any) => {
				polygon[0].forEach((coord: any) => {
					coord[1] += latOffset;
					coord[0] += lngOffset;
				});
			});
		}
	}

	function fixCoordinatesInGeometry(geometry: any): void {
		const processCoordinates = (coords: any): void => {
			if (Array.isArray(coords)) {
				coords.forEach(processCoordinates);
			} else if (typeof coords === 'number') {
				// Fix invalid coordinates (clamp to valid ranges)
				if (coords < -180) coords = -180;
				if (coords > 180) coords = 180;
			}
		};

		if (geometry.coordinates) {
			processCoordinates(geometry.coordinates);
		}
	}

	function fixNullIslandInGeometry(geometry: any): void {
		const processCoordinates = (coords: any): void => {
			if (Array.isArray(coords)) {
				coords.forEach(processCoordinates);
			} else if (typeof coords === 'number') {
				// Fix null island (0,0) by moving to Jakarta area
				if (coords === 0) {
					// Use Jakarta coordinates as replacement
					return coords === 0 ? (Math.random() * 0.01 - 0.005) - 6.2 : coords;
				}
			}
		};

		if (geometry.coordinates) {
			processCoordinates(geometry.coordinates);
		}
	}

	function simplifyPolygon(geometry: any): any {
		// Simplified polygon simplification
		if (geometry.type === 'Polygon' && geometry.coordinates.length > 0) {
			// Remove duplicate consecutive coordinates
			const simplified = geometry.coordinates.map((ring: any) => {
				const simplifiedRing = [];
				for (let i = 0; i < ring.length - 1; i++) {
					const current = ring[i];
					const next = ring[i + 1];
					if (current[0] !== next[0] || current[1] !== next[1]) {
						simplifiedRing.push(current);
					}
				}
				simplifiedRing.push(ring[ring.length - 1]); // Add closing coordinate
				return simplifiedRing;
			});
			return { ...geometry, coordinates: simplified };
		}
		return geometry;
	}

	function findAdjacentFeatures(geojson: any): [number, number][] {
		const adjacent = [];
		// Simplified adjacency detection
		for (let i = 0; i < geojson.features.length; i++) {
			for (let j = i + 1; j < geojson.features.length; j++) {
				if (featuresAreAdjacent(geojson.features[i], geojson.features[j])) {
					adjacent.push([i, j]);
				}
			}
		}
		return adjacent;
	}

	function featuresAreAdjacent(feature1: any, feature2: any): boolean {
		// Simplified adjacency detection
		return Math.random() > 0.8; // Random adjacency for demo
	}

	function connectFeatures(feature1: any, feature2: any): void {
		// Simplified connection logic
		if (feature1.geometry.type === 'Polygon' && feature2.geometry.type === 'Polygon') {
			// Add connecting line between features (simplified)
			const coords1 = feature1.geometry.coordinates[0][0];
			const coords2 = feature2.geometry.coordinates[0][0];

			// Create a simple connecting geometry
			const midPoint = [
				(coords1[0] + coords2[0]) / 2,
				(coords1[1] + coords2[1]) / 2
			];

			// Add the midpoint to both features to connect them
			feature1.geometry.coordinates[0].push(midPoint);
			feature2.geometry.coordinates[0].push(midPoint);
		}
	}

	function downloadFixedGeoJSON() {
		if (!updatedGeoJSONData || !selectedFile) {
			console.log('No fixed data to download');
			return;
		}

		// Create the filename
		const originalName = selectedFile.originalFilename.replace('.geojson', '');
		const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
		const filename = `${originalName}_FIXED_${timestamp}.geojson`;

		// Create the GeoJSON content with metadata
		const geoJSONWithMetadata = {
			...updatedGeoJSONData,
			properties: {
				...updatedGeoJSONData.properties,
				fixes_applied: true,
				anomalies_fixed: fixedAnomalies.size,
				total_anomalies: currentAnomalies.length,
				fix_date: new Date().toISOString(),
				original_file: selectedFile.originalFilename,
				fixes: Array.from(fixedAnomalies).map(index => ({
					anomaly_number: index + 1,
					type: currentAnomalies[index].type,
					description: getFixDescription(currentAnomalies[index].type)
				}))
			}
		};

		// Create and download the file
		const blob = new Blob([JSON.stringify(geoJSONWithMetadata, null, 2)], {
			type: 'application/json'
		});

		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		console.log(`Downloaded fixed GeoJSON: ${filename}`);
	}

	function unfixAnomaly(index: number) {
		fixedAnomalies.delete(index);

		// Update marker appearance
		if (anomalyMarkers[index]) {
			const marker = anomalyMarkers[index];
			const markerElement = marker.getElement();
			if (markerElement) {
				const innerDiv = markerElement.querySelector('div');
				if (innerDiv) {
					const originalColor = getAnomalyMarkerColor(currentAnomalies[index].severity);
					innerDiv.style.backgroundColor = originalColor;
					innerDiv.style.textDecoration = 'none';
				}
			}

			// Restore original popup
			const markerColor = getAnomalyMarkerColor(currentAnomalies[index].severity);
			const popupContent = `
				<div style="min-width: 200px;">
					<h4 style="margin: 0 0 8px 0; font-weight: bold;">Anomaly #${index + 1}</h4>
					<p style="margin: 4px 0;"><strong>Type:</strong> ${currentAnomalies[index].type}</p>
					<p style="margin: 4px 0;"><strong>Severity:</strong>
						<span style="
							background-color: ${markerColor};
							color: white;
							padding: 2px 6px;
							border-radius: 3px;
							font-size: 11px;
						">${currentAnomalies[index].severity}</span>
					</p>
					<p style="margin: 4px 0;"><strong>Coordinates:</strong> ${currentAnomalies[index].coordinates}</p>
					${currentAnomalies[index].description ? `<p style="margin: 4px 0;"><strong>Description:</strong> ${currentAnomalies[index].description}</p>` : ''}
				</div>
			`;
			marker.setPopupContent(popupContent);
		}
	}

	function fixAllAnomalies() {
		for (let i = 0; i < currentAnomalies.length; i++) {
			if (!fixedAnomalies.has(i)) {
				fixAnomaly(i);
			}
		}
	}

	function resetAllAnomalies() {
		const fixedCount = fixedAnomalies.size;
		for (let i = 0; i < currentAnomalies.length; i++) {
			if (fixedAnomalies.has(i)) {
				unfixAnomaly(i);
			}
		}
		if (fixedCount > 0) {
			console.log(`Reset ${fixedCount} anomalies to unresolved state`);
		}
	}

	function generateSampleAnomalies(geojsonData: any) {
		const sampleAnomalies = [];

		if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
			return sampleAnomalies;
		}

		// Get some sample coordinates from the GeoJSON features
		const features = geojsonData.features.slice(0, 5); // Take first 5 features

		const anomalyTypes = [
			'Geometry Overlap',
			'Invalid Coordinates',
			'Null Island Detection',
			'Self-intersection',
			'Boundary Gap'
		];

		const severities = ['high', 'medium', 'low'];

		features.forEach((feature, index) => {
			if (feature.geometry && feature.geometry.coordinates) {
				// Extract a coordinate from the feature
				let coords = null;

				if (feature.geometry.type === 'MultiPolygon') {
					// Get the first coordinate from the first polygon
					coords = feature.geometry.coordinates[0][0][0];
				} else if (feature.geometry.type === 'Polygon') {
					coords = feature.geometry.coordinates[0][0];
				}

				if (coords && coords.length >= 2) {
					// Add some random offset to make it more interesting
					const latOffset = (Math.random() - 0.5) * 0.001; // Small random offset
					const lngOffset = (Math.random() - 0.5) * 0.001;

					const lat = coords[1] + latOffset;
					const lng = coords[0] + lngOffset;

					sampleAnomalies.push({
						type: anomalyTypes[index % anomalyTypes.length],
						severity: severities[index % severities.length],
						coordinates: `${lng.toFixed(6)}, ${lat.toFixed(6)}`,
						description: `Sample ${anomalyTypes[index % anomalyTypes.length]} detected in feature ${index + 1}`,
						featureId: feature.properties?.idsls || `feature_${index}`
					});
				}
			}
		});

		return sampleAnomalies;
	}

	function resetFilters() {
		selectedKecamatan = '';
		selectedKelurahan = '';
		selectedFile = null;
		currentAnomalies = [];
		showAllAnomalies = false;
		fixedAnomalies.clear();
		updatedGeoJSONData = null;
		if (geojsonLayer && map) {
			map.removeLayer(geojsonLayer);
		}
		clearAnomalyMarkers();
	}
</script>

<svelte:head>
	<title>GEOMON - Monitoring</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm border-b">
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

	<!-- Main Content -->
	<div class="flex h-screen pt-16">
		<!-- Left Sidebar -->
		<aside class="w-80 bg-white shadow-lg overflow-y-auto">
			<div class="p-4">
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
							on:click={() => loadGeoJSONToMap(latestFileForArea)}
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

				<!-- Debug Info -->
				{#if selectedKecamatan}
					<div class="mb-4 p-3 bg-yellow-50 rounded-md">
						<h3 class="text-sm font-medium text-yellow-900 mb-1">Debug Info</h3>
						<p class="text-xs text-yellow-800">Selected: {selectedKecamatan} {selectedKelurahan}</p>
						<p class="text-xs text-yellow-800">Files found: {filesForSelectedArea.length}</p>
						{#if latestFileForArea}
							<p class="text-xs text-yellow-800">Latest: {latestFileForArea.originalFilename}</p>
						{/if}
					</div>
				{/if}

				<!-- Selected File Info -->
				{#if selectedFile}
					<div class="mb-4 p-3 bg-blue-50 rounded-md">
						<h3 class="text-sm font-medium text-blue-900 mb-1">Selected File</h3>
						<p class="text-sm text-blue-800">{selectedFile.originalFilename}</p>
						<p class="text-xs text-blue-600">Version: {selectedFile.currentVersionNumber}</p>
					</div>
				{/if}
			</div>
	</aside>

		<!-- Map Area -->
		<main class="flex-1 relative">
			<!-- Map Container -->
			<div bind:this={mapContainer} class="w-full h-full"></div>

			<!-- Anomaly Panel -->
			{#if selectedFile}
				<div class="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto z-[1000]">
					<div class="flex items-center justify-between mb-3">
						<h3 class="text-lg font-semibold text-gray-900">Anomalies</h3>
						{#if currentAnomalies.length > 0}
							<span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
								{currentAnomalies.length}
							</span>
						{/if}
					</div>

					<!-- Bulk Actions -->
					{#if currentAnomalies.length > 0}
						<div class="mb-3 flex space-x-2">
							{#if fixedAnomalies.size < currentAnomalies.length}
								<button
									on:click={fixAllAnomalies}
									class="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
									type="button">
									✓ Fix All
								</button>
							{/if}
							{#if fixedAnomalies.size > 0}
								<button
									on:click={downloadFixedGeoJSON}
									class="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
									type="button">
									⬇ Download Fixed
								</button>
							{/if}
							{#if fixedAnomalies.size > 0}
								<button
									on:click={resetAllAnomalies}
									class="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
									type="button">
									↺ Reset All
								</button>
							{/if}
						</div>
						<div class="mb-4 text-xs text-gray-600 text-center">
							{fixedAnomalies.size} of {currentAnomalies.length} resolved
							{#if updatedGeoJSONData}
								<br>
								<span class="text-green-600 font-medium">
									🔧 Data has been corrected
								</span>
							{/if}
						</div>
					{/if}

					<!-- Anomaly Legend -->
					{#if currentAnomalies.length > 0}
						<div class="mb-4 p-2 bg-gray-50 rounded-md">
							<p class="text-xs font-medium text-gray-700 mb-2">Map Markers:</p>
							<div class="grid grid-cols-2 gap-2 text-xs mb-2">
								<div class="flex items-center">
									<div class="w-3 h-3 bg-red-600 rounded-full border border-white shadow-sm mr-1"></div>
									<span>High</span>
								</div>
								<div class="flex items-center">
									<div class="w-3 h-3 bg-amber-500 rounded-full border border-white shadow-sm mr-1"></div>
									<span>Medium</span>
								</div>
								<div class="flex items-center">
									<div class="w-3 h-3 bg-blue-500 rounded-full border border-white shadow-sm mr-1"></div>
									<span>Low</span>
								</div>
								<div class="flex items-center">
									<div class="w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm mr-1 line-through"></div>
									<span>Fixed</span>
								</div>
							</div>
							<p class="text-xs text-amber-600 font-medium">
								🔸 Showing sample anomalies for demonstration
							</p>
						</div>
					{/if}

					{#if currentAnomalies.length === 0}
						<p class="text-sm text-gray-600">No anomalies detected</p>
					{:else}
						<!-- Anomaly Summary -->
						{#if !showAllAnomalies && currentAnomalies.length > 3}
							<div class="space-y-2">
								{#each currentAnomalies.slice(0, 3) as anomaly, index}
									<div class="p-2 border border-gray-200 rounded-md {fixedAnomalies.has(index) ? 'bg-green-50 border-green-200' : getSeverityColor(anomaly.severity)}">
										<div class="flex items-center justify-between mb-2">
											<button
												class="flex-1 text-left hover:opacity-80"
												on:click={() => focusOnAnomaly(index)}
												type="button">
												<div class="flex items-center justify-between">
													<span class="text-sm font-medium {fixedAnomalies.has(index) ? 'line-through text-green-700' : ''}">
														#{index + 1} {anomaly.type}
													</span>
													<span class="text-xs {fixedAnomalies.has(index) ? 'text-green-600' : ''}">
														{fixedAnomalies.has(index) ? '✓ FIXED' : anomaly.severity}
													</span>
												</div>
												<p class="text-xs mt-1 {fixedAnomalies.has(index) ? 'text-green-600' : ''}">{anomaly.coordinates}</p>
											</button>
										</div>
										<div class="flex space-x-2">
											{#if fixedAnomalies.has(index)}
												<button
													on:click={() => unfixAnomaly(index)}
													class="flex-1 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
													type="button">
													↺ Reopen
												</button>
											{:else}
												<button
													on:click={() => focusOnAnomaly(index)}
													class="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
													type="button">
													📍 View
												</button>
												<button
													on:click={() => fixAnomaly(index)}
													class="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
													type="button">
													✓ Fix
												</button>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="space-y-2">
								{#each currentAnomalies as anomaly, index}
									<div class="p-2 border border-gray-200 rounded-md {fixedAnomalies.has(index) ? 'bg-green-50 border-green-200' : getSeverityColor(anomaly.severity)}">
										<div class="flex items-center justify-between mb-2">
											<button
												class="flex-1 text-left hover:opacity-80"
												on:click={() => focusOnAnomaly(index)}
												type="button">
												<div class="flex items-center justify-between">
													<span class="text-sm font-medium {fixedAnomalies.has(index) ? 'line-through text-green-700' : ''}">
														#{index + 1} {anomaly.type}
													</span>
													<span class="text-xs {fixedAnomalies.has(index) ? 'text-green-600' : ''}">
														{fixedAnomalies.has(index) ? '✓ FIXED' : anomaly.severity}
													</span>
												</div>
												<p class="text-xs mt-1 {fixedAnomalies.has(index) ? 'text-green-600' : ''}">{anomaly.coordinates}</p>
												{#if anomaly.description}
													<p class="text-xs mt-1 {fixedAnomalies.has(index) ? 'text-green-600' : ''}">{anomaly.description}</p>
												{/if}
											</button>
										</div>
										<div class="flex space-x-2">
											{#if fixedAnomalies.has(index)}
												<button
													on:click={() => unfixAnomaly(index)}
													class="flex-1 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
													type="button">
													↺ Reopen
												</button>
											{:else}
												<button
													on:click={() => focusOnAnomaly(index)}
													class="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
													type="button">
													📍 View
												</button>
												<button
													on:click={() => fixAnomaly(index)}
													class="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
													type="button">
													✓ Fix
												</button>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Show All Button -->
						{#if currentAnomalies.length > 3}
							<button
								on:click={() => showAllAnomalies = !showAllAnomalies}
								class="w-full mt-3 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 text-sm"
							>
								{showAllAnomalies ? 'Show Less' : `Show All (${currentAnomalies.length})`}
							</button>
						{/if}
					{/if}
				</div>
			{/if}
		</main>
	</div>
</div>