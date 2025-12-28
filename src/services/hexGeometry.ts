// Direct port from Swift HexGeometry
// Offset coordinates using odd-q vertical layout

import type { HexCoordinate } from '../types';

export const HEX_SIZE = 30; // Size of hex (center to corner)
export const HORIZONTAL_SPACING = HEX_SIZE * 1.5;
export const VERTICAL_SPACING = HEX_SIZE * Math.sqrt(3);

/**
 * Calculate center point for a hex at given coordinate
 */
export function hexCenter(coord: HexCoordinate): { x: number; y: number } {
  const x = coord.q * HORIZONTAL_SPACING + HEX_SIZE;
  const yOffset = coord.q % 2 === 0 ? 0 : VERTICAL_SPACING / 2;
  const y = coord.r * VERTICAL_SPACING + yOffset + HEX_SIZE;
  return { x, y };
}

/**
 * Canvas size needed for grid
 */
export function canvasSize(width: number, height: number): { width: number; height: number } {
  return {
    width: width * HORIZONTAL_SPACING + HEX_SIZE,
    height: height * VERTICAL_SPACING + VERTICAL_SPACING / 2 + HEX_SIZE
  };
}

/**
 * Generate points for a flat-topped hexagon
 */
export function hexPoints(center: { x: number; y: number }, size: number = HEX_SIZE): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    points.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle)
    });
  }
  return points;
}

/**
 * Draw a hexagon path on a canvas context
 */
export function drawHexPath(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, size: number = HEX_SIZE): void {
  const points = hexPoints(center, size);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
}

/**
 * Find hex coordinate at a point
 */
export function coordinateAt(
  point: { x: number; y: number },
  gridWidth: number,
  gridHeight: number
): HexCoordinate | null {
  // Approximate column
  const q = Math.floor((point.x - HEX_SIZE / 2) / HORIZONTAL_SPACING);
  if (q < 0 || q >= gridWidth) return null;

  // Approximate row with offset adjustment
  const yOffset = q % 2 === 0 ? 0 : VERTICAL_SPACING / 2;
  const r = Math.floor((point.y - yOffset) / VERTICAL_SPACING);
  if (r < 0 || r >= gridHeight) return null;

  // Check if actually inside the hex
  const center = hexCenter({ q, r });
  const distance = Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2));

  if (distance <= HEX_SIZE) {
    return { q, r };
  }

  // Check neighbors for edge cases
  const neighbors: HexCoordinate[] = [
    { q: q - 1, r },
    { q: q + 1, r },
    { q, r: r - 1 },
    { q, r: r + 1 }
  ];

  for (const neighbor of neighbors) {
    if (neighbor.q < 0 || neighbor.q >= gridWidth || neighbor.r < 0 || neighbor.r >= gridHeight) {
      continue;
    }
    const nCenter = hexCenter(neighbor);
    const nDistance = Math.sqrt(Math.pow(point.x - nCenter.x, 2) + Math.pow(point.y - nCenter.y, 2));
    if (nDistance < distance && nDistance <= HEX_SIZE) {
      return neighbor;
    }
  }

  return { q, r };
}
