<script lang="ts">
	import { onMount } from 'svelte';

	let files: any[] = [];
	let groupedFiles: any = {};
	let allKelurahanGroups: any = {};
	let operatorGroups: any = {};
	let isLoading = true;
	let error: string | null = null;
	let selectedFile: any = null;
	let showVersions = false;
	let versions: any[] = [];
	let revisions: any[] = [];
	let groupByOperator = false; // Toggle between geographical and operator grouping
	let showAllKelurahan = false; // Toggle to show all kelurahan including those without files

	// Operator allocation data
	const operatorAllocations = [
		{ Nama: 'agustina rahmani ulva', 'Alokasi 1': 'Senen', 'Alokasi 2': 'Gelora' },
		{ Nama: 'Ahmad Naufal', 'Alokasi 1': 'Kartini', 'Alokasi 2': 'Cempaka Putih Timur' },
		{ Nama: 'Ajrina Shafa Ananda', 'Alokasi 1': 'Kebon Sirih', 'Alokasi 2': 'Cideng' },
		{ Nama: 'Amara Husna', 'Alokasi 1': 'Kwitang', 'Alokasi 2': 'Cikini' },
		{ Nama: 'Auliatunnisa', 'Alokasi 1': 'Bungur', 'Alokasi 2': 'Duri Pulo' },
		{ Nama: 'Ayu susetyaning', 'Alokasi 1': 'Galur', 'Alokasi 2': 'Kebon Melati' },
		{ Nama: 'Bayu Adi Nugroho', 'Alokasi 1': 'Utan Panjang', 'Alokasi 2': 'Petojo Utara' },
		{ Nama: 'febry ramadhianti', 'Alokasi 1': 'Kebon Kosong', 'Alokasi 2': 'Kampung Bali' },
		{ Nama: 'Guntur Gunawan', 'Alokasi 1': 'Kebon Kelapa', 'Alokasi 2': 'Sumur Batu' },
		{ Nama: 'Khadija Izzati', 'Alokasi 1': 'Kemayoran', 'Alokasi 2': 'Petojo Selatan' },
		{ Nama: 'Luli huriah', 'Alokasi 1': 'Petamburan', 'Alokasi 2': 'Gondangdia' },
		{
			Nama: 'Lusia Puji Astuti',
			'Alokasi 1': 'Gunung Sahari Selatan',
			'Alokasi 2': 'Karet Tengsin'
		},
		{ Nama: 'Meiriana Hudanti Perdhani', 'Alokasi 1': 'Serdang', 'Alokasi 2': 'Pegangsaan' },
		{ Nama: 'Muhammad Fadhil Amin', 'Alokasi 1': 'Rawasari', 'Alokasi 2': 'Bendungan Hilir' },
		{ Nama: 'Novaldi Endrawan', 'Alokasi 1': 'Paseban', 'Alokasi 2': 'Gambir' },
		{
			Nama: 'Nurhaliza Laila Arman',
			'Alokasi 1': 'Cempaka Putih Barat',
			'Alokasi 2': 'Gunung Sahari Utara'
		},
		{ Nama: 'Revina Ananda Hardiyanto', 'Alokasi 1': 'Kampung Rawa', 'Alokasi 2': 'Karang Anyar' },
		{ Nama: 'Shintia Nikita Zen', 'Alokasi 1': 'Cempaka Baru', 'Alokasi 2': 'Kebon Kacang' },
		{ Nama: 'Siti Fitriyani', 'Alokasi 1': 'Johar Baru', 'Alokasi 2': 'Kenari' },
		{ Nama: 'Siti Humaira', 'Alokasi 1': 'Harapan Mulya', 'Alokasi 2': 'Kramat' },
		{ Nama: 'Siti Nurlenia', 'Alokasi 1': 'Tanah Tinggi', 'Alokasi 2': '' },
		{ Nama: 'Wafa Nazifah', 'Alokasi 1': 'Pasar Baru', 'Alokasi 2': 'Menteng' },
		{ Nama: 'Kurnia Hidayati', 'Alokasi 1': 'Mangga Dua Selatan', 'Alokasi 2': '' }
	];

	// Complete kelurahan structure for Jakarta Pusat
	const allKelurahanStructure = {
		'Jakarta Pusat': {
			'Cempaka Putih': ['Cempaka Putih Barat', 'Cempaka Putih Timur', 'Rawasari'],
			Gambir: ['Cideng', 'Duri Pulo', 'Gambir', 'Kebon Kelapa', 'Petojo Selatan', 'Petojo Utara'],
			'Johar Baru': ['Galur', 'Johar Baru', 'Kampung Rawa', 'Tanah Tinggi'],
			Kemayoran: [
				'Cempaka Baru',
				'Gunung Sahari Selatan',
				'Harapan Mulia',
				'Kebon Kosong',
				'Kemayoran',
				'Serdang',
				'Sumur Batu',
				'Utan Panjang'
			],
			Menteng: ['Cikini', 'Gondangdia', 'Kebon Sirih', 'Menteng', 'Pegangsaan'],
			'Sawah Besar': ['Gunung Sahari Utara', 'Kartini', 'Mangga Dua Selatan', 'Pasar Baru'],
			Senen: ['Bungur', 'Kwitang', 'Kenari', 'Kramat', 'Paseban', 'Senen'],
			'Tanah Abang': [
				'Bendungan Hilir',
				'Gelora',
				'Karet Tengsin',
				'Kebon Melati',
				'Kebon Kacang',
				'Petamburan'
			]
		}
	};

	function groupFilesByKecamatanAndDesa(filesList: any[]) {
		const grouped: any = {};

		filesList.forEach((file) => {
			const kecamatanName = file.kecamatanName || 'Unknown Kecamatan';
			let desaName = file.districtName;

			// If districtName is missing, try to extract from filename
			if (!desaName && file.originalFilename) {
				// Try to match common district names from filename
				const districtNames = [
					'Kwitang',
					'Bungur',
					'Cempaka Putih Timur',
					'Cideng',
					'Cikini',
					'Duri Pulo',
					'Kebon Melati',
					'Utan Panjang',
					'Petojo Utara',
					'Kebon Kosong',
					'Kampung Bali',
					'Kebon Kelapa',
					'Sumur Batu',
					'Kemayoran',
					'Petojo Selatan',
					'Petamburan',
					'Gondangdia',
					'Gunung Sahari Selatan',
					'Karet Tengsin',
					'Serdang',
					'Pegangsaan',
					'Rawasari',
					'Bendungan Hilir',
					'Paseban',
					'Gambir',
					'Cempaka Putih Barat',
					'Gunung Sahari Utara',
					'Kampung Rawa',
					'Karang Anyar',
					'Cempaka Baru',
					'Kebon Kacang',
					'Johar Baru',
					'Kenari',
					'Harapan Mulya',
					'Kramat',
					'Tanah Tinggi',
					'Pasar Baru',
					'Menteng',
					'Mangga Dua Selatan'
				];

				for (const district of districtNames) {
					if (file.originalFilename.toLowerCase().includes(district.toLowerCase())) {
						desaName = district;
						break;
					}
				}
			}

			// If still no districtName found, mark as Unknown
			if (!desaName) {
				desaName = 'Unknown Desa';
				console.log(
					'File missing districtName and could not extract from filename:',
					file.originalFilename,
					file
				);
			}

			if (!grouped[kecamatanName]) {
				grouped[kecamatanName] = {};
			}

			if (!grouped[kecamatanName][desaName]) {
				grouped[kecamatanName][desaName] = [];
			}

			grouped[kecamatanName][desaName].push(file);
		});

		return grouped;
	}

	function groupFilesByOperator(filesList: any[]) {
		const grouped: any = {};

		// Initialize operator groups with allocations
		operatorAllocations.forEach((operator) => {
			const operatorName = operator.Nama;
			grouped[operatorName] = {
				allocations: [],
				files: []
			};

			// Add allocation areas
			if (operator['Alokasi 1']) {
				grouped[operatorName].allocations.push(operator['Alokasi 1']);
			}
			if (operator['Alokasi 2']) {
				grouped[operatorName].allocations.push(operator['Alokasi 2']);
			}
		});

		// Match files to operators based on districtName (case insensitive)
		filesList.forEach((file) => {
			let districtName = file.districtName;

			// If districtName is missing, try to extract from filename (same logic as above)
			if (!districtName && file.originalFilename) {
				const districtNames = [
					'Kwitang',
					'Bungur',
					'Cempaka Putih Timur',
					'Cideng',
					'Cikini',
					'Duri Pulo',
					'Kebon Melati',
					'Utan Panjang',
					'Petojo Utara',
					'Kebon Kosong',
					'Kampung Bali',
					'Kebon Kelapa',
					'Sumur Batu',
					'Kemayoran',
					'Petojo Selatan',
					'Petamburan',
					'Gondangdia',
					'Gunung Sahari Selatan',
					'Karet Tengsin',
					'Serdang',
					'Pegangsaan',
					'Rawasari',
					'Bendungan Hilir',
					'Paseban',
					'Gambir',
					'Cempaka Putih Barat',
					'Gunung Sahari Utara',
					'Kampung Rawa',
					'Karang Anyar',
					'Cempaka Baru',
					'Kebon Kacang',
					'Johar Baru',
					'Kenari',
					'Harapan Mulya',
					'Kramat',
					'Tanah Tinggi',
					'Pasar Baru',
					'Menteng',
					'Mangga Dua Selatan'
				];

				for (const district of districtNames) {
					if (file.originalFilename.toLowerCase().includes(district.toLowerCase())) {
						districtName = district;
						break;
					}
				}
			}

			// Find which operator this file belongs to
			operatorAllocations.forEach((operator) => {
				const operatorName = operator.Nama;
				const allocations = [operator['Alokasi 1'], operator['Alokasi 2']].filter(Boolean);

				// Check if file's district name matches any of operator's allocations (case insensitive)
				const match = allocations.some((allocation) => {
					if (!allocation || !districtName) return false;
					return allocation.toLowerCase() === districtName.toLowerCase();
				});

				if (match) {
					grouped[operatorName].files.push(file);
				}
			});
		});

		// Remove duplicates by district name - keep the most recent file (highest version or latest update)
		Object.keys(grouped).forEach((operatorName) => {
			const filesByDistrict: { [key: string]: any[] } = {};

			// Group files by district name
			grouped[operatorName].files.forEach((file: any) => {
				let districtKey = file.districtName;

				// If districtName is missing, try to extract from filename (same logic as above)
				if (!districtKey && file.originalFilename) {
					const districtNames = [
						'Kwitang',
						'Bungur',
						'Cempaka Putih Timur',
						'Cideng',
						'Cikini',
						'Duri Pulo',
						'Kebon Melati',
						'Utan Panjang',
						'Petojo Utara',
						'Kebon Kosong',
						'Kampung Bali',
						'Kebon Kelapa',
						'Sumur Batu',
						'Kemayoran',
						'Petojo Selatan',
						'Petamburan',
						'Gondangdia',
						'Gunung Sahari Selatan',
						'Karet Tengsin',
						'Serdang',
						'Pegangsaan',
						'Rawasari',
						'Bendungan Hilir',
						'Paseban',
						'Gambir',
						'Cempaka Putih Barat',
						'Gunung Sahari Utara',
						'Kampung Rawa',
						'Karang Anyar',
						'Cempaka Baru',
						'Kebon Kacang',
						'Johar Baru',
						'Kenari',
						'Harapan Mulya',
						'Kramat',
						'Tanah Tinggi',
						'Pasar Baru',
						'Menteng',
						'Mangga Dua Selatan'
					];

					for (const district of districtNames) {
						if (file.originalFilename.toLowerCase().includes(district.toLowerCase())) {
							districtKey = district;
							break;
						}
					}
				}

				if (!districtKey) {
					districtKey = 'Unknown';
				}

				if (!filesByDistrict[districtKey]) {
					filesByDistrict[districtKey] = [];
				}
				filesByDistrict[districtKey].push(file);
			});

			// For each district, keep only the most recent file
			const uniqueFiles: any[] = [];
			Object.keys(filesByDistrict).forEach((district) => {
				const districtFiles = filesByDistrict[district];
				// Sort by version number first, then by update date, and take the first (most recent)
				const mostRecentFile = districtFiles.sort((a, b) => {
					// First sort by currentVersionNumber (higher is better)
					if (b.currentVersionNumber !== a.currentVersionNumber) {
						return b.currentVersionNumber - a.currentVersionNumber;
					}
					// If versions are equal, sort by update date (more recent is better)
					return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
				})[0];
				uniqueFiles.push(mostRecentFile);
			});

			// Replace the files array with deduplicated files
			grouped[operatorName].files = uniqueFiles;
		});

		return grouped;
	}

	async function fetchFiles() {
		try {
			const response = await fetch('/api/save-geojson?userId=anonymous');
			const result = await response.json();

			if (result.success) {
				files = result.files;
				groupedFiles = groupFilesByKecamatanAndDesa(files);
				allKelurahanGroups = groupAllKelurahanWithFiles(files);
				operatorGroups = groupFilesByOperator(files);
			} else {
				throw new Error('Failed to fetch files');
			}
		} catch (err) {
			error = 'Failed to load files';
			console.error('Error fetching files:', err);
		} finally {
			isLoading = false;
		}
	}

	async function fetchVersions(fileId: number) {
		try {
			const response = await fetch(`/api/geojson-versions?fileId=${fileId}`);
			const result = await response.json();

			if (result.success) {
				selectedFile = result.file;
				versions = result.versions;
				revisions = result.revisions;
				showVersions = true;
			} else {
				throw new Error('Failed to fetch versions');
			}
		} catch (err) {
			error = 'Failed to load versions';
			console.error('Error fetching versions:', err);
		}
	}

	async function downloadGeoJson(fileId: number, filename: string) {
		try {
			const response = await fetch(`/api/geojson-versions?fileId=${fileId}`);
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

					// Use the original filename or create a new one
					const downloadFilename = filename.endsWith('.geojson') ? filename : `${filename}.geojson`;
					a.download = downloadFilename;

					// Trigger the download
					document.body.appendChild(a);
					a.click();

					// Clean up
					document.body.removeChild(a);
					window.URL.revokeObjectURL(url);
				} else {
					throw new Error('No GeoJSON data found for this file');
				}
			} else {
				throw new Error('Failed to fetch file data');
			}
		} catch (err) {
			console.error('Error downloading file:', err);
			alert('Failed to download file. Please try again.');
		}
	}

	async function downloadVersionGeoJson(version: any, filename: string) {
		try {
			if (version && version.geojsonData) {
				// Create a Blob with the GeoJSON data
				const blob = new Blob([JSON.stringify(version.geojsonData, null, 2)], {
					type: 'application/json'
				});

				// Create a download link
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;

				// Create filename with version number
				const baseFilename = filename.replace('.geojson', '');
				const downloadFilename = `${baseFilename}_v${version.versionNumber}.geojson`;
				a.download = downloadFilename;

				// Trigger the download
				document.body.appendChild(a);
				a.click();

				// Clean up
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
			} else {
				throw new Error('No GeoJSON data found for this version');
			}
		} catch (err) {
			console.error('Error downloading version:', err);
			alert('Failed to download version. Please try again.');
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString('id-ID');
	}

	function isFileUploadedAfterOrOnTargetDate(dateString: string) {
		const fileDate = new Date(dateString);
		const targetDate = new Date('2025-10-15');
		return fileDate >= targetDate;
	}

	function getKelurahanWithoutGreenCheckmark() {
		const kelurahanWithoutCheckmark: string[] = [];

		// Get the data source based on current view mode
		const dataSource = showAllKelurahan ? allKelurahanGroups : groupedFiles;

		Object.entries(dataSource).forEach(([kecamatanName, desaGroups]) => {
			const desaGroupsTyped = desaGroups as { [key: string]: any[] };

			Object.entries(desaGroupsTyped).forEach(([desaName, desaFiles]) => {
				let hasGreenCheckmark = false;

				if (desaFiles.length > 0) {
					// Check if the latest file has green checkmark
					const latestFile = getLatestFileForDistrict(desaFiles)[0];
					if (latestFile && isFileUploadedAfterOrOnTargetDate(latestFile.updatedAt)) {
						hasGreenCheckmark = true;
					}
				}

				// If no green checkmark, add to list
				if (!hasGreenCheckmark) {
					kelurahanWithoutCheckmark.push(`${desaName}, ${kecamatanName}`);
				}
			});
		});

		return kelurahanWithoutCheckmark;
	}

	function generateKelurahanSummary() {
		const kelurahanList = getKelurahanWithoutGreenCheckmark();

		if (kelurahanList.length === 0) {
			return 'Semua kelurahan sudah memiliki file dengan checklist hijau! 🎉';
		}

		const summaryLines: string[] = [];
		summaryLines.push('Kelurahan yang belum memiliki checklist hijau:');
		summaryLines.push(''); // Empty line
		summaryLines.push(...kelurahanList);
		summaryLines.push(''); // Empty line
		summaryLines.push(`Total: ${kelurahanList.length} kelurahan`);

		return summaryLines.join('\n');
	}

	function getSeverityColor(severity: string) {
		switch (severity.toLowerCase()) {
			case 'high':
				return 'bg-red-100 text-red-800';
			case 'medium':
				return 'bg-yellow-100 text-yellow-800';
			case 'low':
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getLatestFileForDistrict(files: any[]) {
		if (files.length === 0) return [];

		// Sort by version number first, then by update date, and take the first (most recent)
		const latestFile = files.sort((a, b) => {
			// First sort by currentVersionNumber (higher is better)
			if (b.currentVersionNumber !== a.currentVersionNumber) {
				return b.currentVersionNumber - a.currentVersionNumber;
			}
			// If versions are equal, sort by update date (more recent is better)
			return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
		})[0];

		return [latestFile];
	}

	function groupAllKelurahanWithFiles(filesList: any[]) {
		const grouped: any = {};

		// First, create the structure with all kelurahan from allKelurahanStructure
		Object.entries(allKelurahanStructure['Jakarta Pusat']).forEach(
			([kecamatanName, kelurahanList]) => {
				grouped[kecamatanName] = {};

				// Initialize all kelurahan as empty arrays
				kelurahanList.forEach((kelurahanName) => {
					grouped[kecamatanName][kelurahanName] = [];
				});
			}
		);

		// Then, populate with actual files using fuzzy matching
		filesList.forEach((file) => {
			const kecamatanName = file.kecamatanName;
			const districtName = file.districtName;

			// Try to find matching kecamatan using case-insensitive comparison
			let matchedKecamatan = null;
			for (const structureKecamatan of Object.keys(grouped)) {
				if (
					kecamatanName &&
					structureKecamatan.toLowerCase() === kecamatanName.toLowerCase().trim()
				) {
					matchedKecamatan = structureKecamatan;
					break;
				}
			}

			// Try to find matching kelurahan using case-insensitive comparison
			if (matchedKecamatan && districtName) {
				let matchedKelurahan = null;
				for (const structureKelurahan of Object.keys(grouped[matchedKecamatan])) {
					if (structureKelurahan.toLowerCase() === districtName.toLowerCase().trim()) {
						matchedKelurahan = structureKelurahan;
						break;
					}
				}

				// Add file to the correct location
				if (matchedKelurahan) {
					grouped[matchedKecamatan][matchedKelurahan].push(file);
				}
			}
		});

		return grouped;
	}

	function generateOperatorSummary() {
		const summaryLines: string[] = [];

		// Sort operators by name alphabetically for consistent output
		const sortedOperators = Object.keys(operatorGroups).sort((a, b) =>
			a.toLowerCase().localeCompare(b.toLowerCase())
		);

		sortedOperators.forEach((operatorName) => {
			const operatorData = operatorGroups[operatorName] as any;
			const totalAllocations = operatorData.allocations.length;
			const completedFiles = operatorData.files.length;
			const percentage =
				totalAllocations > 0 ? Math.round((completedFiles / totalAllocations) * 100) : 0;

			// Format: "Nama Operator : (X/Y) Z%"
			summaryLines.push(`${operatorName} : (${completedFiles}/${totalAllocations}) ${percentage}%`);
		});

		// Add overall statistics at the end
		const totalAllocations = Object.values(operatorGroups).reduce(
			(sum: number, op: any) => sum + op.allocations.length,
			0
		);
		const totalCompleted = Object.values(operatorGroups).reduce(
			(sum: number, op: any) => sum + op.files.length,
			0
		);
		const overallPercentage =
			totalAllocations > 0 ? Math.round((totalCompleted / totalAllocations) * 100) : 0;

		summaryLines.push(''); // Empty line
		summaryLines.push(`Total: (${totalCompleted}/${totalAllocations}) ${overallPercentage}%`);

		return summaryLines.join('\n');
	}

	async function copyOperatorSummary() {
		try {
			const summary = generateOperatorSummary();
			await navigator.clipboard.writeText(summary);

			// Show success feedback
			alert('Operator summary copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy summary:', err);
			// Fallback for browsers that don't support clipboard API
			const summary = generateOperatorSummary();
			const textArea = document.createElement('textarea');
			textArea.value = summary;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			alert('Operator summary copied to clipboard!');
		}
	}

	async function copyKelurahanSummary() {
		try {
			const summary = generateKelurahanSummary();
			await navigator.clipboard.writeText(summary);

			// Show success feedback
			const kelurahanList = getKelurahanWithoutGreenCheckmark();
			const count = kelurahanList.length;
			alert(`Kelurahan summary copied to clipboard! (${count} kelurahan without green checkmark)`);
		} catch (err) {
			console.error('Failed to copy kelurahan summary:', err);
			// Fallback for browsers that don't support clipboard API
			const summary = generateKelurahanSummary();
			const textArea = document.createElement('textarea');
			textArea.value = summary;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);

			const kelurahanList = getKelurahanWithoutGreenCheckmark();
			const count = kelurahanList.length;
			alert(`Kelurahan summary copied to clipboard! (${count} kelurahan without green checkmark)`);
		}
	}

	onMount(() => {
		fetchFiles();
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
					class="border-l border-gray-200 bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors"
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
				<h2 class="text-2xl font-semibold text-gray-900">Manage Saved GeoJSON Files</h2>

				<div class="flex items-center space-x-4">
					<!-- Copy Kelurahan Summary Button (only show in Area view) -->
					{#if !groupByOperator}
						<button
							on:click={copyKelurahanSummary}
							class="inline-flex items-center rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
							title="Copy kelurahan without green checkmark to clipboard"
						>
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
								></path>
							</svg>
							Copy Kelurahan Summary
						</button>
					{/if}

					<!-- Copy Summary Button (only show in operator view) -->
					{#if groupByOperator}
						<button
							on:click={copyOperatorSummary}
							class="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
							title="Copy operator summary to clipboard"
						>
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								></path>
							</svg>
							Copy Summary
						</button>
					{/if}

					<!-- Toggle for grouping mode -->
					<div class="flex items-center space-x-3">
						<span class="text-sm font-medium text-gray-700">Group by:</span>
						<div class="relative inline-flex items-center rounded-lg bg-gray-100 p-1">
							<button
								on:click={() => (groupByOperator = false)}
								class="relative rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors {groupByOperator
									? 'text-gray-600 hover:text-gray-800'
									: 'bg-white text-gray-900 shadow-sm'}"
							>
								<svg
									class="mr-1 inline-block h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
									></path>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
									></path>
								</svg>
								Area
							</button>
							<button
								on:click={() => (groupByOperator = true)}
								class="relative rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors {groupByOperator
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-600 hover:text-gray-800'}"
							>
								<svg
									class="mr-1 inline-block h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
									></path>
								</svg>
								Operator
							</button>
						</div>
					</div>

					<!-- Show All Kelurahan Toggle (only show in Area view) -->
					{#if !groupByOperator}
						<div class="flex items-center space-x-3">
							<span class="text-sm font-medium text-gray-700">Show:</span>
							<div class="relative inline-flex items-center rounded-lg bg-gray-100 p-1">
								<button
									on:click={() => (showAllKelurahan = false)}
									class="relative rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors {showAllKelurahan
										? 'text-gray-600 hover:text-gray-800'
										: 'bg-white text-gray-900 shadow-sm'}"
								>
									<svg
										class="mr-1 inline-block h-4 w-4"
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
									With Files Only
								</button>
								<button
									on:click={() => (showAllKelurahan = true)}
									class="relative rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors {showAllKelurahan
										? 'bg-white text-gray-900 shadow-sm'
										: 'text-gray-600 hover:text-gray-800'}"
								>
									<svg
										class="mr-1 inline-block h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 6h16M4 10h16M4 14h16M4 18h16"
										></path>
									</svg>
									All Kelurahan
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>

			{#if isLoading}
				<div class="py-12 text-center">
					<div
						class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
					></div>
					<p class="mt-4 text-sm text-gray-600">Loading files...</p>
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
			{:else if files.length === 0}
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
					<p class="mt-2 text-sm text-gray-600">No saved files found</p>
					<p class="mt-1 text-xs text-gray-500">Upload and save GeoJSON files to see them here</p>
				</div>
			{:else if groupByOperator}
				<!-- Operator View -->
				<div class="space-y-6">
					{#each Object.entries(operatorGroups) as [operatorName, operatorData] (operatorName)}
						{@const operatorDataTyped = operatorData as any}
						<div class="rounded-lg border border-gray-200 bg-white">
							<div class="border-b border-gray-200 bg-gray-50 px-4 py-3">
								<div class="flex items-center justify-between">
									<h3 class="text-lg font-semibold text-gray-900">
										<svg
											class="mr-2 inline-block h-5 w-5 text-purple-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
											></path>
										</svg>
										{operatorName}
									</h3>
									<div class="flex items-center space-x-2">
										<span class="text-sm text-gray-600">
											{operatorDataTyped.files.length} file{operatorDataTyped.files.length !== 1
												? 's'
												: ''} • {operatorDataTyped.allocations.length} area{operatorDataTyped
												.allocations.length !== 1
												? 's'
												: ''}
										</span>
									</div>
								</div>
							</div>
							<div class="p-4">
								<!-- Assigned Areas -->
								<div class="mb-4">
									<h4 class="mb-2 text-sm font-medium text-gray-700">Assigned Areas:</h4>
									<div class="flex flex-wrap gap-2">
										{#each operatorDataTyped.allocations as allocation}
											<span
												class="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800"
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
														d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
													></path>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
													></path>
												</svg>
												{allocation}
											</span>
										{/each}
									</div>
								</div>

								<!-- Files -->
								<div>
									<h4 class="mb-3 text-sm font-medium text-gray-700">Files:</h4>
									{#if operatorDataTyped.files.length === 0}
										<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
											<div class="mx-auto h-8 w-8 text-gray-400">
												<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
													></path>
												</svg>
											</div>
											<p class="mt-2 text-xs text-gray-600">
												No GeoJSON files uploaded for assigned areas
											</p>
										</div>
									{:else}
										<div class="space-y-2">
											{#each operatorDataTyped.files as file (file.id)}
												<div class="rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
													<div class="flex items-center justify-between">
														<div class="flex-1">
															<div class="flex items-center space-x-3">
																<div
																	class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100"
																>
																	<svg
																		class="h-4 w-4 text-blue-600"
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
																</div>
																<div class="flex items-center space-x-2">
																	{#if isFileUploadedAfterOrOnTargetDate(file.updatedAt)}
																		<span
																			class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100"
																			title="Uploaded on or after October 15, 2025"
																		>
																			<svg
																				class="h-3 w-3 text-green-600"
																				fill="none"
																				stroke="currentColor"
																				viewBox="0 0 24 24"
																			>
																				<path
																					stroke-linecap="round"
																					stroke-linejoin="round"
																					stroke-width="3"
																					d="M5 13l4 4L19 7"
																				></path>
																			</svg>
																		</span>
																	{/if}
																	<div>
																		<h5 class="text-sm font-medium text-gray-900">
																			{file.districtName}
																		</h5>
																		<p class="text-xs text-gray-500">
																			File: {file.originalFilename} • Version: {file.currentVersionNumber}
																			• Updated: {formatDate(file.updatedAt)}
																		</p>
																	</div>
																</div>
															</div>
														</div>
														<div class="flex items-center space-x-2">
															<button
																on:click={() => downloadGeoJson(file.id, file.originalFilename)}
																class="rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-700 transition-colors hover:bg-green-200"
																title="Download GeoJSON file"
															>
																<svg
																	class="h-4 w-4"
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
															<button
																on:click={() => fetchVersions(file.id)}
																class="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200"
															>
																View Versions
															</button>
														</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Geographical View -->
				<div class="space-y-6">
					{#each Object.entries(showAllKelurahan ? allKelurahanGroups : groupedFiles) as [kecamatanName, desaGroups] (kecamatanName)}
						{@const desaGroupsTyped = desaGroups as { [key: string]: any[] }}
						<div class="rounded-lg border border-gray-200 bg-white">
							<div class="border-b border-gray-200 bg-gray-50 px-4 py-3">
								<h3 class="text-lg font-semibold text-gray-900">
									<svg
										class="mr-2 inline-block h-5 w-5 text-blue-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
										></path>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
										></path>
									</svg>
									{kecamatanName}
								</h3>
							</div>
							<div class="space-y-2 p-4">
								{#each Object.entries(desaGroupsTyped) as [desaName, desaFiles] (desaName)}
									{#if desaFiles.length > 0}
										<!-- Kelurahan with files -->
										{#each getLatestFileForDistrict(desaFiles) as file (file.id)}
											<div class="rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
												<div class="flex items-center justify-between">
													<div class="flex-1">
														<div class="flex items-center space-x-3">
															<div
																class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100"
															>
																<svg
																	class="h-4 w-4 text-green-600"
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
															</div>
															<div class="flex items-center space-x-2">
																{#if isFileUploadedAfterOrOnTargetDate(file.updatedAt)}
																	<span
																		class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100"
																		title="Uploaded on or after October 15, 2025"
																	>
																		<svg
																			class="h-3 w-3 text-green-600"
																			fill="none"
																			stroke="currentColor"
																			viewBox="0 0 24 24"
																		>
																			<path
																				stroke-linecap="round"
																				stroke-linejoin="round"
																				stroke-width="3"
																				d="M5 13l4 4L19 7"
																			></path>
																		</svg>
																	</span>
																{/if}
																<div>
																	<h5 class="text-sm font-medium text-gray-900">{desaName}</h5>
																	<p class="text-xs text-gray-500">
																		File: {file.originalFilename} • Version: {file.currentVersionNumber}
																		• Updated: {formatDate(file.updatedAt)}
																	</p>
																</div>
															</div>
														</div>
													</div>
													<div class="flex items-center space-x-2">
														<button
															on:click={() => downloadGeoJson(file.id, file.originalFilename)}
															class="rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-700 transition-colors hover:bg-green-200"
															title="Download GeoJSON file"
														>
															<svg
																class="h-4 w-4"
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
														<button
															on:click={() => fetchVersions(file.id)}
															class="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200"
														>
															View Versions
														</button>
													</div>
												</div>
											</div>
										{/each}
									{:else}
										<!-- Kelurahan without files -->
										<div class="rounded-lg border border-gray-200 bg-red-50 p-3">
											<div class="flex items-center justify-between">
												<div class="flex-1">
													<div class="flex items-center space-x-3">
														<div
															class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100"
														>
															<svg
																class="h-4 w-4 text-red-600"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M6 18L18 6M6 6l12 12"
																></path>
															</svg>
														</div>
														<div>
															<h5 class="text-sm font-medium text-red-900">{desaName}</h5>
															<p class="text-xs text-red-600">No GeoJSON file uploaded yet</p>
														</div>
													</div>
												</div>
												<div class="flex items-center space-x-2">
													<span
														class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
													>
														Pending
													</span>
												</div>
											</div>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Version History Modal -->
			{#if showVersions}
				<div class="fixed inset-0 z-50 overflow-y-auto">
					<div class="flex min-h-screen items-center justify-center p-4">
						<!-- Background overlay -->
						<div
							class="bg-opacity-75 fixed inset-0 bg-gray-500 transition-opacity"
							role="button"
							tabindex="0"
							aria-label="Close modal"
							on:click={() => (showVersions = false)}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									showVersions = false;
								}
							}}
						></div>

						<!-- Modal panel -->
						<div
							class="relative z-10 inline-block w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all"
						>
							<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
								<div class="mb-4 flex items-center justify-between">
									<h3 class="text-lg font-medium text-gray-900">
										Version History: {selectedFile.districtName || selectedFile.districtCode}
									</h3>
									<p class="text-sm text-gray-600">
										{selectedFile.kabupatenName} • {selectedFile.kecamatanName} • Original File: {selectedFile.originalFilename}
									</p>
									<button
										on:click={() => (showVersions = false)}
										class="rounded-md bg-gray-100 p-2 text-gray-400 hover:bg-gray-200"
										aria-label="Close version history modal"
										title="Close"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											></path>
										</svg>
									</button>
								</div>

								<div class="space-y-4">
									<!-- Versions -->
									<div>
										<h4 class="mb-3 text-sm font-medium text-gray-900">Versions</h4>
										{#if versions.length === 0}
											<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
												<p class="text-sm text-gray-600">No versions found for this file</p>
											</div>
										{:else}
											<div class="space-y-2">
												{#each versions as version (version.id)}
													<div class="rounded-lg border border-gray-200 p-3">
														<div class="flex items-center justify-between">
															<div>
																<div class="flex items-center space-x-2">
																	<span class="text-sm font-medium text-gray-900"
																		>Version {version.versionNumber}</span
																	>
																	<span
																		class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
																	>
																		{version.id === selectedFile.currentVersionId
																			? 'Current'
																			: 'Previous'}
																	</span>
																</div>
																<p class="text-xs text-gray-500">
																	{formatDate(version.createdAt)} • By: {version.createdBy}
																</p>
																{#if version.changeNotes}
																	<p class="mt-1 text-xs text-gray-600">
																		Notes: {version.changeNotes}
																	</p>
																{/if}
																{#if version.anomalySummary}
																	<div class="mt-2 flex items-center space-x-4 text-xs">
																		<span class="font-medium"
																			>Anomalies: {version.anomalySummary.total}</span
																		>
																		{#each Object.entries(version.anomalySummary.bySeverity || {}) as [severity, count]}
																			<span
																				class="{getSeverityColor(severity)} rounded-full px-2 py-1"
																			>
																				{severity}: {count}
																			</span>
																		{/each}
																	</div>
																{/if}
															</div>
															<div class="flex items-center space-x-2">
																<button
																	on:click={() =>
																		downloadVersionGeoJson(version, selectedFile.originalFilename)}
																	class="rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
																	title="Download this version"
																>
																	<svg
																		class="h-3 w-3"
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
																{#if version.id !== selectedFile.currentVersionId}
																	<button
																		on:click={async () => {
																			if (
																				confirm(
																					`Rollback to version ${version.versionNumber}? This will create a new revision.`
																				)
																			) {
																				try {
																					const response = await fetch('/api/geojson-versions', {
																						method: 'POST',
																						headers: { 'Content-Type': 'application/json' },
																						body: JSON.stringify({
																							fileId: selectedFile.id,
																							versionId: version.id
																						})
																					});
																					const result = await response.json();
																					if (result.success) {
																						alert(
																							`Successfully rolled back to version ${version.versionNumber}`
																						);
																						await fetchVersions(selectedFile.id);
																					}
																				} catch (err) {
																					alert('Failed to rollback version');
																				}
																			}
																		}}
																		class="rounded-md bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200"
																	>
																		Rollback
																	</button>
																{/if}
															</div>
														</div>
													</div>
												{/each}
											</div>
										{/if}
									</div>

									<!-- Revisions -->
									{#if revisions.length > 0}
										<div>
											<h4 class="mb-3 text-sm font-medium text-gray-900">Revision History</h4>
											<div class="space-y-2">
												{#each revisions as revision (revision.id)}
													<div class="rounded-lg border border-gray-200 p-3">
														<div class="flex items-center justify-between">
															<div>
																<div class="flex items-center space-x-2">
																	<span class="text-sm font-medium text-gray-900 capitalize"
																		>{revision.revisionType}</span
																	>
																	<span
																		class="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
																	>
																		{formatDate(revision.createdAt)}
																	</span>
																</div>
																<p class="text-xs text-gray-500">By: {revision.createdBy}</p>
																{#if revision.changesSummary}
																	<div class="mt-1 text-xs text-gray-600">
																		{#if revision.revisionType === 'rollback'}
																			Rollback to version {revision.changesSummary
																				.rollbackToVersion}
																		{:else}
																			Anomalies fixed: {revision.changesSummary.anomaliesFixed}
																		{/if}
																	</div>
																{/if}
															</div>
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
