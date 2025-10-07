<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import AnomalyModal from '$lib/components/AnomalyModal.svelte';

	let map: any;
	let L: any;
	let uploadedGeoJSON: GeoJSON.GeoJsonObject | null = null;
	let fileInput: HTMLInputElement;
	let isUploading = false;
	let geoJSONLayer: any = null;
	let showAnomalyModal = false;
	let showLabels = true; // Controls label visibility on map

	// Anomaly data array - will be populated dynamically
	let anomalies: any[] = [];

	// Function to add anomaly with duplicate check based on idsubsls
	function addAnomaly(anomalyData: any) {
		// Check if anomaly with same idsubsls already exists
		const existingAnomaly = anomalies.find((a) => a.idsubsls === anomalyData.idsubsls);

		if (existingAnomaly) {
			console.warn(`Anomaly with idsubsls ${anomalyData.idsubsls} already exists, skipping...`);
			return false;
		}

		// Add new anomaly with timestamp
		const newAnomaly = {
			...anomalyData,
			detectedAt: new Date().toLocaleString()
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

		// Initialize Leaflet map
		map = L.map('map').setView([-2.5, 118], 5); // Center of Indonesia

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
	});

	async function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		isUploading = true;

		try {
			const text = await file.text();
			const geoJson = JSON.parse(text) as GeoJSON.GeoJsonObject;

			uploadedGeoJSON = geoJson;

			// Remove existing GeoJSON layer if exists
			if (geoJSONLayer) {
				map.removeLayer(geoJSONLayer);
			}

			// Remove existing labels
			if (window.mapLabels) {
				window.mapLabels.forEach((label: any) => {
					map.removeLayer(label);
				});
				window.mapLabels = [];
			}

			// Rule 7: Check that all features belong to the same district (check first)
			const districtValidation = checkSingleDistrictWithReturn(geoJson);

			// If Rule 7 fails, show FATAL ERROR and stop all processing
			if (!districtValidation.passed) {
				console.error('FATAL ERROR: Multiple districts detected in upload');

				// Show fatal error alert
				const districtList = districtValidation.anomalyData!.additionalInfo.districts.join(', ');
				throw new Error(
					`FATAL ERROR: Multiple districts detected (${districtList}).\n\nONLY ACCEPT 1 DISTRICT PER UPLOAD.\n\nPlease upload a file containing only one district at a time.`
				);
			} else {
				// Rule 1: Check for duplicate idsubsls
				const uploadedIds = new Set();
				const duplicateFeatures: any[] = [];

				if (geoJson.type === 'FeatureCollection') {
					geoJson.features.forEach((feature: any) => {
						if (feature.properties && feature.properties.idsubsls) {
							if (uploadedIds.has(feature.properties.idsubsls)) {
								duplicateFeatures.push(feature);
							} else {
								uploadedIds.add(feature.properties.idsubsls);
							}
						}
					});
				}

				// Add duplicate idsubsls as anomalies
				duplicateFeatures.forEach((feature: any) => {
					const props = feature.properties;
					const coordinates = extractCoordinates(feature.geometry);

					const anomalyData = {
						idsubsls: props.idsubsls,
						title: `Duplicate ID: ${props.idsubsls}`,
						severity: 'High',
						description: `Duplicate idsubsls found in ${props.nmsls || 'unknown area'}`,
						coordinates: coordinates,
						properties: props
					};

					addAnomaly(anomalyData);
				});

				// Rule 2: Check for overlaps and gaps
				checkTopologyIssues(geoJson);

				// Rule 3: Check for polygons with interior rings (holes)
				checkInteriorRings(geoJson);

				// Rule 4: Check for area discrepancies (gaps/holes detected by area calculation)
				checkAreaDiscrepancies(geoJson);

				// Rule 5: Merge polygons by kddesa and check for holes
				checkMergedPolygonHoles(geoJson);

				// Rule 6: Check for invalid geometries
				checkInvalidGeometries(geoJson);

				// Rule 8: Compare GeoJSON with SIPW table data
				checkSIPWDataConsistency(geoJson);
			}

			// Add GeoJSON to map
			geoJSONLayer = L.geoJSON(geoJson, {
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

			// Fit map to bounds
			if (geoJSONLayer.getBounds().isValid()) {
				map.fitBounds(geoJSONLayer.getBounds());
			}
		} catch (error) {
			console.error('Error processing GeoJSON:', error);

			// Check if this is a fatal error from multiple districts
			if (
				error instanceof Error &&
				error.message.includes('FATAL ERROR: Multiple districts detected')
			) {
				alert(error.message);
			} else {
				alert('Invalid GeoJSON file. Please upload a valid GeoJSON file.');
			}
		} finally {
			isUploading = false;
		}
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

			// Rule 8.2: Find missing IDs (in SIPW but not in GeoJSON)
			const missingIds = [...sipwIds].filter((id) => !geoJsonIds.has(id));
			if (missingIds.length > 0) {
				const missingFeatures = sipwData.filter((item: any) => missingIds.includes(item.idsubsls));
				const districtsMissing = [
					...new Set(missingFeatures.map((item: any) => `${item.nmdesa} (${item.kddesa})`))
				].join(', ');

				addAnomaly({
					idsubsls: 'MISSING_IN_GEOJSON',
					title: 'Missing idsubsls in GeoJSON',
					severity: 'High',
					description: `${missingIds.length} idsubsls found in SIPW table but missing from GeoJSON: ${missingIds.slice(0, 5).join(', ')}${missingIds.length > 5 ? '...' : ''}`,
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString(),
					additionalInfo: {
						missingIds: missingIds,
						missingCount: missingIds.length,
						districtsAffected: districtsMissing,
						details: missingFeatures.slice(0, 10).map((item: any) => ({
							id: item.idsubsls,
							district: item.nmdesa,
							kddesa: item.kddesa
						}))
					}
				});
			}

			// Rule 8.3: Find extra IDs (in GeoJSON but not in SIPW)
			const extraIds = [...geoJsonIds].filter((id) => !sipwIds.has(id));
			if (extraIds.length > 0) {
				const extraFeatures = extraIds.map((id) => featuresById[id]).filter(Boolean);
				const districtsExtra = [
					...new Set(
						extraFeatures.map(
							(feature: any) =>
								`${feature.properties?.nmdesa || 'Unknown'} (${feature.properties?.kddesa || 'Unknown'})`
						)
					)
				].join(', ');

				addAnomaly({
					idsubsls: 'EXTRA_IN_GEOJSON',
					title: 'Extra idsubsls in GeoJSON',
					severity: 'Medium',
					description: `${extraIds.length} idsubsls found in GeoJSON but not in SIPW table: ${extraIds.slice(0, 5).join(', ')}${extraIds.length > 5 ? '...' : ''}`,
					coordinates: 'Unknown',
					detectedAt: new Date().toLocaleString(),
					additionalInfo: {
						extraIds: extraIds,
						extraCount: extraIds.length,
						districtsAffected: districtsExtra,
						details: extraFeatures.slice(0, 10).map((feature: any) => ({
							id: feature.properties?.idsubsls,
							district: feature.properties?.nmdesa,
							kddesa: feature.properties?.kddesa
						}))
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

	function triggerFileUpload() {
		fileInput?.click();
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

<div class="min-h-screen bg-gray-50 px-4 py-8">
	<!-- Header -->
	<header class="mb-8 text-center">
		<h1 class="mb-2 text-6xl font-bold text-gray-900">GEOMON</h1>
		<p class="mb-6 text-xl text-gray-600">Geospasial Monitoring</p>

		<!-- Navigation Menu -->
		<nav class="flex justify-center">
			<div class="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
				<a
					href="/pengecekan"
					class="rounded-l-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors"
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
					class="rounded-r-lg border-l border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Data SLS
				</a>
			</div>
		</nav>
	</header>

	<!-- Main Content Grid -->
	<div class="mx-auto max-w-7xl">
		<div class="grid h-[calc(100vh-12rem)] grid-cols-1 gap-6 lg:grid-cols-4">
			<!-- Left Column - Form (25%) -->
			<div class="lg:col-span-1">
				<div class="h-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-6 text-lg font-semibold text-gray-900">Upload GeoJSON</h2>

					<form on:submit|preventDefault={triggerFileUpload} class="space-y-4">
						<div>
							<label for="geojson-upload" class="mb-2 block text-sm font-medium text-gray-700">
								Select File
							</label>
							<input
								type="file"
								id="geojson-upload"
								accept=".geojson,.json"
								on:change={handleFileUpload}
								bind:this={fileInput}
								class="hidden"
							/>
							<button
								type="button"
								on:click={triggerFileUpload}
								disabled={isUploading}
								class="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if isUploading}
									<span class="flex items-center justify-center">
										<svg
											class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Uploading...
									</span>
								{:else}
									Choose File
								{/if}
							</button>
						</div>
					</form>

					{#if uploadedGeoJSON}
						<div class="mt-6 rounded-md border border-green-200 bg-green-50 p-4">
							<div class="flex items-center">
								<svg
									class="mr-2 h-5 w-5 text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
								<p class="text-sm font-medium text-green-800">File loaded successfully</p>
							</div>
							<p class="mt-1 text-xs text-green-700">GeoJSON data is now visible on the map</p>
						</div>
					{/if}

					<!-- Anomaly List Section -->
					<div class="mt-8">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-lg font-semibold text-gray-900">Anomalies</h3>
							<span
								class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
							>
								{anomalies.length} Detected
							</span>
						</div>

						<!-- Anomaly List -->
						<div class="max-h-64 space-y-3 overflow-y-auto">
							{#if anomalies.length === 0}
								<div class="py-8 text-center">
									<svg
										class="mx-auto h-12 w-12 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										></path>
									</svg>
									<p class="mt-2 text-sm text-gray-600">No anomalies detected</p>
									<p class="mt-1 text-xs text-gray-500">Upload GeoJSON data to start monitoring</p>
								</div>
							{:else}
								{#each anomalies.slice(0, 3) as anomaly (anomaly.idsubsls)}
									<div
										class="cursor-pointer rounded-lg p-3 transition-all hover:scale-105 hover:shadow-md"
										class:bg-red-50={anomaly.severity === 'High'}
										class:bg-yellow-50={anomaly.severity === 'Medium'}
										class:bg-blue-50={anomaly.severity === 'Low'}
										class:border-red-200={anomaly.severity === 'High'}
										class:border-yellow-200={anomaly.severity === 'Medium'}
										class:border-blue-200={anomaly.severity === 'Low'}
										class:border={anomaly.severity}
										on:click={() => zoomToAnomaly(anomaly)}
									>
										<div class="flex items-start space-x-3">
											<div class="flex-shrink-0">
												<div
													class="flex h-8 w-8 items-center justify-center rounded-full"
													class:bg-red-500={anomaly.severity === 'High'}
													class:bg-yellow-500={anomaly.severity === 'Medium'}
													class:bg-blue-500={anomaly.severity === 'Low'}
												>
													<svg
														class="h-4 w-4 text-white"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														{#if anomaly.severity === 'High'}
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
															></path>
														{:else if anomaly.severity === 'Medium'}
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
															></path>
														{:else}
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															></path>
														{/if}
													</svg>
												</div>
											</div>
											<div class="min-w-0 flex-1">
												<p
													class="truncate text-sm font-medium"
													class:text-red-900={anomaly.severity === 'High'}
													class:text-yellow-900={anomaly.severity === 'Medium'}
													class:text-blue-900={anomaly.severity === 'Low'}
												>
													{anomaly.title || 'Unknown Anomaly'}
												</p>
												<p
													class="mt-1 text-xs"
													class:text-red-700={anomaly.severity === 'High'}
													class:text-yellow-700={anomaly.severity === 'Medium'}
													class:text-blue-700={anomaly.severity === 'Low'}
												>
													ID: {anomaly.idsubsls}
												</p>
												<p
													class="mt-1 text-xs"
													class:text-red-600={anomaly.severity === 'High'}
													class:text-yellow-600={anomaly.severity === 'Medium'}
													class:text-blue-600={anomaly.severity === 'Low'}
												>
													Severity: {anomaly.severity}
												</p>
											</div>
										</div>
									</div>
								{/each}
							{/if}
						</div>

						<!-- Toggle Labels Button -->
						<button
							on:click={toggleLabels}
							class="mt-4 w-full rounded-md bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
						>
							{showLabels ? '👁️ Hide Labels' : '👁️‍🗨️ Show Labels'}
						</button>

						<!-- View All Button -->
						<button
							on:click={openAnomalyModal}
							class="mt-2 w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
						>
							View All Anomalies
						</button>
					</div>

					<!-- Additional Info -->
					<div class="mt-8 space-y-4">
						<div class="rounded-md border border-blue-200 bg-blue-50 p-4">
							<h3 class="mb-2 text-sm font-medium text-blue-900">Supported Formats</h3>
							<ul class="space-y-1 text-xs text-blue-700">
								<li>• .geojson files</li>
								<li>• .json files</li>
								<li>• Polygon and multipolygon geometries</li>
							</ul>
						</div>

						<div class="rounded-md border border-gray-200 bg-gray-50 p-4">
							<h3 class="mb-2 text-sm font-medium text-gray-900">Map Controls</h3>
							<ul class="space-y-1 text-xs text-gray-700">
								<li>• Switch between Street/Satellite</li>
								<li>• Zoom in/out with scroll</li>
								<li>• Pan by dragging</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column - Map (75%) -->
			<div class="lg:col-span-3">
				<div class="h-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div id="map" class="h-full min-h-[400px] w-full rounded-md"></div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Anomaly Modal -->
<AnomalyModal
	isOpen={showAnomalyModal}
	{anomalies}
	on:close={closeAnomalyModal}
	on:zoom={(e) => zoomToAnomaly(e.detail)}
/>
