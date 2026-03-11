// Offscreen canvas gradient renderer for weather radar overlay
// Draws per-hex colored fills with Gaussian blur for smooth transitions

import type { WeatherField, WeatherFieldCell, WeatherSimulationConfig } from '../types/Weather';
import { hexCenter, drawHexPath, HEX_SIZE, getHexNeighbors, type HexRange } from './hexGeometry';
import { clamp } from './weather/WeatherField';

/** Color mapping functions for different overlay modes */

function precipitationColor(cell: WeatherFieldCell): string {
  const i = cell.precipIntensity;
  if (i < 0.05) return 'transparent';
  if (i < 0.2) return `rgba(0, 200, 50, ${0.5 + i * 2})`;      // Green (light)
  if (i < 0.4) return `rgba(180, 200, 0, ${0.6 + i})`;           // Yellow
  if (i < 0.6) return `rgba(255, 140, 0, ${0.7 + i * 0.3})`;     // Orange
  if (i < 0.8) return `rgba(255, 40, 40, ${0.8 + i * 0.2})`;     // Red
  return `rgba(180, 0, 180, 0.85)`;                                // Purple (extreme)
}

function temperatureColor(cell: WeatherFieldCell): string {
  const t = cell.temperature;
  if (t < -10) return `rgba(50, 50, 200, 0.85)`;        // Deep blue
  if (t < 0) return `rgba(80, 120, 220, 0.75)`;          // Blue
  if (t < 10) return `rgba(100, 180, 220, 0.65)`;        // Light blue
  if (t < 20) return `rgba(100, 200, 100, 0.55)`;        // Green
  if (t < 30) return `rgba(220, 200, 50, 0.65)`;         // Yellow
  if (t < 40) return `rgba(220, 100, 30, 0.75)`;         // Orange
  return `rgba(200, 30, 30, 0.85)`;                       // Red (extreme heat)
}

function pressureColor(cell: WeatherFieldCell): string {
  const p = cell.pressure;
  const norm = clamp((p - 985) / 60, 0, 1); // 985-1045 range mapped to 0-1
  const r = Math.round(norm * 200);
  const g = Math.round(norm * 200);
  const b = Math.round((1 - norm) * 150 + 50);
  return `rgba(${r}, ${g}, ${b}, 0.55)`;
}

function windColor(cell: WeatherFieldCell): string {
  const speed = Math.sqrt(cell.windVector.u * cell.windVector.u + cell.windVector.v * cell.windVector.v);
  const norm = clamp(speed / 15, 0, 1);
  if (norm < 0.15) return 'transparent';
  const r = Math.round(norm * 255);
  const g = Math.round((1 - norm) * 200);
  return `rgba(${r}, ${g}, 80, ${0.35 + norm * 0.45})`;
}

const COLOR_MAP: Record<string, (cell: WeatherFieldCell) => string> = {
  precipitation: precipitationColor,
  temperature: temperatureColor,
  pressure: pressureColor,
  wind: windColor
};

/** Pre-allocated canvas pair for gradient rendering (draw + blur) */
export interface GradientCanvasRefs {
  draw: HTMLCanvasElement;
  blur: HTMLCanvasElement;
}

/**
 * Ensure canvas refs exist and have the correct dimensions.
 * Returns the refs, creating canvases only on first call or size change.
 */
export function ensureGradientCanvases(
  refs: GradientCanvasRefs | null,
  width: number,
  height: number
): GradientCanvasRefs {
  if (refs && refs.draw.width === width && refs.draw.height === height) {
    return refs;
  }
  const draw = refs?.draw || document.createElement('canvas');
  const blur = refs?.blur || document.createElement('canvas');
  draw.width = width;
  draw.height = height;
  blur.width = width;
  blur.height = height;
  return { draw, blur };
}

/**
 * Render weather gradient overlay to pre-allocated offscreen canvases.
 * Returns the blur canvas for compositing onto the main canvas.
 */
export function renderWeatherGradient(
  field: WeatherField,
  gridWidth: number,
  gridHeight: number,
  config: WeatherSimulationConfig,
  canvasWidth: number,
  canvasHeight: number,
  offsetX: number,
  offsetY: number,
  zoomLevel: number,
  canvasRefs?: GradientCanvasRefs | null,
  visibleRange?: HexRange | null
): HTMLCanvasElement | null {
  if (!config.enabled || Object.keys(field).length === 0) return null;

  const refs = canvasRefs || ensureGradientCanvases(null, canvasWidth, canvasHeight);
  const offscreen = refs.draw;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return null;

  // Clear previous content
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const colorFn = COLOR_MAP[config.overlayMode] || precipitationColor;

  const qMin = visibleRange ? visibleRange.qMin : 0;
  const qMax = visibleRange ? visibleRange.qMax : gridWidth - 1;
  const rMin = visibleRange ? visibleRange.rMin : 0;
  const rMax = visibleRange ? visibleRange.rMax : gridHeight - 1;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(zoomLevel, zoomLevel);

  // Draw hex-by-hex colored fills
  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      const key = `${q},${r}`;
      const cell = field[key];
      if (!cell) continue;

      const color = colorFn(cell);
      if (color === 'transparent') continue;

      const center = hexCenter({ q, r });
      drawHexPath(ctx, center, HEX_SIZE);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  ctx.restore();

  // Apply Gaussian blur for smooth transitions between hexes
  const blurAmount = Math.max(3, Math.min(12, 6 * zoomLevel));
  const blurred = refs.blur;
  const blurCtx = blurred.getContext('2d');
  if (blurCtx) {
    blurCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    blurCtx.filter = `blur(${blurAmount}px)`;
    blurCtx.drawImage(offscreen, 0, 0);
    blurCtx.filter = 'none';
    return blurred;
  }

  return offscreen;
}

/**
 * Render isobar lines (pressure contours).
 * Uses edge-crossing detection: for each hex edge, if the two hexes straddle
 * an isobar level (one above, one below), draw a segment at the midpoint.
 */
export function renderIsobars(
  ctx: CanvasRenderingContext2D,
  field: WeatherField,
  gridWidth: number,
  gridHeight: number,
  zoomLevel: number,
  visibleRange?: HexRange | null
): void {
  const interval = 5; // hPa between isobar lines
  ctx.save();
  ctx.strokeStyle = 'rgba(220, 220, 220, 0.6)';
  ctx.lineWidth = 1.5 / zoomLevel;
  ctx.setLineDash([4 / zoomLevel, 2 / zoomLevel]);

  const qMin = visibleRange ? visibleRange.qMin : 0;
  const qMax = visibleRange ? visibleRange.qMax : gridWidth - 1;
  const rMin = visibleRange ? visibleRange.rMin : 0;
  const rMax = visibleRange ? visibleRange.rMax : gridHeight - 1;

  // Track drawn edges to avoid duplicates (lower key first)
  const drawnEdges = new Set<string>();

  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      const key = `${q},${r}`;
      const cell = field[key];
      if (!cell) continue;

      const neighbors = getHexNeighbors({ q, r });

      for (const n of neighbors) {
        if (n.q < 0 || n.q >= gridWidth || n.r < 0 || n.r >= gridHeight) continue;
        const nk = `${n.q},${n.r}`;
        const neighbor = field[nk];
        if (!neighbor) continue;

        // Deduplicate edges
        const edgeKey = key < nk ? `${key}|${nk}` : `${nk}|${key}`;
        if (drawnEdges.has(edgeKey)) continue;

        // Check if this edge crosses any isobar level
        const pMin = Math.min(cell.pressure, neighbor.pressure);
        const pMax = Math.max(cell.pressure, neighbor.pressure);
        const lowestLevel = Math.ceil(pMin / interval) * interval;

        if (lowestLevel < pMax) {
          // Edge straddles at least one isobar level — draw segment
          drawnEdges.add(edgeKey);
          const c1 = hexCenter({ q, r });
          const c2 = hexCenter({ q: n.q, r: n.r });
          const mx = (c1.x + c2.x) / 2;
          const my = (c1.y + c2.y) / 2;

          // Draw perpendicular segment at midpoint for contour feel
          const dx = c2.x - c1.x;
          const dy = c2.y - c1.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const perpX = -dy / len * HEX_SIZE * 0.4;
          const perpY = dx / len * HEX_SIZE * 0.4;

          ctx.beginPath();
          ctx.moveTo(mx - perpX, my - perpY);
          ctx.lineTo(mx + perpX, my + perpY);
          ctx.stroke();
        }
      }
    }
  }

  ctx.restore();
}

/**
 * Render weather front lines (both DM and player views).
 * Blue triangles for cold fronts, red semicircles for warm fronts.
 */
export function renderFronts(
  ctx: CanvasRenderingContext2D,
  field: WeatherField,
  gridWidth: number,
  gridHeight: number,
  zoomLevel: number,
  visibleRange?: HexRange | null
): void {
  ctx.save();
  ctx.lineWidth = 3.5 / zoomLevel;

  const qMin = visibleRange ? visibleRange.qMin : 0;
  const qMax = visibleRange ? visibleRange.qMax : gridWidth - 1;
  const rMin = visibleRange ? visibleRange.rMin : 0;
  const rMax = visibleRange ? visibleRange.rMax : gridHeight - 1;

  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      const key = `${q},${r}`;
      const cell = field[key];
      if (!cell || cell.frontType === 'none') continue;

      const center = hexCenter({ q, r });
      const size = 8 / zoomLevel;

      if (cell.frontType === 'cold') {
        ctx.strokeStyle = 'rgba(80, 130, 255, 0.9)';
        ctx.fillStyle = 'rgba(80, 130, 255, 0.7)';
        // Draw small triangle
        ctx.beginPath();
        ctx.moveTo(center.x, center.y - size);
        ctx.lineTo(center.x - size * 0.8, center.y + size * 0.5);
        ctx.lineTo(center.x + size * 0.8, center.y + size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (cell.frontType === 'warm') {
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)';
        ctx.fillStyle = 'rgba(255, 80, 80, 0.7)';
        // Draw small semicircle
        ctx.beginPath();
        ctx.arc(center.x, center.y, size, 0, Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        // Occluded front: purple
        ctx.strokeStyle = 'rgba(160, 80, 200, 0.9)';
        ctx.fillStyle = 'rgba(160, 80, 200, 0.7)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}
