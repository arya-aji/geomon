// Dynamic Leaflet import for SSR compatibility
export default async function importLeaflet() {
	if (typeof window !== 'undefined') {
		const L = await import('leaflet');
		// Fix for default export in leaflet
		L.default = L.default || L;
		return L;
	}
	return {};
}