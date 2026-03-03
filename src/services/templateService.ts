// Template service — pure functions for template extraction, validation,
// wrapping, share codes, and customization application.

import type {
  CampaignTemplate,
  TemplateFileEnvelope,
  TemplateCustomizations,
  TemplateFaction,
  TemplateRegion,
} from '../types/CampaignTemplate';
import type { Campaign, GenerationConfig } from '../types/Campaign';
import type { CalendarPreset } from '../types/Weather';

// ============ EXTRACTION ============

/** Extract a reusable template from an existing campaign (strips hexes/content). */
export function extractTemplateFromCampaign(
  campaign: Campaign,
  meta: { name: string; description: string; icon: CampaignTemplate['icon']; accentColor: string; tags: string[] }
): CampaignTemplate {
  const factions: TemplateFaction[] = (campaign.factions ?? []).map(f => ({
    name: f.name,
    description: f.description,
    color: f.color,
    goals: f.goals,
    tags: [...f.tags],
  }));

  const regions: TemplateRegion[] = (campaign.regions ?? []).map(r => ({
    name: r.name,
    color: r.color,
    description: r.description,
    tags: [...r.tags],
  }));

  const calendarPreset: CalendarPreset =
    campaign.timeWeather?.calendar?.preset ?? 'simple';

  return {
    id: crypto.randomUUID(),
    name: meta.name,
    description: meta.description,
    icon: meta.icon,
    accentColor: meta.accentColor,
    recommendedWidth: campaign.gridWidth,
    recommendedHeight: campaign.gridHeight,
    calendarPreset,
    startYear: campaign.timeWeather?.currentTime?.year,
    terrainTypes: campaign.terrainTypes.map(t => ({ ...t })),
    encounterTables: campaign.encounterTables.map(table => ({
      ...table,
      entries: table.entries.map(e => ({ ...e })),
    })),
    landmarkTables: (campaign.landmarkTables ?? []).map(table => ({
      ...table,
      entries: table.entries.map(e => ({ ...e })),
    })),
    generationConfig: campaign.generationConfig
      ? { ...campaign.generationConfig }
      : {},
    factions,
    regions,
    tags: [...meta.tags],
  };
}

// ============ FILE ENVELOPE ============

/** Wrap a template for file export. */
export function wrapTemplateForExport(
  template: CampaignTemplate,
  author?: string
): TemplateFileEnvelope {
  return {
    fileType: 'hexal-template',
    fileVersion: 1,
    template,
    exportedAt: new Date().toISOString(),
    sourceApp: 'Hexal',
    author,
  };
}

// ============ VALIDATION ============

interface ValidationResult {
  valid: boolean;
  template?: CampaignTemplate;
  errors: string[];
}

/** Validate parsed JSON as a template file envelope. */
export function validateTemplateFile(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data is not an object'] };
  }

  const obj = data as Record<string, unknown>;

  if (obj.fileType !== 'hexal-template') {
    errors.push('Missing or invalid fileType (expected "hexal-template")');
  }
  if (obj.fileVersion !== 1) {
    errors.push('Unsupported fileVersion (expected 1)');
  }

  const tpl = obj.template;
  if (!tpl || typeof tpl !== 'object') {
    errors.push('Missing template object');
    return { valid: false, errors };
  }

  const t = tpl as Record<string, unknown>;

  if (typeof t.name !== 'string' || !t.name) {
    errors.push('Template name is required');
  }
  if (!Array.isArray(t.terrainTypes) || t.terrainTypes.length === 0) {
    errors.push('Template must have at least one terrain type');
  }
  if (!Array.isArray(t.encounterTables)) {
    errors.push('Template must have an encounterTables array');
  }
  if (!Array.isArray(t.landmarkTables)) {
    errors.push('Template must have a landmarkTables array');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, template: tpl as CampaignTemplate, errors: [] };
}

/** Validate a bare template object (not wrapped in an envelope). */
export function validateTemplate(data: unknown): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data is not an object'] };
  }

  const t = data as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof t.name !== 'string' || !t.name) {
    errors.push('Template name is required');
  }
  if (!Array.isArray(t.terrainTypes) || t.terrainTypes.length === 0) {
    errors.push('Template must have at least one terrain type');
  }
  if (!Array.isArray(t.encounterTables)) {
    errors.push('Template must have an encounterTables array');
  }
  if (!Array.isArray(t.landmarkTables)) {
    errors.push('Template must have a landmarkTables array');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, template: data as CampaignTemplate, errors: [] };
}

// ============ SHARE CODES ============

/** Helper to read all chunks from a ReadableStream. */
async function readAllChunks(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const result = await reader.read();
    if (result.value) chunks.push(result.value);
    done = result.done;
  }
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return merged;
}

/** Encode a template as a share code string (base64-encoded gzip). */
export async function encodeShareCode(template: CampaignTemplate): Promise<string> {
  const json = JSON.stringify(template);
  const encoded = new TextEncoder().encode(json);

  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(encoded);
  writer.close();

  const compressed = await readAllChunks(cs.readable);

  // Convert to base64
  let binary = '';
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  const b64 = btoa(binary);
  return `hexal-tpl:v1:${b64}`;
}

/** Decode a share code string back to a CampaignTemplate. */
export async function decodeShareCode(code: string): Promise<CampaignTemplate> {
  if (!code.startsWith('hexal-tpl:v1:')) {
    throw new Error('Invalid share code format');
  }

  const b64 = code.slice('hexal-tpl:v1:'.length);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();

  const decompressed = await readAllChunks(ds.readable);

  const json = new TextDecoder().decode(decompressed);
  const parsed = JSON.parse(json);
  const validation = validateTemplate(parsed);
  if (!validation.valid) {
    throw new Error(`Invalid template in share code: ${validation.errors.join(', ')}`);
  }
  return validation.template!;
}

// ============ CUSTOMIZATION ============

/** Create a default (no-op) customizations object. */
export function createDefaultCustomizations(): TemplateCustomizations {
  return {
    disabledTerrainIds: new Set(),
    terrainNameOverrides: {},
    disabledFactionIndices: new Set(),
    factionNameOverrides: {},
    disabledRegionIndices: new Set(),
    disabledEncounterTableIds: new Set(),
    disabledLandmarkTableIds: new Set(),
    generationConfig: {},
    calendarPreset: null,
  };
}

/** Apply customizations to a template, returning a new template with disabled items removed and overrides applied. */
export function applyCustomizations(
  template: CampaignTemplate,
  customizations: TemplateCustomizations
): CampaignTemplate {
  const terrainTypes = template.terrainTypes
    .filter(t => !customizations.disabledTerrainIds.has(t.id))
    .map(t => ({
      ...t,
      name: customizations.terrainNameOverrides[t.id] ?? t.name,
    }));

  // Build set of enabled terrain names for filtering encounter/landmark tables
  const enabledTerrainNames = new Set(terrainTypes.map(t => t.name));

  const factions = template.factions
    .filter((_, i) => !customizations.disabledFactionIndices.has(i))
    .map((f, _newIdx) => {
      // We need the original index to look up overrides
      let origIdx = 0;
      let count = 0;
      for (let i = 0; i < template.factions.length; i++) {
        if (!customizations.disabledFactionIndices.has(i)) {
          if (count === _newIdx) {
            origIdx = i;
            break;
          }
          count++;
        }
      }
      return {
        ...f,
        name: customizations.factionNameOverrides[origIdx] ?? f.name,
      };
    });

  const regions = template.regions.filter(
    (_, i) => !customizations.disabledRegionIndices.has(i)
  );

  const encounterTables = template.encounterTables.filter(
    t => !customizations.disabledEncounterTableIds.has(t.id)
      && enabledTerrainNames.has(t.terrain)
  );

  const landmarkTables = template.landmarkTables.filter(
    t => !customizations.disabledLandmarkTableIds.has(t.id)
      && enabledTerrainNames.has(t.terrain)
  );

  const generationConfig: Partial<GenerationConfig> = {
    ...template.generationConfig,
    ...customizations.generationConfig,
  };

  return {
    ...template,
    terrainTypes,
    encounterTables,
    landmarkTables,
    factions,
    regions,
    generationConfig,
    calendarPreset: customizations.calendarPreset ?? template.calendarPreset,
  };
}
