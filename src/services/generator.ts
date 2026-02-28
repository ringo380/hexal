// Procedural generation service
// Supports seeded RNG, biome-aware terrain, landmarks, rivers, and roads

import type {
  TerrainType,
  EncounterTable,
  Hex,
  HexCoordinate,
  LandmarkTable,
  GenerationConfig,
  HexEdge,
  ContentItem,
} from '../types';
import type { Encounter } from '../types/Campaign';
import { createEncounter, createContentItem, hexKey, parseHexKey } from '../types/Campaign';
import { SeededRNG } from './rng';
import { getValidNeighbors, getHexNeighbors } from './hexGeometry';

// ============================================================================
// Terrain Elevation (implicit from terrain type)
// ============================================================================

const TERRAIN_ELEVATION: Record<string, number> = {
  Mountains: 5,
  Hills: 3,
  Forest: 2,
  Jungle: 2,
  Tundra: 2,
  Plains: 1,
  Grassland: 1,
  Desert: 1,
  Swamp: 0,
  Coast: 0
};

export function getTerrainElevation(terrain: string, terrainTypes?: TerrainType[]): number {
  if (terrainTypes) {
    const t = terrainTypes.find(tt => tt.name === terrain);
    if (t?.elevation !== undefined) return t.elevation;
  }
  return TERRAIN_ELEVATION[terrain] ?? 1;
}

// ============================================================================
// Terrain Adjacency Affinity (soft constraints for biome clustering)
// ============================================================================

const TERRAIN_AFFINITY: Record<string, Record<string, number>> = {
  Plains:    { Grassland: 0.9, Forest: 0.8, Hills: 0.7, Desert: 0.5, Coast: 0.4 },
  Grassland: { Plains: 0.9, Hills: 0.7, Forest: 0.6, Desert: 0.4 },
  Forest:   { Plains: 0.8, Hills: 0.7, Jungle: 0.6, Swamp: 0.5, Grassland: 0.6 },
  Hills:    { Mountains: 0.9, Plains: 0.7, Forest: 0.7, Grassland: 0.7, Tundra: 0.5 },
  Mountains: { Hills: 0.9, Tundra: 0.7, Forest: 0.4 },
  Swamp:    { Forest: 0.5, Coast: 0.6, Jungle: 0.5, Plains: 0.4 },
  Desert:   { Plains: 0.5, Grassland: 0.4, Hills: 0.4, Coast: 0.3 },
  Coast:    { Plains: 0.4, Swamp: 0.6, Desert: 0.3, Jungle: 0.4 },
  Jungle:   { Forest: 0.6, Swamp: 0.5, Coast: 0.4, Hills: 0.4 },
  Tundra:   { Mountains: 0.7, Hills: 0.5, Plains: 0.3 }
};

function getAffinity(terrainA: string, terrainB: string, terrainTypes?: TerrainType[]): number {
  if (terrainA === terrainB) return 1.0; // Self-affinity is always highest
  const hardcoded = TERRAIN_AFFINITY[terrainA]?.[terrainB];
  if (hardcoded !== undefined) return hardcoded;
  if (!terrainTypes) return 0.3;
  const a = terrainTypes.find(t => t.name === terrainA);
  const b = terrainTypes.find(t => t.name === terrainB);
  if (!a || !b) return 0.3;
  const dist = Math.sqrt(
    ((a.elevation ?? 1) - (b.elevation ?? 1)) ** 2 +
    ((a.moisture ?? 2) - (b.moisture ?? 2)) ** 2 +
    ((a.temperature ?? 3) - (b.temperature ?? 3)) ** 2
  );
  return Math.max(0.1, 1 - dist / 8.66);
}

// Movement cost for road pathfinding
const TERRAIN_MOVE_COST: Record<string, number> = {
  Mountains: 4,
  Swamp: 3,
  Jungle: 3,
  Hills: 2,
  Forest: 2,
  Tundra: 2,
  Plains: 1,
  Grassland: 1,
  Desert: 1,
  Coast: 5 // Discourage roads through coast
};

function getMoveCost(terrain: string, terrainTypes?: TerrainType[]): number {
  if (terrainTypes) {
    const t = terrainTypes.find(tt => tt.name === terrain);
    if (t?.moveCost !== undefined) return t.moveCost;
  }
  return TERRAIN_MOVE_COST[terrain] ?? 1;
}

// ============================================================================
// Core Random Selection (seeded)
// ============================================================================

/**
 * Generate random terrain based on weighted selection.
 * Uses SeededRNG if provided, otherwise falls back to Math.random.
 */
export function randomTerrain(types: TerrainType[], rng?: SeededRNG): string {
  if (rng) {
    return rng.weightedChoice(types, t => t.weight).name;
  }
  // Legacy fallback for backward compatibility
  const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.floor(Math.random() * totalWeight) + 1;
  for (const type of types) {
    roll -= type.weight;
    if (roll <= 0) return type.name;
  }
  return types[0]?.name ?? 'Plains';
}

/**
 * Generate a random encounter for a terrain type.
 * Uses SeededRNG if provided, otherwise falls back to Math.random.
 */
export function randomEncounter(
  terrain: string,
  tables: EncounterTable[],
  rng?: SeededRNG
): Encounter | null {
  const table = tables.find(t => t.terrain === terrain);
  if (!table || table.entries.length === 0) return null;

  const entry = rng
    ? rng.weightedChoice(table.entries, e => e.weight)
    : (() => {
        const totalWeight = table.entries.reduce((sum, e) => sum + e.weight, 0);
        let roll = Math.floor(Math.random() * totalWeight) + 1;
        for (const e of table.entries) {
          roll -= e.weight;
          if (roll <= 0) return e;
        }
        return table.entries[table.entries.length - 1];
      })();

  const encounter = createEncounter(entry.title);
  encounter.description = entry.description;
  encounter.difficulty = entry.difficulty;
  encounter.encounterType = inferEncounterType(entry.difficulty);
  return encounter;
}

/**
 * Generate a random landmark for a terrain type.
 */
export function randomLandmark(
  terrain: string,
  tables: LandmarkTable[],
  rng: SeededRNG
): ContentItem | null {
  const table = tables.find(t => t.terrain === terrain);
  if (!table || table.entries.length === 0) return null;

  const entry = rng.weightedChoice(table.entries, e => e.weight);
  const item = createContentItem(entry.title);
  item.description = entry.description;
  return item;
}

function inferEncounterType(difficulty: string): Encounter['encounterType'] {
  const lower = difficulty.toLowerCase();
  if (lower === 'social') return 'social';
  if (lower === 'exploration') return 'exploration';
  if (lower === 'puzzle') return 'puzzle';
  return 'combat';
}

// ============================================================================
// Populate Hex (single hex generation)
// ============================================================================

export interface PopulateHexOptions {
  generateTerrain?: boolean;
  generateEncounter?: boolean;
  generateLandmark?: boolean;
  encounterDensity?: number;
  landmarkDensity?: number;
}

/**
 * Populate a hex with generated content.
 * Supports optional SeededRNG, landmark tables, and density controls.
 */
export function populateHex(
  hex: Hex,
  terrainTypes: TerrainType[],
  encounterTables: EncounterTable[],
  options: PopulateHexOptions = {},
  rng?: SeededRNG,
  landmarkTables?: LandmarkTable[]
): Hex {
  const {
    generateTerrain = true,
    generateEncounter = true,
    generateLandmark = false,
    encounterDensity = 1,
    landmarkDensity = 1
  } = options;
  const updatedHex = { ...hex };

  if (generateTerrain) {
    updatedHex.terrain = randomTerrain(terrainTypes, rng);
  }

  if (generateEncounter) {
    const roll = rng ? rng.next() : Math.random();
    if (roll < encounterDensity) {
      const encounter = randomEncounter(updatedHex.terrain, encounterTables, rng);
      if (encounter) {
        updatedHex.encounters = [...updatedHex.encounters, encounter];
      }
    }
  }

  if (generateLandmark && landmarkTables && rng) {
    const roll = rng.next();
    if (roll < landmarkDensity) {
      const landmark = randomLandmark(updatedHex.terrain, landmarkTables, rng);
      if (landmark) {
        updatedHex.locations = [...updatedHex.locations, landmark];
      }
    }
  }

  return updatedHex;
}

// ============================================================================
// Neighbor-Aware Single-Hex Generation
// ============================================================================

/**
 * Generate terrain for a single hex, biased toward adjacent terrain types.
 */
export function neighborAwareTerrain(
  coord: HexCoordinate,
  hexes: Record<string, Hex>,
  terrainTypes: TerrainType[],
  gridWidth: number,
  gridHeight: number,
  rng: SeededRNG
): string {
  const neighbors = getValidNeighbors(coord, gridWidth, gridHeight);
  const neighborTerrains: string[] = [];
  for (const n of neighbors) {
    const h = hexes[hexKey(n)];
    if (h && h.terrain) neighborTerrains.push(h.terrain);
  }

  if (neighborTerrains.length === 0) {
    return randomTerrain(terrainTypes, rng);
  }

  // Count neighbor terrain frequencies
  const counts: Record<string, number> = {};
  for (const t of neighborTerrains) {
    counts[t] = (counts[t] || 0) + 1;
  }

  // Adjust terrain type weights based on neighbor affinity
  const adjustedTypes = terrainTypes.map(t => {
    let affinityBonus = 0;
    for (const [neighborTerrain, count] of Object.entries(counts)) {
      affinityBonus += getAffinity(t.name, neighborTerrain, terrainTypes) * count;
    }
    return { ...t, weight: t.weight + affinityBonus * 3 };
  });

  return rng.weightedChoice(adjustedTypes, t => t.weight).name;
}

// ============================================================================
// Biome-Aware Terrain Generation (whole grid)
// ============================================================================

/**
 * Generate terrain for all empty hexes using seed-and-grow algorithm.
 * 1. Place seed hexes (~5% of grid, scaled by clusterStrength)
 * 2. Assign each seed a weighted-random terrain type (variety flattens/amplifies weights)
 * 3. BFS growth from seeds — clusterStrength probability to copy neighbor vs fresh roll
 * 4. Optional smoothing pass at high clusterStrength
 */
export function generateBiomeTerrain(
  hexes: Record<string, Hex>,
  terrainTypes: TerrainType[],
  gridWidth: number,
  gridHeight: number,
  config: GenerationConfig,
  rng: SeededRNG
): Record<string, Hex> {
  const result = { ...hexes };
  const { biomeClusteringStrength: clusterStrength, terrainVariety: variety } = config;

  // Adjust terrain weights based on variety parameter
  // variety=0 → amplify dominant types, variety=1 → flatten toward uniform
  const adjustedTypes = terrainTypes.map(t => {
    const avgWeight = terrainTypes.reduce((s, tt) => s + tt.weight, 0) / terrainTypes.length;
    const adjusted = t.weight + (avgWeight - t.weight) * variety;
    return { ...t, weight: Math.max(0.1, adjusted) };
  });

  // Collect all empty hex keys
  const allKeys: string[] = [];
  for (let q = 0; q < gridWidth; q++) {
    for (let r = 0; r < gridHeight; r++) {
      const key = `${q},${r}`;
      if (!result[key] || !result[key].terrain) {
        allKeys.push(key);
      }
    }
  }

  if (allKeys.length === 0) return result;

  // Step 1: Place seed hexes
  const seedCount = Math.max(1, Math.floor(allKeys.length * 0.05 * (1 + clusterStrength)));
  const shuffled = rng.shuffle([...allKeys]);
  const seedKeys = shuffled.slice(0, seedCount);
  const assigned = new Set<string>();

  // Step 2: Assign terrain to seeds
  for (const key of seedKeys) {
    const terrain = rng.weightedChoice(adjustedTypes, t => t.weight).name;
    const coord = parseHexKey(key);
    if (!coord) continue;
    if (!result[key]) {
      result[key] = createHexFromCoord(coord);
    }
    result[key] = { ...result[key], terrain };
    assigned.add(key);
  }

  // Step 3: BFS growth from seeds
  const queue = [...seedKeys];
  while (queue.length > 0) {
    const currentKey = queue.shift()!;
    const currentCoord = parseHexKey(currentKey);
    if (!currentCoord) continue;
    const currentTerrain = result[currentKey]?.terrain || '';

    const neighbors = getValidNeighbors(currentCoord, gridWidth, gridHeight);
    for (const nCoord of neighbors) {
      const nKey = hexKey(nCoord);
      if (assigned.has(nKey)) continue;
      if (result[nKey] && result[nKey].terrain) continue; // Already has terrain

      let terrain: string;
      if (rng.next() < clusterStrength && currentTerrain) {
        // Copy neighbor's terrain (cluster growth)
        terrain = currentTerrain;
      } else {
        // Fresh roll with affinity bias
        const affinityAdjusted = adjustedTypes.map(t => ({
          ...t,
          weight: t.weight * (1 + getAffinity(t.name, currentTerrain, terrainTypes) * clusterStrength)
        }));
        terrain = rng.weightedChoice(affinityAdjusted, t => t.weight).name;
      }

      if (!result[nKey]) {
        result[nKey] = createHexFromCoord(nCoord);
      }
      result[nKey] = { ...result[nKey], terrain };
      assigned.add(nKey);
      queue.push(nKey);
    }
  }

  // Step 4: Smoothing pass at high cluster strength
  if (clusterStrength > 0.7) {
    for (const key of assigned) {
      const coord = parseHexKey(key);
      if (!coord) continue;
      const neighbors = getValidNeighbors(coord, gridWidth, gridHeight);
      const neighborTerrains: string[] = [];
      for (const n of neighbors) {
        const h = result[hexKey(n)];
        if (h && h.terrain) neighborTerrains.push(h.terrain);
      }

      // Count most common neighbor terrain
      const counts: Record<string, number> = {};
      for (const t of neighborTerrains) {
        counts[t] = (counts[t] || 0) + 1;
      }

      const currentTerrain = result[key].terrain;
      let maxCount = 0;
      let dominant = currentTerrain;
      for (const [t, c] of Object.entries(counts)) {
        if (c > maxCount) {
          maxCount = c;
          dominant = t;
        }
      }

      // Reassign if 4+ neighbors share a different terrain
      if (maxCount >= 4 && dominant !== currentTerrain) {
        result[key] = { ...result[key], terrain: dominant };
      }
    }
  }

  return result;
}

// Helper to create a minimal hex from coordinate
function createHexFromCoord(coord: HexCoordinate): Hex {
  return {
    id: crypto.randomUUID(),
    coordinate: coord,
    terrain: '',
    status: 'undiscovered',
    notes: '',
    tags: [],
    locations: [],
    encounters: [],
    npcs: [],
    treasures: [],
    clues: [],
    markers: []
  };
}

// ============================================================================
// River Generation
// ============================================================================

/**
 * Generate river networks flowing from high to low elevation.
 * Rivers start in Mountains/Hills and flow downhill to Coast/Swamp/grid edge.
 */
export function generateRivers(
  hexes: Record<string, Hex>,
  gridWidth: number,
  gridHeight: number,
  rng: SeededRNG,
  count?: number,
  terrainTypes?: TerrainType[]
): Record<string, Hex> {
  const result: Record<string, Hex> = {};
  // Deep-copy only the hexes that exist, preserving connections
  for (const [key, hex] of Object.entries(hexes)) {
    result[key] = {
      ...hex,
      connections: hex.connections
        ? { rivers: [...hex.connections.rivers], roads: [...hex.connections.roads] }
        : { rivers: [], roads: [] }
    };
  }

  const riverCount = count ?? Math.max(1, Math.floor((gridWidth * gridHeight) / 15));

  // Find potential source hexes (high elevation)
  const sources: string[] = [];
  for (const [key, hex] of Object.entries(result)) {
    if (hex.terrain && getTerrainElevation(hex.terrain, terrainTypes) >= 3) {
      sources.push(key);
    }
  }

  if (sources.length === 0) return result;
  rng.shuffle(sources);

  const usedSources = new Set<string>();
  let riversGenerated = 0;

  for (const sourceKey of sources) {
    if (riversGenerated >= riverCount) break;
    if (usedSources.has(sourceKey)) continue;

    // Walk downhill
    let currentKey = sourceKey;
    const visited = new Set<string>();
    visited.add(currentKey);

    while (true) {
      const currentCoord = parseHexKey(currentKey);
      if (!currentCoord) break;

      const currentHex = result[currentKey];
      if (!currentHex) break;
      const currentElev = getTerrainElevation(currentHex.terrain, terrainTypes);

      // Check termination: low-elevation terrain (Coast, Swamp, or custom low terrain)
      if (getTerrainElevation(currentHex.terrain, terrainTypes) === 0) break;

      // Get valid neighbors sorted by elevation
      const neighbors = getValidNeighbors(currentCoord, gridWidth, gridHeight);
      const neighborData = neighbors
        .map((nCoord, idx) => {
          const nKey = hexKey(nCoord);
          const nHex = result[nKey];
          const elev = nHex ? getTerrainElevation(nHex.terrain, terrainTypes) : 1;
          return { coord: nCoord, key: nKey, elev, neighborIdx: idx };
        })
        .filter(n => !visited.has(n.key) && n.elev <= currentElev)
        .sort((a, b) => a.elev - b.elev);

      if (neighborData.length === 0) break; // Grid edge or no downhill path

      // 70% lowest, 30% second-lowest for natural meander
      let chosen = neighborData[0];
      if (neighborData.length > 1 && rng.next() < 0.3) {
        chosen = neighborData[1];
      }

      // Record river edge on both hexes
      const allNeighbors = getHexNeighbors(currentCoord);
      const edgeIdx = allNeighbors.findIndex(n => n.q === chosen.coord.q && n.r === chosen.coord.r);
      if (edgeIdx >= 0) {
        addRiverEdge(result, currentKey, edgeIdx as HexEdge);
        const oppositeEdge = ((edgeIdx + 3) % 6) as HexEdge;
        addRiverEdge(result, chosen.key, oppositeEdge);
      }

      visited.add(chosen.key);
      usedSources.add(chosen.key);
      currentKey = chosen.key;
    }

    if (visited.size > 1) {
      riversGenerated++;
      usedSources.add(sourceKey);
    }
  }

  return result;
}

function addRiverEdge(hexes: Record<string, Hex>, key: string, edge: HexEdge): void {
  const hex = hexes[key];
  if (!hex) return;
  if (!hex.connections) {
    hexes[key] = { ...hex, connections: { rivers: [edge], roads: [] } };
  } else if (!hex.connections.rivers.includes(edge)) {
    hexes[key] = {
      ...hex,
      connections: {
        ...hex.connections,
        rivers: [...hex.connections.rivers, edge]
      }
    };
  }
}

// ============================================================================
// Road Generation
// ============================================================================

/**
 * Generate road networks connecting hexes with landmarks/locations via A* pathfinding.
 */
export function generateRoads(
  hexes: Record<string, Hex>,
  gridWidth: number,
  gridHeight: number,
  rng: SeededRNG,
  count?: number,
  terrainTypes?: TerrainType[]
): Record<string, Hex> {
  const result: Record<string, Hex> = {};
  for (const [key, hex] of Object.entries(hexes)) {
    result[key] = {
      ...hex,
      connections: hex.connections
        ? { rivers: [...hex.connections.rivers], roads: [...hex.connections.roads] }
        : { rivers: [], roads: [] }
    };
  }

  // Find hexes with locations/landmarks as road endpoints
  const endpoints: string[] = [];
  for (const [key, hex] of Object.entries(result)) {
    if (hex.locations && hex.locations.length > 0) {
      endpoints.push(key);
    }
  }

  if (endpoints.length < 2) return result;

  const roadCount = count ?? Math.min(endpoints.length - 1, Math.max(1, Math.floor(endpoints.length / 2)));
  rng.shuffle(endpoints);

  for (let i = 0; i < roadCount && i + 1 < endpoints.length; i++) {
    const startKey = endpoints[i];
    const endKey = endpoints[i + 1];

    const path = aStarPath(
      startKey, endKey, result, gridWidth, gridHeight, rng, terrainTypes
    );

    if (path && path.length >= 2) {
      // Record road edges along path
      for (let j = 0; j < path.length - 1; j++) {
        const fromCoord = parseHexKey(path[j]);
        const toCoord = parseHexKey(path[j + 1]);
        if (!fromCoord || !toCoord) continue;

        const allNeighbors = getHexNeighbors(fromCoord);
        const edgeIdx = allNeighbors.findIndex(n => n.q === toCoord.q && n.r === toCoord.r);
        if (edgeIdx >= 0) {
          addRoadEdge(result, path[j], edgeIdx as HexEdge);
          const oppositeEdge = ((edgeIdx + 3) % 6) as HexEdge;
          addRoadEdge(result, path[j + 1], oppositeEdge);
        }
      }
    }
  }

  return result;
}

function addRoadEdge(hexes: Record<string, Hex>, key: string, edge: HexEdge): void {
  const hex = hexes[key];
  if (!hex) return;
  if (!hex.connections) {
    hexes[key] = { ...hex, connections: { rivers: [], roads: [edge] } };
  } else if (!hex.connections.roads.includes(edge)) {
    hexes[key] = {
      ...hex,
      connections: {
        ...hex.connections,
        roads: [...hex.connections.roads, edge]
      }
    };
  }
}

/**
 * A* pathfinding between two hex keys.
 * Movement cost varies by terrain with small random perturbation for natural routes.
 */
function aStarPath(
  startKey: string,
  endKey: string,
  hexes: Record<string, Hex>,
  gridWidth: number,
  gridHeight: number,
  rng: SeededRNG,
  terrainTypes?: TerrainType[]
): string[] | null {
  const endCoord = parseHexKey(endKey);
  if (!endCoord) return null;

  // Heuristic: axial distance
  function heuristic(key: string): number {
    const coord = parseHexKey(key);
    if (!coord) return Infinity;
    const dq = Math.abs(coord.q - endCoord!.q);
    const dr = Math.abs(coord.r - endCoord!.r);
    return dq + dr;
  }

  const openSet = new Set<string>([startKey]);
  const cameFrom: Record<string, string> = {};
  const gScore: Record<string, number> = { [startKey]: 0 };
  const fScore: Record<string, number> = { [startKey]: heuristic(startKey) };

  while (openSet.size > 0) {
    // Find node with lowest fScore in open set
    let current = '';
    let lowestF = Infinity;
    openSet.forEach(key => {
      const f = fScore[key] ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        current = key;
      }
    });

    if (current === endKey) {
      // Reconstruct path
      const path = [current];
      let node = current;
      while (cameFrom[node]) {
        node = cameFrom[node];
        path.unshift(node);
      }
      return path;
    }

    openSet.delete(current);
    const currentCoord = parseHexKey(current);
    if (!currentCoord) continue;

    const neighbors = getValidNeighbors(currentCoord, gridWidth, gridHeight);
    for (const nCoord of neighbors) {
      const nKey = hexKey(nCoord);
      const nHex = hexes[nKey];
      if (!nHex) continue;

      const cost = getMoveCost(nHex.terrain, terrainTypes) + rng.next() * 0.5; // Small perturbation
      const tentativeG = (gScore[current] ?? Infinity) + cost;

      if (tentativeG < (gScore[nKey] ?? Infinity)) {
        cameFrom[nKey] = current;
        gScore[nKey] = tentativeG;
        fScore[nKey] = tentativeG + heuristic(nKey);
        openSet.add(nKey);
      }
    }
  }

  return null; // No path found
}
