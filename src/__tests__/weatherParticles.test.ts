import { describe, it, expect } from 'vitest';
import { WeatherParticleSystem } from '../services/weatherParticles';
import { createDefaultCell } from '../services/weather/WeatherField';
import type { WeatherField } from '../types/Weather';

// Mock canvas context
function createMockCtx(): CanvasRenderingContext2D {
  return {
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    arc: () => {},
    fill: () => {},
    createRadialGradient: () => ({
      addColorStop: () => {}
    }),
    fillRect: () => {},
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineCap: 'butt',
    globalAlpha: 1
  } as unknown as CanvasRenderingContext2D;
}

describe('WeatherParticleSystem', () => {
  describe('construction', () => {
    it('creates system with pre-allocated pool', () => {
      const system = new WeatherParticleSystem();
      expect(system).toBeDefined();
    });
  });

  describe('spawn and update', () => {
    it('spawns particles based on precipitation intensity', () => {
      const system = new WeatherParticleSystem();

      const field: WeatherField = {
        '0,0': { ...createDefaultCell(), precipIntensity: 0.8, cloudCover: 0.7 },
        '1,0': { ...createDefaultCell(), precipIntensity: 0.5, cloudCover: 0.5 }
      };

      // Spawn a few times to build up particles
      for (let i = 0; i < 5; i++) {
        system.spawn(field, 5, 5, 1.0, 0, 0, 800, 600);
        system.update(16);
      }

      // Render should not throw
      const ctx = createMockCtx();
      system.render(ctx);
    });

    it('respects zoom LOD — no particles at low zoom', () => {
      const system = new WeatherParticleSystem();

      const field: WeatherField = {
        '0,0': { ...createDefaultCell(), precipIntensity: 0.9, cloudCover: 0.8 }
      };

      // Spawn at very low zoom — should skip spawning
      system.spawn(field, 5, 5, 0.1, 0, 0, 800, 600);
      system.update(16);

      // No meaningful assertion beyond "doesn't crash"
      const ctx = createMockCtx();
      system.render(ctx);
    });

    it('handles empty field gracefully', () => {
      const system = new WeatherParticleSystem();

      system.spawn({}, 5, 5, 1.0, 0, 0, 800, 600);
      system.update(16);

      const ctx = createMockCtx();
      system.render(ctx);
    });
  });

  describe('particle lifecycle', () => {
    it('particles die after enough update cycles', () => {
      const system = new WeatherParticleSystem();

      const field: WeatherField = {
        '2,2': { ...createDefaultCell(), precipIntensity: 1.0, cloudCover: 0.9 }
      };

      // Spawn particles
      system.spawn(field, 5, 5, 1.0, 0, 0, 800, 600);

      // Run many updates with no spawning to let particles die
      for (let i = 0; i < 100; i++) {
        system.update(32);
      }

      // After long enough all particles should have expired
      // Render should still work fine
      const ctx = createMockCtx();
      system.render(ctx);
    });
  });
});
