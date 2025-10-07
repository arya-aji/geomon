<script lang="ts">
</script>

<svelte:head>
	<title>GEOMON - Monitoring</title>
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
					class="border-l border-gray-200 bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors"
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
					class="rounded-r-lg border-l border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Perubahan
				</a>
			</div>
		</nav>
	</header>

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl">
		<div class="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
			<svg
				class="mx-auto mb-6 h-24 w-24 text-gray-400"
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
			<h2 class="mb-4 text-2xl font-semibold text-gray-900">Monitoring</h2>
			<p class="mx-auto max-w-md text-gray-600">
				Halaman monitoring sedang dalam pengembangan. Fitur ini akan segera tersedia untuk memantau
				status dan progres geospasial secara real-time.
			</p>
			<div class="mt-8">
				<a
					href="/"
					class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
				>
					Kembali ke Pengecekan
				</a>
			</div>
		</div>
	</div>
</div>
