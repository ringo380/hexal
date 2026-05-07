import { HexCoordinate, Campaign, ContentCategory, MarkerPosition } from '../types';
import { hexCenter, drawHexPath, hexPoints, HEX_SIZE } from './hexGeometry';
import { hexToRgba, getContentSummary, CONTENT_INDICATORS, renderMarkers } from './hexRenderer';

export interface IndicatorPosition {
  x: number;
  y: number;
  radius: number;
  coord: HexCoordinate;
  category: ContentCategory;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  campaign: Campaign;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  lod: any; // Level of Detail settings
  layerVisibility: any;
  selectedCoordinate?: HexCoordinate | null;
  selectedMarkerId?: string | null;
  hexRegionMap: Map<string, any>;
  getTerrainColor: (terrain: string) => string;
}

/**
 * Render hex backgrounds (terrain fills and selection highlights)
 */
export function renderHexBackgrounds(
  context: RenderContext,
  visibleRange: { qMin: number; qMax: number; rMin: number; rMax: number }
) {
  const { ctx, campaign, selectedCoordinate, hexRegionMap, getTerrainColor, lod } = context;

  for (let q = visibleRange.qMin; q <= visibleRange.qMax; q++) {
    for (let r = visibleRange.rMin; r <= visibleRange.rMax; r++) {
      const coord: HexCoordinate = { q, r };
      const center = hexCenter(coord);
      const hex = campaign.hexes[`${q},${r}`];
      const isSelected = selectedCoordinate?.q === q && selectedCoordinate?.r === r;

      // Determine fill color
      let fillColor = 'rgba(50, 50, 50, 0.3)'; // Empty/inactive hex
      if (hex && hex.terrain) {
        const baseColor = getTerrainColor(hex.terrain);
        const opacity = hex.status === 'undiscovered' ? 0.3 : 0.7;
        fillColor = hexToRgba(baseColor, opacity);
      }

      // Draw hex fill
      drawHexPath(ctx, center, HEX_SIZE);
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Region overlay
      const region = hexRegionMap.get(`${q},${r}`);
      if (region) {
        drawHexPath(ctx, center, HEX_SIZE);
        ctx.fillStyle = hexToRgba(region.color, 0.25);
        ctx.fill();
      }

      // Draw border (LOD-controlled)
      if (lod.showBorders || isSelected) {
        ctx.strokeStyle = isSelected ? '#4a9eff' : '#555555';
        ctx.lineWidth = isSelected ? 3 : lod.borderWidth;
        ctx.stroke();
      }
    }
  }
}

/**
 * Render hex content indicators and labels
 */
export function renderHexContent(
  context: RenderContext,
  visibleRange: { qMin: number; qMax: number; rMin: number; rMax: number },
  indicatorPositions: IndicatorPosition[]
) {
  const { ctx, campaign, lod, layerVisibility } = context;

  let currentFont = '';
  let currentAlign = '';
  let currentBaseline = '';

  for (let q = visibleRange.qMin; q <= visibleRange.qMax; q++) {
    for (let r = visibleRange.rMin; r <= visibleRange.rMax; r++) {
      const coord: HexCoordinate = { q, r };
      const center = hexCenter(coord);
      const hex = campaign.hexes[`${q},${r}`];
      if (!hex) continue;

      // Draw status indicator (LOD-controlled + layer visibility)
      if (lod.showStatusDot && layerVisibility.statusIndicators && hex.status !== 'undiscovered') {
        ctx.beginPath();
        ctx.arc(center.x, center.y, lod.statusDotRadius, 0, Math.PI * 2);
        ctx.fillStyle = hex.status === 'discovered' ? 'rgba(74, 158, 255, 0.7)' : 'rgba(76, 175, 80, 0.7)';
        ctx.fill();
      }

      // Draw content indicators
      if (lod.showIndicators && layerVisibility.contentIndicators) {
        const summary = getContentSummary(hex);
        if (summary.length > 0) {
          const totalWidth = (summary.length - 1) * lod.indicatorSpacing;
          const startX = center.x - totalWidth / 2;
          const rowY = center.y + lod.indicatorY;

          summary.forEach((item, index) => {
            const config = CONTENT_INDICATORS[item.category];
            const isFullyResolved = item.unresolved === 0;
            const indicatorX = startX + index * lod.indicatorSpacing;

            indicatorPositions.push({
              x: indicatorX,
              y: rowY,
              radius: lod.indicatorRadius,
              coord,
              category: item.category
            });

            ctx.beginPath();
            ctx.arc(indicatorX, rowY, lod.indicatorRadius, 0, Math.PI * 2);
            ctx.fillStyle = isFullyResolved ? hexToRgba(config.color, 0.4) : config.color;
            ctx.fill();

            if (lod.showIndicatorLetters && lod.indicatorFont > 0) {
              const wantFont = `bold ${lod.indicatorFont}px sans-serif`;
              if (currentFont !== wantFont) { ctx.font = wantFont; currentFont = wantFont; }
              if (currentAlign !== 'center') { ctx.textAlign = 'center'; currentAlign = 'center'; }
              if (currentBaseline !== 'middle') { ctx.textBaseline = 'middle'; currentBaseline = 'middle'; }
              ctx.fillStyle = '#ffffff';
              ctx.fillText(config.letter, indicatorX, rowY);
            }
          });
        }
      }
      
      // Terrain Label
      if (lod.showTerrainLabels && layerVisibility.terrainLabels && hex.terrain) {
        const wantFont = `bold ${lod.terrainFontSize}px sans-serif`;
        if (currentFont !== wantFont) { ctx.font = wantFont; currentFont = wantFont; }
        if (currentAlign !== 'center') { ctx.textAlign = 'center'; currentAlign = 'center'; }
        if (currentBaseline !== 'middle') { ctx.textBaseline = 'middle'; currentBaseline = 'middle'; }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 3;
        ctx.fillText(hex.terrain, center.x, center.y + lod.terrainLabelY);
        ctx.shadowBlur = 0;
      }

      // Coordinates
      if (lod.showCoords && layerVisibility.coordinates) {
        const wantFont = `${lod.coordFontSize}px sans-serif`;
        if (currentFont !== wantFont) { ctx.font = wantFont; currentFont = wantFont; }
        if (currentAlign !== 'center') { ctx.textAlign = 'center'; currentAlign = 'center'; }
        if (currentBaseline !== 'alphabetic') { ctx.textBaseline = 'alphabetic'; currentBaseline = 'alphabetic'; }
        
        ctx.fillStyle = 'rgba(136, 136, 136, 0.7)';
        ctx.fillText(`${q},${r}`, center.x, center.y + lod.coordY);
      }
    }
  }
  
  // Reset text properties after restoration
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

/**
 * Render multi-selection overlay
 */
export function renderMultiSelection(
  ctx: CanvasRenderingContext2D,
  multiSelectedKeys: Set<string>
) {
  if (multiSelectedKeys.size === 0) return;

  for (const key of multiSelectedKeys) {
    const parts = key.split(',');
    const msq = parseInt(parts[0], 10);
    const msr = parseInt(parts[1], 10);
    const msCenter = hexCenter({ q: msq, r: msr });
    drawHexPath(ctx, msCenter, HEX_SIZE);
    ctx.fillStyle = 'rgba(74, 158, 255, 0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/**
 * Render connections (rivers and roads)
 */
export function renderAllConnections(
  context: RenderContext,
  visibleRange: { qMin: number; qMax: number; rMin: number; rMax: number }
) {
  const { ctx, campaign, zoomLevel, layerVisibility } = context;
  if (!layerVisibility.connections || zoomLevel < 0.25) return;

  for (let q = visibleRange.qMin; q <= visibleRange.qMax; q++) {
    for (let r = visibleRange.rMin; r <= visibleRange.rMax; r++) {
      const hex = campaign.hexes[`${q},${r}`];
      if (!hex?.connections) continue;
      const center = hexCenter({ q, r });
      const points = hexPoints(center, HEX_SIZE);

      // Draw rivers
      if (hex.connections.rivers.length > 0) {
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const edge of hex.connections.rivers) {
          const p1 = points[edge];
          const p2 = points[(edge + 1) % 6];
          const edgeMidX = (p1.x + p2.x) / 2;
          const edgeMidY = (p1.y + p2.y) / 2;

          ctx.beginPath();
          ctx.moveTo(edgeMidX, edgeMidY);
          const cpX = center.x + (edgeMidX - center.x) * 0.3;
          const cpY = center.y + (edgeMidY - center.y) * 0.3;
          ctx.quadraticCurveTo(cpX, cpY, center.x, center.y);
          ctx.stroke();
        }
      }

      // Draw roads
      if (hex.connections.roads.length > 0 && zoomLevel >= 0.40) {
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.setLineDash([3, 3]);

        for (const edge of hex.connections.roads) {
          const p1 = points[edge];
          const p2 = points[(edge + 1) % 6];
          const edgeMidX = (p1.x + p2.x) / 2;
          const edgeMidY = (p1.y + p2.y) / 2;

          ctx.beginPath();
          ctx.moveTo(edgeMidX, edgeMidY);
          ctx.lineTo(center.x, center.y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }
  }
}

/**
 * Render markers for all visible hexes
 */
export function renderAllMarkers(
  context: RenderContext,
  visibleRange: { qMin: number; qMax: number; rMin: number; rMax: number },
  markerPositions: MarkerPosition[]
) {
  const { ctx, campaign, zoomLevel, selectedMarkerId } = context;
  const markerTypes = campaign.markerTypes || [];

  for (let q = visibleRange.qMin; q <= visibleRange.qMax; q++) {
    for (let r = visibleRange.rMin; r <= visibleRange.rMax; r++) {
      const hex = campaign.hexes[`${q},${r}`];
      if (hex) {
        const positions = renderMarkers(
          ctx,
          hex,
          hexCenter({ q, r }),
          markerTypes,
          zoomLevel,
          selectedMarkerId || undefined
        );
        markerPositions.push(...positions);
      }
    }
  }
}
