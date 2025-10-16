import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { processedGeojson, geojsonVersions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET({ url }: { url: URL }) {
  try {
    const districtName = url.searchParams.get('district');
    const kecamatanName = url.searchParams.get('kecamatan');

    if (!districtName || !kecamatanName) {
      return error(400, 'Both district and kecamatan names are required');
    }

    // Find file by kecamatan and district names
    const files = await db
      .select({
        id: processedGeojson.id,
        originalFilename: processedGeojson.originalFilename,
        currentVersionId: processedGeojson.currentVersionId,
        kecamatanName: processedGeojson.kecamatanName,
        districtName: processedGeojson.districtName,
        idkel: processedGeojson.idkel
      })
      .from(processedGeojson)
      .where(
        and(
          eq(processedGeojson.kecamatanName, kecamatanName),
          eq(processedGeojson.districtName, districtName),
          eq(processedGeojson.isActive, true)
        )
      )
      .limit(1);

    let fileRecord = null;

    if (files.length > 0) {
      fileRecord = files[0];
    }

    if (!fileRecord) {
      return error(404, 'No GeoJSON file found for the specified area');
    }

    // Get the current version data
    const versionData = await db
      .select({
        geojsonData: geojsonVersions.geojsonData,
        versionNumber: geojsonVersions.versionNumber
      })
      .from(geojsonVersions)
      .where(eq(geojsonVersions.id, fileRecord.currentVersionId!))
      .limit(1);

    if (versionData.length === 0) {
      return error(404, 'Version data not found');
    }

    const geojsonContent = versionData[0].geojsonData;
    const safeDistrictName = fileRecord.districtName?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
    const safeKecamatanName = fileRecord.kecamatanName?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
    const filename = fileRecord.originalFilename || `geojson_${safeKecamatanName}_${safeDistrictName}.json`;

    // Return the GeoJSON file for download
    return new Response(JSON.stringify(geojsonContent, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (err) {
    console.error('Error downloading GeoJSON:', err);
    return error(500, 'Internal server error');
  }
}