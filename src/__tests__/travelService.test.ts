import { describe, it, expect } from 'vitest';
import { hexDistance, findPath } from '../services/travelService';

describe('hexDistance', () => {
  it('returns 0 for same coordinate', () => {
    expect(hexDistance({ q: 3, r: 4 }, { q: 3, r: 4 })).toBe(0);
  });

  it('returns 1 for adjacent hexes', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(1);
  });

  it('returns correct distance for non-adjacent hexes', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: 0 })).toBe(3);
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 5 })).toBe(5);
  });
});

describe('findPath', () => {
  function makePassable(width: number, height: number): Set<string> {
    const keys = new Set<string>();
    for (let q = 0; q < width; q++) {
      for (let r = 0; r < height; r++) {
        keys.add(`${q},${r}`);
      }
    }
    return keys;
  }

  it('finds a path between adjacent hexes', () => {
    const passable = makePassable(5, 5);
    const path = findPath({ q: 0, r: 0 }, { q: 1, r: 0 }, passable, 5, 5);
    expect(path).not.toBeNull();
    expect(path!.length).toBe(2);
    expect(path![0]).toBe('0,0');
    expect(path![1]).toBe('1,0');
  });

  it('returns single-element array for same start and end', () => {
    const passable = makePassable(5, 5);
    const path = findPath({ q: 2, r: 2 }, { q: 2, r: 2 }, passable, 5, 5);
    expect(path).toEqual(['2,2']);
  });

  it('returns null when no path exists (blocked)', () => {
    // Create a wall that blocks all paths
    const passable = new Set<string>();
    passable.add('0,0');
    passable.add('4,4');
    // No intermediate hexes — can't reach
    const path = findPath({ q: 0, r: 0 }, { q: 4, r: 4 }, passable, 5, 5);
    expect(path).toBeNull();
  });

  it('returns null when start is not passable', () => {
    const passable = new Set<string>();
    passable.add('1,0');
    const path = findPath({ q: 0, r: 0 }, { q: 1, r: 0 }, passable, 5, 5);
    expect(path).toBeNull();
  });

  it('returns null when end is not passable', () => {
    const passable = new Set<string>();
    passable.add('0,0');
    const path = findPath({ q: 0, r: 0 }, { q: 1, r: 0 }, passable, 5, 5);
    expect(path).toBeNull();
  });

  it('avoids impassable hexes', () => {
    const passable = makePassable(5, 5);
    // Remove hex 1,0 to force a detour
    passable.delete('1,0');
    const path = findPath({ q: 0, r: 0 }, { q: 2, r: 0 }, passable, 5, 5);
    expect(path).not.toBeNull();
    // Path should not include the blocked hex
    expect(path!.includes('1,0')).toBe(false);
    // Path should start and end correctly
    expect(path![0]).toBe('0,0');
    expect(path![path!.length - 1]).toBe('2,0');
  });

  it('finds a longer path in a larger grid', () => {
    const passable = makePassable(10, 10);
    const path = findPath({ q: 0, r: 0 }, { q: 5, r: 5 }, passable, 10, 10);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(1);
    expect(path![0]).toBe('0,0');
    expect(path![path!.length - 1]).toBe('5,5');
  });
});
