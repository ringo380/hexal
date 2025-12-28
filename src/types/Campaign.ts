// Direct port from Swift data models

import { TimeWeatherState, DEFAULT_WEATHER, DEFAULT_TIME, CalendarSystem } from './Weather';
import { CALENDAR_PRESETS } from '../data/calendars';

export interface Campaign {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  hexes: Record<string, Hex>; // Key: "q,r" format
  terrainTypes: TerrainType[];
  encounterTables: EncounterTable[];
  createdAt: string; // ISO date string
  modifiedAt: string;

  // Weather & Time System (optional for backward compatibility)
  timeWeather?: TimeWeatherState;
}

export interface Hex {
  id: string;
  coordinate: HexCoordinate;
  terrain: string;
  status: DiscoveryStatus;
  notes: string;
  tags: string[];
  locations: ContentItem[];
  encounters: ContentItem[];
  npcs: ContentItem[];
  treasures: ContentItem[];
  clues: ContentItem[];
}

export interface HexCoordinate {
  q: number; // column
  r: number; // row
}

export type DiscoveryStatus = 'undiscovered' | 'discovered' | 'cleared';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  difficulty?: string;
  isResolved: boolean;
}

export type ContentCategory = 'locations' | 'encounters' | 'npcs' | 'treasures' | 'clues';

export interface TerrainType {
  id: string;
  name: string;
  colorHex: string;
  icon: string;
  weight: number;
}

export interface EncounterTable {
  id: string;
  name: string;
  terrain: string;
  entries: EncounterEntry[];
}

export interface EncounterEntry {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  weight: number;
}

// Helper functions
export function hexKey(coord: HexCoordinate): string {
  return `${coord.q},${coord.r}`;
}

// Alias for consistency
export const coordinateKey = hexKey;

export function parseHexKey(key: string): HexCoordinate | null {
  const parts = key.split(',');
  if (parts.length !== 2) return null;
  const q = parseInt(parts[0], 10);
  const r = parseInt(parts[1], 10);
  if (isNaN(q) || isNaN(r)) return null;
  return { q, r };
}

export function hasUnresolvedContent(hex: Hex): boolean {
  const allItems = [
    ...hex.locations,
    ...hex.encounters,
    ...hex.npcs,
    ...hex.treasures,
    ...hex.clues
  ];
  return allItems.some(item => !item.isResolved);
}

// Alias for consistency
export const hexHasUnresolvedContent = hasUnresolvedContent;

// Default factory functions

export function createDefaultTimeWeather(calendar: CalendarSystem = CALENDAR_PRESETS['simple']): TimeWeatherState {
  return {
    calendar,
    currentTime: { ...DEFAULT_TIME },
    timeSpeed: 'normal',
    globalWeather: { ...DEFAULT_WEATHER },
    zoneWeathers: {},
    hexWeatherOverrides: {},
    weatherHistory: [],
    dynamicWeather: true,
    seasonalEffects: true,
    weatherChangeInterval: 6
  };
}

export function createCampaign(name: string, gridWidth: number, gridHeight: number): Campaign {
  return {
    id: crypto.randomUUID(),
    name,
    gridWidth: Math.min(gridWidth, 50),
    gridHeight: Math.min(gridHeight, 50),
    hexes: {},
    terrainTypes: DEFAULT_TERRAIN_TYPES,
    encounterTables: DEFAULT_ENCOUNTER_TABLES,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    timeWeather: createDefaultTimeWeather()
  };
}

export function createHex(coordinate: HexCoordinate, terrain: string = ''): Hex {
  return {
    id: crypto.randomUUID(),
    coordinate,
    terrain,
    status: 'undiscovered',
    notes: '',
    tags: [],
    locations: [],
    encounters: [],
    npcs: [],
    treasures: [],
    clues: []
  };
}

export function createContentItem(title: string = ''): ContentItem {
  return {
    id: crypto.randomUUID(),
    title,
    description: '',
    difficulty: undefined,
    isResolved: false
  };
}

// Default data (ported from Swift)
export const DEFAULT_TERRAIN_TYPES: TerrainType[] = [
  { id: crypto.randomUUID(), name: 'Plains', colorHex: '#90EE90', icon: 'leaf', weight: 3 },
  { id: crypto.randomUUID(), name: 'Forest', colorHex: '#228B22', icon: 'tree', weight: 2 },
  { id: crypto.randomUUID(), name: 'Hills', colorHex: '#DEB887', icon: 'triangle', weight: 2 },
  { id: crypto.randomUUID(), name: 'Mountains', colorHex: '#A0A0A0', icon: 'mountain', weight: 1 },
  { id: crypto.randomUUID(), name: 'Swamp', colorHex: '#556B2F', icon: 'drop', weight: 1 },
  { id: crypto.randomUUID(), name: 'Desert', colorHex: '#F4A460', icon: 'sun', weight: 1 },
  { id: crypto.randomUUID(), name: 'Coast', colorHex: '#87CEEB', icon: 'water', weight: 1 },
  { id: crypto.randomUUID(), name: 'Jungle', colorHex: '#006400', icon: 'leaf', weight: 1 },
  { id: crypto.randomUUID(), name: 'Tundra', colorHex: '#E0FFFF', icon: 'snowflake', weight: 1 },
  { id: crypto.randomUUID(), name: 'Grassland', colorHex: '#7CFC00', icon: 'wind', weight: 2 }
];

export const DEFAULT_ENCOUNTER_TABLES: EncounterTable[] = [
  {
    id: crypto.randomUUID(),
    name: 'Forest Encounters',
    terrain: 'Forest',
    entries: [
      { id: crypto.randomUUID(), title: 'Wolf Pack', description: '2d4 wolves hunting in the forest', difficulty: 'CR 2', weight: 1 },
      { id: crypto.randomUUID(), title: 'Bandit Camp', description: 'A group of bandits has made camp here', difficulty: 'CR 3', weight: 1 },
      { id: crypto.randomUUID(), title: 'Ancient Shrine', description: 'An overgrown shrine to a forgotten deity', difficulty: 'Exploration', weight: 1 },
      { id: crypto.randomUUID(), title: 'Treant Guardian', description: 'An ancient treant watches over this grove', difficulty: 'CR 9', weight: 1 }
    ]
  },
  {
    id: crypto.randomUUID(),
    name: 'Plains Encounters',
    terrain: 'Plains',
    entries: [
      { id: crypto.randomUUID(), title: 'Traveling Merchant', description: 'A merchant with a cart of goods', difficulty: 'Social', weight: 1 },
      { id: crypto.randomUUID(), title: 'Gnoll Raiders', description: '1d6+2 gnolls on a raiding party', difficulty: 'CR 4', weight: 1 },
      { id: crypto.randomUUID(), title: 'Ancient Battlefield', description: 'Bones and rusted weapons litter the ground', difficulty: 'Exploration', weight: 1 }
    ]
  },
  {
    id: crypto.randomUUID(),
    name: 'Mountains Encounters',
    terrain: 'Mountains',
    entries: [
      { id: crypto.randomUUID(), title: 'Giant Eagle Nest', description: 'A pair of giant eagles have nested here', difficulty: 'CR 2', weight: 1 },
      { id: crypto.randomUUID(), title: 'Orc Warband', description: '2d6 orcs traveling through the pass', difficulty: 'CR 5', weight: 1 },
      { id: crypto.randomUUID(), title: "Dragon's Lair Entrance", description: 'A cave that leads deeper into the mountain', difficulty: 'CR 15+', weight: 1 }
    ]
  }
];

// Category metadata
export const CATEGORY_INFO: Record<ContentCategory, { label: string; icon: string }> = {
  locations: { label: 'Locations', icon: '📍' },
  encounters: { label: 'Encounters', icon: '⚔️' },
  npcs: { label: 'NPCs', icon: '👤' },
  treasures: { label: 'Treasures', icon: '✨' },
  clues: { label: 'Clues & Hooks', icon: '💡' }
};

// Aliases for CampaignContext
export const defaultTerrainTypes = DEFAULT_TERRAIN_TYPES;
export const defaultEncounterTables = DEFAULT_ENCOUNTER_TABLES;
