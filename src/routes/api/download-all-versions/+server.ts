import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { processedGeojson, geojsonVersions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import JSZip from 'jszip';

export async function GET({ url }: { url: URL }) {
  try {
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      return error(400, 'fileId is required');
    }

    // Get the file information
    const files = await db
      .select({
        id: processedGeojson.id,
        originalFilename: processedGeojson.originalFilename,
        districtName: processedGeojson.districtName,
        kecamatanName: processedGeojson.kecamatanName,
        updatedAt: processedGeojson.updatedAt
      })
      .from(processedGeojson)
      .where(eq(processedGeojson.id, parseInt(fileId)))
      .limit(1);

    if (files.length === 0) {
      return error(404, 'File not found');
    }

    const file = files[0];

    // Get all versions for this file
    const versions = await db
      .select({
        id: geojsonVersions.id,
        versionNumber: geojsonVersions.versionNumber,
        geojsonData: geojsonVersions.geojsonData,
        createdAt: geojsonVersions.createdAt,
        createdBy: geojsonVersions.createdBy
      })
      .from(geojsonVersions)
      .where(eq(geojsonVersions.fileId, parseInt(fileId)))
      .orderBy(geojsonVersions.versionNumber);

    if (versions.length === 0) {
      return error(404, 'No versions found for this file');
    }

    // Format the date from updatedAt (DDMMYY format)
    const updateDate = new Date(file.updatedAt);
    const day = String(updateDate.getDate()).padStart(2, '0');
    const month = String(updateDate.getMonth() + 1).padStart(2, '0');
    const year = String(updateDate.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`;

    // Create a safe kelurahan name for filename
    const safeKelurahanName = file.districtName?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
    const zipFilename = `${safeKelurahanName}_${dateStr}.zip`;

    // Create a new ZIP file
    const zip = new JSZip();

    // Create a folder for the file
    const fileFolder = zip.folder(`${safeKelurahanName}_versions`);

    if (!fileFolder) {
      return error(500, 'Failed to create ZIP folder');
    }

    // Add each version as a separate GeoJSON file
    versions.forEach((version) => {
      const versionFilename = `version_${version.versionNumber}.geojson`;
      const versionContent = JSON.stringify(version.geojsonData, null, 2);
      fileFolder.file(versionFilename, versionContent);
    });

    // Add a summary file with metadata
    const summaryData = {
      file: {
        id: file.id,
        originalFilename: file.originalFilename,
        districtName: file.districtName,
        kecamatanName: file.kecamatanName,
        updatedAt: file.updatedAt
      },
      versions: versions.map(v => ({
        versionNumber: v.versionNumber,
        createdAt: v.createdAt,
        createdBy: v.createdBy,
        filename: `version_${v.versionNumber}.geojson`
      })),
      downloadInfo: {
        downloadDate: new Date().toISOString(),
        totalVersions: versions.length,
        dateFormat: 'DDMMYY'
      }
    };

    fileFolder.file('info.json', JSON.stringify(summaryData, null, 2));

    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

    // Return the ZIP file as response
    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`
      }
    });

  } catch (err) {
    console.error('Error downloading all versions:', err);
    return error(500, 'Internal server error');
  }
}