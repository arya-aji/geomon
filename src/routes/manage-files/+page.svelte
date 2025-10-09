<script lang="ts">
	import { onMount } from 'svelte';

	let files: any[] = [];
	let groupedFiles: any = {};
	let isLoading = true;
	let error: string | null = null;
	let selectedFile: any = null;
	let showVersions = false;
	let versions: any[] = [];
	let revisions: any[] = [];

	function groupFilesByKecamatanAndDesa(filesList: any[]) {
		const grouped: any = {};

		filesList.forEach(file => {
			const kecamatanName = file.kecamatanName || 'Unknown Kecamatan';
			const desaName = file.desaaName || 'Unknown Desa';

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

	async function fetchFiles() {
		try {
			const response = await fetch('/api/save-geojson?userId=anonymous');
			const result = await response.json();

			if (result.success) {
				files = result.files;
				groupedFiles = groupFilesByKecamatanAndDesa(files);
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

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString('id-ID');
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
			<h2 class="mb-6 text-2xl font-semibold text-gray-900">Manage Saved GeoJSON Files</h2>

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
			{:else}
				<div class="space-y-6">
					{#each Object.entries(groupedFiles) as [kecamatanName, desaGroups] (kecamatanName)}
						<div class="rounded-lg border border-gray-200 bg-white">
							<div class="border-b border-gray-200 bg-gray-50 px-4 py-3">
								<h3 class="text-lg font-semibold text-gray-900">
									<svg class="inline-block h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
									</svg>
									{kecamatanName}
								</h3>
							</div>
							<div class="divide-y divide-gray-200">
								{#each Object.entries(desaGroups as any) as [desaName, desaFiles] (desaName)}
									<div class="p-4">
										<h4 class="text-sm font-medium text-gray-700 mb-3">
											<svg class="inline-block h-4 w-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
											</svg>
											{desaName}
										</h4>
										<div class="space-y-2 ml-5">
											{#each desaFiles as file (file.id)}
												<div class="rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
													<div class="flex items-center justify-between">
														<div class="flex-1">
															<div class="flex items-center space-x-3">
																<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
																	<svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
																	</svg>
																</div>
																<div>
																	<h5 class="text-sm font-medium text-gray-900">{file.districtName}</h5>
																	<p class="text-xs text-gray-500">
																		File: {file.originalFilename} • Version: {file.currentVersionNumber}
																		• Updated: {formatDate(file.updatedAt)}
																	</p>
																</div>
															</div>
														</div>
														<button
															on:click={() => fetchVersions(file.id)}
															class="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200"
														>
															View Versions
														</button>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Version History Modal -->
			{#if showVersions && selectedFile}
				<div class="fixed inset-0 z-50 overflow-y-auto">
					<div
						class="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0"
					>
						<div
							class="bg-opacity-75 fixed inset-0 bg-gray-500 transition-opacity"
							on:click={() => (showVersions = false)}
						></div>

						<div
							class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle"
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
											{/each}
										</div>
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
