// Direct port from Swift data models

import { TimeWeatherState, DEFAULT_WEATHER, DEFAULT_TIME, CalendarSystem, CurrentTime, WeatherSimulationState, createDefaultSimulationState } from './Weather';
import { CALENDAR_PRESETS } from '../data/calendars';
import { HexMarker, MarkerType, DEFAULT_MARKER_TYPES } from './Markers';
import { DEFAULT_EXPANDED_ENCOUNTER_TABLES, DEFAULT_LANDMARK_TABLES } from '../data/generatorTables';
import type { Quest, StoryArc } from './Quest';
import { getTemplateById } from '../data/campaignTemplates';
import { getDefaultStartYear } from '../data/calendars';
import type { CampaignTemplate } from './CampaignTemplate';

/** Current campaign schema version. Increment when making breaking data model changes. */
export const CAMPAIGN_SCHEMA_VERSION = 2;

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
   * Schema version for migration support.
   * Optional for backward compatibility with legacy campaign files.
   */
  schemaVersion?: number;

  /**
   * Monotonic counter for sync conflict detection.
   * Incremented on each save. Optional for backward compat.
   */
  version?: number;

  /**
   * User attribution for collaboration (user ID or display name).
   * Optional for backward compatibility with legacy campaign files.
   */
  lastModifiedBy?: string;

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

  /**
   * NPC factions for this campaign.
   * Optional for backward compatibility with legacy campaign files.
   */
  factions?: Faction[];

  /**
   * Game sessions for this campaign.
   * Optional for backward compatibility with legacy campaign files.
   */
  sessions?: Session[];

  /**
   * Session log entries (flat array, referenced by sessionId).
   * Optional for backward compatibility with legacy campaign files.
   */
  sessionLog?: SessionLogEntry[];

  /**
   * Quests for this campaign.
   * Optional for backward compatibility with legacy campaign files.
   */
  quests?: Quest[];

  /**
   * Story arcs grouping quests into narrative threads.
   * Optional for backward compatibility with legacy campaign files.
   */
  storyArcs?: StoryArc[];

  /**
   * Weather simulation state (radar overlay, pressure systems, events).
   * Optional for backward compatibility with legacy campaign files.
   */
  weatherSimulation?: WeatherSimulationState;

  /**
   * Fog of war configuration for the player view.
   * Optional for backward compatibility with legacy campaign files.
   */
  fogOfWarConfig?: FogOfWarConfig;

  /**
   * Player characters tracked on the map.
   * Optional for backward compatibility with legacy campaign files.
   */
  playerCharacters?: PlayerCharacter[];

  /**
   * Named parties for grouping player characters.
   * Optional for backward compatibility with legacy campaign files.
   */
  parties?: Party[];

  /**
   * Player journal notes (bidirectional: players create, DM views).
   * Optional for backward compatibility with legacy campaign files.
   */
  playerNotes?: PlayerNote[];
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
  npcs: Npc[];
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
  moveCost?: number;         // 1-5, default 1 (used by road pathfinding)
  elevation?: number;        // 0-5, default 1 (used by river generation)
  isDefault?: boolean;       // true for built-in terrains
  hazardLevel?: number;      // 0-5, 0=safe (default)
  hazardType?: string;       // e.g. "Extreme Cold", "Toxic Spores"
  hazardDescription?: string; // Longer description for hex detail
  category?: string;         // "Temperate", "Aquatic", "Arctic", etc.
  moisture?: number;         // 0-5 (biome humidity, replaces hardcoded weather lookups)
  temperature?: number;      // 0-5 (biome warmth, replaces hardcoded weather lookups)
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
    encounterTables: DEFAULT_EXPANDED_ENCOUNTER_TABLES,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
    version: 1,
    timeWeather: createDefaultTimeWeather(),
    markerTypes: DEFAULT_MARKER_TYPES,
    encounterTemplates: [],
    bookmarkedHexes: [],
    regions: [],
    generationConfig: createDefaultGenerationConfig(),
    landmarkTables: DEFAULT_LANDMARK_TABLES,
    factions: [],
    sessions: [],
    sessionLog: [],
    quests: [],
    storyArcs: [],
    weatherSimulation: createDefaultSimulationState(),
    fogOfWarConfig: createDefaultFogOfWarConfig(),
    playerCharacters: [],
    parties: [],
    playerNotes: []
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
  { id: crypto.randomUUID(), name: 'Plains', colorHex: '#90EE90', icon: 'leaf', weight: 3, moveCost: 1, elevation: 1, isDefault: true, hazardLevel: 0, category: 'Temperate', moisture: 2, temperature: 3 },
  { id: crypto.randomUUID(), name: 'Forest', colorHex: '#228B22', icon: 'tree', weight: 2, moveCost: 2, elevation: 2, isDefault: true, hazardLevel: 0, category: 'Temperate', moisture: 3, temperature: 2 },
  { id: crypto.randomUUID(), name: 'Hills', colorHex: '#DEB887', icon: 'triangle', weight: 2, moveCost: 2, elevation: 3, isDefault: true, hazardLevel: 0, category: 'Temperate', moisture: 2, temperature: 2 },
  { id: crypto.randomUUID(), name: 'Mountains', colorHex: '#A0A0A0', icon: 'mountain', weight: 1, moveCost: 4, elevation: 5, isDefault: true, hazardLevel: 2, hazardType: 'Altitude', category: 'Highland', moisture: 1, temperature: 0 },
  { id: crypto.randomUUID(), name: 'Swamp', colorHex: '#556B2F', icon: 'drop', weight: 1, moveCost: 3, elevation: 0, isDefault: true, hazardLevel: 1, hazardType: 'Difficult Terrain', category: 'Aquatic', moisture: 5, temperature: 3 },
  { id: crypto.randomUUID(), name: 'Desert', colorHex: '#F4A460', icon: 'sun', weight: 1, moveCost: 1, elevation: 1, isDefault: true, hazardLevel: 1, hazardType: 'Extreme Heat', category: 'Arid', moisture: 0, temperature: 5 },
  { id: crypto.randomUUID(), name: 'Coast', colorHex: '#87CEEB', icon: 'water', weight: 1, moveCost: 5, elevation: 0, isDefault: true, hazardLevel: 0, category: 'Aquatic', moisture: 5, temperature: 3 },
  { id: crypto.randomUUID(), name: 'Jungle', colorHex: '#006400', icon: 'leaf', weight: 1, moveCost: 3, elevation: 2, isDefault: true, hazardLevel: 1, hazardType: 'Dense Undergrowth', category: 'Tropical', moisture: 5, temperature: 4 },
  { id: crypto.randomUUID(), name: 'Tundra', colorHex: '#E0FFFF', icon: 'snowflake', weight: 1, moveCost: 2, elevation: 2, isDefault: true, hazardLevel: 1, hazardType: 'Extreme Cold', category: 'Arctic', moisture: 1, temperature: 0 },
  { id: crypto.randomUUID(), name: 'Grassland', colorHex: '#7CFC00', icon: 'wind', weight: 2, moveCost: 1, elevation: 1, isDefault: true, hazardLevel: 0, category: 'Temperate', moisture: 2, temperature: 3 }
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

// ============ ACTIVE ENCOUNTER (session-only, not persisted) ============

export interface ActiveEncounter {
  id: string;
  title: string;
  description: string;
  encounterType: EncounterType;
  creatures: { name: string; count: number; cr?: string }[];
  terrain: string;
  hexKey: string;
  regionName?: string;
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

// ============ NPC SYSTEM ============

export type NpcAlignment =
  | 'lawful-good' | 'neutral-good' | 'chaotic-good'
  | 'lawful-neutral' | 'true-neutral' | 'chaotic-neutral'
  | 'lawful-evil' | 'neutral-evil' | 'chaotic-evil'
  | 'unaligned';

export type NpcAttitude = 'friendly' | 'indifferent' | 'hostile' | 'unknown';

export type RelationshipType =
  | 'ally' | 'enemy' | 'rival' | 'family' | 'mentor'
  | 'student' | 'employer' | 'employee' | 'romantic' | 'other';

export interface NpcRelationship {
  targetNpcId: string;
  targetHexKey: string; // "q,r" format
  type: RelationshipType;
  description?: string;
}

export interface Npc extends ContentItem {
  race?: string;
  class?: string;
  alignment?: NpcAlignment;
  attitude?: NpcAttitude;
  appearance?: string;
  personality?: string;
  factionId?: string;
  factionRole?: string;
  relationships: NpcRelationship[];
  tags: string[];
  isAlive: boolean;
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  alignment?: NpcAlignment;
  color: string;
  goals?: string;
  headquarters?: string;
  tags: string[];
  isKnownToPlayers: boolean;
}

// ============ SESSION LOG SYSTEM ============

export type SessionLogTag = 'combat' | 'discovery' | 'social' | 'quest' | 'travel' | 'rest' | 'shopping' | 'custom';

export const SESSION_TAG_INFO: Record<SessionLogTag, { label: string; icon: IconName; color: string }> = {
  combat: { label: 'Combat', icon: 'sword', color: '#f44336' },
  discovery: { label: 'Discovery', icon: 'search', color: '#4caf50' },
  social: { label: 'Social', icon: 'user', color: '#4a9eff' },
  quest: { label: 'Quest', icon: 'star', color: '#ff9800' },
  travel: { label: 'Travel', icon: 'walk', color: '#8bc34a' },
  rest: { label: 'Rest', icon: 'moon', color: '#9c27b0' },
  shopping: { label: 'Shopping', icon: 'sparkle', color: '#00bcd4' },
  custom: { label: 'Custom', icon: 'lightbulb', color: '#607d8b' }
};

export interface SessionLogEntry {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  inGameTime: CurrentTime;
  hexKeys: string[];
  tags: SessionLogTag[];
  isVisibleToPlayers: boolean;
  customTag?: string;
}

export interface Session {
  id: string;
  number: number;
  title: string;
  summary: string;
  realWorldDate: string; // ISO date string
  inGameTimeStart?: CurrentTime;
  inGameTimeEnd?: CurrentTime;
  hexesVisited: string[];
  isVisibleToPlayers: boolean;
}

// NPC alignment display info
export const ALIGNMENT_LABELS: Record<NpcAlignment, string> = {
  'lawful-good': 'LG',
  'neutral-good': 'NG',
  'chaotic-good': 'CG',
  'lawful-neutral': 'LN',
  'true-neutral': 'N',
  'chaotic-neutral': 'CN',
  'lawful-evil': 'LE',
  'neutral-evil': 'NE',
  'chaotic-evil': 'CE',
  'unaligned': 'UA'
};

export const ALIGNMENT_COLORS: Record<NpcAlignment, string> = {
  'lawful-good': '#4a9eff',
  'neutral-good': '#4caf50',
  'chaotic-good': '#8bc34a',
  'lawful-neutral': '#607d8b',
  'true-neutral': '#9e9e9e',
  'chaotic-neutral': '#ff9800',
  'lawful-evil': '#9c27b0',
  'neutral-evil': '#f44336',
  'chaotic-evil': '#e91e63',
  'unaligned': '#666666'
};

export const ATTITUDE_INFO: Record<NpcAttitude, { label: string; color: string }> = {
  friendly: { label: 'Friendly', color: '#4caf50' },
  indifferent: { label: 'Indifferent', color: '#9e9e9e' },
  hostile: { label: 'Hostile', color: '#f44336' },
  unknown: { label: 'Unknown', color: '#666666' }
};

export const RELATIONSHIP_TYPE_INFO: Record<RelationshipType, { label: string; color: string }> = {
  ally: { label: 'Ally', color: '#4caf50' },
  enemy: { label: 'Enemy', color: '#f44336' },
  rival: { label: 'Rival', color: '#ff9800' },
  family: { label: 'Family', color: '#4a9eff' },
  mentor: { label: 'Mentor', color: '#9c27b0' },
  student: { label: 'Student', color: '#00bcd4' },
  employer: { label: 'Employer', color: '#607d8b' },
  employee: { label: 'Employee', color: '#8bc34a' },
  romantic: { label: 'Romantic', color: '#e91e63' },
  other: { label: 'Other', color: '#666666' }
};

export const FACTION_COLORS = [
  '#4a9eff', '#4caf50', '#f44336', '#ff9800', '#9c27b0', '#00bcd4',
  '#e91e63', '#8bc34a', '#ff5722', '#607d8b', '#3f51b5', '#cddc39'
];

export function createNpc(title: string = ''): Npc {
  return {
    id: crypto.randomUUID(),
    title,
    description: '',
    difficulty: undefined,
    isResolved: false,
    relationships: [],
    tags: [],
    isAlive: true
  };
}

export function createFaction(name: string = '', color: string = '#4a9eff'): Faction {
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    color,
    tags: [],
    isKnownToPlayers: false
  };
}

export function createSession(number: number, title?: string): Session {
  return {
    id: crypto.randomUUID(),
    number,
    title: title || `Session ${number}`,
    summary: '',
    realWorldDate: new Date().toISOString().split('T')[0],
    hexesVisited: [],
    isVisibleToPlayers: true
  };
}

export function createSessionLogEntry(sessionId: string, inGameTime: CurrentTime): SessionLogEntry {
  return {
    id: crypto.randomUUID(),
    sessionId,
    title: '',
    description: '',
    inGameTime: { ...inGameTime },
    hexKeys: [],
    tags: [],
    isVisibleToPlayers: true
  };
}

export function createNpcRelationship(
  targetNpcId: string,
  targetHexKey: string,
  type: RelationshipType = 'ally'
): NpcRelationship {
  return { targetNpcId, targetHexKey, type };
}

/** Migrate a legacy ContentItem to the full Npc type */
export function migrateNpcData(item: ContentItem): Npc {
  if ('relationships' in item) return item as Npc;
  return {
    ...item,
    relationships: [],
    tags: [],
    isAlive: true
  };
}

// ============ FOG OF WAR CONFIG ============

export interface FogOfWarConfig {
  revealRadius: number;              // 1-3, default 1
  showAdjacentSilhouettes: boolean;  // default true
  fadeTransitionEnabled: boolean;     // default true
}

export function createDefaultFogOfWarConfig(): FogOfWarConfig {
  return {
    revealRadius: 1,
    showAdjacentSilhouettes: true,
    fadeTransitionEnabled: true
  };
}

// ============ PLAYER CHARACTER TRACKING ============

export interface PlayerCharacter {
  id: string;
  name: string;
  color: string;
  icon: string;        // emoji/unicode character
  hexKey?: string;     // current location "q,r"
  isVisible: boolean;  // visible on player view
  partyId?: string;
}

export interface Party {
  id: string;
  name: string;
  color: string;
}

export function createPlayerCharacter(name: string = '', color: string = '#4a9eff'): PlayerCharacter {
  return {
    id: crypto.randomUUID(),
    name,
    color,
    icon: '🧙',
    isVisible: true
  };
}

export function createParty(name: string = '', color: string = '#4a9eff'): Party {
  return {
    id: crypto.randomUUID(),
    name,
    color
  };
}

// ============ PLAYER NOTES ============

export interface PlayerNote {
  id: string;
  playerName: string;
  title: string;
  content: string;          // markdown (plain text for now, no rendering)
  createdAt: string;         // ISO date string
  modifiedAt: string;        // ISO date string
  linkedHexKeys: string[];
  linkedNpcNames: string[];
  linkedQuestIds: string[];
  tags: string[];
}

export function createPlayerNote(playerName: string): PlayerNote {
  return {
    id: crypto.randomUUID(),
    playerName,
    title: '',
    content: '',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    linkedHexKeys: [],
    linkedNpcNames: [],
    linkedQuestIds: [],
    tags: []
  };
}

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

// Lookup tables for backfilling terrain type fields during migration
const DEFAULT_TERRAIN_ELEVATION: Record<string, number> = {
  Mountains: 5, Hills: 3, Forest: 2, Jungle: 2, Tundra: 2,
  Plains: 1, Grassland: 1, Desert: 1, Swamp: 0, Coast: 0
};
const DEFAULT_TERRAIN_MOVE_COST: Record<string, number> = {
  Mountains: 4, Swamp: 3, Jungle: 3, Hills: 2, Forest: 2, Tundra: 2,
  Plains: 1, Grassland: 1, Desert: 1, Coast: 5
};
const DEFAULT_TERRAIN_HAZARD_LEVEL: Record<string, number> = {
  Mountains: 2, Swamp: 1, Desert: 1, Jungle: 1, Tundra: 1,
  Plains: 0, Forest: 0, Hills: 0, Coast: 0, Grassland: 0
};
const DEFAULT_TERRAIN_HAZARD_TYPE: Record<string, string> = {
  Mountains: 'Altitude', Swamp: 'Difficult Terrain', Desert: 'Extreme Heat',
  Jungle: 'Dense Undergrowth', Tundra: 'Extreme Cold'
};
const DEFAULT_TERRAIN_CATEGORY: Record<string, string> = {
  Plains: 'Temperate', Forest: 'Temperate', Hills: 'Temperate', Grassland: 'Temperate',
  Mountains: 'Highland', Swamp: 'Aquatic', Coast: 'Aquatic',
  Desert: 'Arid', Jungle: 'Tropical', Tundra: 'Arctic'
};
const DEFAULT_TERRAIN_MOISTURE: Record<string, number> = {
  Plains: 2, Forest: 3, Hills: 2, Mountains: 1, Swamp: 5,
  Desert: 0, Coast: 5, Jungle: 5, Tundra: 1, Grassland: 2
};
const DEFAULT_TERRAIN_TEMPERATURE: Record<string, number> = {
  Plains: 3, Forest: 2, Hills: 2, Mountains: 0, Swamp: 3,
  Desert: 5, Coast: 3, Jungle: 4, Tundra: 0, Grassland: 3
};
const DEFAULT_TERRAIN_NAMES = new Set(Object.keys(DEFAULT_TERRAIN_ELEVATION));

/** Migrate terrain types: backfill isDefault, moveCost, elevation, hazard, category, moisture, temperature */
function migrateTerrainTypes(terrainTypes: TerrainType[]): { types: TerrainType[]; changed: boolean } {
  let changed = false;
  const types = terrainTypes.map(t => {
    const isKnown = DEFAULT_TERRAIN_NAMES.has(t.name);
    const needsIsDefault = t.isDefault === undefined && isKnown;
    const needsMoveCost = t.moveCost === undefined && DEFAULT_TERRAIN_MOVE_COST[t.name] !== undefined;
    const needsElevation = t.elevation === undefined && DEFAULT_TERRAIN_ELEVATION[t.name] !== undefined;
    const needsHazardLevel = t.hazardLevel === undefined && isKnown;
    const needsHazardType = t.hazardType === undefined && DEFAULT_TERRAIN_HAZARD_TYPE[t.name] !== undefined;
    const needsCategory = t.category === undefined && isKnown;
    const needsMoisture = t.moisture === undefined && isKnown;
    const needsTemperature = t.temperature === undefined && isKnown;
    if (!needsIsDefault && !needsMoveCost && !needsElevation &&
        !needsHazardLevel && !needsHazardType && !needsCategory &&
        !needsMoisture && !needsTemperature) return t;
    changed = true;
    return {
      ...t,
      ...(needsIsDefault ? { isDefault: true } : {}),
      ...(needsMoveCost ? { moveCost: DEFAULT_TERRAIN_MOVE_COST[t.name] } : {}),
      ...(needsElevation ? { elevation: DEFAULT_TERRAIN_ELEVATION[t.name] } : {}),
      ...(needsHazardLevel ? { hazardLevel: DEFAULT_TERRAIN_HAZARD_LEVEL[t.name] ?? 0 } : {}),
      ...(needsHazardType ? { hazardType: DEFAULT_TERRAIN_HAZARD_TYPE[t.name] } : {}),
      ...(needsCategory ? { category: DEFAULT_TERRAIN_CATEGORY[t.name] ?? '' } : {}),
      ...(needsMoisture ? { moisture: DEFAULT_TERRAIN_MOISTURE[t.name] ?? 2 } : {}),
      ...(needsTemperature ? { temperature: DEFAULT_TERRAIN_TEMPERATURE[t.name] ?? 3 } : {})
    };
  });
  return { types, changed };
}

/** Migrate an entire campaign's encounter, NPC, and terrain data (non-destructive) */
export function migrateCampaign(campaign: Campaign): Campaign {
  let changed = false;
  const hexes: Record<string, Hex> = {};
  for (const [key, hex] of Object.entries(campaign.hexes)) {
    const migratedEncounters = hex.encounters.map(e => {
      const migrated = migrateEncounterData(e);
      if (migrated !== e) changed = true;
      return migrated;
    });
    const migratedNpcs = hex.npcs.map(n => {
      const migrated = migrateNpcData(n);
      if (migrated !== n) changed = true;
      return migrated;
    });
    hexes[key] = { ...hex, encounters: migratedEncounters, npcs: migratedNpcs };
  }

  // Migrate terrain types
  const terrainMigration = migrateTerrainTypes(campaign.terrainTypes);
  if (terrainMigration.changed) changed = true;

  // Check if versioning fields need migration
  if (campaign.schemaVersion !== CAMPAIGN_SCHEMA_VERSION) changed = true;
  if (campaign.version === undefined) changed = true;

  // Migrate weatherSimulation.config.timeMode for existing campaigns
  if (campaign.weatherSimulation && !campaign.weatherSimulation.config.timeMode) {
    changed = true;
  }

  if (!changed
    && campaign.encounterTemplates !== undefined
    && campaign.bookmarkedHexes !== undefined
    && campaign.regions !== undefined
    && campaign.generationConfig !== undefined
    && campaign.landmarkTables !== undefined
    && campaign.factions !== undefined
    && campaign.sessions !== undefined
    && campaign.sessionLog !== undefined
    && campaign.quests !== undefined
    && campaign.storyArcs !== undefined
    && campaign.weatherSimulation !== undefined
    && campaign.weatherSimulation.config.timeMode !== undefined
    && campaign.fogOfWarConfig !== undefined
    && campaign.playerCharacters !== undefined
    && campaign.parties !== undefined
    && campaign.playerNotes !== undefined
  ) return campaign;

  const ws = campaign.weatherSimulation ?? createDefaultSimulationState();
  return {
    ...campaign,
    hexes,
    terrainTypes: terrainMigration.types,
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
    version: campaign.version ?? 1,
    encounterTemplates: campaign.encounterTemplates ?? [],
    bookmarkedHexes: campaign.bookmarkedHexes ?? [],
    regions: campaign.regions ?? [],
    generationConfig: campaign.generationConfig ?? createDefaultGenerationConfig(),
    landmarkTables: campaign.landmarkTables ?? [],
    factions: campaign.factions ?? [],
    sessions: campaign.sessions ?? [],
    sessionLog: campaign.sessionLog ?? [],
    quests: campaign.quests ?? [],
    storyArcs: campaign.storyArcs ?? [],
    weatherSimulation: {
      ...ws,
      config: { ...ws.config, timeMode: ws.config.timeMode ?? 'realtime' }
    },
    fogOfWarConfig: campaign.fogOfWarConfig ?? createDefaultFogOfWarConfig(),
    playerCharacters: campaign.playerCharacters ?? [],
    parties: campaign.parties ?? [],
    playerNotes: campaign.playerNotes ?? []
  };
}

// ============ TEMPLATE FACTORY ============

/** Internal: builds a campaign from a resolved template object */
function buildCampaignFromTemplate(
  template: CampaignTemplate,
  name: string,
  width: number,
  height: number
): Campaign {
  const base = createCampaign(name, width, height);

  const terrainTypes: TerrainType[] = template.terrainTypes.map(t => ({
    ...t,
    id: crypto.randomUUID(),
    isDefault: false,
  }));

  const encounterTables: EncounterTable[] = template.encounterTables.map(table => ({
    ...table,
    id: crypto.randomUUID(),
    entries: table.entries.map(entry => ({
      ...entry,
      id: crypto.randomUUID(),
    })),
  }));

  const landmarkTables: LandmarkTable[] = template.landmarkTables.map(table => ({
    ...table,
    id: crypto.randomUUID(),
    entries: table.entries.map(entry => ({
      ...entry,
      id: crypto.randomUUID(),
    })),
  }));

  const factions: Faction[] = template.factions.map(f => ({
    id: crypto.randomUUID(),
    name: f.name,
    description: f.description,
    color: f.color,
    goals: f.goals,
    tags: [...f.tags],
    isKnownToPlayers: false,
  }));

  const regions: Region[] = template.regions.map(r => ({
    id: crypto.randomUUID(),
    name: r.name,
    color: r.color,
    description: r.description,
    hexKeys: [],
    tags: [...r.tags],
    isDiscovered: false,
    notes: '',
  }));

  const generationConfig: GenerationConfig = {
    ...createDefaultGenerationConfig(),
    ...template.generationConfig,
  };

  const calendarPreset = template.calendarPreset;
  const calendar = CALENDAR_PRESETS[calendarPreset];
  const timeWeather = createDefaultTimeWeather(calendar);
  const startYear = template.startYear ?? getDefaultStartYear(calendarPreset);
  timeWeather.currentTime = { ...timeWeather.currentTime, year: startYear };

  return {
    ...base,
    terrainTypes,
    encounterTables,
    landmarkTables,
    factions,
    regions,
    generationConfig,
    timeWeather,
  };
}

/** Create a campaign pre-configured from a built-in template ID */
export function createCampaignFromTemplate(
  templateId: string,
  name: string,
  width: number,
  height: number
): Campaign {
  const template = getTemplateById(templateId);
  if (!template) {
    return createCampaign(name, width, height);
  }
  return buildCampaignFromTemplate(template, name, width, height);
}

/** Create a campaign from an arbitrary template object (user/community templates).
 *  Callers should apply customizations before passing the template. */
export function createCampaignFromTemplateObject(
  template: CampaignTemplate,
  name: string,
  width: number,
  height: number
): Campaign {
  return buildCampaignFromTemplate(template, name, width, height);
}

// Aliases for CampaignContext
export const defaultTerrainTypes = DEFAULT_TERRAIN_TYPES;
export const defaultEncounterTables = DEFAULT_ENCOUNTER_TABLES;
