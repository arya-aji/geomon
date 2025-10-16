import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { processedGeojson, geojsonVersions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import JSZip from 'jszip';

export async function GET({ url }: { url: URL }) {
  try {
    // Get query parameters
    const onlyWithFiles = url.searchParams.get('onlyWithFiles') === 'true';
    const includeVersions = url.searchParams.get('includeVersions') === 'true';

    // Get all files from processed_geojson table
    const files = await db
      .select({
        id: processedGeojson.id,
        originalFilename: processedGeojson.originalFilename,
        districtName: processedGeojson.districtName,
        kecamatanName: processedGeojson.kecamatanName,
        kabupatenName: processedGeojson.kabupatenName,
        currentVersionId: processedGeojson.currentVersionId,
        currentVersionNumber: processedGeojson.currentVersionNumber,
        updatedAt: processedGeojson.updatedAt,
        isActive: processedGeojson.isActive
      })
      .from(processedGeojson)
      .where(eq(processedGeojson.isActive, true))
      .orderBy(processedGeojson.kecamatanName, processedGeojson.districtName);

    if (files.length === 0) {
      return error(404, 'No files found');
    }

    // Filter files if requested
    let filteredFiles = files;
    if (onlyWithFiles) {
      // Only include files that have actual data (not just SIPW references)
      filteredFiles = files.filter(file => file.originalFilename && file.currentVersionId);
    }

    // Create ZIP file
    const zip = new JSZip();
    const currentDate = new Date();
    const dateStr = `${String(currentDate.getDate()).padStart(2, '0')}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getFullYear()).slice(-2)}`;

    // Main folder for all kecamatan data
    const mainFolder = zip.folder(`geomon_all_kecamatan_${dateStr}`);

    if (!mainFolder) {
      return error(500, 'Failed to create ZIP folder');
    }

    // Group files by kecamatan
    const filesByKecamatan = filteredFiles.reduce((acc, file) => {
      const kecamatan = file.kecamatanName || 'Unknown_Kecamatan';
      if (!acc[kecamatan]) {
        acc[kecamatan] = [];
      }
      acc[kecamatan].push(file);
      return acc;
    }, {} as Record<string, typeof filteredFiles>);

    // Create summary data
    const summary = {
      downloadInfo: {
        downloadDate: currentDate.toISOString(),
        totalKecamatan: Object.keys(filesByKecamatan).length,
        totalFiles: filteredFiles.length,
        onlyWithFiles: onlyWithFiles,
        includeVersions: includeVersions,
        dateFormat: 'DDMMYY'
      },
      kecamatanSummary: {} as Record<string, any>
    };

    // Process each kecamatan
    for (const [kecamatanName, kecamatanFiles] of Object.entries(filesByKecamatan)) {
      const safeKecamatanName = kecamatanName.replace(/[^a-zA-Z0-9]/g, '_');
      const kecamatanFolder = mainFolder.folder(safeKecamatanName);

      if (!kecamatanFolder) continue;

      // Add kecamatan summary
      summary.kecamatanSummary[kecamatanName] = {
        totalFiles: kecamatanFiles.length,
        files: kecamatanFiles.map(f => ({
          id: f.id,
          districtName: f.districtName,
          originalFilename: f.originalFilename,
          currentVersionNumber: f.currentVersionNumber,
          updatedAt: f.updatedAt
        }))
      };

      // Process each file in the kecamatan
      for (const file of kecamatanFiles) {
        if (!file.originalFilename || !file.currentVersionId) continue;

        const safeDistrictName = file.districtName?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
        const districtFolder = kecamatanFolder.folder(safeDistrictName);

        if (!districtFolder) continue;

        // Get current version data
        const currentVersion = await db
          .select({
            geojsonData: geojsonVersions.geojsonData,
            versionNumber: geojsonVersions.versionNumber,
            createdAt: geojsonVersions.createdAt,
            createdBy: geojsonVersions.createdBy
          })
          .from(geojsonVersions)
          .where(eq(geojsonVersions.id, file.currentVersionId!))
          .limit(1);

        if (currentVersion.length > 0) {
          // Add current version
          const currentFilename = `${file.originalFilename}`;
          districtFolder.file(currentFilename, JSON.stringify(currentVersion[0].geojsonData, null, 2));

          // If includeVersions is true, get all versions
          if (includeVersions) {
            const versionsFolder = districtFolder.folder('all_versions');

            if (versionsFolder) {
              // Get all versions for this file
              const allVersions = await db
                .select({
                  versionNumber: geojsonVersions.versionNumber,
                  geojsonData: geojsonVersions.geojsonData,
                  createdAt: geojsonVersions.createdAt,
                  createdBy: geojsonVersions.createdBy
                })
                .from(geojsonVersions)
                .where(eq(geojsonVersions.fileId, file.id))
                .orderBy(geojsonVersions.versionNumber);

              allVersions.forEach((version) => {
                const versionFilename = `version_${version.versionNumber}.geojson`;
                versionsFolder.file(versionFilename, JSON.stringify(version.geojsonData, null, 2));
              });

              // Add version info file
              const versionInfo = {
                file: {
                  id: file.id,
                  originalFilename: file.originalFilename,
                  districtName: file.districtName,
                  kecamatanName: file.kecamatanName,
                  currentVersionNumber: file.currentVersionNumber
                },
                versions: allVersions.map(v => ({
                  versionNumber: v.versionNumber,
                  createdAt: v.createdAt,
                  createdBy: v.createdBy,
                  filename: `version_${v.versionNumber}.geojson`
                }))
              };
              versionsFolder.file('version_info.json', JSON.stringify(versionInfo, null, 2));
            }
          }

          // Add file metadata
          const fileMetadata = {
            id: file.id,
            originalFilename: file.originalFilename,
            districtName: file.districtName,
            kecamatanName: file.kecamatanName,
            kabupatenName: file.kabupatenName,
            currentVersionNumber: file.currentVersionNumber,
            updatedAt: file.updatedAt,
            downloadInfo: {
              downloadedAt: currentDate.toISOString(),
              includeVersions: includeVersions
            }
          };
          districtFolder.file('metadata.json', JSON.stringify(fileMetadata, null, 2));
        }
      }
    }

    // Add main summary file
    mainFolder.file('download_summary.json', JSON.stringify(summary, null, 2));

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: 'uint8array' });
    const zipFilename = `geomon_all_kecamatan_${dateStr}.zip`;

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`
      }
    });

  } catch (err) {
    console.error('Error downloading all kecamatan data:', err);
    return error(500, 'Internal server error');
  }
}