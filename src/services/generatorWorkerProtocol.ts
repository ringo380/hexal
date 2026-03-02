// Worker <-> main thread message types for procedural generation

import type {
  Hex,
  TerrainType,
  EncounterTable,
  LandmarkTable,
  GenerationConfig,
} from '../types';

// ============ Main → Worker Messages ============

export interface GenerateAllEmptyPayload {
  hexes: Record<string, Hex>;
  terrainTypes: TerrainType[];
  encounterTables: EncounterTable[];
  landmarkTables?: LandmarkTable[];
  gridWidth: number;
  gridHeight: number;
  config: GenerationConfig;
  seed: string;
  generateTerrain: boolean;
  generateEncounters: boolean;
  generateLandmarks: boolean;
  generateRivers: boolean;
  generateRoads: boolean;
  encounterDensity: number;
  landmarkDensity: number;
}

export type GeneratorInMessage =
  | { type: 'GENERATE_ALL_EMPTY'; payload: GenerateAllEmptyPayload };

// ============ Worker → Main Messages ============

export type GeneratorOutMessage =
  | { type: 'PROGRESS'; step: string; percent: number }
  | { type: 'COMPLETE'; hexes: Record<string, Hex> }
  | { type: 'ERROR'; message: string };
