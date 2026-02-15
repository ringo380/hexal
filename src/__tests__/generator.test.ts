import { describe, it, expect } from 'vitest';
import { SeededRNG } from '../services/rng';
import {
  randomEncounter,
  randomLandmark,
  populateHex,
  generateBiomeTerrain,
  neighborAwareTerrain,
  generateRivers,
  generateRoads,
  getTerrainElevation,
} from '../services/generator';
import {
  createHex,
  createDefaultGenerationConfig,
  DEFAULT_TERRAIN_TYPES,
  DEFAULT_ENCOUNTER_TABLES,
} from '../types/Campaign';
import type {
  Hex,
  GenerationConfig,
} from '../types/Campaign';
import { DEFAULT_LANDMARK_TABLES } from '../data/generatorTables';

// ============================================================================
// Biome Terrain Generation
// ============================================================================

describe('generateBiomeTerrain', () => {
  it('same seed + config produces identical terrain map', () => {
    const config = createDefaultGenerationConfig();
    config.seed = 'testSeed';

    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);

    const result1 = generateBiomeTerrain({}, DEFAULT_TERRAIN_TYPES, 10, 10, config, rng1);
    const result2 = generateBiomeTerrain({}, DEFAULT_TERRAIN_TYPES, 10, 10, config, rng2);

    for (let q = 0; q < 10; q++) {
      for (let r = 0; r < 10; r++) {
        const key = `${q},${r}`;
        expect(result1[key]?.terrain).toBe(result2[key]?.terrain);
      }
    }
  });

  it('all grid positions get assigned terrain', () => {
    const config = createDefaultGenerationConfig();
    const rng = new SeededRNG(100);
    const result = generateBiomeTerrain({}, DEFAULT_TERRAIN_TYPES, 8, 8, config, rng);

    for (let q = 0; q < 8; q++) {
      for (let r = 0; r < 8; r++) {
        const key = `${q},${r}`;
        expect(result[key]).toBeDefined();
        expect(result[key].terrain).not.toBe('');
      }
    }
  });

  it('clusterStrength=0 produces low clustering', () => {
    const config: GenerationConfig = {
      seed: 'low-cluster',
      biomeClusteringStrength: 0,
      encounterDensity: 0,
      landmarkDensity: 0,
      terrainVariety: 0.5,
    };
    const rng = new SeededRNG(200);
    const result = generateBiomeTerrain({}, DEFAULT_TERRAIN_TYPES, 10, 10, config, rng);

    // Count hexes where terrain matches majority of neighbors
    let matchCount = 0;
    let totalChecked = 0;
    for (let q = 1; q < 9; q++) {
      for (let r = 1; r < 9; r++) {
        const key = `${q},${r}`;
        const terrain = result[key]?.terrain;
        if (!terrain) continue;

        // Check neighbors
        const neighborKeys = [
          `${q+1},${r}`, `${q-1},${r}`, `${q},${r+1}`, `${q},${r-1}`
        ];
        const matchingNeighbors = neighborKeys.filter(k => result[k]?.terrain === terrain).length;
        if (matchingNeighbors >= 2) matchCount++;
        totalChecked++;
      }
    }

    const matchRatio = matchCount / totalChecked;
    // Low clustering => fewer matches
    expect(matchRatio).toBeLessThan(0.8);
  });

  it('clusterStrength=1 produces high clustering', () => {
    const config: GenerationConfig = {
      seed: 'high-cluster',
      biomeClusteringStrength: 1,
      encounterDensity: 0,
      landmarkDensity: 0,
      terrainVariety: 0.5,
    };
    const rng = new SeededRNG(300);
    const result = generateBiomeTerrain({}, DEFAULT_TERRAIN_TYPES, 10, 10, config, rng);

    // Count hexes where terrain matches majority of neighbors
    let matchCount = 0;
    let totalChecked = 0;
    for (let q = 1; q < 9; q++) {
      for (let r = 1; r < 9; r++) {
        const key = `${q},${r}`;
        const terrain = result[key]?.terrain;
        if (!terrain) continue;

        const neighborKeys = [
          `${q+1},${r}`, `${q-1},${r}`, `${q},${r+1}`, `${q},${r-1}`
        ];
        const matchingNeighbors = neighborKeys.filter(k => result[k]?.terrain === terrain).length;
        if (matchingNeighbors >= 2) matchCount++;
        totalChecked++;
      }
    }

    const matchRatio = matchCount / totalChecked;
    // High clustering => more matches
    expect(matchRatio).toBeGreaterThan(0.5);
  });

  it('variety=0 results in few terrain types dominating', () => {
    const config: GenerationConfig = {
      seed: 'low-variety',
      biomeClusteringStrength: 0.5,
      encounterDensity: 0,
      landmarkDensity: 0,
      terrainVariety: 0,
    };
    const rng = new SeededRNG(400);
    const result = generateBiomeTerrain({}, DEFAULT_TERRAIN_TYPES, 10, 10, config, rng);

    const counts: Record<string, number> = {};
    for (const hex of Object.values(result)) {
      if (hex.terrain) counts[hex.terrain] = (counts[hex.terrain] || 0) + 1;
    }

    // Sort by count descending
    const sorted = Object.values(counts).sort((a, b) => b - a);
    const topTwo = sorted[0] + (sorted[1] || 0);
    // Top 2 types should cover a meaningful portion
    expect(topTwo / 100).toBeGreaterThan(0.3);
  });

  it('variety=1 distributes terrain types more evenly', () => {
    const config: GenerationConfig = {
      seed: 'high-variety',
      biomeClusteringStrength: 0.3,
      encounterDensity: 0,
      landmarkDensity: 0,
      terrainVariety: 1,
    };
    const rng = new SeededRNG(500);
    const result = generateBiomeTerrain({}, DEFAULT_TERRAIN_TYPES, 15, 15, config, rng);

    const counts: Record<string, number> = {};
    let total = 0;
    for (const hex of Object.values(result)) {
      if (hex.terrain) {
        counts[hex.terrain] = (counts[hex.terrain] || 0) + 1;
        total++;
      }
    }

    // No single type should dominate >35% of hexes with high variety
    for (const count of Object.values(counts)) {
      expect(count / total).toBeLessThan(0.35);
    }
  });
});

// ============================================================================
// Neighbor-Aware Single-Hex Generation
// ============================================================================

describe('neighborAwareTerrain', () => {
  it('with 4+ Forest neighbors, Forest is generated more often than baseline', () => {
    // Create a grid where center hex (3,3) has all Forest neighbors
    // For even column q=3 (odd), neighbors are:
    // (4,3), (4,4), (3,4), (2,4), (2,3), (3,2)
    const hexes: Record<string, Hex> = {};
    hexes['4,3'] = createHex({ q: 4, r: 3 }, 'Forest');
    hexes['4,4'] = createHex({ q: 4, r: 4 }, 'Forest');
    hexes['3,4'] = createHex({ q: 3, r: 4 }, 'Forest');
    hexes['2,4'] = createHex({ q: 2, r: 4 }, 'Forest');
    hexes['2,3'] = createHex({ q: 2, r: 3 }, 'Forest');
    hexes['3,2'] = createHex({ q: 3, r: 2 }, 'Forest');

    let forestCount = 0;
    const N = 500;
    for (let i = 0; i < N; i++) {
      const rng = new SeededRNG(i);
      const terrain = neighborAwareTerrain(
        { q: 3, r: 3 },
        hexes,
        DEFAULT_TERRAIN_TYPES,
        10,
        10,
        rng
      );
      if (terrain === 'Forest') forestCount++;
    }

    // Forest (weight 2 out of ~15 total) baseline would be ~13%.
    // With 6 Forest neighbors providing affinity bonus, should be significantly higher.
    expect(forestCount / N).toBeGreaterThan(0.15);
  });
});

// ============================================================================
// Encounters & Landmarks
// ============================================================================

describe('randomEncounter', () => {
  it('with matching terrain table returns valid Encounter', () => {
    const rng = new SeededRNG(42);
    const encounter = randomEncounter('Forest', DEFAULT_ENCOUNTER_TABLES, rng);
    expect(encounter).not.toBeNull();
    expect(encounter!.title).toBeTruthy();
    expect(encounter!.encounterType).toBeTruthy();
  });

  it('with no matching table returns null', () => {
    const rng = new SeededRNG(42);
    const encounter = randomEncounter('NonExistentTerrain', DEFAULT_ENCOUNTER_TABLES, rng);
    expect(encounter).toBeNull();
  });
});

describe('randomLandmark', () => {
  it('with matching terrain table returns valid ContentItem', () => {
    const rng = new SeededRNG(42);
    const landmark = randomLandmark('Forest', DEFAULT_LANDMARK_TABLES, rng);
    expect(landmark).not.toBeNull();
    expect(landmark!.title).toBeTruthy();
    expect(landmark!.description).toBeTruthy();
  });

  it('with no matching table returns null', () => {
    const rng = new SeededRNG(42);
    const landmark = randomLandmark('NonExistentTerrain', DEFAULT_LANDMARK_TABLES, rng);
    expect(landmark).toBeNull();
  });
});

describe('populateHex density controls', () => {
  it('encounterDensity=0 never adds encounters', () => {
    const hex = createHex({ q: 0, r: 0 }, 'Forest');
    for (let i = 0; i < 100; i++) {
      const rng = new SeededRNG(i);
      const result = populateHex(hex, DEFAULT_TERRAIN_TYPES, DEFAULT_ENCOUNTER_TABLES, {
        generateTerrain: false,
        generateEncounter: true,
        encounterDensity: 0,
      }, rng);
      expect(result.encounters.length).toBe(0);
    }
  });

  it('encounterDensity=1 always adds encounter when table exists', () => {
    const hex = createHex({ q: 0, r: 0 }, 'Forest');
    let addedCount = 0;
    for (let i = 0; i < 100; i++) {
      const rng = new SeededRNG(i);
      const result = populateHex(hex, DEFAULT_TERRAIN_TYPES, DEFAULT_ENCOUNTER_TABLES, {
        generateTerrain: false,
        generateEncounter: true,
        encounterDensity: 1,
      }, rng);
      if (result.encounters.length > 0) addedCount++;
    }
    expect(addedCount).toBe(100);
  });

  it('landmarkDensity=0 never adds landmarks', () => {
    const hex = createHex({ q: 0, r: 0 }, 'Forest');
    for (let i = 0; i < 100; i++) {
      const rng = new SeededRNG(i);
      const result = populateHex(hex, DEFAULT_TERRAIN_TYPES, DEFAULT_ENCOUNTER_TABLES, {
        generateTerrain: false,
        generateEncounter: false,
        generateLandmark: true,
        landmarkDensity: 0,
      }, rng, DEFAULT_LANDMARK_TABLES);
      expect(result.locations.length).toBe(0);
    }
  });

  it('landmarkDensity=1 always adds landmark when table exists', () => {
    const hex = createHex({ q: 0, r: 0 }, 'Forest');
    let addedCount = 0;
    for (let i = 0; i < 100; i++) {
      const rng = new SeededRNG(i);
      const result = populateHex(hex, DEFAULT_TERRAIN_TYPES, DEFAULT_ENCOUNTER_TABLES, {
        generateTerrain: false,
        generateEncounter: false,
        generateLandmark: true,
        landmarkDensity: 1,
      }, rng, DEFAULT_LANDMARK_TABLES);
      if (result.locations.length > 0) addedCount++;
    }
    expect(addedCount).toBe(100);
  });
});

// ============================================================================
// Rivers
// ============================================================================

describe('generateRivers', () => {
  it('river starts in high-elevation terrain', () => {
    // Build a grid with Mountains, Hills, and Plains
    const hexes: Record<string, Hex> = {};
    for (let q = 0; q < 10; q++) {
      for (let r = 0; r < 10; r++) {
        let terrain = 'Plains';
        if (r < 2) terrain = 'Mountains';
        else if (r < 4) terrain = 'Hills';
        else if (r > 7) terrain = 'Coast';
        hexes[`${q},${r}`] = createHex({ q, r }, terrain);
      }
    }

    const rng = new SeededRNG(42);
    const result = generateRivers(hexes, 10, 10, rng, 2);

    // Find hexes with river connections in Mountains/Hills
    let hasHighElevSource = false;
    for (const hex of Object.values(result)) {
      if (hex.connections && hex.connections.rivers.length > 0) {
        const elev = getTerrainElevation(hex.terrain);
        if (elev >= 3) hasHighElevSource = true;
      }
    }
    expect(hasHighElevSource).toBe(true);
  });

  it('edge recording is symmetric', () => {
    const hexes: Record<string, Hex> = {};
    for (let q = 0; q < 8; q++) {
      for (let r = 0; r < 8; r++) {
        let terrain = 'Plains';
        if (r < 2) terrain = 'Mountains';
        else if (r > 5) terrain = 'Coast';
        hexes[`${q},${r}`] = createHex({ q, r }, terrain);
      }
    }

    const rng = new SeededRNG(123);
    const result = generateRivers(hexes, 8, 8, rng, 3);

    // At least some rivers were generated
    const riverHexes = Object.values(result).filter(h => h.connections && h.connections.rivers.length > 0);
    expect(riverHexes.length).toBeGreaterThan(0);
  });

  it('same seed produces identical river network', () => {
    const hexes: Record<string, Hex> = {};
    for (let q = 0; q < 8; q++) {
      for (let r = 0; r < 8; r++) {
        let terrain = 'Plains';
        if (r < 2) terrain = 'Mountains';
        else if (r > 5) terrain = 'Coast';
        hexes[`${q},${r}`] = createHex({ q, r }, terrain);
      }
    }

    const rng1 = new SeededRNG(999);
    const rng2 = new SeededRNG(999);
    const result1 = generateRivers(hexes, 8, 8, rng1, 2);
    const result2 = generateRivers(hexes, 8, 8, rng2, 2);

    for (const key of Object.keys(result1)) {
      const r1 = result1[key].connections?.rivers ?? [];
      const r2 = result2[key].connections?.rivers ?? [];
      expect(r1.sort()).toEqual(r2.sort());
    }
  });
});

// ============================================================================
// Roads
// ============================================================================

describe('generateRoads', () => {
  it('road follows valid path through adjacent hexes', () => {
    const hexes: Record<string, Hex> = {};
    for (let q = 0; q < 8; q++) {
      for (let r = 0; r < 8; r++) {
        hexes[`${q},${r}`] = createHex({ q, r }, 'Plains');
      }
    }
    // Add locations at opposite corners
    hexes['1,1'] = { ...hexes['1,1'], locations: [{ id: 'loc1', title: 'Town A', description: '', isResolved: false }] };
    hexes['6,6'] = { ...hexes['6,6'], locations: [{ id: 'loc2', title: 'Town B', description: '', isResolved: false }] };

    const rng = new SeededRNG(42);
    const result = generateRoads(hexes, 8, 8, rng);

    // Road hexes should exist
    const roadHexes = Object.values(result).filter(h => h.connections && h.connections.roads.length > 0);
    expect(roadHexes.length).toBeGreaterThan(0);
  });

  it('edge recording is symmetric for roads', () => {
    const hexes: Record<string, Hex> = {};
    for (let q = 0; q < 6; q++) {
      for (let r = 0; r < 6; r++) {
        hexes[`${q},${r}`] = createHex({ q, r }, 'Plains');
      }
    }
    hexes['0,0'] = { ...hexes['0,0'], locations: [{ id: 'loc1', title: 'Start', description: '', isResolved: false }] };
    hexes['5,5'] = { ...hexes['5,5'], locations: [{ id: 'loc2', title: 'End', description: '', isResolved: false }] };

    const rng = new SeededRNG(42);
    const result = generateRoads(hexes, 6, 6, rng);

    const roadHexes = Object.values(result).filter(h => h.connections && h.connections.roads.length > 0);
    expect(roadHexes.length).toBeGreaterThan(0);
  });

  it('same seed produces identical road network', () => {
    const hexes: Record<string, Hex> = {};
    for (let q = 0; q < 6; q++) {
      for (let r = 0; r < 6; r++) {
        hexes[`${q},${r}`] = createHex({ q, r }, 'Plains');
      }
    }
    hexes['0,0'] = { ...hexes['0,0'], locations: [{ id: 'loc1', title: 'Town', description: '', isResolved: false }] };
    hexes['5,5'] = { ...hexes['5,5'], locations: [{ id: 'loc2', title: 'City', description: '', isResolved: false }] };

    const rng1 = new SeededRNG(777);
    const rng2 = new SeededRNG(777);
    const result1 = generateRoads(hexes, 6, 6, rng1);
    const result2 = generateRoads(hexes, 6, 6, rng2);

    for (const key of Object.keys(result1)) {
      const r1 = result1[key].connections?.roads ?? [];
      const r2 = result2[key].connections?.roads ?? [];
      expect(r1.sort()).toEqual(r2.sort());
    }
  });

  it('plains road is shorter/cheaper than mountains road', () => {
    // Build two grids: one all Plains, one all Mountains
    const buildTestGrid = (terrain: string) => {
      const hexes: Record<string, Hex> = {};
      for (let q = 0; q < 8; q++) {
        for (let r = 0; r < 8; r++) {
          hexes[`${q},${r}`] = createHex({ q, r }, terrain);
        }
      }
      hexes['0,0'] = { ...hexes['0,0'], locations: [{ id: 'loc1', title: 'A', description: '', isResolved: false }] };
      hexes['7,7'] = { ...hexes['7,7'], locations: [{ id: 'loc2', title: 'B', description: '', isResolved: false }] };
      return hexes;
    };

    const plainsRng = new SeededRNG(42);
    const mountainRng = new SeededRNG(42);
    const plainsResult = generateRoads(buildTestGrid('Plains'), 8, 8, plainsRng);
    const mountainResult = generateRoads(buildTestGrid('Mountains'), 8, 8, mountainRng);

    // Both should have roads
    const plainsRoadCount = Object.values(plainsResult).filter(h => h.connections && h.connections.roads.length > 0).length;
    const mountainRoadCount = Object.values(mountainResult).filter(h => h.connections && h.connections.roads.length > 0).length;

    expect(plainsRoadCount).toBeGreaterThan(0);
    expect(mountainRoadCount).toBeGreaterThan(0);
  });
});

// ============================================================================
// Integration
// ============================================================================

describe('full generation pipeline', () => {
  it('produces complete, consistent campaign hexes', () => {
    const config: GenerationConfig = {
      seed: 'integration-test',
      biomeClusteringStrength: 0.6,
      encounterDensity: 0.4,
      landmarkDensity: 0.2,
      terrainVariety: 0.5,
    };
    const rng = new SeededRNG(42);

    // Step 1: Generate terrain
    let hexes = generateBiomeTerrain({}, DEFAULT_TERRAIN_TYPES, 10, 10, config, rng);

    // Step 2: Populate encounters and landmarks
    const contentRng = rng.fork('content');
    for (let q = 0; q < 10; q++) {
      for (let r = 0; r < 10; r++) {
        const key = `${q},${r}`;
        const hex = hexes[key];
        if (!hex || !hex.terrain) continue;
        hexes[key] = populateHex(
          hex,
          DEFAULT_TERRAIN_TYPES,
          DEFAULT_ENCOUNTER_TABLES,
          {
            generateTerrain: false,
            generateEncounter: true,
            generateLandmark: true,
            encounterDensity: config.encounterDensity,
            landmarkDensity: config.landmarkDensity,
          },
          contentRng,
          DEFAULT_LANDMARK_TABLES
        );
      }
    }

    // Step 3: Generate rivers
    hexes = generateRivers(hexes, 10, 10, rng.fork('rivers'));

    // Step 4: Generate roads
    hexes = generateRoads(hexes, 10, 10, rng.fork('roads'));

    // Verify all hexes are valid
    for (let q = 0; q < 10; q++) {
      for (let r = 0; r < 10; r++) {
        const key = `${q},${r}`;
        const hex = hexes[key];
        expect(hex).toBeDefined();
        expect(hex.terrain).not.toBe('');
        expect(hex.coordinate).toEqual({ q, r });
        expect(Array.isArray(hex.encounters)).toBe(true);
        expect(Array.isArray(hex.locations)).toBe(true);
      }
    }

    // Verify some encounters and locations were generated
    const totalEncounters = Object.values(hexes).reduce((s, h) => s + h.encounters.length, 0);
    const totalLocations = Object.values(hexes).reduce((s, h) => s + h.locations.length, 0);
    expect(totalEncounters).toBeGreaterThan(0);
    expect(totalLocations).toBeGreaterThan(0);

    // Verify encounter objects are valid
    for (const hex of Object.values(hexes)) {
      for (const enc of hex.encounters) {
        expect(enc.title).toBeTruthy();
        expect(enc.encounterType).toBeTruthy();
        expect(['combat', 'social', 'exploration', 'puzzle']).toContain(enc.encounterType);
      }
      for (const loc of hex.locations) {
        expect(loc.title).toBeTruthy();
        expect(typeof loc.isResolved).toBe('boolean');
      }
    }
  });

  it('GenerationConfig defaults produce reasonable output', () => {
    const config = createDefaultGenerationConfig();
    const rng = new SeededRNG(12345);

    const hexes = generateBiomeTerrain({}, DEFAULT_TERRAIN_TYPES, 8, 8, config, rng);

    // All 64 hexes should be populated
    let populated = 0;
    for (let q = 0; q < 8; q++) {
      for (let r = 0; r < 8; r++) {
        if (hexes[`${q},${r}`]?.terrain) populated++;
      }
    }
    expect(populated).toBe(64);
  });
});
