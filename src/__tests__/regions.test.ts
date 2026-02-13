import { describe, it, expect } from 'vitest';
import {
  getHexNeighbors,
  areHexesAdjacent,
  getValidNeighbors
} from '../services/hexGeometry';
import {
  getRegionForHex,
  getRegionHexes,
  isAdjacentToRegion,
  isRegionContiguous,
  createHexRegionMap,
  getRegionBorderSegments
} from '../services/regions';
import { createRegion, type Region } from '../types/Campaign';

// Helper to make a region with specific hex keys
function makeRegion(overrides: Partial<Region> = {}): Region {
  return {
    ...createRegion('Test Region', '#4a9eff'),
    ...overrides
  };
}

// ============================================================================
// Hex Neighbor Tests
// ============================================================================

describe('getHexNeighbors', () => {
  it('returns 6 neighbors for an even column hex', () => {
    const neighbors = getHexNeighbors({ q: 2, r: 2 });
    expect(neighbors).toHaveLength(6);
    // Even column: east-north is (q+1, r-1), east-south is (q+1, r), etc.
    expect(neighbors).toContainEqual({ q: 3, r: 1 }); // east-north
    expect(neighbors).toContainEqual({ q: 3, r: 2 }); // east-south
    expect(neighbors).toContainEqual({ q: 2, r: 3 }); // south
    expect(neighbors).toContainEqual({ q: 1, r: 2 }); // west-south
    expect(neighbors).toContainEqual({ q: 1, r: 1 }); // west-north
    expect(neighbors).toContainEqual({ q: 2, r: 1 }); // north
  });

  it('returns 6 neighbors for an odd column hex', () => {
    const neighbors = getHexNeighbors({ q: 3, r: 2 });
    expect(neighbors).toHaveLength(6);
    // Odd column: east-north is (q+1, r), east-south is (q+1, r+1), etc.
    expect(neighbors).toContainEqual({ q: 4, r: 2 }); // east-north
    expect(neighbors).toContainEqual({ q: 4, r: 3 }); // east-south
    expect(neighbors).toContainEqual({ q: 3, r: 3 }); // south
    expect(neighbors).toContainEqual({ q: 2, r: 3 }); // west-south
    expect(neighbors).toContainEqual({ q: 2, r: 2 }); // west-north
    expect(neighbors).toContainEqual({ q: 3, r: 1 }); // north
  });

  it('handles origin hex (0,0)', () => {
    const neighbors = getHexNeighbors({ q: 0, r: 0 });
    expect(neighbors).toHaveLength(6);
    // Even column at origin
    expect(neighbors).toContainEqual({ q: 1, r: -1 }); // east-north (out of bounds in a grid)
    expect(neighbors).toContainEqual({ q: 1, r: 0 });  // east-south
    expect(neighbors).toContainEqual({ q: 0, r: 1 });  // south
  });
});

describe('areHexesAdjacent', () => {
  it('returns true for adjacent hexes', () => {
    expect(areHexesAdjacent({ q: 2, r: 2 }, { q: 2, r: 3 })).toBe(true);
    expect(areHexesAdjacent({ q: 2, r: 2 }, { q: 3, r: 2 })).toBe(true);
  });

  it('returns false for non-adjacent hexes', () => {
    expect(areHexesAdjacent({ q: 0, r: 0 }, { q: 2, r: 2 })).toBe(false);
    expect(areHexesAdjacent({ q: 0, r: 0 }, { q: 0, r: 2 })).toBe(false);
  });

  it('is symmetric', () => {
    const a = { q: 3, r: 2 };
    const b = { q: 3, r: 3 };
    expect(areHexesAdjacent(a, b)).toBe(areHexesAdjacent(b, a));
  });
});

describe('getValidNeighbors', () => {
  it('returns only in-bounds neighbors', () => {
    // Corner hex (0,0) in a 5x5 grid
    const neighbors = getValidNeighbors({ q: 0, r: 0 }, 5, 5);
    // Should exclude any with negative coordinates
    for (const n of neighbors) {
      expect(n.q).toBeGreaterThanOrEqual(0);
      expect(n.r).toBeGreaterThanOrEqual(0);
      expect(n.q).toBeLessThan(5);
      expect(n.r).toBeLessThan(5);
    }
  });

  it('returns all 6 neighbors for an interior hex', () => {
    const neighbors = getValidNeighbors({ q: 2, r: 2 }, 5, 5);
    expect(neighbors).toHaveLength(6);
  });
});

// ============================================================================
// Region Service Tests
// ============================================================================

describe('getRegionForHex', () => {
  it('returns the region containing the hex', () => {
    const region = makeRegion({ hexKeys: ['1,2', '3,4'] });
    const result = getRegionForHex([region], { q: 3, r: 4 });
    expect(result).toBe(region);
  });

  it('returns undefined for a hex not in any region', () => {
    const region = makeRegion({ hexKeys: ['1,2'] });
    const result = getRegionForHex([region], { q: 5, r: 5 });
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty regions array', () => {
    const result = getRegionForHex([], { q: 0, r: 0 });
    expect(result).toBeUndefined();
  });
});

describe('getRegionHexes', () => {
  it('parses hex keys into coordinates', () => {
    const region = makeRegion({ hexKeys: ['0,0', '1,2', '3,4'] });
    const hexes = getRegionHexes(region);
    expect(hexes).toHaveLength(3);
    expect(hexes).toContainEqual({ q: 0, r: 0 });
    expect(hexes).toContainEqual({ q: 1, r: 2 });
    expect(hexes).toContainEqual({ q: 3, r: 4 });
  });

  it('handles empty hexKeys', () => {
    const region = makeRegion({ hexKeys: [] });
    expect(getRegionHexes(region)).toHaveLength(0);
  });
});

describe('isAdjacentToRegion', () => {
  it('returns true when hex is adjacent to a region hex', () => {
    const region = makeRegion({ hexKeys: ['2,2'] });
    // (2,3) is south neighbor of (2,2)
    expect(isAdjacentToRegion({ q: 2, r: 3 }, region)).toBe(true);
  });

  it('returns false when hex is not adjacent to any region hex', () => {
    const region = makeRegion({ hexKeys: ['0,0'] });
    expect(isAdjacentToRegion({ q: 5, r: 5 }, region)).toBe(false);
  });
});

describe('isRegionContiguous', () => {
  it('returns true for a single hex', () => {
    const region = makeRegion({ hexKeys: ['2,2'] });
    expect(isRegionContiguous(region)).toBe(true);
  });

  it('returns true for empty region', () => {
    const region = makeRegion({ hexKeys: [] });
    expect(isRegionContiguous(region)).toBe(true);
  });

  it('returns true for connected hexes', () => {
    // Vertical line in even column
    const region = makeRegion({ hexKeys: ['2,2', '2,3', '2,4'] });
    expect(isRegionContiguous(region)).toBe(true);
  });

  it('returns false for disconnected hexes', () => {
    // Two hexes far apart
    const region = makeRegion({ hexKeys: ['0,0', '10,10'] });
    expect(isRegionContiguous(region)).toBe(false);
  });

  it('handles L-shaped connected regions', () => {
    // L shape using even column neighbors
    const region = makeRegion({ hexKeys: ['2,2', '2,3', '3,3'] });
    expect(isRegionContiguous(region)).toBe(true);
  });
});

describe('createHexRegionMap', () => {
  it('maps hex keys to their regions', () => {
    const r1 = makeRegion({ id: 'r1', hexKeys: ['0,0', '0,1'] });
    const r2 = makeRegion({ id: 'r2', hexKeys: ['2,2', '2,3'] });
    const map = createHexRegionMap([r1, r2]);

    expect(map.get('0,0')).toBe(r1);
    expect(map.get('0,1')).toBe(r1);
    expect(map.get('2,2')).toBe(r2);
    expect(map.get('2,3')).toBe(r2);
    expect(map.get('5,5')).toBeUndefined();
  });

  it('returns empty map for no regions', () => {
    const map = createHexRegionMap([]);
    expect(map.size).toBe(0);
  });
});

describe('getRegionBorderSegments', () => {
  it('returns 6 border segments for a single hex region', () => {
    const region = makeRegion({ hexKeys: ['2,2'] });
    const segments = getRegionBorderSegments(region);
    // A single hex has all 6 edges as borders
    expect(segments).toHaveLength(6);
    // All should reference the same coord
    for (const seg of segments) {
      expect(seg.coord).toEqual({ q: 2, r: 2 });
    }
  });

  it('returns fewer border segments for adjacent hexes sharing an edge', () => {
    // Two hexes in the same column (vertical neighbors)
    const region = makeRegion({ hexKeys: ['2,2', '2,3'] });
    const segments = getRegionBorderSegments(region);
    // 2 hexes * 6 edges = 12 total, minus 2 shared internal edges = 10
    expect(segments).toHaveLength(10);
  });

  it('returns empty for empty region', () => {
    const region = makeRegion({ hexKeys: [] });
    const segments = getRegionBorderSegments(region);
    expect(segments).toHaveLength(0);
  });
});

// ============================================================================
// createRegion factory
// ============================================================================

describe('createRegion', () => {
  it('creates a region with default values', () => {
    const region = createRegion();
    expect(region.id).toBeTruthy();
    expect(region.name).toBe('');
    expect(region.color).toBe('#4a9eff');
    expect(region.hexKeys).toEqual([]);
    expect(region.tags).toEqual([]);
    expect(region.isDiscovered).toBe(false);
  });

  it('creates a region with custom name and color', () => {
    const region = createRegion('The Dark Woods', '#228B22');
    expect(region.name).toBe('The Dark Woods');
    expect(region.color).toBe('#228B22');
  });
});
