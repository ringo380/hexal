import { describe, it, expect } from 'vitest';
import { DEFAULT_EXPANDED_ENCOUNTER_TABLES, DEFAULT_LANDMARK_TABLES } from '../data/generatorTables';
import { DEFAULT_TERRAIN_TYPES } from '../types/Campaign';

describe('Generator Tables Data Integrity', () => {
  const terrainNames = DEFAULT_TERRAIN_TYPES.map(t => t.name);

  describe('encounter tables', () => {
    it('every terrain type has a corresponding encounter table', () => {
      for (const terrain of terrainNames) {
        const table = DEFAULT_EXPANDED_ENCOUNTER_TABLES.find(t => t.terrain === terrain);
        expect(table, `Missing encounter table for terrain: ${terrain}`).toBeDefined();
      }
    });

    it('all entries have non-empty titles and positive weights', () => {
      for (const table of DEFAULT_EXPANDED_ENCOUNTER_TABLES) {
        expect(table.entries.length).toBeGreaterThan(0);
        for (const entry of table.entries) {
          expect(entry.title.length, `Empty title in ${table.name}`).toBeGreaterThan(0);
          expect(entry.weight, `Non-positive weight in ${table.name}: ${entry.title}`).toBeGreaterThan(0);
        }
      }
    });

    it('no duplicate terrain names across encounter tables', () => {
      const terrains = DEFAULT_EXPANDED_ENCOUNTER_TABLES.map(t => t.terrain);
      const unique = new Set(terrains);
      expect(unique.size).toBe(terrains.length);
    });
  });

  describe('landmark tables', () => {
    it('every terrain type has a corresponding landmark table', () => {
      for (const terrain of terrainNames) {
        const table = DEFAULT_LANDMARK_TABLES.find(t => t.terrain === terrain);
        expect(table, `Missing landmark table for terrain: ${terrain}`).toBeDefined();
      }
    });

    it('all entries have non-empty titles and positive weights', () => {
      for (const table of DEFAULT_LANDMARK_TABLES) {
        expect(table.entries.length).toBeGreaterThan(0);
        for (const entry of table.entries) {
          expect(entry.title.length, `Empty title in ${table.name}`).toBeGreaterThan(0);
          expect(entry.weight, `Non-positive weight in ${table.name}: ${entry.title}`).toBeGreaterThan(0);
        }
      }
    });

    it('no duplicate terrain names across landmark tables', () => {
      const terrains = DEFAULT_LANDMARK_TABLES.map(t => t.terrain);
      const unique = new Set(terrains);
      expect(unique.size).toBe(terrains.length);
    });
  });
});
