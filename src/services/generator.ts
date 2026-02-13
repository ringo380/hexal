// Direct port from Swift GeneratorService

import type { TerrainType, EncounterTable, Hex } from '../types';
import type { Encounter } from '../types/Campaign';
import { createEncounter } from '../types/Campaign';

/**
 * Generate random terrain based on weighted selection
 */
export function randomTerrain(types: TerrainType[]): string {
  const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.floor(Math.random() * totalWeight) + 1;

  for (const type of types) {
    roll -= type.weight;
    if (roll <= 0) {
      return type.name;
    }
  }

  return types[0]?.name ?? 'Plains';
}

/**
 * Generate a random encounter for a terrain type
 */
export function randomEncounter(
  terrain: string,
  tables: EncounterTable[]
): Encounter | null {
  const table = tables.find(t => t.terrain === terrain);
  if (!table || table.entries.length === 0) {
    return null;
  }

  const totalWeight = table.entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.floor(Math.random() * totalWeight) + 1;

  for (const entry of table.entries) {
    roll -= entry.weight;
    if (roll <= 0) {
      const encounter = createEncounter(entry.title);
      encounter.description = entry.description;
      encounter.difficulty = entry.difficulty;
      encounter.encounterType = inferEncounterType(entry.difficulty);
      return encounter;
    }
  }

  return null;
}

function inferEncounterType(difficulty: string): Encounter['encounterType'] {
  const lower = difficulty.toLowerCase();
  if (lower === 'social') return 'social';
  if (lower === 'exploration') return 'exploration';
  if (lower === 'puzzle') return 'puzzle';
  return 'combat';
}

/**
 * Populate a hex with generated content
 */
export function populateHex(
  hex: Hex,
  terrainTypes: TerrainType[],
  encounterTables: EncounterTable[],
  options: { generateTerrain?: boolean; generateEncounter?: boolean } = {}
): Hex {
  const { generateTerrain = true, generateEncounter = true } = options;
  const updatedHex = { ...hex };

  if (generateTerrain) {
    updatedHex.terrain = randomTerrain(terrainTypes);
  }

  if (generateEncounter) {
    const encounter = randomEncounter(updatedHex.terrain, encounterTables);
    if (encounter) {
      updatedHex.encounters = [...updatedHex.encounters, encounter];
    }
  }

  return updatedHex;
}
