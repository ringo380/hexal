// Hex Renderer Service - Shared rendering logic for HexGrid and Map Export
// Extracted from HexGrid.tsx to enable reuse across live view and export

import type { Campaign, Hex, HexCoordinate, ContentCategory, HexMarker, MarkerType, MarkerPosition } from '../types';
import type { RenderConfig, ColorMode, MapExportOptions } from '../types/MapExport';
import { getMarkerColor, getMarkerIcon } from '../types/Markers';
import {
  figurineCache,
  getFigurineSync,
  getGlyphIdForMarker,
  getFigurineSizeForMarker,
  FIGURINE_SIZES,
  isMarkerVisibleAtZoom,
  getMarkerRenderScale
} from './markerFigurines';
import {
  HEX_SIZE,
  hexCenter,
  canvasSize,
  drawHexPath
} from './hexGeometry';
import {
  CONTENT_INDICATOR_COLORS,
  STATUS_COLORS,
  BACKGROUND_COLORS,
  BORDER_COLORS,
  FONT_COLORS
} from '../types/MapExport';

// Content categories in render order
const CONTENT_CATEGORIES: ContentCategory[] = ['locations', 'encounters', 'npcs', 'treasures', 'clues'];

// Content indicator metadata
export const CONTENT_INDICATORS: Record<ContentCategory, {
  color: string;
  letter: string;
  label: string;
}> = {
  locations:  { color: '#e91e63', letter: 'L', label: 'Locations' },
  encounters: { color: '#ff5722', letter: 'E', label: 'Encounters' },
  npcs:       { color: '#2196f3', letter: 'N', label: 'NPCs' },
  treasures:  { color: '#ffc107', letter: 'T', label: 'Treasures' },
  clues:      { color: '#9c27b0', letter: 'C', label: 'Clues' }
};

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Convert hex color to rgba string
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Convert color to grayscale
 */
export function colorToGrayscale(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Luminance formula
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  return `rgb(${gray}, ${gray}, ${gray})`;
}

/**
 * Lighten a hex color for print mode
 */
export function lightenColor(hex: string, amount: number = 0.3): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));

  return `rgb(${newR}, ${newG}, ${newB})`;
}

/**
 * Adjust terrain color based on color mode
 */
export function adjustColorForMode(hex: string, colorMode: ColorMode): string {
  switch (colorMode) {
    case 'dark':
      return hex;
    case 'light':
      return lightenColor(hex, 0.2);
    case 'print-bw':
      return colorToGrayscale(hex);
    default:
      return hex;
  }
}

// ============================================================================
// Configuration Builders
// ============================================================================

/**
 * Create a RenderConfig from MapExportOptions
 */
export function createRenderConfig(options: MapExportOptions): RenderConfig {
  const colorMode = options.colorMode;
  const fontColors = FONT_COLORS[colorMode];

  // Determine visibility based on view mode
  const isPlayerView = options.viewMode === 'player';
  const showUndiscovered = !isPlayerView || options.playerFogStyle === 'fog';
  const showUndiscoveredAsFog = isPlayerView && options.playerFogStyle === 'fog';

  return {
    backgroundColor: BACKGROUND_COLORS[colorMode],
    borderColor: BORDER_COLORS[colorMode],
    borderWidth: 1,
    hexOpacityUndiscovered: showUndiscoveredAsFog ? 0.15 : 0.3,
    hexOpacityDiscovered: 0.7,
    showUndiscovered,
    showUndiscoveredAsFog,
    showCoordinates: options.showCoordinates,
    showTerrainLabels: options.showTerrainLabels,
    showContentIndicators: options.showContentIndicators && !isPlayerView,
    showStatusDots: options.showStatusDots,
    showBorders: options.showHexBorders,
    coordFontSize: 5,
    terrainFontSize: 6,
    fontColor: fontColors.main,
    fontShadowColor: fontColors.shadow,
    coordColor: fontColors.coord,
    statusDiscoveredColor: STATUS_COLORS.discovered,
    statusClearedColor: STATUS_COLORS.cleared,
    contentIndicatorColors: CONTENT_INDICATOR_COLORS,
    scale: options.scale,
    colorMode
  };
}

/**
 * Create a default RenderConfig for live HexGrid view
 */
export function createLiveRenderConfig(showAll: boolean = true): RenderConfig {
  return {
    backgroundColor: '#1e1e1e',
    borderColor: '#555555',
    borderWidth: 1,
    hexOpacityUndiscovered: 0.3,
    hexOpacityDiscovered: 0.7,
    showUndiscovered: showAll,
    showUndiscoveredAsFog: false,
    showCoordinates: true,
    showTerrainLabels: true,
    showContentIndicators: true,
    showStatusDots: true,
    showBorders: true,
    coordFontSize: 5,
    terrainFontSize: 6,
    fontColor: 'rgba(255, 255, 255, 0.85)',
    fontShadowColor: 'rgba(0, 0, 0, 0.7)',
    coordColor: 'rgba(136, 136, 136, 0.7)',
    statusDiscoveredColor: STATUS_COLORS.discovered,
    statusClearedColor: STATUS_COLORS.cleared,
    contentIndicatorColors: CONTENT_INDICATOR_COLORS,
    scale: 1,
    colorMode: 'dark'
  };
}

// ============================================================================
// Content Helpers
// ============================================================================

/**
 * Get content summary for a hex (counts by category)
 */
export function getContentSummary(hex: Hex): { category: ContentCategory; total: number; unresolved: number }[] {
  return CONTENT_CATEGORIES
    .map(category => {
      const items = hex[category];
      return {
        category,
        total: items.length,
        unresolved: items.filter(item => !item.isResolved).length
      };
    })
    .filter(summary => summary.total > 0);
}

/**
 * Truncate text to fit within hex width
 */
export function truncateForHex(text: string, fontSize: number, zoomLevel: number = 1): string {
  const effectiveWidth = 50 * Math.max(1, zoomLevel);
  const maxChars = Math.floor(effectiveWidth / (fontSize * 0.6));
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + '…';
}

// ============================================================================
// Dimension Calculations
// ============================================================================

/**
 * Calculate dimensions for export canvas including margins for title/legend
 */
export function calculateExportDimensions(
  campaign: Campaign,
  options: MapExportOptions
): { width: number; height: number; mapWidth: number; mapHeight: number; offsetX: number; offsetY: number } {
  const baseSize = canvasSize(campaign.gridWidth, campaign.gridHeight);

  let offsetX = 0;
  let offsetY = 0;
  let extraHeight = 0;
  let extraWidth = 0;

  // Add space for title
  if (options.showTitle) {
    offsetY = 40;
    extraHeight += 40;
  }

  // Add space for legend
  if (options.showLegend) {
    extraHeight += 80; // Space below map for legend
  }

  // Add space for scale indicator
  if (options.showScale && options.scaleText) {
    extraHeight += 30;
  }

  return {
    width: baseSize.width + extraWidth,
    height: baseSize.height + extraHeight,
    mapWidth: baseSize.width,
    mapHeight: baseSize.height,
    offsetX,
    offsetY
  };
}

// ============================================================================
// Core Rendering Functions
// ============================================================================

/**
 * Render the complete hex grid to a canvas context
 */
export function renderHexGrid(
  ctx: CanvasRenderingContext2D,
  campaign: Campaign,
  config: RenderConfig,
  getTerrainColor: (terrain: string) => string,
  offsetX: number = 0,
  offsetY: number = 0
): void {
  // Apply offset transform
  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Draw all hexes
  for (let q = 0; q < campaign.gridWidth; q++) {
    for (let r = 0; r < campaign.gridHeight; r++) {
      const coord: HexCoordinate = { q, r };
      const key = `${q},${r}`;
      const hex = campaign.hexes[key] || null;

      renderSingleHex(ctx, hex, coord, getTerrainColor, config);
    }
  }

  ctx.restore();
}

/**
 * Render a single hex with all its elements
 */
export function renderSingleHex(
  ctx: CanvasRenderingContext2D,
  hex: Hex | null,
  coord: HexCoordinate,
  getTerrainColor: (terrain: string) => string,
  config: RenderConfig
): void {
  const center = hexCenter(coord);

  // Check if we should render this hex at all
  if (hex && hex.status === 'undiscovered' && !config.showUndiscovered) {
    // Player view with blank fog - draw empty/transparent hex
    drawHexPath(ctx, center, HEX_SIZE);
    ctx.fillStyle = config.backgroundColor;
    ctx.fill();
    if (config.showBorders) {
      ctx.strokeStyle = hexToRgba(config.borderColor, 0.3);
      ctx.lineWidth = config.borderWidth;
      ctx.stroke();
    }
    return;
  }

  // Determine fill color
  let fillColor = 'rgba(50, 50, 50, 0.3)'; // Empty/inactive hex
  if (hex && hex.terrain) {
    const baseColor = getTerrainColor(hex.terrain);
    const adjustedColor = adjustColorForMode(baseColor, config.colorMode);

    let opacity: number;
    if (hex.status === 'undiscovered') {
      opacity = config.showUndiscoveredAsFog ? config.hexOpacityUndiscovered : config.hexOpacityUndiscovered;
    } else {
      opacity = config.hexOpacityDiscovered;
    }

    fillColor = hexToRgba(adjustedColor, opacity);
  }

  // Draw hex fill
  drawHexPath(ctx, center, HEX_SIZE);
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Draw border
  if (config.showBorders) {
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = config.borderWidth;
    ctx.stroke();
  }

  // Draw fog overlay for player view
  if (config.showUndiscoveredAsFog && hex && hex.status === 'undiscovered') {
    drawHexPath(ctx, center, HEX_SIZE);
    ctx.fillStyle = hexToRgba(config.backgroundColor, 0.6);
    ctx.fill();
  }

  // Draw status indicator dot
  if (config.showStatusDots && hex && hex.status !== 'undiscovered') {
    const dotRadius = 4;
    ctx.beginPath();
    ctx.arc(center.x, center.y, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = hex.status === 'discovered'
      ? config.statusDiscoveredColor
      : config.statusClearedColor;
    ctx.fill();
  }

  // Draw content indicators
  if (config.showContentIndicators && hex) {
    renderContentIndicators(ctx, hex, center, config);
  }

  // Draw terrain label
  if (config.showTerrainLabels && hex && hex.terrain) {
    renderTerrainLabel(ctx, hex.terrain, center, config);
  }

  // Draw coordinate label
  if (config.showCoordinates) {
    renderCoordinateLabel(ctx, coord, center, config);
  }
}

/**
 * Render content indicator dots for a hex
 */
export function renderContentIndicators(
  ctx: CanvasRenderingContext2D,
  hex: Hex,
  center: { x: number; y: number },
  config: RenderConfig
): void {
  const summary = getContentSummary(hex);
  if (summary.length === 0) return;

  const indicatorRadius = 3;
  const spacing = 8;
  const yOffset = -15;

  // Calculate row layout - centered horizontally
  const totalWidth = (summary.length - 1) * spacing;
  const startX = center.x - totalWidth / 2;
  const rowY = center.y + yOffset;

  summary.forEach((item, index) => {
    const isFullyResolved = item.unresolved === 0;
    const indicatorX = startX + index * spacing;

    // Draw circle
    ctx.beginPath();
    ctx.arc(indicatorX, rowY, indicatorRadius, 0, Math.PI * 2);

    const color = config.contentIndicatorColors[item.category];
    ctx.fillStyle = isFullyResolved ? hexToRgba(color, 0.4) : color;
    ctx.fill();

    // Draw count badge if multiple items
    if (item.total > 1) {
      const badgeRadius = 3;
      const badgeX = indicatorX + indicatorRadius - 1;
      const badgeY = rowY - indicatorRadius + 1;

      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
      ctx.fillStyle = config.backgroundColor;
      ctx.fill();

      ctx.font = 'bold 4px sans-serif';
      ctx.fillStyle = isFullyResolved ? 'rgba(255,255,255,0.6)' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.total > 9 ? '9+' : String(item.total), badgeX, badgeY);
    }
  });
}

/**
 * Render terrain label text
 */
export function renderTerrainLabel(
  ctx: CanvasRenderingContext2D,
  terrain: string,
  center: { x: number; y: number },
  config: RenderConfig
): void {
  const fontSize = config.terrainFontSize;
  const yOffset = 6;

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = config.fontColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add shadow for readability
  if (config.fontShadowColor !== 'transparent') {
    ctx.shadowColor = config.fontShadowColor;
    ctx.shadowBlur = 3;
  }

  const text = truncateForHex(terrain, fontSize);
  ctx.fillText(text, center.x, center.y + yOffset);

  ctx.shadowBlur = 0;
}

/**
 * Render coordinate label
 */
export function renderCoordinateLabel(
  ctx: CanvasRenderingContext2D,
  coord: HexCoordinate,
  center: { x: number; y: number },
  config: RenderConfig
): void {
  const fontSize = config.coordFontSize;
  const yOffset = 18;

  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = config.coordColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${coord.q},${coord.r}`, center.x, center.y + yOffset);
}

// ============================================================================
// Legend & Metadata Rendering
// ============================================================================

/**
 * Render a legend showing terrain types and content indicators
 */
export function renderLegend(
  ctx: CanvasRenderingContext2D,
  campaign: Campaign,
  x: number,
  y: number,
  config: RenderConfig
): { width: number; height: number } {
  const padding = 10;
  const itemHeight = 20;
  const swatchSize = 14;
  const columnWidth = 120;

  // Get used terrain types
  const usedTerrains = new Set<string>();
  Object.values(campaign.hexes).forEach(hex => {
    if (hex.terrain) usedTerrains.add(hex.terrain);
  });

  const terrainTypes = campaign.terrainTypes.filter(t => usedTerrains.has(t.name));
  const contentCategories = CONTENT_CATEGORIES;

  // Calculate dimensions
  const terrainRows = Math.ceil(terrainTypes.length / 2);
  const contentRows = 1; // Content indicators in a single row
  const totalHeight = padding * 2 + (terrainRows + contentRows + 1) * itemHeight;
  const totalWidth = columnWidth * 2 + padding * 2;

  // Draw background
  ctx.fillStyle = config.colorMode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(x, y, totalWidth, totalHeight);
  ctx.strokeStyle = config.borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, totalWidth, totalHeight);

  // Draw "Legend" title
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = config.fontColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Legend', x + padding, y + padding);

  let currentY = y + padding + itemHeight;

  // Draw terrain types (2 columns)
  terrainTypes.forEach((terrain, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const itemX = x + padding + col * columnWidth;
    const itemY = currentY + row * itemHeight;

    // Color swatch
    const color = adjustColorForMode(terrain.colorHex, config.colorMode);
    ctx.fillStyle = color;
    ctx.fillRect(itemX, itemY, swatchSize, swatchSize);
    ctx.strokeStyle = config.borderColor;
    ctx.strokeRect(itemX, itemY, swatchSize, swatchSize);

    // Label
    ctx.font = '10px sans-serif';
    ctx.fillStyle = config.fontColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(terrain.name, itemX + swatchSize + 6, itemY + swatchSize / 2);
  });

  currentY += terrainRows * itemHeight + 10;

  // Draw content indicators
  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = config.fontColor;
  ctx.textAlign = 'left';
  ctx.fillText('Content:', x + padding, currentY);

  let indicatorX = x + padding + 60;
  contentCategories.forEach(category => {
    const indicator = CONTENT_INDICATORS[category];

    // Draw dot
    ctx.beginPath();
    ctx.arc(indicatorX, currentY + 5, 5, 0, Math.PI * 2);
    ctx.fillStyle = indicator.color;
    ctx.fill();

    // Draw label
    ctx.font = '9px sans-serif';
    ctx.fillStyle = config.fontColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(indicator.label, indicatorX + 8, currentY + 5);

    indicatorX += 70;
  });

  return { width: totalWidth, height: totalHeight };
}

/**
 * Render title text
 */
export function renderTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  canvasWidth: number,
  y: number,
  config: RenderConfig
): void {
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = config.fontColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (config.fontShadowColor !== 'transparent') {
    ctx.shadowColor = config.fontShadowColor;
    ctx.shadowBlur = 4;
  }

  ctx.fillText(title, canvasWidth / 2, y);
  ctx.shadowBlur = 0;
}

/**
 * Render scale indicator
 */
export function renderScaleIndicator(
  ctx: CanvasRenderingContext2D,
  scaleText: string,
  x: number,
  y: number,
  config: RenderConfig
): void {
  ctx.font = '12px sans-serif';
  ctx.fillStyle = config.fontColor;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(scaleText, x, y);
}

// ============================================================================
// Marker Rendering
// ============================================================================

/**
 * Render markers on a hex using figurine images
 * Returns marker positions for hit testing
 *
 * @param ctx - Canvas rendering context
 * @param hex - The hex containing markers
 * @param hexCenter - Center point of the hex (fallback for markers without worldX/worldY)
 * @param markerTypes - Available marker type definitions
 * @param zoomLevel - Current zoom level (used for adaptive scaling and visibility)
 * @param selectedMarkerId - ID of currently selected marker (for highlight)
 */
export function renderMarkers(
  ctx: CanvasRenderingContext2D,
  hex: Hex,
  hexCenterPoint: { x: number; y: number },
  markerTypes: MarkerType[],
  zoomLevel: number = 1,
  selectedMarkerId?: string
): MarkerPosition[] {
  // Filter to visible markers that pass zoom-level visibility check
  const markers = hex.markers?.filter(m =>
    m.isVisible && isMarkerVisibleAtZoom(m.typeId, zoomLevel)
  ) ?? [];
  if (markers.length === 0) return [];

  const positions: MarkerPosition[] = [];

  // Get adaptive render scale based on zoom level
  // This compensates for canvas zoom to maintain consistent screen-space size
  const adaptiveScale = getMarkerRenderScale(zoomLevel);

  // Separate markers with explicit positions from those without
  const positionedMarkers = markers.filter(m => m.worldX !== undefined && m.worldY !== undefined);
  const unpositionedMarkers = markers.filter(m => m.worldX === undefined || m.worldY === undefined);

  // Render positioned markers at their explicit world coordinates
  for (const marker of positionedMarkers) {
    const worldX = marker.worldX!;
    const worldY = marker.worldY!;

    renderSingleMarker(
      ctx,
      marker,
      worldX,
      worldY,
      markerTypes,
      adaptiveScale,
      selectedMarkerId === marker.id,
      positions,
      hex.coordinate
    );
  }

  // Render unpositioned markers in a row at hex center (legacy behavior)
  if (unpositionedMarkers.length > 0) {
    const maxVisible = 3;
    const visibleMarkers = unpositionedMarkers.slice(0, maxVisible);

    // Calculate spacing based on adaptive scale
    const baseSpacing = 18 * adaptiveScale;
    const totalWidth = (visibleMarkers.length - 1) * baseSpacing;
    const startX = hexCenterPoint.x - totalWidth / 2;
    const markerY = hexCenterPoint.y - 2;

    for (let i = 0; i < visibleMarkers.length; i++) {
      const marker = visibleMarkers[i];
      const markerX = startX + i * baseSpacing;

      renderSingleMarker(
        ctx,
        marker,
        markerX,
        markerY,
        markerTypes,
        adaptiveScale,
        selectedMarkerId === marker.id,
        positions,
        hex.coordinate
      );
    }

    // Draw overflow indicator if there are more unpositioned markers
    if (unpositionedMarkers.length > maxVisible) {
      const overflowX = startX + visibleMarkers.length * baseSpacing;
      const fontSize = Math.max(6, 8 * adaptiveScale);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 2;
      ctx.fillText(`+${unpositionedMarkers.length - maxVisible}`, overflowX, markerY);
      ctx.shadowBlur = 0;
    }
  }

  return positions;
}

/**
 * Render a single marker figurine
 */
function renderSingleMarker(
  ctx: CanvasRenderingContext2D,
  marker: HexMarker,
  worldX: number,
  worldY: number,
  markerTypes: MarkerType[],
  adaptiveScale: number,
  isSelected: boolean,
  positions: MarkerPosition[],
  hexCoord: HexCoordinate
): void {
  // Get figurine image (sync for render loop performance)
  const figurine = getFigurineSync(marker, markerTypes);

  // Get figurine dimensions for this marker
  const size = getFigurineSizeForMarker(marker.typeId);
  const dims = FIGURINE_SIZES[size];

  // Apply adaptive scale (0.5 base + zoom compensation)
  const renderScale = 0.5 * adaptiveScale;
  const renderWidth = dims.totalWidth * renderScale;
  const renderHeight = dims.totalHeight * renderScale;

  // Hit-test radius adapts with figurine size
  const hitRadius = renderWidth / 2;

  // Draw selection highlight behind figurine
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(worldX, worldY, hitRadius + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(74, 158, 255, 0.3)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  if (figurine) {
    // Draw figurine image centered at position
    ctx.drawImage(
      figurine,
      worldX - renderWidth / 2,
      worldY - renderHeight / 2,
      renderWidth,
      renderHeight
    );
  } else {
    // Fallback to text icon if figurine not loaded yet
    const icon = getMarkerIcon(marker, markerTypes);
    const color = getMarkerColor(marker, markerTypes);

    const fontSize = Math.max(8, 10 * adaptiveScale);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 2;
    ctx.fillText(icon, worldX, worldY);
    ctx.shadowBlur = 0;

    // Trigger async load for next frame
    const markerType = markerTypes.find(t => t.id === marker.typeId);
    if (markerType) {
      const glyphId = getGlyphIdForMarker(marker.typeId);
      const markerColor = marker.color || markerType.defaultColor;
      figurineCache.getImage(glyphId, markerColor, size).catch(() => {});
    }
  }

  // Store position for hit testing with world coordinates and adaptive radius
  positions.push({
    x: worldX,  // These are world coordinates (before canvas transform)
    y: worldY,
    worldX,
    worldY,
    markerId: marker.id,
    hexCoord,
    radius: hitRadius
  });
}

/**
 * Render a single dragging marker (follows cursor with tilt)
 */
export function renderDraggingMarker(
  ctx: CanvasRenderingContext2D,
  marker: HexMarker,
  position: { x: number; y: number },
  markerTypes: MarkerType[],
  zoomLevel: number = 1,
  tiltAngle: number = 0  // Tilt in degrees (-5 to +5)
): void {
  const figurine = getFigurineSync(marker, markerTypes);
  const size = getFigurineSizeForMarker(marker.typeId);
  const dims = FIGURINE_SIZES[size];

  // Get adaptive scale and add 10% for drag emphasis
  const adaptiveScale = getMarkerRenderScale(zoomLevel);
  const renderScale = 0.5 * adaptiveScale * 1.1;  // 10% larger than normal
  const renderWidth = dims.totalWidth * renderScale;
  const renderHeight = dims.totalHeight * renderScale;

  ctx.save();

  // Move to marker position
  ctx.translate(position.x, position.y);

  // Apply tilt rotation
  ctx.rotate(tiltAngle * Math.PI / 180);

  // Draw with slight transparency
  ctx.globalAlpha = 0.85;

  // Add drop shadow for lifted effect
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  if (figurine) {
    // Draw figurine image centered
    ctx.drawImage(
      figurine,
      -renderWidth / 2,
      -renderHeight / 2,
      renderWidth,
      renderHeight
    );
  } else {
    // Fallback to text icon
    const icon = getMarkerIcon(marker, markerTypes);
    const color = getMarkerColor(marker, markerTypes);

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(icon, 0, 0);
  }

  ctx.restore();
}

/**
 * Render marker palette preview (for palette hover/selection)
 */
export function renderMarkerPreview(
  ctx: CanvasRenderingContext2D,
  markerType: MarkerType,
  x: number,
  y: number,
  size: number,
  isSelected: boolean = false
): void {
  // Draw background circle
  ctx.beginPath();
  ctx.arc(x, y, size / 2 + 4, 0, Math.PI * 2);
  ctx.fillStyle = isSelected ? 'rgba(100, 100, 255, 0.3)' : 'rgba(50, 50, 50, 0.5)';
  ctx.fill();

  if (isSelected) {
    ctx.strokeStyle = '#6666ff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw icon
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = markerType.defaultColor;
  ctx.fillText(markerType.icon, x, y);
}

// ============================================================================
// Full Export Rendering
// ============================================================================

/**
 * Render the complete export canvas with map, legend, title, etc.
 */
export function renderExportCanvas(
  ctx: CanvasRenderingContext2D,
  campaign: Campaign,
  options: MapExportOptions,
  config: RenderConfig
): void {
  const dims = calculateExportDimensions(campaign, options);

  // Get terrain color function
  const getTerrainColor = (terrain: string): string => {
    const terrainType = campaign.terrainTypes.find(t => t.name === terrain);
    return terrainType?.colorHex ?? '#666666';
  };

  // Fill background
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, dims.width, dims.height);

  // Render title
  if (options.showTitle) {
    const title = options.customTitle || campaign.name;
    renderTitle(ctx, title, dims.width, 10, config);
  }

  // Render hex grid
  renderHexGrid(ctx, campaign, config, getTerrainColor, dims.offsetX, dims.offsetY);

  // Render legend
  if (options.showLegend) {
    const legendY = dims.offsetY + dims.mapHeight + 10;
    renderLegend(ctx, campaign, 10, legendY, config);
  }

  // Render scale indicator
  if (options.showScale && options.scaleText) {
    const scaleY = dims.height - 20;
    renderScaleIndicator(ctx, options.scaleText, dims.width - 20, scaleY, config);
  }
}
