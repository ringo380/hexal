// Travel Service - Pure functions for travel mode pathfinding and hex utilities

import type { HexCoordinate } from '../types';
import { parseHexKey, hexKey } from '../types/Campaign';
import { getValidNeighbors } from './hexGeometry';

/**
 * Hex distance heuristic for A*.
 * Converts odd-q offset coordinates to cube coordinates, then returns max of abs deltas.
 */
export function hexDistance(a: HexCoordinate, b: HexCoordinate): number {
  // Convert odd-q offset to cube coordinates
  const ax = a.q;
  const az = a.r - Math.floor(a.q / 2);
  const ay = -ax - az;
  const bx = b.q;
  const bz = b.r - Math.floor(b.q / 2);
  const by = -bx - bz;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

/**
 * A* pathfinding between two hex coordinates.
 * Returns array of hex keys ("q,r") from start to end (inclusive), or null if no path.
 * `passableKeys` is the set of hex keys that can be traversed.
 */
export function findPath(
  start: HexCoordinate,
  end: HexCoordinate,
  passableKeys: Set<string>,
  gridWidth: number,
  gridHeight: number
): string[] | null {
  const startKey = hexKey(start);
  const endKey = hexKey(end);

  if (!passableKeys.has(startKey) || !passableKeys.has(endKey)) {
    return null;
  }

  if (startKey === endKey) {
    return [startKey];
  }

  // A* open set as a simple priority queue (array sorted by f-score)
  interface AStarNode {
    key: string;
    coord: HexCoordinate;
    g: number;
    f: number;
  }

  const openSet: AStarNode[] = [{ key: startKey, coord: start, g: 0, f: hexDistance(start, end) }];
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  gScore.set(startKey, 0);

  const closedSet = new Set<string>();

  while (openSet.length > 0) {
    // Pop the node with the lowest f-score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (current.key === endKey) {
      // Reconstruct path
      const path: string[] = [];
      let k = endKey;
      while (k !== undefined) {
        path.unshift(k);
        k = cameFrom.get(k)!;
        if (k === startKey) {
          path.unshift(startKey);
          break;
        }
      }
      return path;
    }

    closedSet.add(current.key);

    const neighbors = getValidNeighbors(current.coord, gridWidth, gridHeight);
    for (const neighbor of neighbors) {
      const nKey = hexKey(neighbor);
      if (closedSet.has(nKey) || !passableKeys.has(nKey)) continue;

      const tentativeG = current.g + 1;
      const existingG = gScore.get(nKey);

      if (existingG === undefined || tentativeG < existingG) {
        cameFrom.set(nKey, current.key);
        gScore.set(nKey, tentativeG);
        const f = tentativeG + hexDistance(neighbor, end);

        // Check if already in open set
        const existingIdx = openSet.findIndex(n => n.key === nKey);
        if (existingIdx >= 0) {
          openSet[existingIdx].g = tentativeG;
          openSet[existingIdx].f = f;
        } else {
          openSet.push({ key: nKey, coord: neighbor, g: tentativeG, f });
        }
      }
    }
  }

  return null; // No path found
}

/**
 * Build a set of passable hex keys from the campaign hexes.
 * All hexes that exist in the grid are considered passable.
 */
export function buildPassableKeys(
  gridWidth: number,
  gridHeight: number,
  hexes: Record<string, unknown>
): Set<string> {
  const keys = new Set<string>();
  for (let q = 0; q < gridWidth; q++) {
    for (let r = 0; r < gridHeight; r++) {
      const key = `${q},${r}`;
      if (hexes[key]) {
        keys.add(key);
      }
    }
  }
  return keys;
}

export { parseHexKey, hexKey };
