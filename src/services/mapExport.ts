// Map Export Service - Handles PNG, JPEG, and PDF export of hex maps

import { jsPDF } from 'jspdf';
import type { Campaign } from '../types';
import type {
  MapExportOptions,
  PaperSize,
  PageOrientation
} from '../types/MapExport';
import {
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_PRESETS,
  PAPER_DIMENSIONS as paperDims
} from '../types/MapExport';
import {
  createRenderConfig,
  calculateExportDimensions,
  renderExportCanvas
} from './hexRenderer';
import { canvasSize } from './hexGeometry';

// Re-export for convenience
export { DEFAULT_EXPORT_OPTIONS, EXPORT_PRESETS };

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert Blob to base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert canvas to Blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement, format: 'png' | 'jpeg', quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality
    );
  });
}

/**
 * Get page dimensions in mm for a paper size and orientation
 */
export function getPageDimensions(
  paperSize: PaperSize,
  orientation: PageOrientation
): { width: number; height: number } {
  const dims = paperDims[paperSize];
  if (orientation === 'landscape') {
    return { width: dims.height, height: dims.width };
  }
  return dims;
}

/**
 * Estimate file size for an export (rough approximation)
 */
export function estimateFileSize(
  campaign: Campaign,
  options: MapExportOptions
): { min: string; max: string } {
  const baseSize = canvasSize(campaign.gridWidth, campaign.gridHeight);
  const pixels = baseSize.width * baseSize.height * options.scale * options.scale;

  // Rough estimates based on format and compression
  let bytesPerPixel: { min: number; max: number };

  switch (options.format) {
    case 'png':
      bytesPerPixel = { min: 0.5, max: 2 };
      break;
    case 'jpeg':
      bytesPerPixel = { min: 0.1, max: 0.5 };
      break;
    case 'pdf':
      bytesPerPixel = { min: 0.3, max: 1.5 };
      break;
    default:
      bytesPerPixel = { min: 0.5, max: 2 };
  }

  const minBytes = pixels * bytesPerPixel.min;
  const maxBytes = pixels * bytesPerPixel.max;

  return {
    min: formatBytes(minBytes),
    max: formatBytes(maxBytes)
  };
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export campaign map as an image (PNG or JPEG)
 */
export async function exportAsImage(
  campaign: Campaign,
  options: MapExportOptions
): Promise<Blob> {
  // Create render config
  const config = createRenderConfig(options);

  // Calculate dimensions
  const dims = calculateExportDimensions(campaign, options);

  // Create offscreen canvas at scaled resolution
  const canvas = document.createElement('canvas');
  canvas.width = dims.width * options.scale;
  canvas.height = dims.height * options.scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Scale context for high-DPI export
  ctx.scale(options.scale, options.scale);

  // Render the map
  renderExportCanvas(ctx, campaign, options, config);

  // Convert to blob
  return canvasToBlob(
    canvas,
    options.format === 'jpeg' ? 'jpeg' : 'png',
    options.quality
  );
}

/**
 * Export campaign map as PDF
 */
export async function exportAsPDF(
  campaign: Campaign,
  options: MapExportOptions
): Promise<Blob> {
  // Get page dimensions
  const pageDims = getPageDimensions(options.paperSize, options.orientation);
  const printableWidth = pageDims.width - options.margins * 2;
  const printableHeight = pageDims.height - options.margins * 2;

  // Calculate map dimensions
  const mapDims = calculateExportDimensions(campaign, options);

  // Create PDF document
  const pdf = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.paperSize
  });

  if (options.pageMode === 'fit-to-page') {
    // Scale map to fit on one page
    const scaleX = printableWidth / mapDims.width;
    const scaleY = printableHeight / mapDims.height;
    const scale = Math.min(scaleX, scaleY);

    // Calculate optimal scale multiplier for resolution
    // We want at least 150 DPI for print quality
    const dpi = 150;
    const mmToInch = 25.4;
    const targetPixelWidth = (printableWidth / mmToInch) * dpi;
    const canvasScale = Math.max(1, Math.ceil(targetPixelWidth / mapDims.width));

    // Generate image with calculated scale
    const imageOptions = { ...options, scale: canvasScale, format: 'png' as const };
    const imageBlob = await exportAsImage(campaign, imageOptions);
    const imageData = await blobToDataURL(imageBlob);

    // Calculate centered position
    const scaledWidth = mapDims.width * scale;
    const scaledHeight = mapDims.height * scale;
    const x = options.margins + (printableWidth - scaledWidth) / 2;
    const y = options.margins + (printableHeight - scaledHeight) / 2;

    // Add image to PDF
    pdf.addImage(imageData, 'PNG', x, y, scaledWidth, scaledHeight);
  } else {
    // Multi-page tiling
    await exportAsPDFMultiPage(pdf, campaign, options, pageDims, printableWidth, printableHeight, mapDims);
  }

  // Return as blob
  return pdf.output('blob');
}

/**
 * Multi-page PDF export for large maps
 */
async function exportAsPDFMultiPage(
  pdf: jsPDF,
  campaign: Campaign,
  options: MapExportOptions,
  pageDims: { width: number; height: number },
  printableWidth: number,
  printableHeight: number,
  mapDims: { width: number; height: number; mapWidth: number; mapHeight: number; offsetX: number; offsetY: number }
): Promise<void> {
  // Calculate how many pages we need
  // Use 1:1 scale (1 pixel = 0.264583mm at 96 DPI)
  const mmPerPixel = 0.264583;
  const mapWidthMM = mapDims.width * mmPerPixel;
  const mapHeightMM = mapDims.height * mmPerPixel;

  const pagesX = Math.ceil(mapWidthMM / printableWidth);
  const pagesY = Math.ceil(mapHeightMM / printableHeight);

  // Generate high-res image
  const imageOptions = { ...options, scale: 2, format: 'png' as const };
  const imageBlob = await exportAsImage(campaign, imageOptions);
  const imageData = await blobToDataURL(imageBlob);

  // Calculate tile dimensions
  const tileWidthMM = printableWidth;
  const tileHeightMM = printableHeight;

  for (let py = 0; py < pagesY; py++) {
    for (let px = 0; px < pagesX; px++) {
      // Add new page (except for first)
      if (px > 0 || py > 0) {
        pdf.addPage();
      }

      // Calculate source crop region (in mm of the original image)
      const srcX = px * tileWidthMM;
      const srcY = py * tileHeightMM;

      // Position the full image so only the tile portion is visible on this page
      const totalWidth = mapWidthMM;
      const totalHeight = mapHeightMM;

      const offsetX = -srcX + options.margins;
      const offsetY = -srcY + options.margins;

      pdf.addImage(imageData, 'PNG', offsetX, offsetY, totalWidth, totalHeight);

      // Add page label
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      const pageLabel = `Page ${py * pagesX + px + 1} of ${pagesX * pagesY}`;
      pdf.text(pageLabel, pageDims.width - options.margins, pageDims.height - 5, { align: 'right' });

      // Add assembly guides (crop marks at corners)
      pdf.setDrawColor(128, 128, 128);
      pdf.setLineWidth(0.1);

      // Top-left corner mark
      pdf.line(options.margins - 3, options.margins, options.margins, options.margins);
      pdf.line(options.margins, options.margins - 3, options.margins, options.margins);

      // Top-right corner mark
      const rightEdge = pageDims.width - options.margins;
      pdf.line(rightEdge + 3, options.margins, rightEdge, options.margins);
      pdf.line(rightEdge, options.margins - 3, rightEdge, options.margins);

      // Bottom-left corner mark
      const bottomEdge = pageDims.height - options.margins;
      pdf.line(options.margins - 3, bottomEdge, options.margins, bottomEdge);
      pdf.line(options.margins, bottomEdge + 3, options.margins, bottomEdge);

      // Bottom-right corner mark
      pdf.line(rightEdge + 3, bottomEdge, rightEdge, bottomEdge);
      pdf.line(rightEdge, bottomEdge + 3, rightEdge, bottomEdge);
    }
  }
}

/**
 * Convert Blob to data URL for jsPDF
 */
async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ============================================================================
// Preview Generation
// ============================================================================

/**
 * Generate a preview canvas at reduced scale
 */
export function generatePreview(
  campaign: Campaign,
  options: MapExportOptions,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  // Calculate preview dimensions
  const mapDims = calculateExportDimensions(campaign, options);

  // Calculate scale to fit in preview area
  const scaleX = maxWidth / mapDims.width;
  const scaleY = maxHeight / mapDims.height;
  const previewScale = Math.min(scaleX, scaleY, 1); // Don't scale up

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(mapDims.width * previewScale);
  canvas.height = Math.floor(mapDims.height * previewScale);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas;
  }

  // Scale context
  ctx.scale(previewScale, previewScale);

  // Create render config
  const config = createRenderConfig(options);

  // Render at preview scale
  renderExportCanvas(ctx, campaign, options, config);

  return canvas;
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export the map with the given options
 * Returns the blob ready for saving
 */
export async function exportMap(
  campaign: Campaign,
  options: MapExportOptions
): Promise<Blob> {
  if (options.format === 'pdf') {
    return exportAsPDF(campaign, options);
  }
  return exportAsImage(campaign, options);
}

/**
 * Export and save the map to a file
 * Uses Electron IPC to show save dialog and write file
 */
export async function exportAndSave(
  campaign: Campaign,
  options: MapExportOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get default filename
    const extension = options.format;
    const defaultName = `${campaign.name}-map.${extension}`;

    // Show save dialog
    const filePath = await window.electronAPI.exportFileDialog(defaultName, options.format);
    if (!filePath) {
      return { success: false, error: 'Export cancelled' };
    }

    // Generate export
    const blob = await exportMap(campaign, options);

    // Convert to base64
    const base64 = await blobToBase64(blob);

    // Save file
    const result = await window.electronAPI.saveBinaryFile(filePath, base64);
    return result;
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
