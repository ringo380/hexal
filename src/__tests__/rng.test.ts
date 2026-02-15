import { describe, it, expect } from 'vitest';
import { SeededRNG, stringToSeed } from '../services/rng';

describe('SeededRNG', () => {
  describe('determinism', () => {
    it('same seed produces identical sequence over 1000 calls', () => {
      const rng1 = new SeededRNG(42);
      const rng2 = new SeededRNG(42);

      for (let i = 0; i < 1000; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it('different seeds produce different sequences', () => {
      const rng1 = new SeededRNG(42);
      const rng2 = new SeededRNG(99);

      let sameCount = 0;
      for (let i = 0; i < 100; i++) {
        if (rng1.next() === rng2.next()) sameCount++;
      }
      expect(sameCount).toBeLessThan(5);
    });
  });

  describe('distribution', () => {
    it('next() output falls in [0, 1)', () => {
      const rng = new SeededRNG(12345);
      for (let i = 0; i < 10000; i++) {
        const val = rng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('mean approximates 0.5 over 10K samples', () => {
      const rng = new SeededRNG(67890);
      let sum = 0;
      const N = 10000;
      for (let i = 0; i < N; i++) {
        sum += rng.next();
      }
      const mean = sum / N;
      expect(mean).toBeGreaterThan(0.45);
      expect(mean).toBeLessThan(0.55);
    });
  });

  describe('nextInt', () => {
    it('results within [min, max] inclusive', () => {
      const rng = new SeededRNG(111);
      for (let i = 0; i < 1000; i++) {
        const val = rng.nextInt(3, 7);
        expect(val).toBeGreaterThanOrEqual(3);
        expect(val).toBeLessThanOrEqual(7);
      }
    });

    it('covers the full range', () => {
      const rng = new SeededRNG(222);
      const seen = new Set<number>();
      for (let i = 0; i < 1000; i++) {
        seen.add(rng.nextInt(0, 4));
      }
      expect(seen.size).toBe(5); // 0, 1, 2, 3, 4
    });
  });

  describe('weightedChoice', () => {
    it('item with weight 10 selected ~10x more than weight 1', () => {
      const rng = new SeededRNG(333);
      const items = [
        { name: 'heavy', weight: 10 },
        { name: 'light', weight: 1 }
      ];
      const counts: Record<string, number> = { heavy: 0, light: 0 };
      const N = 10000;

      for (let i = 0; i < N; i++) {
        const chosen = rng.weightedChoice(items, it => it.weight);
        counts[chosen.name]++;
      }

      // Heavy should be ~10x light (within reasonable variance)
      const ratio = counts.heavy / counts.light;
      expect(ratio).toBeGreaterThan(5);
      expect(ratio).toBeLessThan(20);
    });
  });

  describe('pick', () => {
    it('picks from array', () => {
      const rng = new SeededRNG(444);
      const arr = ['a', 'b', 'c'];
      for (let i = 0; i < 100; i++) {
        expect(arr).toContain(rng.pick(arr));
      }
    });
  });

  describe('shuffle', () => {
    it('shuffles deterministically', () => {
      const rng1 = new SeededRNG(555);
      const rng2 = new SeededRNG(555);

      const arr1 = [1, 2, 3, 4, 5];
      const arr2 = [1, 2, 3, 4, 5];

      rng1.shuffle(arr1);
      rng2.shuffle(arr2);

      expect(arr1).toEqual(arr2);
    });

    it('preserves all elements', () => {
      const rng = new SeededRNG(666);
      const arr = [10, 20, 30, 40, 50];
      rng.shuffle(arr);
      expect(arr.sort()).toEqual([10, 20, 30, 40, 50]);
    });
  });

  describe('fork', () => {
    it('produces different sequence from parent', () => {
      const parent = new SeededRNG(777);
      const child = parent.fork('child');

      let sameCount = 0;
      for (let i = 0; i < 100; i++) {
        if (parent.next() === child.next()) sameCount++;
      }
      expect(sameCount).toBeLessThan(5);
    });

    it('forked RNG is itself deterministic', () => {
      const parent1 = new SeededRNG(888);
      const child1 = parent1.fork('salt');

      const parent2 = new SeededRNG(888);
      const child2 = parent2.fork('salt');

      for (let i = 0; i < 100; i++) {
        expect(child1.next()).toBe(child2.next());
      }
    });
  });
});

describe('stringToSeed', () => {
  it('returns consistent numeric seed for same input', () => {
    expect(stringToSeed('hello')).toBe(stringToSeed('hello'));
    expect(stringToSeed('world')).toBe(stringToSeed('world'));
  });

  it('returns different seeds for different inputs', () => {
    expect(stringToSeed('hello')).not.toBe(stringToSeed('world'));
    expect(stringToSeed('abc')).not.toBe(stringToSeed('xyz'));
  });

  it('returns a positive number', () => {
    expect(stringToSeed('test')).toBeGreaterThan(0);
    expect(stringToSeed('')).toBeGreaterThan(0);
  });
});
