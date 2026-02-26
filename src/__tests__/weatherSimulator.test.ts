import { describe, it, expect } from 'vitest';
import { PerlinWeatherEngine } from '../services/weather/PerlinWeatherEngine';
import { createDefaultSimulationConfig } from '../types/Weather';
import type { SimGrid } from '../services/weather/WeatherSimulator';

function createTestGrid(width = 5, height = 5): SimGrid {
  const hexes = [];
  for (let q = 0; q < width; q++) {
    for (let r = 0; r < height; r++) {
      hexes.push({
        key: `${q},${r}`,
        terrain: q === 0 ? 'Mountains' : q === 1 ? 'Coast' : 'Plains',
        elevation: q === 0 ? 3 : 1,
        isCoast: q === 1,
        hasRiver: q === 2 && r === 2
      });
    }
  }
  return { width, height, hexes };
}

describe('PerlinWeatherEngine', () => {
  describe('determinism', () => {
    it('same seed produces identical fields', () => {
      const grid = createTestGrid();
      const config = { ...createDefaultSimulationConfig(), enabled: true };

      const engine1 = new PerlinWeatherEngine();
      engine1.init(grid, 'test-seed-42', config);
      const result1 = engine1.tick();

      const engine2 = new PerlinWeatherEngine();
      engine2.init(grid, 'test-seed-42', config);
      const result2 = engine2.tick();

      // Fields should be identical
      const keys1 = Object.keys(result1.field).sort();
      const keys2 = Object.keys(result2.field).sort();
      expect(keys1).toEqual(keys2);

      for (const key of keys1) {
        const cell1 = result1.field[key]!;
        const cell2 = result2.field[key]!;
        expect(cell1.pressure).toBeCloseTo(cell2.pressure);
        expect(cell1.temperature).toBeCloseTo(cell2.temperature);
        expect(cell1.humidity).toBeCloseTo(cell2.humidity);
      }
    });

    it('different seeds produce different fields', () => {
      const grid = createTestGrid();
      const config = { ...createDefaultSimulationConfig(), enabled: true };

      const engine1 = new PerlinWeatherEngine();
      engine1.init(grid, 'seed-alpha', config);
      engine1.tick();

      const engine2 = new PerlinWeatherEngine();
      engine2.init(grid, 'seed-beta', config);
      engine2.tick();

      // At least some cells should differ
      const field1 = engine1.getField();
      const field2 = engine2.getField();
      let differCount = 0;

      for (const key of Object.keys(field1)) {
        if (field2[key] && Math.abs(field1[key]!.pressure - field2[key]!.pressure) > 0.1) {
          differCount++;
        }
      }
      expect(differCount).toBeGreaterThan(0);
    });
  });

  describe('field generation', () => {
    it('generates field cells for all hexes in grid', () => {
      const grid = createTestGrid(4, 4);
      const config = { ...createDefaultSimulationConfig(), enabled: true };

      const engine = new PerlinWeatherEngine();
      engine.init(grid, 'gen-test', config);
      const result = engine.tick();

      expect(Object.keys(result.field)).toHaveLength(16);
      for (const hex of grid.hexes) {
        expect(result.field[hex.key]).toBeDefined();
      }
    });

    it('field cells have values in reasonable ranges', () => {
      const grid = createTestGrid();
      const config = { ...createDefaultSimulationConfig(), enabled: true };

      const engine = new PerlinWeatherEngine();
      engine.init(grid, 'range-test', config);
      const result = engine.tick();

      for (const cell of Object.values(result.field)) {
        if (!cell) continue;
        expect(cell.pressure).toBeGreaterThanOrEqual(960);
        expect(cell.pressure).toBeLessThanOrEqual(1060);
        expect(cell.humidity).toBeGreaterThanOrEqual(0);
        expect(cell.humidity).toBeLessThanOrEqual(1);
        expect(cell.cloudCover).toBeGreaterThanOrEqual(0);
        expect(cell.cloudCover).toBeLessThanOrEqual(1);
        expect(cell.precipIntensity).toBeGreaterThanOrEqual(0);
        expect(cell.precipIntensity).toBeLessThanOrEqual(1);
      }
    });

    it('terrain modifies temperature (mountains colder)', () => {
      const grid = createTestGrid();
      const config = { ...createDefaultSimulationConfig(), enabled: true };

      const engine = new PerlinWeatherEngine();
      engine.init(grid, 'terrain-temp', config);
      engine.tick();
      const field = engine.getField();

      // Average temperature for mountains (q=0) vs plains (q>=2)
      let mountainTemp = 0, plainTemp = 0;
      let mountainCount = 0, plainCount = 0;

      for (const [key, cell] of Object.entries(field)) {
        if (!cell) continue;
        const q = parseInt(key.split(',')[0]);
        if (q === 0) { mountainTemp += cell.temperature; mountainCount++; }
        if (q >= 2) { plainTemp += cell.temperature; plainCount++; }
      }

      if (mountainCount > 0 && plainCount > 0) {
        mountainTemp /= mountainCount;
        plainTemp /= plainCount;
        expect(mountainTemp).toBeLessThan(plainTemp);
      }
    });
  });

  describe('events', () => {
    it('spawns and tracks events', () => {
      const grid = createTestGrid();
      const config = { ...createDefaultSimulationConfig(), enabled: true };

      const engine = new PerlinWeatherEngine();
      engine.init(grid, 'event-test', config);

      const event = engine.spawnEvent('hurricane', '2,2', 0.8, 50);
      expect(event.type).toBe('hurricane');
      expect(event.centerKey).toBe('2,2');
      expect(event.intensity).toBe(0.8);

      const result = engine.tick();
      expect(result.activeEvents).toHaveLength(1);
      expect(result.activeEvents[0].type).toBe('hurricane');
    });

    it('cancels events by ID', () => {
      const grid = createTestGrid();
      const config = { ...createDefaultSimulationConfig(), enabled: true };

      const engine = new PerlinWeatherEngine();
      engine.init(grid, 'cancel-test', config);

      const event = engine.spawnEvent('blizzard', '1,1');
      engine.cancelEvent(event.id);

      const result = engine.tick();
      expect(result.activeEvents).toHaveLength(0);
    });

    it('events decay over time', () => {
      const grid = createTestGrid();
      const config = { ...createDefaultSimulationConfig(), enabled: true };

      const engine = new PerlinWeatherEngine();
      engine.init(grid, 'decay-test', config);

      engine.spawnEvent('tornado', '2,2', 1.0, 5);

      // Tick until the event ends (endedEventIds populated on the tick it expires)
      let result;
      let foundEnded = false;
      for (let i = 0; i < 10; i++) {
        result = engine.tick();
        if (result.endedEventIds.length > 0) {
          foundEnded = true;
          break;
        }
      }

      expect(foundEnded).toBe(true);
      expect(result!.activeEvents).toHaveLength(0);
      expect(result!.endedEventIds).toHaveLength(1);
    });
  });

  describe('config updates', () => {
    it('updates config without reinit', () => {
      const grid = createTestGrid();
      const config = { ...createDefaultSimulationConfig(), enabled: true };

      const engine = new PerlinWeatherEngine();
      engine.init(grid, 'config-test', config);
      engine.tick();

      engine.setConfig({ simulationSpeed: 8 });
      const result = engine.tick();

      // Should still produce valid field
      expect(Object.keys(result.field).length).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('clears field and events', () => {
      const grid = createTestGrid();
      const config = { ...createDefaultSimulationConfig(), enabled: true };

      const engine = new PerlinWeatherEngine();
      engine.init(grid, 'reset-test', config);
      engine.tick();
      engine.spawnEvent('monsoon', '2,2');

      engine.reset();

      const field = engine.getField();
      expect(Object.keys(field)).toHaveLength(0);
    });
  });
});
