<script lang="ts">
	import { onMount } from 'svelte';

	type FRSItem = {
		id: number;
		idsls_before: string;
		nama_sls_before: string;
		idsls_after: string;
		nama_sls_after: string;
		ketua_sls: string;
		status: number;
		createdAt: string;
		updatedAt: string;
	};

	let frsData = $state<FRSItem[]>([]);
	let isLoading = $state(true); // Start with loading state
	let error = $state<string | null>(null);
	let selectedStatus = $state<number | null>(null); // Filter by status
	let searchQuery = $state(''); // Search query

	// Status type mapping
	const statusTypes: Record<number, string> = {
		1: 'Pemekaran SLS',
		2: 'Penggabungan SLS',
		3: 'Perubahan Jenis SLS',
		4: 'Perubahan Tingkatan SLS',
		5: 'Perubahan Kode SLS',
		6: 'Perubahan Ketua SLS/Perubahan Nama SLS'
	};

	// Table pagination
	let currentPage = $state(1);
	let itemsPerPage = 20;
	let totalPages = $derived(Math.ceil(getFilteredDataCount() / itemsPerPage));

	async function fetchFRSData() {
		isLoading = true;
		error = null;

		try {
			console.log('Fetching FRS data...');
			const response = await fetch('/api/frs-data');
			console.log('Response status:', response.status);
			if (!response.ok) throw new Error('Failed to fetch FRS data');

			const data = (await response.json()) as FRSItem[];
			console.log('Received FRS data:', data);
			console.log('Data type:', typeof data);
			console.log('Data length:', data.length);
			console.log('Is array?', Array.isArray(data));

			if (data && data.length > 0) {
				console.log('Sample first item:', data[0]);
			}

			frsData = data;
			currentPage = 1; // Reset to first page when new data is loaded

			console.log('frsData set to:', frsData.length);
			console.log('frsData type:', typeof frsData);
			console.log('frsData is array?', Array.isArray(frsData));
		} catch (err) {
			console.error('Error fetching FRS data:', err);
			error = 'Failed to load FRS data';
		} finally {
			isLoading = false;
			console.log(
				'Fetch completed. Final state - isLoading:',
				isLoading,
				'error:',
				error,
				'frsData.length:',
				frsData.length
			);
		}
	}

	// Helper function to get filtered and paginated data
	function getPaginatedData() {
		// Apply filters
		let filteredData = frsData;

		// Apply status filter
		if (selectedStatus !== null) {
			filteredData = filteredData.filter((item) => item.status === selectedStatus);
		}

		// Apply search filter
		if (searchQuery.trim() !== '') {
			const query = searchQuery.toLowerCase().trim();
			filteredData = filteredData.filter((item) => {
				return (
					// Search in ID SLS before
					(item.idsls_before && item.idsls_before.toLowerCase().includes(query)) ||
					// Search in ID SLS after
					(item.idsls_after && item.idsls_after.toLowerCase().includes(query)) ||
					// Search in nama SLS before
					(item.nama_sls_before && item.nama_sls_before.toLowerCase().includes(query)) ||
					// Search in nama SLS after
					(item.nama_sls_after && item.nama_sls_after.toLowerCase().includes(query)) ||
					// Search in ketua SLS
					(item.ketua_sls && item.ketua_sls.toLowerCase().includes(query))
				);
			});
		}

		// Apply pagination
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return filteredData.slice(start, end);
	}

	// Get total filtered data count for pagination
	function getFilteredDataCount() {
		let filteredData = frsData;

		// Apply status filter
		if (selectedStatus !== null) {
			filteredData = filteredData.filter((item) => item.status === selectedStatus);
		}

		// Apply search filter
		if (searchQuery.trim() !== '') {
			const query = searchQuery.toLowerCase().trim();
			filteredData = filteredData.filter((item) => {
				return (
					(item.idsls_before && item.idsls_before.toLowerCase().includes(query)) ||
					(item.idsls_after && item.idsls_after.toLowerCase().includes(query)) ||
					(item.nama_sls_before && item.nama_sls_before.toLowerCase().includes(query)) ||
					(item.nama_sls_after && item.nama_sls_after.toLowerCase().includes(query)) ||
					(item.ketua_sls && item.ketua_sls.toLowerCase().includes(query))
				);
			});
		}

		return filteredData.length;
	}

	// Reset to page 1 when filter changes
	$effect(() => {
		currentPage = 1;
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
			for (let i = 1; i <= totalPages; i++) {
				numbers.push(i);
			}
		} else {
			let start = Math.max(1, currentPage - 2);
			let end = Math.min(totalPages, start + maxVisible - 1);

			if (end - start + 1 < maxVisible) {
				start = Math.max(1, end - maxVisible + 1);
			}

			for (let i = start; i <= end; i++) {
				numbers.push(i);
			}
		}

		return numbers;
	});

	function getStatusColor(status: number): string {
		switch (status) {
			case 1:
				return 'bg-blue-100 text-blue-800'; // Pemekaran
			case 2:
				return 'bg-red-100 text-red-800'; // Penggabungan
			case 3:
				return 'bg-yellow-100 text-yellow-800'; // Perubahan Jenis
			case 4:
				return 'bg-purple-100 text-purple-800'; // Perubahan Tingkatan
			case 5:
				return 'bg-green-100 text-green-800'; // Perubahan Kode
			case 6:
				return 'bg-orange-100 text-orange-800'; // Perubahan Ketua/Nama
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusIcon(status: number): string {
		switch (status) {
			case 1:
				return '➕'; // Pemekaran (addition)
			case 2:
				return '🔗'; // Penggabungan (merge)
			case 3:
				return '🔄'; // Perubahan Jenis (type change)
			case 4:
				return '⬆️'; // Perubahan Tingkatan (level up/down)
			case 5:
				return '🏷️'; // Perubahan Kode (code change)
			case 6:
				return '✏️'; // Perubahan Ketua/Nama (name change)
			default:
				return '❓';
		}
	}

	onMount(() => {
		fetchFRSData();
	});
</script>

<svelte:head>
	<title>GEOMON - Perubahan SLS</title>
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
					class="rounded-r-lg border-l border-gray-200 bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors"
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
			<h2 class="mb-6 text-2xl font-semibold text-gray-900">
				Perubahan SLS (Sensus Lingkungan Sementara)
			</h2>

			<!-- Status Legend -->
			<div class="mb-6 rounded-lg bg-blue-50 p-4">
				<h3 class="mb-3 text-sm font-medium text-blue-900">Legenda Status Perubahan:</h3>
				<div class="grid grid-cols-2 gap-2 text-xs md:grid-cols-3 lg:grid-cols-6">
					{#each Object.entries(statusTypes) as [status, label]}
						<div class="flex items-center space-x-1">
							<span class="text-lg">{getStatusIcon(parseInt(status))}</span>
							<span class="font-medium">{label}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Search Bar -->
			<div class="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
					<div class="flex-1">
						<label for="search-input" class="mb-2 block text-sm font-medium text-gray-700">
							Cari Perubahan SLS:
						</label>
						<div class="relative">
							<input
								type="text"
								id="search-input"
								bind:value={searchQuery}
								placeholder="Cari berdasarkan ID SLS, Nama SLS, atau Ketua SLS..."
								class="w-full rounded-md border border-gray-300 px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
							<div class="absolute inset-y-0 right-0 flex items-center pr-3">
								<svg
									class="h-4 w-4 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									></path>
								</svg>
							</div>
						</div>
						{#if searchQuery.trim() !== ''}
							<p class="mt-2 text-xs text-gray-500">
								Menampilkan hasil untuk: <span class="font-medium">{searchQuery}</span>
							</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Status Filter -->
			<div class="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<label for="status-filter" class="mb-2 block text-sm font-medium text-gray-700 sm:mb-0">
							Filter Status:
						</label>
					</div>
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							onclick={() => (selectedStatus = null)}
							class="rounded-md px-4 py-2 text-sm font-medium {selectedStatus === null
								? 'bg-blue-600 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors"
						>
							Semua Status
						</button>
						{#each Object.entries(statusTypes) as [status, label]}
							<button
								type="button"
								onclick={() => (selectedStatus = parseInt(status))}
								class="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium {selectedStatus ===
								parseInt(status)
									? 'bg-blue-600 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors"
							>
								<span>{getStatusIcon(parseInt(status))}</span>
								<span>{label}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Data Table -->

			{#if isLoading}
				<div class="py-12 text-center">
					<div
						class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
					></div>
					<p class="mt-4 text-sm text-gray-600">Memuat data...</p>
					<p class="mt-2 text-xs text-gray-500">Mengambil {frsData.length} data perubahan SLS...</p>
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
					<p class="mt-2 text-sm text-gray-600">Terjadi kesalahan: {error}</p>
				</div>
			{:else if frsData.length > 0}
				<div class="mb-4 flex items-center justify-between">
					<p class="text-sm text-gray-600">
						Menampilkan {getPaginatedData().length} dari {getFilteredDataCount()} perubahan SLS
						{selectedStatus !== null || searchQuery.trim() !== ''
							? `(Filter: ${selectedStatus !== null ? statusTypes[selectedStatus] : ''}${searchQuery.trim() !== '' ? (selectedStatus !== null ? ', ' : '') + `Pencarian: "${searchQuery}"` : ''})`
							: ''}
					</p>
				</div>

				<div class="overflow-x-auto rounded-lg border border-gray-200">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Status
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									ID SLS Sebelum
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Nama SLS Sebelum
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									ID SLS Sesudah
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Nama SLS Sesudah
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Ketua SLS
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									Tanggal Perubahan
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each getPaginatedData() as item (item.id)}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 text-sm whitespace-nowrap">
										<div class="flex items-center space-x-2">
											<span class="text-lg">{getStatusIcon(item.status)}</span>
											<span
												class="inline-flex rounded-full px-2 py-1 text-xs font-medium {getStatusColor(
													item.status
												)}"
											>
												{statusTypes[item.status]}
											</span>
										</div>
									</td>
									<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
										{item.idsls_before || '-'}
										{#if item.status === 2}
											<span class="ml-2 text-xs font-normal text-red-600">(akan dihapus)</span>
										{/if}
									</td>
									<td class="px-6 py-4 text-sm text-gray-600">
										{item.nama_sls_before || '-'}
									</td>
									<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
										{item.idsls_after || '-'}
									</td>
									<td class="px-6 py-4 text-sm text-gray-600">
										{item.nama_sls_after || '-'}
									</td>
									<td class="px-6 py-4 text-sm text-gray-600">
										{item.ketua_sls || '-'}
									</td>
									<td class="px-6 py-4 text-sm text-gray-600">
										{new Date(item.createdAt).toLocaleDateString('id-ID')}
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
								getFilteredDataCount()
							)} dari {getFilteredDataCount()} data
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
			{:else}
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
					<p class="mt-2 text-sm text-gray-600">Tidak ada data perubahan yang ditemukan</p>
					<p class="mt-1 text-xs text-gray-500">Coba ubah filter atau periksa koneksi Anda</p>
				</div>
			{/if}
		</div>
	</div>
</div>
