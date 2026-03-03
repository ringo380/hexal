import { describe, it, expect } from 'vitest';
import {
  extractTemplateFromCampaign,
  wrapTemplateForExport,
  validateTemplateFile,
  encodeShareCode,
  decodeShareCode,
  createDefaultCustomizations,
  applyCustomizations,
} from '../services/templateService';
import { createCampaign, createCampaignFromTemplateObject } from '../types/Campaign';
import type { CampaignTemplate } from '../types/CampaignTemplate';
import { CAMPAIGN_TEMPLATES } from '../data/campaignTemplates';

// Helper: build a minimal template for testing
function buildTestTemplate(): CampaignTemplate {
  return {
    id: 'test-tpl',
    name: 'Test Template',
    description: 'A test template',
    icon: 'hexagon',
    accentColor: '#4a9eff',
    recommendedWidth: 15,
    recommendedHeight: 15,
    calendarPreset: 'simple',
    terrainTypes: [
      { id: 'tt-1', name: 'Plains', colorHex: '#90EE90', icon: 'leaf', weight: 3 },
      { id: 'tt-2', name: 'Forest', colorHex: '#228B22', icon: 'tree', weight: 2 },
    ],
    encounterTables: [
      {
        id: 'et-1',
        name: 'Plains Encounters',
        terrain: 'Plains',
        entries: [
          { id: 'ee-1', title: 'Wolf Pack', description: 'Wolves', difficulty: 'CR 2', weight: 1 },
        ],
      },
    ],
    landmarkTables: [
      {
        id: 'lt-1',
        name: 'Plains Landmarks',
        terrain: 'Plains',
        entries: [
          { id: 'le-1', title: 'Old Well', description: 'A well', rarity: 'Common', weight: 1 },
        ],
      },
    ],
    generationConfig: { biomeClusteringStrength: 0.6 },
    factions: [
      { name: 'Knights', description: 'Noble knights', color: '#4a9eff', tags: ['military'] },
    ],
    regions: [
      { name: 'Heartlands', color: '#4caf50', description: 'Central region', tags: ['core'] },
    ],
    tags: ['fantasy', 'classic'],
  };
}

describe('templateService', () => {
  describe('extractTemplateFromCampaign', () => {
    it('strips hex content and preserves terrain/encounters/factions/regions', () => {
      const campaign = createCampaign('My Campaign', 20, 20);
      // Add a faction to the campaign
      campaign.factions = [
        { id: 'f1', name: 'Faction A', description: 'Desc', color: '#f00', tags: ['tag1'], isKnownToPlayers: true },
      ];
      campaign.regions = [
        { id: 'r1', name: 'Region A', color: '#0f0', description: 'Desc', hexKeys: ['1,2', '3,4'], tags: ['tag2'], isDiscovered: true, notes: 'notes' },
      ];

      const template = extractTemplateFromCampaign(campaign, {
        name: 'Extracted',
        description: 'Test extract',
        icon: 'map',
        accentColor: '#ff0',
        tags: ['extracted'],
      });

      expect(template.name).toBe('Extracted');
      expect(template.terrainTypes.length).toBe(campaign.terrainTypes.length);
      expect(template.encounterTables.length).toBe(campaign.encounterTables.length);
      expect(template.factions).toHaveLength(1);
      expect(template.factions[0].name).toBe('Faction A');
      // Regions should NOT have hexKeys
      expect(template.regions).toHaveLength(1);
      expect(template.regions[0].name).toBe('Region A');
      expect((template.regions[0] as any).hexKeys).toBeUndefined();
    });
  });

  describe('wrapTemplateForExport / validateTemplateFile', () => {
    it('round-trips correctly', () => {
      const template = buildTestTemplate();
      const envelope = wrapTemplateForExport(template, 'Test Author');

      expect(envelope.fileType).toBe('hexal-template');
      expect(envelope.fileVersion).toBe(1);
      expect(envelope.author).toBe('Test Author');
      expect(envelope.template.name).toBe('Test Template');

      const validation = validateTemplateFile(envelope);
      expect(validation.valid).toBe(true);
      expect(validation.template!.name).toBe('Test Template');
    });
  });

  describe('validateTemplateFile', () => {
    it('rejects non-object input', () => {
      expect(validateTemplateFile(null).valid).toBe(false);
      expect(validateTemplateFile('string').valid).toBe(false);
      expect(validateTemplateFile(42).valid).toBe(false);
    });

    it('rejects missing fileType', () => {
      const result = validateTemplateFile({ fileVersion: 1, template: {} });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('fileType'))).toBe(true);
    });

    it('rejects missing template name', () => {
      const result = validateTemplateFile({
        fileType: 'hexal-template',
        fileVersion: 1,
        template: { terrainTypes: [{}], encounterTables: [], landmarkTables: [] },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('rejects empty terrainTypes', () => {
      const result = validateTemplateFile({
        fileType: 'hexal-template',
        fileVersion: 1,
        template: { name: 'Test', terrainTypes: [], encounterTables: [], landmarkTables: [] },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('terrain'))).toBe(true);
    });
  });

  describe('encodeShareCode / decodeShareCode', () => {
    it('round-trips a template', async () => {
      const template = buildTestTemplate();
      const code = await encodeShareCode(template);

      expect(code.startsWith('hexal-tpl:v1:')).toBe(true);

      const decoded = await decodeShareCode(code);
      expect(decoded.name).toBe('Test Template');
      expect(decoded.terrainTypes.length).toBe(2);
      expect(decoded.factions.length).toBe(1);
    });

    it('rejects invalid prefix', async () => {
      await expect(decodeShareCode('invalid-code')).rejects.toThrow('Invalid share code format');
    });
  });

  describe('applyCustomizations', () => {
    it('filters disabled terrain types', () => {
      const template = buildTestTemplate();
      const customizations = createDefaultCustomizations();
      customizations.disabledTerrainIds.add('tt-2'); // Disable Forest

      const result = applyCustomizations(template, customizations);
      expect(result.terrainTypes).toHaveLength(1);
      expect(result.terrainTypes[0].name).toBe('Plains');
    });

    it('applies terrain name overrides', () => {
      const template = buildTestTemplate();
      const customizations = createDefaultCustomizations();
      customizations.terrainNameOverrides['tt-1'] = 'Savanna';

      const result = applyCustomizations(template, customizations);
      expect(result.terrainTypes[0].name).toBe('Savanna');
    });

    it('filters disabled factions', () => {
      const template = buildTestTemplate();
      const customizations = createDefaultCustomizations();
      customizations.disabledFactionIndices.add(0);

      const result = applyCustomizations(template, customizations);
      expect(result.factions).toHaveLength(0);
    });

    it('filters disabled regions', () => {
      const template = buildTestTemplate();
      const customizations = createDefaultCustomizations();
      customizations.disabledRegionIndices.add(0);

      const result = applyCustomizations(template, customizations);
      expect(result.regions).toHaveLength(0);
    });

    it('filters disabled encounter tables', () => {
      const template = buildTestTemplate();
      const customizations = createDefaultCustomizations();
      customizations.disabledEncounterTableIds.add('et-1');

      const result = applyCustomizations(template, customizations);
      expect(result.encounterTables).toHaveLength(0);
    });

    it('filters encounter tables for disabled terrain', () => {
      const template = buildTestTemplate();
      const customizations = createDefaultCustomizations();
      customizations.disabledTerrainIds.add('tt-1'); // Disable Plains

      const result = applyCustomizations(template, customizations);
      // Plains encounter table should be gone because Plains terrain is disabled
      expect(result.encounterTables).toHaveLength(0);
    });

    it('merges generation config overrides', () => {
      const template = buildTestTemplate();
      const customizations = createDefaultCustomizations();
      customizations.generationConfig = { encounterDensity: 0.9 };

      const result = applyCustomizations(template, customizations);
      expect(result.generationConfig.encounterDensity).toBe(0.9);
      expect(result.generationConfig.biomeClusteringStrength).toBe(0.6);
    });

    it('overrides calendar preset', () => {
      const template = buildTestTemplate();
      const customizations = createDefaultCustomizations();
      customizations.calendarPreset = 'greyhawk';

      const result = applyCustomizations(template, customizations);
      expect(result.calendarPreset).toBe('greyhawk');
    });

    it('returns unmodified template with default customizations', () => {
      const template = buildTestTemplate();
      const customizations = createDefaultCustomizations();

      const result = applyCustomizations(template, customizations);
      expect(result.terrainTypes.length).toBe(template.terrainTypes.length);
      expect(result.factions.length).toBe(template.factions.length);
      expect(result.regions.length).toBe(template.regions.length);
    });
  });

  describe('createCampaignFromTemplateObject', () => {
    it('produces a valid campaign', () => {
      const template = buildTestTemplate();
      const campaign = createCampaignFromTemplateObject(template, 'Test', 15, 15);

      expect(campaign.id).toBeTruthy();
      expect(campaign.name).toBe('Test');
      expect(campaign.gridWidth).toBe(15);
      expect(campaign.gridHeight).toBe(15);
      expect(campaign.terrainTypes.length).toBe(template.terrainTypes.length);
      expect(campaign.encounterTables.length).toBe(template.encounterTables.length);
      expect(campaign.factions!.length).toBe(template.factions.length);
      expect(campaign.regions!.length).toBe(template.regions.length);
    });

    it('generates fresh UUIDs (not template IDs)', () => {
      const template = buildTestTemplate();
      const campaign = createCampaignFromTemplateObject(template, 'Test', 10, 10);

      // Template IDs should be replaced with crypto UUIDs
      for (const tt of campaign.terrainTypes) {
        expect(tt.id).not.toBe('tt-1');
        expect(tt.id).not.toBe('tt-2');
      }
    });

    it('works with all built-in templates', () => {
      for (const template of CAMPAIGN_TEMPLATES) {
        const campaign = createCampaignFromTemplateObject(template, 'Test', 10, 10);
        expect(campaign.terrainTypes.length).toBe(template.terrainTypes.length);
      }
    });
  });
});
