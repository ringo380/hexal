// Pure 2D Perlin noise implementation (no dependencies)
// Used by PerlinWeatherEngine for layered noise-based weather generation

const GRAD2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1]
];

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function dot2(g: number[], x: number, y: number): number {
  return g[0] * x + g[1] * y;
}

/**
 * Seeded 2D Perlin noise generator.
 * Create with a seed, then call noise(x, y) for values in [-1, 1].
 */
export class PerlinNoise2D {
  private perm: Uint8Array;

  constructor(seed: number) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    // Initialize permutation table with seed
    for (let i = 0; i < 256; i++) p[i] = i;
    // Fisher-Yates shuffle with seeded PRNG (mulberry32)
    let state = seed | 0;
    for (let i = 255; i > 0; i--) {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      const r = ((t ^ (t >>> 14)) >>> 0) % (i + 1);
      const tmp = p[i];
      p[i] = p[r];
      p[r] = tmp;
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  /** Returns noise value in [-1, 1] */
  noise(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = fade(xf);
    const v = fade(yf);

    const aa = this.perm[this.perm[xi] + yi];
    const ab = this.perm[this.perm[xi] + yi + 1];
    const ba = this.perm[this.perm[xi + 1] + yi];
    const bb = this.perm[this.perm[xi + 1] + yi + 1];

    const g00 = GRAD2[aa % 8];
    const g10 = GRAD2[ba % 8];
    const g01 = GRAD2[ab % 8];
    const g11 = GRAD2[bb % 8];

    const n00 = dot2(g00, xf, yf);
    const n10 = dot2(g10, xf - 1, yf);
    const n01 = dot2(g01, xf, yf - 1);
    const n11 = dot2(g11, xf - 1, yf - 1);

    return lerp(
      lerp(n00, n10, u),
      lerp(n01, n11, u),
      v
    );
  }

  /** Fractal Brownian Motion: layered noise with configurable octaves */
  fbm(x: number, y: number, octaves: number = 4, lacunarity: number = 2.0, gain: number = 0.5): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmp = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise(x * frequency, y * frequency);
      maxAmp += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return value / maxAmp;
  }
}
