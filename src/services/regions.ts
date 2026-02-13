// Region service - pure utility functions for region operations

import type { Region, HexCoordinate } from '../types';
import { hexKey, parseHexKey } from '../types/Campaign';
import { getHexNeighbors } from './hexGeometry';

/** Find which region a hex belongs to */
export function getRegionForHex(regions: Region[], coord: HexCoordinate): Region | undefined {
  const key = hexKey(coord);
  return regions.find(r => r.hexKeys.includes(key));
}

/** Parse a region's hexKeys into HexCoordinate objects */
export function getRegionHexes(region: Region): HexCoordinate[] {
  return region.hexKeys
    .map(k => parseHexKey(k))
    .filter((c): c is HexCoordinate => c !== null);
}

/** Check if a coordinate is adjacent to any hex in a region */
export function isAdjacentToRegion(coord: HexCoordinate, region: Region): boolean {
  const neighbors = getHexNeighbors(coord);
  return neighbors.some(n => region.hexKeys.includes(hexKey(n)));
}

/** Validate that all hexes in a region form a single connected group (flood fill) */
export function isRegionContiguous(region: Region): boolean {
  if (region.hexKeys.length <= 1) return true;

  const remaining = new Set(region.hexKeys);
  const first = region.hexKeys[0];
  const queue = [first];
  remaining.delete(first);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const coord = parseHexKey(current);
    if (!coord) continue;

    const neighbors = getHexNeighbors(coord);
    for (const neighbor of neighbors) {
      const nKey = hexKey(neighbor);
      if (remaining.has(nKey)) {
        remaining.delete(nKey);
        queue.push(nKey);
      }
    }
  }

  return remaining.size === 0;
}

/** Build a fast lookup map from hex key to region */
export function createHexRegionMap(regions: Region[]): Map<string, Region> {
  const map = new Map<string, Region>();
  for (const region of regions) {
    for (const key of region.hexKeys) {
      map.set(key, region);
    }
  }
  return map;
}

/** Identifies which edges of region hexes are on the boundary (neighbor not in same region) */
export function getRegionBorderSegments(
  region: Region
): Array<{ coord: HexCoordinate; edgeIndex: number }> {
  const keySet = new Set(region.hexKeys);
  const segments: Array<{ coord: HexCoordinate; edgeIndex: number }> = [];

  for (const key of region.hexKeys) {
    const coord = parseHexKey(key);
    if (!coord) continue;

    const neighbors = getHexNeighbors(coord);
    for (let i = 0; i < 6; i++) {
      const neighborKey = hexKey(neighbors[i]);
      if (!keySet.has(neighborKey)) {
        segments.push({ coord, edgeIndex: i });
      }
    }
  }

  return segments;
}
