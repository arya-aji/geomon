<script lang="ts">
	import { onMount } from 'svelte';

	type SIPWItem = {
		idsubsls: string;
		nmkab?: string;
		nmkec?: string;
		nmdesa?: string;
		nama_sls?: string;
		kd_subsls?: string;
		nama_wke?: string;
		muatan_dominan?: number;
	};

	let sipwData = $state<SIPWItem[]>([]);
	let filteredData = $state<SIPWItem[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Filter states
	let selectedNmkab = $state('');
	let selectedNmkec = $state('');
	let selectedNmdesa = $state('');

	// Filter options
	let nmkabOptions = $state<string[]>([]);
	let nmkecOptions = $state<string[]>([]);
	let nmdesaOptions = $state<string[]>([]);

	// Table pagination
	let currentPage = $state(1);
	let itemsPerPage = 20;
	let totalPages = $derived(Math.ceil(filteredData.length / itemsPerPage));

	async function fetchDistinctValues() {
		try {
			const response = await fetch('/api/sipw-data/distinct-values');
			if (!response.ok) throw new Error('Failed to fetch filter options');

			const data = await response.json();
			nmkabOptions = data.nmkab || [];
		} catch (err) {
			console.error('Error fetching distinct values:', err);
			error = 'Failed to load filter options';
		}
	}

	async function fetchSIPWData() {
		if (!selectedNmkec && !selectedNmdesa) {
			error = 'Please select at least Kecamatan or Desa filter';
			return;
		}

		isLoading = true;
		error = null;

		// Reset data before fetching new data
		sipwData = [];
		filteredData = [];

		try {
			const filterParams: Record<string, string> = {};
			if (selectedNmkab) filterParams.nmkab = selectedNmkab;
			if (selectedNmkec) filterParams.nmkec = selectedNmkec;
			if (selectedNmdesa) filterParams.nmdesa = selectedNmdesa;

			const response = await fetch('/api/sipw-data/filter', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(filterParams)
			});

			if (!response.ok) throw new Error('Failed to fetch SIPW data');

			const newData = (await response.json()) as SIPWItem[];
			sipwData = newData;
			filteredData = newData;

			// Reset pagination to first page
			currentPage = 1;
		} catch (err) {
			console.error('Error fetching SIPW data:', err);
			error = 'Failed to load SIPW data';
		} finally {
			isLoading = false;
		}
	}

	async function fetchKecamatanOptions() {
		if (!selectedNmkab) {
			nmkecOptions = [];
			nmdesaOptions = [];
			return;
		}

		try {
			const response = await fetch('/api/sipw-data/filter', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ nmkab: selectedNmkab })
			});

			if (response.ok) {
				const data = await response.json();
				if (Array.isArray(data)) {
					const kecamatanSet = new Set(data.map((item: any) => item.nmkec).filter(Boolean));
					nmkecOptions = Array.from(kecamatanSet).sort();
				} else {
					console.error('API did not return an array:', data);
					nmkecOptions = [];
				}
			}
		} catch (err) {
			console.error('Error fetching kecamatan options:', err);
		}
	}

	async function fetchDesaOptions() {
		if (!selectedNmkec) {
			nmdesaOptions = [];
			return;
		}

		try {
			const response = await fetch('/api/sipw-data/filter', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					nmkab: selectedNmkab,
					nmkec: selectedNmkec
				})
			});

			if (response.ok) {
				const data = await response.json();
				if (Array.isArray(data)) {
					const desaSet = new Set(data.map((item: any) => item.nmdesa).filter(Boolean));
					nmdesaOptions = Array.from(desaSet).sort();
				} else {
					console.error('API did not return an array:', data);
					nmdesaOptions = [];
				}
			}
		} catch (err) {
			console.error('Error fetching desa options:', err);
		}
	}

	$effect(() => {
		if (selectedNmkab) {
			fetchKecamatanOptions();
		} else {
			nmkecOptions = [];
			nmdesaOptions = [];
			selectedNmkec = '';
			selectedNmdesa = '';
		}
	});

	$effect(() => {
		if (selectedNmkec) {
			fetchDesaOptions();
		} else {
			nmdesaOptions = [];
			selectedNmdesa = '';
		}
	});

	
	function resetFilters() {
		selectedNmkab = '';
		selectedNmkec = '';
		selectedNmdesa = '';
		sipwData = [];
		filteredData = [];
		error = null;
	}

	const paginatedData = $derived(() => {
		if (!filteredData || filteredData.length === 0) return [] as SIPWItem[];

		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		const result = filteredData.slice(startIndex, endIndex);

		return result;
	});

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	const paginationNumbers = $derived(() => {
		const numbers: number[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			// Show all pages if total is small
			for (let i = 1; i <= totalPages; i++) {
				numbers.push(i);
			}
		} else {
			// Show current page and 2 pages before/after
			let start = Math.max(1, currentPage - 2);
			let end = Math.min(totalPages, start + maxVisible - 1);

			// Adjust start if we're near the end
			if (end - start + 1 < maxVisible) {
				start = Math.max(1, end - maxVisible + 1);
			}

			for (let i = start; i <= end; i++) {
				numbers.push(i);
			}
		}

		return numbers;
	});

	// Mapping for muatan_dominan codes to names
	function getMuatanDominanName(kode?: number): string {
		if (!kode) return '-';

		const muatanList: Record<number, string> = {
			1: 'Permukiman Biasa',
			2: 'Permukiman Mewah/elite/real estate',
			3: 'Permukiman Kumuh',
			4: 'Apartemen/kondominium/flat',
			5: 'Kos-kosan/kontrakan',
			6: 'Pesantren/barak/asrama/seminari',
			7: '(tidak digunakan)',
			8: 'Pusat perbelanjaan modern/mall/pertokoan/pasar',
			9: 'Kawasan industri/sentra industri',
			10: 'Hotel/tempat rekreasi',
			11: 'Wilayah tidak berpenghuni (hutan/kebun, pulau kosong, danau/waduk/rawa, lahan kosong)',
			12: 'Perkantoran',
			13: 'Pelabuhan/Bandara/Terminal Bus/Stasiun'
		};

		return muatanList[kode] || `Kode ${kode}`;
	}

	onMount(() => {
		fetchDistinctValues();
	});
</script>

<svelte:head>
	<title>GEOMON - Data SLS</title>
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
					class="border-l border-gray-200 bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors"
				>
					Data SLS
				</a>
				<a
					href="/perubahan"
					class="rounded-r-lg border-l border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl">
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h2 class="mb-6 text-2xl font-semibold text-gray-900">Data SLS - Updated SIPW 2025</h2>

			<!-- Filter Section -->
			<div class="mb-8 rounded-lg bg-gray-50 p-6">
				<h3 class="mb-4 text-lg font-medium text-gray-900">Filter Data</h3>

				<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
					<div>
						<label for="nmkab" class="mb-2 block text-sm font-medium text-gray-700">
							Kabupaten/Kota
						</label>
						<select
							id="nmkab"
							bind:value={selectedNmkab}
							class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						>
							<option value="">-- Pilih Kabupaten/Kota --</option>
							{#each nmkabOptions as kabupaten}
								<option value={kabupaten}>{kabupaten}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="nmkec" class="mb-2 block text-sm font-medium text-gray-700">
							Kecamatan
						</label>
						<select
							id="nmkec"
							bind:value={selectedNmkec}
							disabled={!nmkecOptions.length}
							class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
						>
							<option value="">-- Pilih Kecamatan --</option>
							{#each nmkecOptions as kecamatan}
								<option value={kecamatan}>{kecamatan}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="nmdesa" class="mb-2 block text-sm font-medium text-gray-700">
							Desa/Kelurahan
						</label>
						<select
							id="nmdesa"
							bind:value={selectedNmdesa}
							disabled={!nmdesaOptions.length}
							class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
						>
							<option value="">-- Pilih Desa/Kelurahan --</option>
							{#each nmdesaOptions as desa}
								<option value={desa}>{desa}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="flex gap-3">
					<button
						onclick={fetchSIPWData}
						disabled={isLoading || (!selectedNmkec && !selectedNmdesa)}
						class="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isLoading}
							<span class="flex items-center">
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
								Loading...
							</span>
						{:else}
							Tampilkan Data
						{/if}
					</button>

					<button
						onclick={resetFilters}
						disabled={isLoading}
						class="rounded-md bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						Reset
					</button>
				</div>

				{#if error}
					<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
						<div class="flex">
							<svg
								class="h-5 w-5 text-red-400"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
							<div class="ml-3">
								<p class="text-sm font-medium text-red-800">{error}</p>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Data Table -->
			{#if filteredData.length > 0}
				<div class="mb-4 flex items-center justify-between">
					<p class="text-sm text-gray-600">
						Menampilkan {filteredData.length} data SLS
						{#if selectedNmkab}
							dari Kabupaten/Kota {selectedNmkab}{/if}
						{#if selectedNmkec}, Kecamatan {selectedNmkec}{/if}
						{#if selectedNmdesa}, Desa {selectedNmdesa}{/if}
					</p>
				</div>

				<div class="overflow-x-auto rounded-lg border border-gray-200">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									ID SLS
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Kabupaten/Kota
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Kecamatan
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Desa/Kelurahan
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Nama SLS
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Kode SLS
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Wilayah Kerja
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Muatan Dominan
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each paginatedData() as item (item.idsubsls)}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
										{item.idsubsls}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
										{item.nmkab || '-'}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
										{item.nmkec || '-'}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
										{item.nmdesa || '-'}
									</td>
									<td class="px-6 py-4 text-sm text-gray-600">
										{item.nama_sls || '-'}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
										{item.kd_subsls || '-'}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
										{item.nama_wke || '-'}
									</td>
									<td class="px-6 py-4 text-sm text-gray-600">
										{getMuatanDominanName(item.muatan_dominan)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="mt-6 flex items-center justify-between">
						<div class="text-sm text-gray-600">
							Menampilkan {(currentPage - 1) * itemsPerPage + 1} hingga {Math.min(
								currentPage * itemsPerPage,
								filteredData.length
							)} dari {filteredData.length} data
						</div>
						<div class="flex gap-2">
							<button
								onclick={() => goToPage(currentPage - 1)}
								disabled={currentPage === 1}
								class="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Previous
							</button>

							{#each paginationNumbers() as page}
								<button
									onclick={() => goToPage(page)}
									class="rounded-md border px-3 py-1 text-sm {page === currentPage
										? 'border-blue-600 bg-blue-600 text-white'
										: 'border-gray-300 hover:bg-gray-50'}"
								>
									{page}
								</button>
							{/each}

							<button
								onclick={() => goToPage(currentPage + 1)}
								disabled={currentPage === totalPages}
								class="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Next
							</button>
						</div>
					</div>
				{/if}
			{:else if !isLoading && sipwData.length === 0 && (selectedNmkec || selectedNmdesa)}
				<div class="py-12 text-center">
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
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
						/>
					</svg>
					<p class="mt-2 text-sm text-gray-600">Tidak ada data SLS yang ditemukan</p>
					<p class="mt-1 text-xs text-gray-500">Coba ubah filter atau periksa koneksi Anda</p>
				</div>
			{:else if !isLoading && !selectedNmkec && !selectedNmdesa}
				<div class="py-12 text-center">
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
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
					<p class="mt-2 text-sm text-gray-600">
						Pilih filter Kecamatan atau Desa untuk menampilkan data
					</p>
					<p class="mt-1 text-xs text-gray-500">
						Gunakan filter di atas untuk memulai pencarian data SLS
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
