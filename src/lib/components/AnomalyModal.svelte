<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;
  export let anomalies: any[] = [];

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-[9999] flex items-center justify-center"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && closeModal()}
  >
    <!-- Animated black backdrop -->
    <div
      class="absolute inset-0 bg-black"
      style="opacity: 0.5; animation: fadeIn 0.3s ease-out;"
    ></div>

    <!-- Modal content -->
    <div
      class="relative bg-white rounded-xl shadow-2xl max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden"
      style="animation: slideUp 0.3s ease-out;"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-2xl font-bold text-gray-900">All Detected Anomalies</h2>
          <button
            on:click={closeModal}
            class="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
            aria-label="Close modal"
          >
            <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <p class="mt-2 text-sm text-gray-600">
          Total anomalies detected: <span class="font-semibold text-red-600">{anomalies.length}</span>
        </p>
      </div>

      <!-- Anomalies list -->
      <div class="px-6 py-4 overflow-y-auto max-h-[60vh]">
        {#if anomalies.length === 0}
          <div class="text-center py-12">
            <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900">No anomalies detected</h3>
            <p class="mt-2 text-sm text-gray-600">Upload GeoJSON data to start monitoring for anomalies</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each anomalies as anomaly, index (anomaly.idsubsls)}
              <div
                class="p-4 rounded-lg border-2 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                class:bg-red-50={anomaly.severity === 'High'}
                class:bg-yellow-50={anomaly.severity === 'Medium'}
                class:bg-blue-50={anomaly.severity === 'Low'}
                class:border-red-200={anomaly.severity === 'High'}
                class:border-yellow-200={anomaly.severity === 'Medium'}
                class:border-blue-200={anomaly.severity === 'Low'}
                style="animation: slideIn 0.3s ease-out {index * 0.1}s both;"
              >
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0">
                    <div
                      class="w-10 h-10 rounded-full flex items-center justify-center"
                      class:bg-red-500={anomaly.severity === 'High'}
                      class:bg-yellow-500={anomaly.severity === 'Medium'}
                      class:bg-blue-500={anomaly.severity === 'Low'}
                    >
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <h3
                      class="text-sm font-semibold truncate"
                      class:text-red-900={anomaly.severity === 'High'}
                      class:text-yellow-900={anomaly.severity === 'Medium'}
                      class:text-blue-900={anomaly.severity === 'Low'}
                    >
                      {anomaly.title || `Anomaly ${anomaly.idsubsls}`}
                    </h3>
                    <p
                      class="text-xs mt-1"
                      class:text-red-700={anomaly.severity === 'High'}
                      class:text-yellow-700={anomaly.severity === 'Medium'}
                      class:text-blue-700={anomaly.severity === 'Low'}
                    >
                      🆔 ID: {anomaly.idsubsls}
                    </p>
                    {#if anomaly.coordinates}
                      <p
                        class="text-xs mt-1"
                        class:text-red-700={anomaly.severity === 'High'}
                        class:text-yellow-700={anomaly.severity === 'Medium'}
                        class:text-blue-700={anomaly.severity === 'Low'}
                      >
                        📍 {anomaly.coordinates}
                      </p>
                    {/if}
                    <div class="mt-2 flex items-center space-x-4">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        class:bg-red-100={anomaly.severity === 'High'}
                        class:bg-yellow-100={anomaly.severity === 'Medium'}
                        class:bg-blue-100={anomaly.severity === 'Low'}
                        class:text-red-800={anomaly.severity === 'High'}
                        class:text-yellow-800={anomaly.severity === 'Medium'}
                        class:text-blue-800={anomaly.severity === 'Low'}
                      >
                        Severity: {anomaly.severity}
                      </span>
                      <span class="text-xs text-gray-500">
                        🕐 {anomaly.detectedAt || 'Just now'}
                      </span>
                    </div>
                    {#if anomaly.description}
                      <p class="text-xs text-gray-600 mt-2">{anomaly.description}</p>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-600">
            💡 Click on any anomaly to view details on the map
          </p>
          <button
            on:click={closeModal}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>

  <style>
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 0.5;
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  </style>
{/if}