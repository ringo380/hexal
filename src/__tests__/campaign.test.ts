import { describe, it, expect } from 'vitest';
import {
  hexKey,
  parseHexKey,
  createCampaign,
  createHex,
  migrateCampaign,
  hasUnresolvedContent
} from '../types/Campaign';
import type { Campaign, Hex, Encounter, ContentItem } from '../types/Campaign';

describe('hexKey', () => {
  it('formats coordinate as "q,r"', () => {
    expect(hexKey({ q: 0, r: 0 })).toBe('0,0');
    expect(hexKey({ q: 5, r: 12 })).toBe('5,12');
    expect(hexKey({ q: -1, r: -3 })).toBe('-1,-3');
  });
});

describe('parseHexKey', () => {
  it('parses valid "q,r" format', () => {
    expect(parseHexKey('0,0')).toEqual({ q: 0, r: 0 });
    expect(parseHexKey('5,12')).toEqual({ q: 5, r: 12 });
    expect(parseHexKey('-1,-3')).toEqual({ q: -1, r: -3 });
  });

  it('returns null for invalid formats', () => {
    expect(parseHexKey('')).toBeNull();
    expect(parseHexKey('abc')).toBeNull();
    expect(parseHexKey('1')).toBeNull();
    expect(parseHexKey('1,2,3')).toBeNull();
    expect(parseHexKey('a,b')).toBeNull();
  });

  it('roundtrips with hexKey', () => {
    const coord = { q: 7, r: 3 };
    expect(parseHexKey(hexKey(coord))).toEqual(coord);
  });
});

describe('createCampaign', () => {
  it('includes bookmarkedHexes as empty array', () => {
    const campaign = createCampaign('Test', 10, 10);
    expect(campaign.bookmarkedHexes).toEqual([]);
  });

  it('includes encounterTemplates as empty array', () => {
    const campaign = createCampaign('Test', 10, 10);
    expect(campaign.encounterTemplates).toEqual([]);
  });

  it('clamps grid dimensions to max 50', () => {
    const campaign = createCampaign('Test', 100, 100);
    expect(campaign.gridWidth).toBe(50);
    expect(campaign.gridHeight).toBe(50);
  });

  it('sets name and basic properties', () => {
    const campaign = createCampaign('My Campaign', 8, 6);
    expect(campaign.name).toBe('My Campaign');
    expect(campaign.gridWidth).toBe(8);
    expect(campaign.gridHeight).toBe(6);
    expect(campaign.hexes).toEqual({});
    expect(campaign.terrainTypes.length).toBeGreaterThan(0);
  });
});

describe('createHex', () => {
  it('creates a hex with default values', () => {
    const hex = createHex({ q: 3, r: 4 }, 'Forest');
    expect(hex.coordinate).toEqual({ q: 3, r: 4 });
    expect(hex.terrain).toBe('Forest');
    expect(hex.status).toBe('undiscovered');
    expect(hex.notes).toBe('');
    expect(hex.tags).toEqual([]);
    expect(hex.locations).toEqual([]);
    expect(hex.encounters).toEqual([]);
    expect(hex.npcs).toEqual([]);
    expect(hex.treasures).toEqual([]);
    expect(hex.clues).toEqual([]);
    expect(hex.markers).toEqual([]);
  });
});

describe('hasUnresolvedContent', () => {
  it('returns false for hex with no content', () => {
    const hex = createHex({ q: 0, r: 0 });
    expect(hasUnresolvedContent(hex)).toBe(false);
  });

  it('returns true when a location is unresolved', () => {
    const hex = createHex({ q: 0, r: 0 });
    hex.locations = [{ id: '1', title: 'Temple', description: '', isResolved: false }];
    expect(hasUnresolvedContent(hex)).toBe(true);
  });

  it('returns false when all content is resolved', () => {
    const hex = createHex({ q: 0, r: 0 });
    hex.locations = [{ id: '1', title: 'Temple', description: '', isResolved: true }];
    hex.npcs = [{ id: '2', title: 'Guard', description: '', isResolved: true }];
    expect(hasUnresolvedContent(hex)).toBe(false);
  });
});

describe('migrateCampaign', () => {
  function makeLegacyCampaign(overrides: Partial<Campaign> = {}): Campaign {
    return {
      id: 'camp-1',
      name: 'Legacy Campaign',
      gridWidth: 10,
      gridHeight: 10,
      hexes: {},
      terrainTypes: [],
      encounterTables: [],
      createdAt: '2025-01-01',
      modifiedAt: '2025-01-01',
      ...overrides
    };
  }

  it('adds missing bookmarkedHexes field', () => {
    const legacy = makeLegacyCampaign();
    // bookmarkedHexes is undefined
    expect(legacy.bookmarkedHexes).toBeUndefined();

    const migrated = migrateCampaign(legacy);
    expect(migrated.bookmarkedHexes).toEqual([]);
  });

  it('adds missing encounterTemplates field', () => {
    const legacy = makeLegacyCampaign();
    expect(legacy.encounterTemplates).toBeUndefined();

    const migrated = migrateCampaign(legacy);
    expect(migrated.encounterTemplates).toEqual([]);
  });

  it('preserves existing bookmarkedHexes', () => {
    const campaign = makeLegacyCampaign({
      bookmarkedHexes: ['0,0', '1,2'],
      encounterTemplates: []
    });
    const migrated = migrateCampaign(campaign);
    expect(migrated.bookmarkedHexes).toEqual(['0,0', '1,2']);
  });

  it('returns same reference when no migration needed', () => {
    const campaign = makeLegacyCampaign({
      bookmarkedHexes: [],
      encounterTemplates: []
    });
    const migrated = migrateCampaign(campaign);
    // No encounter migration needed, fields exist => same reference
    expect(migrated).toBe(campaign);
  });

  it('migrates legacy encounter ContentItems to Encounter type', () => {
    const legacyEncounter: ContentItem = {
      id: 'enc-1',
      title: 'Wolf Attack',
      description: 'Wolves appear',
      isResolved: false
    };
    const hex = createHex({ q: 0, r: 0 });
    // Manually assign a ContentItem to encounters (legacy behavior)
    (hex as Hex).encounters = [legacyEncounter as unknown as Encounter];

    const campaign = makeLegacyCampaign({
      hexes: { '0,0': hex },
      encounterTemplates: [],
      bookmarkedHexes: []
    });

    const migrated = migrateCampaign(campaign);
    const enc = migrated.hexes['0,0'].encounters[0] as Encounter;
    expect(enc.encounterType).toBe('combat');
    expect(enc.creatures).toEqual([]);
    expect(enc.rewards).toEqual([]);
    expect(enc.outcome).toBe('pending');
  });
});
