import { describe, it, expect } from 'vitest';
import { randomUUIDFallback } from '../polyfills/randomUUID';

describe('randomUUIDFallback', () => {
  it('produces RFC 4122 version 4 UUIDs', () => {
    const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    for (let i = 0; i < 100; i++) {
      expect(randomUUIDFallback()).toMatch(v4);
    }
  });

  it('does not repeat', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => randomUUIDFallback()));
    expect(ids.size).toBe(1000);
  });
});
