<script lang="ts">
</script>

<svelte:head>
	<title>GEOMON - Monitoring</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8">
	<!-- Header -->
	<header class="mb-8 text-center">
		<h1 class="mb-2 text-6xl font-bold text-gray-900">GEOMON</h1>
		<p class="text-xl text-gray-600 mb-6">Geospasial Monitoring</p>

		<!-- Navigation Menu -->
		<nav class="flex justify-center">
			<div class="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
				<a
					href="/pengecekan"
					class="px-6 py-3 text-sm font-medium rounded-l-lg text-gray-700 hover:bg-gray-50 transition-colors"
				>
					Pengecekan
				</a>
				<a
					href="/monitoring"
					class="px-6 py-3 text-sm font-medium bg-blue-600 text-white transition-colors border-l border-gray-200"
				>
					Monitoring
				</a>
				<a
					href="/data-sls"
					class="px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border-l border-gray-200 rounded-r-lg"
				>
					Data SLS
				</a>
			</div>
		</nav>
	</header>

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl">
		<div class="rounded-lg border border-gray-200 bg-white p-12 shadow-sm text-center">
			<svg
				class="mx-auto h-24 w-24 text-gray-400 mb-6"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
				/>
			</svg>
			<h2 class="text-2xl font-semibold text-gray-900 mb-4">Monitoring</h2>
			<p class="text-gray-600 max-w-md mx-auto">
				Halaman monitoring sedang dalam pengembangan. Fitur ini akan segera tersedia untuk memantau status dan progres geospasial secara real-time.
			</p>
			<div class="mt-8">
				<a
					href="/pengecekan"
					class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					Kembali ke Pengecekan
				</a>
			</div>
		</div>
	</div>
</div>