// News-station style radar rendering: pressure labels, wind arrows, cloud cover, ground shadows

import type { WeatherField } from '../types/Weather';
import { hexCenter, drawHexPath, HEX_SIZE, getHexNeighbors, type HexRange } from './hexGeometry';
import { clamp } from './weather/WeatherField';

/**
 * Render bold "H" (high) and "L" (low) pressure system labels at local extremes.
 * Scans the field for cells whose pressure is higher/lower than all 6 hex neighbors.
 */
export function renderPressureLabels(
  ctx: CanvasRenderingContext2D,
  field: WeatherField,
  gridWidth: number,
  gridHeight: number,
  zoomLevel: number,
  visibleRange?: HexRange | null
): void {
  const threshold = 2; // hPa above/below neighbor average to qualify

  const qMin = visibleRange ? visibleRange.qMin : 0;
  const qMax = visibleRange ? visibleRange.qMax : gridWidth - 1;
  const rMin = visibleRange ? visibleRange.rMin : 0;
  const rMax = visibleRange ? visibleRange.rMax : gridHeight - 1;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      const key = `${q},${r}`;
      const cell = field[key];
      if (!cell) continue;

      const hexNeighbors = getHexNeighbors({ q, r });

      let isHigh = true;
      let isLow = true;
      let neighborSum = 0;
      let neighborCount = 0;

      for (const n of hexNeighbors) {
        if (n.q < 0 || n.q >= gridWidth || n.r < 0 || n.r >= gridHeight) continue;
        const neighbor = field[`${n.q},${n.r}`];
        if (!neighbor) continue;
        neighborCount++;
        neighborSum += neighbor.pressure;
        if (neighbor.pressure >= cell.pressure) isHigh = false;
        if (neighbor.pressure <= cell.pressure) isLow = false;
      }

      if (neighborCount < 2) continue;
      const neighborAvg = neighborSum / neighborCount;
      const diff = Math.abs(cell.pressure - neighborAvg);
      if (diff < threshold) continue;

      if (!isHigh && !isLow) continue;

      const center = hexCenter({ q, r });
      const fontSize = Math.max(12, 18 / zoomLevel);
      const label = isHigh ? 'H' : 'L';
      const color = isHigh ? 'rgba(220, 60, 60, 1)' : 'rgba(60, 100, 220, 1)';

      // Background circle for visibility
      const circleRadius = fontSize * 0.7;
      ctx.beginPath();
      ctx.arc(center.x, center.y, circleRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 / zoomLevel;
      ctx.stroke();

      // Label text
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 3;
      ctx.fillText(label, center.x, center.y);
      ctx.shadowBlur = 0;
    }
  }

  ctx.restore();
}

/**
 * Render wind direction arrows across the map.
 * Uses checkerboard skip at medium zoom for readability.
 */
export function renderWindArrows(
  ctx: CanvasRenderingContext2D,
  field: WeatherField,
  gridWidth: number,
  gridHeight: number,
  zoomLevel: number,
  visibleRange?: HexRange | null
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

  // Skip pattern: at medium zoom, show every other hex for readability
  const skipCheckerboard = zoomLevel > 0.4;

  const qMin = visibleRange ? visibleRange.qMin : 0;
  const qMax = visibleRange ? visibleRange.qMax : gridWidth - 1;
  const rMin = visibleRange ? visibleRange.rMin : 0;
  const rMax = visibleRange ? visibleRange.rMax : gridHeight - 1;

  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      if (skipCheckerboard && (q + r) % 2 !== 0) continue;

      const key = `${q},${r}`;
      const cell = field[key];
      if (!cell) continue;

      const speed = Math.sqrt(cell.windVector.u ** 2 + cell.windVector.v ** 2);
      if (speed < 1) continue;

      const center = hexCenter({ q, r });
      const length = clamp(speed * 2, 4, 20) / zoomLevel;

      // Normalize direction
      const nx = cell.windVector.u / speed;
      const ny = cell.windVector.v / speed;

      // Arrow shaft
      const x1 = center.x - nx * length * 0.5;
      const y1 = center.y - ny * length * 0.5;
      const x2 = center.x + nx * length * 0.5;
      const y2 = center.y + ny * length * 0.5;

      ctx.lineWidth = 1 / zoomLevel;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Arrowhead
      const headSize = 3 / zoomLevel;
      const perpX = -ny;
      const perpY = nx;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - nx * headSize + perpX * headSize * 0.5, y2 - ny * headSize + perpY * headSize * 0.5);
      ctx.lineTo(x2 - nx * headSize - perpX * headSize * 0.5, y2 - ny * headSize - perpY * headSize * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

/** Pre-allocated canvas pair for cloud rendering (draw + blur) */
export interface CloudCanvasRefs {
  draw: HTMLCanvasElement;
  blur: HTMLCanvasElement;
}

/**
 * Ensure cloud canvas refs exist and have the correct dimensions.
 */
export function ensureCloudCanvases(
  refs: CloudCanvasRefs | null,
  width: number,
  height: number
): CloudCanvasRefs {
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
 * Render cloud cover as a blurred gray/white haze layer.
 * Returns an offscreen canvas for compositing.
 */
export function renderCloudCover(
  field: WeatherField,
  gridWidth: number,
  gridHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  offsetX: number,
  offsetY: number,
  zoomLevel: number,
  canvasRefs?: CloudCanvasRefs | null,
  visibleRange?: HexRange | null
): HTMLCanvasElement | null {
  if (Object.keys(field).length === 0) return null;

  const refs = canvasRefs || ensureCloudCanvases(null, canvasWidth, canvasHeight);
  const offscreen = refs.draw;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const qMin = visibleRange ? visibleRange.qMin : 0;
  const qMax = visibleRange ? visibleRange.qMax : gridWidth - 1;
  const rMin = visibleRange ? visibleRange.rMin : 0;
  const rMax = visibleRange ? visibleRange.rMax : gridHeight - 1;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(zoomLevel, zoomLevel);

  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      const key = `${q},${r}`;
      const cell = field[key];
      if (!cell) continue;

      const cc = cell.cloudCover;
      if (cc < 0.05) continue;

      let color: string;
      if (cc < 0.5) {
        color = `rgba(180, 190, 200, ${0.15 + cc * 0.3})`;
      } else if (cc < 0.8) {
        color = `rgba(160, 170, 180, ${0.3 + cc * 0.3})`;
      } else {
        color = `rgba(140, 140, 150, ${0.5 + cc * 0.3})`;
      }

      const center = hexCenter({ q, r });
      drawHexPath(ctx, center, HEX_SIZE);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  ctx.restore();

  // Apply Gaussian blur for smooth cloud edges
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
 * Render ground shadows cast by clouds, offset by wind direction.
 * Returns an offscreen canvas to composite with 'multiply' blend mode.
 */
export function renderCloudShadows(
  field: WeatherField,
  gridWidth: number,
  gridHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  offsetX: number,
  offsetY: number,
  zoomLevel: number,
  canvasRefs?: CloudCanvasRefs | null,
  visibleRange?: HexRange | null
): HTMLCanvasElement | null {
  if (Object.keys(field).length === 0) return null;

  const refs = canvasRefs || ensureCloudCanvases(null, canvasWidth, canvasHeight);
  const offscreen = refs.draw;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return null;

  // Fill with white (neutral for multiply blend)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const qMin = visibleRange ? visibleRange.qMin : 0;
  const qMax = visibleRange ? visibleRange.qMax : gridWidth - 1;
  const rMin = visibleRange ? visibleRange.rMin : 0;
  const rMax = visibleRange ? visibleRange.rMax : gridHeight - 1;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(zoomLevel, zoomLevel);

  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      const key = `${q},${r}`;
      const cell = field[key];
      if (!cell || cell.cloudCover < 0.2) continue;

      const intensity = cell.cloudCover * 0.3;
      const center = hexCenter({ q, r });

      // Offset shadow by wind direction
      const dx = cell.windVector.u * 3;
      const dy = cell.windVector.v * 3;

      ctx.save();
      ctx.translate(dx, dy);
      drawHexPath(ctx, center, HEX_SIZE);
      ctx.fillStyle = `rgba(0, 0, 0, ${intensity})`;
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();

  // Apply heavy Gaussian blur for soft shadow edges
  const blurAmount = Math.max(6, 10 * zoomLevel);
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
