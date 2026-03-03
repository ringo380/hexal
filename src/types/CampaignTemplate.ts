// Campaign Template type definitions

import type { IconName } from '../components/icons/Icon';
import type { CalendarPreset } from './Weather';
import type { TerrainType, EncounterTable, LandmarkTable, GenerationConfig } from './Campaign';

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
