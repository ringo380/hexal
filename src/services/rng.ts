// Seeded pseudo-random number generator using mulberry32 algorithm
// Provides deterministic randomness for reproducible procedural generation

/**
 * Convert a user-friendly seed string to a numeric seed.
 * Uses a simple hash (djb2) for consistent results.
 */
export function stringToSeed(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  // Ensure positive 32-bit integer
  return hash >>> 0;
}

/**
 * Seeded PRNG using the mulberry32 algorithm.
 * Produces deterministic sequences from a given numeric seed.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Pick a random item from an array */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Shuffle an array in-place (Fisher-Yates) and return it */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /**
   * Select an item by weighted probability.
   * @param items - array of items
   * @param getWeight - function returning the weight for each item
   */
  weightedChoice<T>(items: T[], getWeight: (item: T) => number): T {
    const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0);
    let roll = this.next() * totalWeight;
    for (const item of items) {
      roll -= getWeight(item);
      if (roll <= 0) return item;
    }
    return items[items.length - 1];
  }

  /**
   * Create an independent child RNG by combining the current state with a salt.
   * The child produces a different sequence from the parent but is itself deterministic.
   */
  fork(salt: string): SeededRNG {
    return new SeededRNG(this.state ^ stringToSeed(salt));
  }
}
