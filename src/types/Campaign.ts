// Direct port from Swift data models

import { TimeWeatherState, DEFAULT_WEATHER, DEFAULT_TIME, CalendarSystem } from './Weather';
import { CALENDAR_PRESETS } from '../data/calendars';
import { HexMarker, MarkerType, DEFAULT_MARKER_TYPES } from './Markers';

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

  /**
   * Weather & Time System state.
   * Optional for backward compatibility with legacy campaign files.
   * New campaigns are always initialized with this field via createCampaign().
   */
  timeWeather?: TimeWeatherState;

  /**
   * Custom marker type definitions for this campaign.
   * Optional for backward compatibility with legacy campaign files.
   * New campaigns are always initialized with DEFAULT_MARKER_TYPES via createCampaign().
   */
  markerTypes?: MarkerType[];

  /**
   * Encounter templates for this campaign.
   * Optional for backward compatibility with legacy campaign files.
   */
  encounterTemplates?: EncounterTemplate[];

  /**
   * Bookmarked hex keys ("q,r" format) for quick access.
   * Optional for backward compatibility with legacy campaign files.
   */
  bookmarkedHexes?: string[];

  /**
   * Named geographic regions grouping adjacent hexes.
   * Optional for backward compatibility with legacy campaign files.
   */
  regions?: Region[];

  /**
   * Procedural generation configuration (seed, densities, clustering).
   * Optional for backward compatibility with legacy campaign files.
   */
  generationConfig?: GenerationConfig;

  /**
   * Custom landmark tables for procedural generation.
   * Optional for backward compatibility with legacy campaign files.
   */
  landmarkTables?: LandmarkTable[];
}

export interface Hex {
  id: string;
  coordinate: HexCoordinate;
  terrain: string;
  status: DiscoveryStatus;
  notes: string;
  tags: string[];
  locations: ContentItem[];
  encounters: Encounter[];
  npcs: ContentItem[];
  treasures: ContentItem[];
  clues: ContentItem[];
  /** Visual markers/figurines on this hex. Optional for backward compatibility with legacy files. */
  markers?: HexMarker[];
  /** River and road edge connections. Optional for backward compatibility with legacy files. */
  connections?: HexConnections;
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

// ============ GENERATION CONFIG ============

export interface GenerationConfig {
  seed: string;
  biomeClusteringStrength: number; // 0-1
  encounterDensity: number;        // 0-1
  landmarkDensity: number;         // 0-1
  terrainVariety: number;          // 0-1
}

export function createDefaultGenerationConfig(): GenerationConfig {
  return {
    seed: '',
    biomeClusteringStrength: 0.6,
    encounterDensity: 0.4,
    landmarkDensity: 0.2,
    terrainVariety: 0.5
  };
}

// ============ LANDMARK TABLES ============

export interface LandmarkEntry {
  id: string;
  title: string;
  description: string;
  rarity: string;
  weight: number;
}

export interface LandmarkTable {
  id: string;
  name: string;
  terrain: string;
  entries: LandmarkEntry[];
}

// ============ HEX CONNECTIONS (Rivers/Roads) ============

/** Edge index 0-5 representing the 6 edges of a hex */
export type HexEdge = 0 | 1 | 2 | 3 | 4 | 5;

export interface HexConnections {
  rivers: HexEdge[];
  roads: HexEdge[];
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
    timeWeather: createDefaultTimeWeather(),
    markerTypes: DEFAULT_MARKER_TYPES,
    encounterTemplates: [],
    bookmarkedHexes: [],
    regions: [],
    generationConfig: createDefaultGenerationConfig(),
    landmarkTables: []
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
    clues: [],
    markers: []
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
import type { IconName } from '../components/icons/Icon';

export const CATEGORY_INFO: Record<ContentCategory, { label: string; icon: IconName }> = {
  locations: { label: 'Locations', icon: 'pin' },
  encounters: { label: 'Encounters', icon: 'sword' },
  npcs: { label: 'NPCs', icon: 'user' },
  treasures: { label: 'Treasures', icon: 'sparkle' },
  clues: { label: 'Clues & Hooks', icon: 'lightbulb' }
};

// ============ ENCOUNTER SYSTEM ============

export type EncounterType = 'combat' | 'social' | 'exploration' | 'puzzle';
export type EncounterOutcome = 'pending' | 'victory' | 'defeat' | 'fled' | 'negotiated' | 'bypassed';

export interface CreatureEntry {
  id: string;
  name: string;
  count: number;
  cr?: string;
  notes?: string;
}

export interface EncounterReward {
  id: string;
  type: 'gold' | 'item' | 'xp' | 'other';
  description: string;
  quantity?: number;
}

export interface LinkedNpcRef {
  npcId: string;
  hexKey: string; // "q,r" format
}

export interface Encounter extends ContentItem {
  encounterType: EncounterType;
  creatures: CreatureEntry[];
  linkedNpcIds: LinkedNpcRef[];
  rewards: EncounterReward[];
  outcome: EncounterOutcome;
  outcomeNotes: string;
  templateId?: string;
}

export interface EncounterTemplate {
  id: string;
  name: string;
  description: string;
  encounterType: EncounterType;
  difficulty: string;
  creatures: CreatureEntry[];
  rewards: EncounterReward[];
  tags: string[];
  terrainAffinity?: string[];
}

// Encounter constants
export const ENCOUNTER_TYPE_INFO: Record<EncounterType, { label: string; icon: IconName; color: string }> = {
  combat: { label: 'Combat', icon: 'sword', color: '#f44336' },
  social: { label: 'Social', icon: 'user', color: '#4a9eff' },
  exploration: { label: 'Exploration', icon: 'map', color: '#4caf50' },
  puzzle: { label: 'Puzzle', icon: 'lightbulb', color: '#ff9800' }
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  'Easy': '#4caf50',
  'Medium': '#ff9800',
  'Hard': '#f44336',
  'Deadly': '#9c27b0'
};

export const OUTCOME_INFO: Record<EncounterOutcome, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#666666' },
  victory: { label: 'Victory', color: '#4caf50' },
  defeat: { label: 'Defeat', color: '#f44336' },
  fled: { label: 'Fled', color: '#ff9800' },
  negotiated: { label: 'Negotiated', color: '#4a9eff' },
  bypassed: { label: 'Bypassed', color: '#9c27b0' }
};

// ============ REGION SYSTEM ============

export interface Region {
  id: string;
  name: string;
  color: string;          // hex color e.g. "#4a9eff"
  description: string;
  hexKeys: string[];       // "q,r" format coordinate keys
  tags: string[];
  isDiscovered: boolean;
  notes: string;
}

export const REGION_COLORS = [
  '#4a9eff', '#4caf50', '#f44336', '#ff9800', '#9c27b0', '#00bcd4',
  '#e91e63', '#8bc34a', '#ff5722', '#607d8b', '#3f51b5', '#cddc39'
];

export function createRegion(name: string = '', color: string = '#4a9eff'): Region {
  return {
    id: crypto.randomUUID(),
    name,
    color,
    description: '',
    hexKeys: [],
    tags: [],
    isDiscovered: false,
    notes: ''
  };
}

// Encounter factory functions
export function createEncounter(title: string = ''): Encounter {
  return {
    id: crypto.randomUUID(),
    title,
    description: '',
    difficulty: undefined,
    isResolved: false,
    encounterType: 'combat',
    creatures: [],
    linkedNpcIds: [],
    rewards: [],
    outcome: 'pending',
    outcomeNotes: ''
  };
}

export function createEncounterTemplate(name: string = ''): EncounterTemplate {
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    encounterType: 'combat',
    difficulty: '',
    creatures: [],
    rewards: [],
    tags: []
  };
}

export function createCreatureEntry(name: string = ''): CreatureEntry {
  return {
    id: crypto.randomUUID(),
    name,
    count: 1
  };
}

export function createEncounterReward(description: string = ''): EncounterReward {
  return {
    id: crypto.randomUUID(),
    type: 'item',
    description
  };
}

export function instantiateFromTemplate(template: EncounterTemplate): Encounter {
  return {
    id: crypto.randomUUID(),
    title: template.name,
    description: template.description,
    difficulty: template.difficulty || undefined,
    isResolved: false,
    encounterType: template.encounterType,
    creatures: template.creatures.map(c => ({ ...c, id: crypto.randomUUID() })),
    linkedNpcIds: [],
    rewards: template.rewards.map(r => ({ ...r, id: crypto.randomUUID() })),
    outcome: 'pending',
    outcomeNotes: '',
    templateId: template.id
  };
}

/** Migrate a legacy ContentItem to the full Encounter type */
export function migrateEncounterData(item: ContentItem): Encounter {
  // If already an Encounter, return as-is
  if ('encounterType' in item) return item as Encounter;
  return {
    ...item,
    encounterType: inferEncounterType(item.difficulty),
    creatures: [],
    linkedNpcIds: [],
    rewards: [],
    outcome: item.isResolved ? 'victory' : 'pending',
    outcomeNotes: ''
  };
}

function inferEncounterType(difficulty?: string): EncounterType {
  if (!difficulty) return 'combat';
  const lower = difficulty.toLowerCase();
  if (lower === 'social') return 'social';
  if (lower === 'exploration') return 'exploration';
  if (lower === 'puzzle') return 'puzzle';
  return 'combat';
}

/** Migrate an entire campaign's encounter data (non-destructive) */
export function migrateCampaign(campaign: Campaign): Campaign {
  let changed = false;
  const hexes: Record<string, Hex> = {};
  for (const [key, hex] of Object.entries(campaign.hexes)) {
    const migratedEncounters = hex.encounters.map(e => {
      const migrated = migrateEncounterData(e);
      if (migrated !== e) changed = true;
      return migrated;
    });
    hexes[key] = { ...hex, encounters: migratedEncounters };
  }
  if (!changed
    && campaign.encounterTemplates !== undefined
    && campaign.bookmarkedHexes !== undefined
    && campaign.regions !== undefined
    && campaign.generationConfig !== undefined
    && campaign.landmarkTables !== undefined
  ) return campaign;
  return {
    ...campaign,
    hexes,
    encounterTemplates: campaign.encounterTemplates ?? [],
    bookmarkedHexes: campaign.bookmarkedHexes ?? [],
    regions: campaign.regions ?? [],
    generationConfig: campaign.generationConfig ?? createDefaultGenerationConfig(),
    landmarkTables: campaign.landmarkTables ?? []
  };
}

// Aliases for CampaignContext
export const defaultTerrainTypes = DEFAULT_TERRAIN_TYPES;
export const defaultEncounterTables = DEFAULT_ENCOUNTER_TABLES;
