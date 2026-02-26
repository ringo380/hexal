// Offscreen canvas gradient renderer for weather radar overlay
// Draws per-hex colored fills with Gaussian blur for smooth transitions

import type { WeatherField, WeatherFieldCell, WeatherSimulationConfig } from '../types/Weather';
import { hexCenter, drawHexPath, HEX_SIZE } from './hexGeometry';
import { clamp } from './weather/WeatherField';

/** Color mapping functions for different overlay modes */

function precipitationColor(cell: WeatherFieldCell): string {
  const i = cell.precipIntensity;
  if (i < 0.05) return 'transparent';
  if (i < 0.2) return `rgba(0, 200, 50, ${0.3 + i * 2})`;      // Green (light)
  if (i < 0.4) return `rgba(180, 200, 0, ${0.4 + i})`;           // Yellow
  if (i < 0.6) return `rgba(255, 140, 0, ${0.5 + i * 0.5})`;     // Orange
  if (i < 0.8) return `rgba(255, 40, 40, ${0.6 + i * 0.3})`;     // Red
  return `rgba(180, 0, 180, ${0.7 + i * 0.2})`;                   // Purple (extreme)
}

function temperatureColor(cell: WeatherFieldCell): string {
  const t = cell.temperature;
  if (t < -10) return `rgba(50, 50, 200, 0.7)`;         // Deep blue
  if (t < 0) return `rgba(80, 120, 220, 0.6)`;           // Blue
  if (t < 10) return `rgba(100, 180, 220, 0.5)`;         // Light blue
  if (t < 20) return `rgba(100, 200, 100, 0.4)`;         // Green
  if (t < 30) return `rgba(220, 200, 50, 0.5)`;          // Yellow
  if (t < 40) return `rgba(220, 100, 30, 0.6)`;          // Orange
  return `rgba(200, 30, 30, 0.7)`;                        // Red (extreme heat)
}

function pressureColor(cell: WeatherFieldCell): string {
  const p = cell.pressure;
  const norm = clamp((p - 985) / 60, 0, 1); // 985-1045 range mapped to 0-1
  const r = Math.round(norm * 200);
  const g = Math.round(norm * 200);
  const b = Math.round((1 - norm) * 150 + 50);
  return `rgba(${r}, ${g}, ${b}, 0.45)`;
}

function windColor(cell: WeatherFieldCell): string {
  const speed = Math.sqrt(cell.windVector.u * cell.windVector.u + cell.windVector.v * cell.windVector.v);
  const norm = clamp(speed / 15, 0, 1);
  if (norm < 0.15) return 'transparent';
  const r = Math.round(norm * 255);
  const g = Math.round((1 - norm) * 200);
  return `rgba(${r}, ${g}, 80, ${0.2 + norm * 0.4})`;
}

const COLOR_MAP: Record<string, (cell: WeatherFieldCell) => string> = {
  precipitation: precipitationColor,
  temperature: temperatureColor,
  pressure: pressureColor,
  wind: windColor
};

/**
 * Render weather gradient overlay to an offscreen canvas.
 * Returns the offscreen canvas for compositing onto the main canvas.
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
  zoomLevel: number
): HTMLCanvasElement | null {
  if (!config.enabled || Object.keys(field).length === 0) return null;

  const offscreen = document.createElement('canvas');
  offscreen.width = canvasWidth;
  offscreen.height = canvasHeight;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return null;

  const colorFn = COLOR_MAP[config.overlayMode] || precipitationColor;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(zoomLevel, zoomLevel);

  // Draw hex-by-hex colored fills
  for (let q = 0; q < gridWidth; q++) {
    for (let r = 0; r < gridHeight; r++) {
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
  // Use a second canvas to avoid undefined behavior from self-draw
  const blurAmount = Math.max(2, Math.min(8, 4 * zoomLevel));
  const blurred = document.createElement('canvas');
  blurred.width = canvasWidth;
  blurred.height = canvasHeight;
  const blurCtx = blurred.getContext('2d');
  if (blurCtx) {
    blurCtx.filter = `blur(${blurAmount}px)`;
    blurCtx.drawImage(offscreen, 0, 0);
    blurCtx.filter = 'none';
    return blurred;
  }

  return offscreen;
}

/**
 * Render isobar lines (pressure contours) — DM only.
 * Draws contour lines at regular pressure intervals.
 */
export function renderIsobars(
  ctx: CanvasRenderingContext2D,
  field: WeatherField,
  gridWidth: number,
  gridHeight: number,
  zoomLevel: number
): void {
  const interval = 5; // hPa between isobar lines
  ctx.save();
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.35)';
  ctx.lineWidth = 1 / zoomLevel;
  ctx.setLineDash([3 / zoomLevel, 3 / zoomLevel]);

  for (let q = 0; q < gridWidth; q++) {
    for (let r = 0; r < gridHeight; r++) {
      const key = `${q},${r}`;
      const cell = field[key];
      if (!cell) continue;

      const roundedP = Math.round(cell.pressure / interval) * interval;
      if (Math.abs(cell.pressure - roundedP) > 1) continue;

      // Check if any neighbor crosses this contour
      const neighbors: [number, number][] = [
        [q + 1, r], [q - 1, r], [q, r + 1], [q, r - 1]
      ];

      for (const [nq, nr] of neighbors) {
        const nk = `${nq},${nr}`;
        const neighbor = field[nk];
        if (!neighbor) continue;

        const nRoundedP = Math.round(neighbor.pressure / interval) * interval;
        if (roundedP !== nRoundedP) {
          // Draw a short line segment between hex centers
          const c1 = hexCenter({ q, r });
          const c2 = hexCenter({ q: nq, r: nr });
          const mx = (c1.x + c2.x) / 2;
          const my = (c1.y + c2.y) / 2;

          ctx.beginPath();
          ctx.moveTo(c1.x, c1.y);
          ctx.lineTo(mx, my);
          ctx.stroke();
          break;
        }
      }
    }
  }

  ctx.restore();
}

/**
 * Render weather front lines — DM only.
 * Blue triangles for cold fronts, red semicircles for warm fronts.
 */
export function renderFronts(
  ctx: CanvasRenderingContext2D,
  field: WeatherField,
  gridWidth: number,
  gridHeight: number,
  zoomLevel: number
): void {
  ctx.save();
  ctx.lineWidth = 2.5 / zoomLevel;

  for (let q = 0; q < gridWidth; q++) {
    for (let r = 0; r < gridHeight; r++) {
      const key = `${q},${r}`;
      const cell = field[key];
      if (!cell || cell.frontType === 'none') continue;

      const center = hexCenter({ q, r });
      const size = 4 / zoomLevel;

      if (cell.frontType === 'cold') {
        ctx.strokeStyle = 'rgba(80, 130, 255, 0.7)';
        ctx.fillStyle = 'rgba(80, 130, 255, 0.5)';
        // Draw small triangle
        ctx.beginPath();
        ctx.moveTo(center.x, center.y - size);
        ctx.lineTo(center.x - size * 0.8, center.y + size * 0.5);
        ctx.lineTo(center.x + size * 0.8, center.y + size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (cell.frontType === 'warm') {
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.7)';
        ctx.fillStyle = 'rgba(255, 80, 80, 0.5)';
        // Draw small semicircle
        ctx.beginPath();
        ctx.arc(center.x, center.y, size, 0, Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        // Occluded front: purple
        ctx.strokeStyle = 'rgba(160, 80, 200, 0.7)';
        ctx.fillStyle = 'rgba(160, 80, 200, 0.5)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}
