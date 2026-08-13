// gridRenderer - Canvas render passes shared by HexGrid (DM) and PlayerHexGrid.
//
// Only passes whose behavior is genuinely identical between the two grids live
// here; per-view differences are parameterized (skipUndiscovered, dimInvisible).
// The PASS 1 background/content loops stay inline in each grid on purpose:
// the player view's fog-of-war, adjacency opacity, and undiscovered gating are
// intentional divergence, not drift.

import { Region, MarkerPosition, Hex } from '../types';
import type { MarkerType } from '../types/Markers';
import { hexCenter, drawHexPath, hexPoints, HEX_SIZE } from './hexGeometry';
import { hexToRgba, renderMarkers } from './hexRenderer';
import { getRegionBorderSegments } from './regions';

export interface HexRange {
  qMin: number;
  qMax: number;
  rMin: number;
  rMax: number;
}

/** Minimal hex shape needed by the connection pass (DM Hex and PlayerHex both satisfy it). */
interface ConnectableHex {
  status: string;
  connections?: { rivers: number[]; roads: number[] };
}

/** Minimal region shape needed by the label pass (Region and PlayerRegion both satisfy it). */
interface LabeledRegion {
  name: string;
  color: string;
  hexKeys: string[];
}

/** Character token shape (DM PlayerCharacter and player PlayerCharacterToken both satisfy it). */
export interface CharacterToken {
  id: string;
  hexKey?: string | null;
  color: string;
  icon: string;
  name: string;
  isVisible?: boolean;
}

/** Token position collected for hit-testing (world coordinates). */
export interface TokenPosition {
  characterId: string;
  x: number;
  y: number;
  radius: number;
}

// Neighbor-to-edge index mapping for region border rendering
const NEIGHBOR_TO_EDGE = [5, 0, 1, 2, 3, 4];

// Character token geometry
const TOKEN_RADIUS = 8;
const TOKEN_RING_INNER = 10;   // ring radius for up to 6 tokens
const TOKEN_RING_OUTER = 15;   // wider ring used above 6 (with one token centered)
const TOKEN_RING_CAPACITY = 6;

/**
 * Lay out N character tokens on one hex. A single token keeps the legacy
 * position (hex center raised 10); 2-6 tokens spread on a ring around the
 * hex center; above 6, one token sits at the center and the rest on a wider
 * ring (two symmetric rings can't guarantee separation for arbitrary counts).
 * Deterministic: index order in equals position order out.
 */
export function layoutTokensOnHex(
  center: { x: number; y: number },
  count: number
): { x: number; y: number }[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: center.x, y: center.y - 10 }];

  const positions: { x: number; y: number }[] = [];
  let ringCount = count;
  let radius = TOKEN_RING_INNER;
  if (count > TOKEN_RING_CAPACITY) {
    positions.push({ x: center.x, y: center.y });
    ringCount = count - 1;
    radius = TOKEN_RING_OUTER;
  }
  for (let i = 0; i < ringCount; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / ringCount;
    positions.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    });
  }
  return positions;
}

/**
 * Render multi-selection overlay (DM view only)
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
 * Render connections (rivers and roads). Caller gates on layer visibility;
 * the zoom gates live here (pass at 0.25, roads at 0.40).
 */
export function renderAllConnections(
  ctx: CanvasRenderingContext2D,
  getHex: (q: number, r: number) => ConnectableHex | null | undefined,
  visibleRange: HexRange,
  zoomLevel: number,
  skipUndiscovered = false
) {
  if (zoomLevel < 0.25) return;

  for (let q = visibleRange.qMin; q <= visibleRange.qMax; q++) {
    for (let r = visibleRange.rMin; r <= visibleRange.rMax; r++) {
      const hex = getHex(q, r);
      if (!hex?.connections) continue;
      if (skipUndiscovered && hex.status === 'undiscovered') continue;
      const center = hexCenter({ q, r });
      const points = hexPoints(center, HEX_SIZE);

      // Draw rivers (blue curved lines)
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
          // Curve through hex center for organic look
          const cpX = center.x + (edgeMidX - center.x) * 0.3;
          const cpY = center.y + (edgeMidY - center.y) * 0.3;
          ctx.quadraticCurveTo(cpX, cpY, center.x, center.y);
          ctx.stroke();
        }
      }

      // Draw roads (brown dashed lines)
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
 * Render region boundary edges. Caller gates on layer visibility.
 */
export function renderRegionBorders(
  ctx: CanvasRenderingContext2D,
  regions: Region[]
) {
  for (const region of regions) {
    if (region.hexKeys.length === 0) continue;
    const borderSegments = getRegionBorderSegments(region);

    ctx.strokeStyle = hexToRgba(region.color, 0.6);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    for (const segment of borderSegments) {
      const center = hexCenter(segment.coord);
      const points = hexPoints(center, HEX_SIZE);
      const edgeIndex = NEIGHBOR_TO_EDGE[segment.edgeIndex];
      const p1 = points[edgeIndex];
      const p2 = points[(edgeIndex + 1) % 6];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }
}

/**
 * Render region name labels at overview zoom levels. Caller gates on layer
 * visibility; the zoom window (0.25 - 0.80) lives here.
 */
export function renderRegionLabels(
  ctx: CanvasRenderingContext2D,
  regions: LabeledRegion[],
  zoomLevel: number
) {
  if (zoomLevel < 0.25 || zoomLevel > 0.80) return;

  let currentFont = '';
  let currentAlign = '';
  let currentBaseline = '';

  for (const region of regions) {
    if (region.hexKeys.length === 0) continue;

    // Calculate bounding box center of region hexes
    let sumX = 0, sumY = 0;
    for (const key of region.hexKeys) {
      const parsed = key.split(',');
      const rq = parseInt(parsed[0], 10);
      const rr = parseInt(parsed[1], 10);
      const c = hexCenter({ q: rq, r: rr });
      sumX += c.x;
      sumY += c.y;
    }
    const cx = sumX / region.hexKeys.length;
    const cy = sumY / region.hexKeys.length;

    const fontSize = Math.max(8, Math.min(14, 10 / zoomLevel));
    const wantFont = `bold ${fontSize}px sans-serif`;
    if (currentFont !== wantFont) { ctx.font = wantFont; currentFont = wantFont; }
    if (currentAlign !== 'center') { ctx.textAlign = 'center'; currentAlign = 'center'; }
    if (currentBaseline !== 'middle') { ctx.textBaseline = 'middle'; currentBaseline = 'middle'; }
    ctx.fillStyle = hexToRgba(region.color, 0.9);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(region.name, cx, cy);
    ctx.shadowBlur = 0;
  }
}

/**
 * Render markers (figurines) for all visible hexes. Caller gates on LOD and
 * layer visibility, and filters via getHex (return null to skip a hex).
 */
export function renderAllMarkers(
  ctx: CanvasRenderingContext2D,
  getHex: (q: number, r: number) => Hex | null | undefined,
  visibleRange: HexRange,
  zoomLevel: number,
  markerTypes: MarkerType[],
  options?: { selectedMarkerId?: string; markerPositions?: MarkerPosition[] }
) {
  for (let q = visibleRange.qMin; q <= visibleRange.qMax; q++) {
    for (let r = visibleRange.rMin; r <= visibleRange.rMax; r++) {
      const hex = getHex(q, r);
      if (hex && hex.markers && hex.markers.length > 0) {
        const positions = renderMarkers(
          ctx,
          hex,
          hexCenter({ q, r }),
          markerTypes,
          zoomLevel,
          options?.selectedMarkerId
        );
        options?.markerPositions?.push(...positions);
      }
    }
  }
}

/**
 * Render character tokens (player characters on the map).
 * dimInvisible: DM view renders tokens with isVisible=false at reduced opacity.
 * skipUndiscovered: player view hides tokens on undiscovered hexes.
 */
export function renderCharacterTokens(
  ctx: CanvasRenderingContext2D,
  characters: CharacterToken[],
  getHexByKey: (key: string) => { status: string } | null | undefined,
  visibleRange: HexRange,
  zoomLevel: number,
  options?: {
    dimInvisible?: boolean;
    skipUndiscovered?: boolean;
    tokenPositions?: TokenPosition[];
  }
) {
  let currentFont = '';
  let currentAlign = '';
  let currentBaseline = '';

  // Group placed characters by hex so co-located tokens fan out instead of stacking
  const byHex = new Map<string, CharacterToken[]>();
  for (const char of characters) {
    if (!char.hexKey) continue;
    const hex = getHexByKey(char.hexKey);
    if (!hex) continue;
    if (options?.skipUndiscovered && hex.status === 'undiscovered') continue;
    const group = byHex.get(char.hexKey);
    if (group) group.push(char);
    else byHex.set(char.hexKey, [char]);
  }

  for (const [key, group] of byHex) {
    const parts = key.split(',');
    const cq = parseInt(parts[0], 10);
    const cr = parseInt(parts[1], 10);
    if (cq < visibleRange.qMin || cq > visibleRange.qMax || cr < visibleRange.rMin || cr > visibleRange.rMax) continue;

    const center = hexCenter({ q: cq, r: cr });
    const layout = layoutTokensOnHex(center, group.length);

    for (let i = 0; i < group.length; i++) {
      const char = group[i];
      const pos = layout[i];
      const dimmed = options?.dimInvisible === true && !char.isVisible;

      options?.tokenPositions?.push({
        characterId: char.id,
        x: pos.x,
        y: pos.y,
        radius: TOKEN_RADIUS
      });

      // Draw circular token (slightly transparent for invisible characters in DM view)
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, TOKEN_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = dimmed ? hexToRgba(char.color, 0.4) : char.color;
      ctx.fill();
      ctx.strokeStyle = dimmed ? 'rgba(255, 255, 255, 0.4)' : '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw icon
      const wantFont = '10px sans-serif';
      if (currentFont !== wantFont) { ctx.font = wantFont; currentFont = wantFont; }
      if (currentAlign !== 'center') { ctx.textAlign = 'center'; currentAlign = 'center'; }
      if (currentBaseline !== 'middle') { ctx.textBaseline = 'middle'; currentBaseline = 'middle'; }
      ctx.fillStyle = dimmed ? 'rgba(255, 255, 255, 0.4)' : '#fff';
      ctx.fillText(char.icon, pos.x, pos.y);

      // Draw name label if zoomed in enough
      if (zoomLevel >= 0.6) {
        const nameFont = 'bold 5px sans-serif';
        if (currentFont !== nameFont) { ctx.font = nameFont; currentFont = nameFont; }
        ctx.fillStyle = dimmed ? hexToRgba(char.color, 0.4) : char.color;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 2;
        ctx.fillText(char.name, pos.x, pos.y + 9);
        ctx.shadowBlur = 0;
      }
    }
  }
}

/**
 * Render the ghost of a character token being dragged (screen coordinates,
 * call after the world-space transform is restored).
 */
export function renderTokenDragGhost(
  ctx: CanvasRenderingContext2D,
  token: CharacterToken,
  screenPos: { x: number; y: number },
  zoomLevel: number
) {
  const radius = TOKEN_RADIUS * Math.max(1, zoomLevel);
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = token.color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = `${Math.round(10 * Math.max(1, zoomLevel))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(token.icon, screenPos.x, screenPos.y);
  ctx.restore();
}

/**
 * Render the party position marker (gold circle with "P" label).
 */
export function renderPartyMarker(
  ctx: CanvasRenderingContext2D,
  partyCenter: { x: number; y: number }
) {
  ctx.save();
  // Gold circle
  ctx.beginPath();
  ctx.arc(partyCenter.x, partyCenter.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // "P" label
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.fillText('P', partyCenter.x, partyCenter.y);
  ctx.restore();
}
