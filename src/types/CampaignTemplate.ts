// Campaign Template type definitions

import type { IconName } from '../components/icons/Icon';
import type { CalendarPreset } from './Weather';
import type { TerrainType, EncounterTable, LandmarkTable, GenerationConfig } from './Campaign';

// ============ FILE FORMAT ============

/** File format envelope for .hexal-template files */
export interface TemplateFileEnvelope {
  fileType: 'hexal-template';
  fileVersion: 1;
  template: CampaignTemplate;
  exportedAt: string;
  sourceApp: string;
  author?: string;
}

/** Runtime wrapper for template list entries */
export interface TemplateListItem {
  template: CampaignTemplate;
  source: 'builtin' | 'user' | 'community';
  filePath?: string;
}

// ============ CUSTOMIZATION ============

/** Overrides applied during campaign creation from a template */
export interface TemplateCustomizations {
  disabledTerrainIds: Set<string>;
  terrainNameOverrides: Record<string, string>;
  disabledFactionIndices: Set<number>;
  factionNameOverrides: Record<number, string>;
  disabledRegionIndices: Set<number>;
  disabledEncounterTableIds: Set<string>;
  disabledLandmarkTableIds: Set<string>;
  generationConfig: Partial<GenerationConfig>;
  calendarPreset: CalendarPreset | null;
}

// ============ COMMUNITY REGISTRY ============

/** Entry in the community template registry index */
export interface TemplateRegistryEntry {
  id: string;
  name: string;
  description: string;
  author: string;
  tags: string[];
  terrainCount: number;
  factionCount: number;
  downloadUrl: string;
}

/** Community template registry index */
export interface TemplateRegistry {
  version: 1;
  updatedAt: string;
  templates: TemplateRegistryEntry[];
}

/** Faction stub in a template — gets a fresh UUID at campaign creation */
export interface TemplateFaction {
  name: string;
  description: string;
  color: string;
  goals?: string;
  tags: string[];
}

/** Region stub in a template — names and colors only, no hex assignments */
export interface TemplateRegion {
  name: string;
  color: string;
  description: string;
  tags: string[];
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;           // 1-2 sentence flavor text
  icon: IconName;                // From existing icon system
  accentColor: string;           // Hex color for card highlight
  recommendedWidth: number;
  recommendedHeight: number;
  calendarPreset: CalendarPreset;
  startYear?: number;
  terrainTypes: TerrainType[];   // REPLACES defaults entirely
  encounterTables: EncounterTable[];
  landmarkTables: LandmarkTable[];
  generationConfig: Partial<GenerationConfig>;
  factions: TemplateFaction[];   // Stubs, get UUIDs at creation
  regions: TemplateRegion[];     // Names+colors only, no hex assignments
  tags: string[];                // For display (e.g., "arctic", "horror")
}
