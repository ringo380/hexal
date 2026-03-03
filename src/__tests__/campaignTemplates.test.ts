import { describe, it, expect } from 'vitest';
import { CAMPAIGN_TEMPLATES, getTemplateById } from '../data/campaignTemplates';
import { createCampaignFromTemplate } from '../types/Campaign';

describe('Campaign Templates', () => {
  describe('CAMPAIGN_TEMPLATES array', () => {
    it('contains 10 templates', () => {
      expect(CAMPAIGN_TEMPLATES).toHaveLength(10);
    });

    it('has unique template IDs', () => {
      const ids = CAMPAIGN_TEMPLATES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getTemplateById', () => {
    it('returns correct template for known IDs', () => {
      for (const template of CAMPAIGN_TEMPLATES) {
        const found = getTemplateById(template.id);
        expect(found).toBe(template);
      }
    });

    it('returns undefined for unknown ID', () => {
      expect(getTemplateById('nonexistent')).toBeUndefined();
    });
  });

  describe('createCampaignFromTemplate', () => {
    for (const template of CAMPAIGN_TEMPLATES) {
      describe(`template: ${template.name}`, () => {
        it('produces a valid campaign', () => {
          const campaign = createCampaignFromTemplate(template.id, 'Test', template.recommendedWidth, template.recommendedHeight);

          expect(campaign.id).toBeTruthy();
          expect(campaign.name).toBe('Test');
          expect(campaign.gridWidth).toBe(Math.min(template.recommendedWidth, 50));
          expect(campaign.gridHeight).toBe(Math.min(template.recommendedHeight, 50));
          expect(campaign.terrainTypes.length).toBe(template.terrainTypes.length);
          expect(campaign.encounterTables.length).toBe(template.encounterTables.length);
          expect(campaign.landmarkTables!.length).toBe(template.landmarkTables.length);
          expect(campaign.factions!.length).toBe(template.factions.length);
          expect(campaign.regions!.length).toBe(template.regions.length);
        });

        it('generates unique terrain type IDs', () => {
          const campaign = createCampaignFromTemplate(template.id, 'Test', 10, 10);
          const ids = campaign.terrainTypes.map(t => t.id);
          expect(new Set(ids).size).toBe(ids.length);
          // IDs should not be the template placeholders
          for (const id of ids) {
            expect(id).not.toMatch(/^tpl-/);
          }
        });

        it('generates unique encounter table and entry IDs', () => {
          const campaign = createCampaignFromTemplate(template.id, 'Test', 10, 10);
          const tableIds = campaign.encounterTables.map(t => t.id);
          expect(new Set(tableIds).size).toBe(tableIds.length);

          const entryIds = campaign.encounterTables.flatMap(t => t.entries.map(e => e.id));
          expect(new Set(entryIds).size).toBe(entryIds.length);
        });

        it('generates unique landmark table and entry IDs', () => {
          const campaign = createCampaignFromTemplate(template.id, 'Test', 10, 10);
          const tableIds = campaign.landmarkTables!.map(t => t.id);
          expect(new Set(tableIds).size).toBe(tableIds.length);

          const entryIds = campaign.landmarkTables!.flatMap(t => t.entries.map(e => e.id));
          expect(new Set(entryIds).size).toBe(entryIds.length);
        });

        it('encounter tables reference valid terrain names', () => {
          const terrainNames = new Set(template.terrainTypes.map(t => t.name));
          for (const table of template.encounterTables) {
            expect(terrainNames.has(table.terrain)).toBe(true);
          }
        });

        it('landmark tables reference valid terrain names', () => {
          const terrainNames = new Set(template.terrainTypes.map(t => t.name));
          for (const table of template.landmarkTables) {
            expect(terrainNames.has(table.terrain)).toBe(true);
          }
        });

        it('applies calendar preset and start year', () => {
          const campaign = createCampaignFromTemplate(template.id, 'Test', 10, 10);
          expect(campaign.timeWeather).toBeDefined();
          expect(campaign.timeWeather!.calendar.preset).toBe(template.calendarPreset);
          if (template.startYear !== undefined) {
            expect(campaign.timeWeather!.currentTime.year).toBe(template.startYear);
          }
        });
      });
    }
  });

  describe('fallback for unknown template', () => {
    it('returns a default campaign when template ID is unknown', () => {
      const campaign = createCampaignFromTemplate('nonexistent', 'Fallback', 15, 15);
      expect(campaign.name).toBe('Fallback');
      expect(campaign.gridWidth).toBe(15);
      expect(campaign.gridHeight).toBe(15);
      // Should have default terrain types, not template ones
      expect(campaign.terrainTypes.length).toBeGreaterThan(0);
    });
  });
});
