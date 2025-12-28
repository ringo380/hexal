// Direct port from Swift GeneratorService

import type { TerrainType, EncounterTable, ContentItem, Hex } from '../types';
import { createContentItem } from '../types';

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
): ContentItem | null {
  const table = tables.find(t => t.terrain === terrain);
  if (!table || table.entries.length === 0) {
    return null;
  }

  const totalWeight = table.entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.floor(Math.random() * totalWeight) + 1;

  for (const entry of table.entries) {
    roll -= entry.weight;
    if (roll <= 0) {
      return {
        ...createContentItem(entry.title),
        description: entry.description,
        difficulty: entry.difficulty
      };
    }
  }

  return null;
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
