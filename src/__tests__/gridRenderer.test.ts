import { describe, it, expect } from 'vitest';
import { layoutTokensOnHex } from '../services/gridRenderer';

const CENTER = { x: 100, y: 200 };

describe('layoutTokensOnHex', () => {
  it('returns empty array for zero tokens', () => {
    expect(layoutTokensOnHex(CENTER, 0)).toEqual([]);
  });

  it('keeps the legacy single-token position (center, raised 10)', () => {
    const positions = layoutTokensOnHex(CENTER, 1);
    expect(positions).toHaveLength(1);
    expect(positions[0].x).toBeCloseTo(100);
    expect(positions[0].y).toBeCloseTo(190);
  });

  it('spreads multiple tokens to distinct positions', () => {
    const positions = layoutTokensOnHex(CENTER, 4);
    expect(positions).toHaveLength(4);
    const keys = new Set(positions.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`));
    expect(keys.size).toBe(4);
  });

  it('places a ring of tokens equidistant from the hex center', () => {
    const positions = layoutTokensOnHex(CENTER, 5);
    const dists = positions.map(p => Math.hypot(p.x - CENTER.x, p.y - CENTER.y));
    for (const d of dists) {
      expect(d).toBeCloseTo(dists[0]);
    }
  });

  it('keeps all tokens within the hex footprint (HEX_SIZE 30)', () => {
    for (const count of [2, 3, 6, 9, 12]) {
      const positions = layoutTokensOnHex(CENTER, count);
      for (const p of positions) {
        const d = Math.hypot(p.x - CENTER.x, p.y - CENTER.y);
        expect(d).toBeLessThanOrEqual(18);
      }
    }
  });

  it('is deterministic for the same count', () => {
    expect(layoutTokensOnHex(CENTER, 7)).toEqual(layoutTokensOnHex(CENTER, 7));
  });

  it('keeps every pair of tokens separated enough to stay visible', () => {
    for (let count = 2; count <= 12; count++) {
      const positions = layoutTokensOnHex(CENTER, count);
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const d = Math.hypot(positions[i].x - positions[j].x, positions[i].y - positions[j].y);
          expect(d, `count=${count} pair ${i},${j}`).toBeGreaterThanOrEqual(8);
        }
      }
    }
  });

  it('uses a second ring beyond six tokens so positions stay distinct', () => {
    const positions = layoutTokensOnHex(CENTER, 9);
    const keys = new Set(positions.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`));
    expect(keys.size).toBe(9);
    const dists = positions.map(p => Math.hypot(p.x - CENTER.x, p.y - CENTER.y));
    const uniqueRadii = new Set(dists.map(d => d.toFixed(3)));
    expect(uniqueRadii.size).toBe(2);
  });
});
