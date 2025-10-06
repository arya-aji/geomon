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

  // Anomaly data array - will be populated dynamically
  let anomalies: any[] = [];

  // Function to add anomaly with duplicate check based on idsubsls
  function addAnomaly(anomalyData: any) {
    // Check if anomaly with same idsubsls already exists
    const existingAnomaly = anomalies.find(a => a.idsubsls === anomalyData.idsubsls);

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

    // Find the specific feature in the GeoJSON layer
    geoJSONLayer.eachLayer((layer: any) => {
      if (layer.feature && layer.feature.properties &&
          layer.feature.properties.idsubsls === anomaly.idsubsls) {

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
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // Initialize Leaflet map
    map = L.map('map').setView([-2.5, 118], 5); // Center of Indonesia

    // Add OpenStreetMap tile layer with hybrid-like appearance
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add satellite layer option (using ESRI World Imagery)
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri'
    });

    // Add layer control
    const baseMaps = {
      "Street": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }),
      "Satellite": satelliteLayer
    };

    baseMaps["Street"].addTo(map);
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

      // Check for duplicate idsubsls in current upload
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
          }
        }
      }).addTo(map);

      // Fit map to bounds
      if (geoJSONLayer.getBounds().isValid()) {
        map.fitBounds(geoJSONLayer.getBounds());
      }

    } catch (error) {
      console.error('Error parsing GeoJSON:', error);
      alert('Invalid GeoJSON file. Please upload a valid GeoJSON file.');
    } finally {
      isUploading = false;
    }
  }

  
  function extractCoordinates(geometry: any): string {
    try {
      if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates[0] && geometry.coordinates[0][0]) {
        const coords = geometry.coordinates[0][0];
        return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
      } else if (geometry.type === 'MultiPolygon' && geometry.coordinates && geometry.coordinates[0] && geometry.coordinates[0][0] && geometry.coordinates[0][0][0]) {
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
    importantFields.forEach(field => {
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

  function triggerFileUpload() {
    fileInput?.click();
  }

  function openAnomalyModal() {
    showAnomalyModal = true;
  }

  function closeAnomalyModal() {
    showAnomalyModal = false;
  }
</script>

<svelte:head>
  <title>GEOMON - Geospasial Monitoring</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8 px-4">
  <!-- Header -->
  <header class="text-center mb-8">
    <h1 class="text-6xl font-bold text-gray-900 mb-2">GEOMON</h1>
    <p class="text-xl text-gray-600">Geospasial Monitoring</p>
  </header>

  <!-- Main Content Grid -->
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">

      <!-- Left Column - Form (25%) -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Upload GeoJSON</h2>

          <form on:submit|preventDefault={triggerFileUpload} class="space-y-4">
            <div>
              <label for="geojson-upload" class="block text-sm font-medium text-gray-700 mb-2">
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
                class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {#if isUploading}
                  <span class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
            <div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div class="flex items-center">
                <svg class="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm text-green-800 font-medium">File loaded successfully</p>
              </div>
              <p class="text-xs text-green-700 mt-1">GeoJSON data is now visible on the map</p>
            </div>
          {/if}

          <!-- Anomaly List Section -->
          <div class="mt-8">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Anomalies</h3>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {anomalies.length} Detected
              </span>
            </div>

            <!-- Anomaly List -->
            <div class="space-y-3 max-h-64 overflow-y-auto">
              {#if anomalies.length === 0}
                <div class="text-center py-8">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p class="mt-2 text-sm text-gray-600">No anomalies detected</p>
                  <p class="text-xs text-gray-500 mt-1">Upload GeoJSON data to start monitoring</p>
                </div>
              {:else}
                {#each anomalies.slice(0, 3) as anomaly (anomaly.idsubsls)}
                  <div
                    class="p-3 rounded-lg hover:shadow-md transition-all cursor-pointer hover:scale-105"
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
                          class="w-8 h-8 rounded-full flex items-center justify-center"
                          class:bg-red-500={anomaly.severity === 'High'}
                          class:bg-yellow-500={anomaly.severity === 'Medium'}
                          class:bg-blue-500={anomaly.severity === 'Low'}
                        >
                          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {#if anomaly.severity === 'High'}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            {:else if anomaly.severity === 'Medium'}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            {:else}
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            {/if}
                          </svg>
                        </div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p
                          class="text-sm font-medium truncate"
                          class:text-red-900={anomaly.severity === 'High'}
                          class:text-yellow-900={anomaly.severity === 'Medium'}
                          class:text-blue-900={anomaly.severity === 'Low'}
                        >
                          {anomaly.title || 'Unknown Anomaly'}
                        </p>
                        <p
                          class="text-xs mt-1"
                          class:text-red-700={anomaly.severity === 'High'}
                          class:text-yellow-700={anomaly.severity === 'Medium'}
                          class:text-blue-700={anomaly.severity === 'Low'}
                        >
                          ID: {anomaly.idsubsls}
                        </p>
                        <p
                          class="text-xs mt-1"
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

            <!-- View All Button -->
            <button
              on:click={openAnomalyModal}
              class="mt-4 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm font-medium"
            >
              View All Anomalies
            </button>
          </div>

          <!-- Additional Info -->
          <div class="mt-8 space-y-4">
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 class="text-sm font-medium text-blue-900 mb-2">Supported Formats</h3>
              <ul class="text-xs text-blue-700 space-y-1">
                <li>• .geojson files</li>
                <li>• .json files</li>
                <li>• Polygon and multipolygon geometries</li>
              </ul>
            </div>

            <div class="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 class="text-sm font-medium text-gray-900 mb-2">Map Controls</h3>
              <ul class="text-xs text-gray-700 space-y-1">
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
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
          <div
            id="map"
            class="w-full h-full rounded-md min-h-[400px]"
          ></div>
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
