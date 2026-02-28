import { describe, it, expect } from 'vitest';
import {
  hexKey,
  parseHexKey,
  createCampaign,
  createHex,
  migrateCampaign,
  hasUnresolvedContent,
  CAMPAIGN_SCHEMA_VERSION
} from '../types/Campaign';
import type { Campaign, Hex, Encounter, ContentItem, Npc } from '../types/Campaign';
import { createDefaultSimulationState } from '../types/Weather';

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

  it('includes schemaVersion and version', () => {
    const campaign = createCampaign('Test', 10, 10);
    expect(campaign.schemaVersion).toBe(CAMPAIGN_SCHEMA_VERSION);
    expect(campaign.version).toBe(1);
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
    hex.npcs = [{ id: '2', title: 'Guard', description: '', isResolved: true, relationships: [], tags: [], isAlive: true }];
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
      schemaVersion: 2,
      version: 1,
      terrainTypes: [
        { id: 't1', name: 'Plains', colorHex: '#90EE90', icon: 'leaf', weight: 3, moveCost: 1, elevation: 1, isDefault: true, hazardLevel: 0, category: 'Temperate', moisture: 2, temperature: 3 }
      ],
      bookmarkedHexes: [],
      encounterTemplates: [],
      regions: [],
      generationConfig: { seed: '', biomeClusteringStrength: 0.6, encounterDensity: 0.4, landmarkDensity: 0.2, terrainVariety: 0.5 },
      landmarkTables: [],
      factions: [],
      sessions: [],
      sessionLog: [],
      quests: [],
      storyArcs: [],
      weatherSimulation: createDefaultSimulationState(),
    });
    const migrated = migrateCampaign(campaign);
    // No encounter migration needed, fields exist => same reference
    expect(migrated).toBe(campaign);
  });

  it('adds missing generationConfig with defaults', () => {
    const legacy = makeLegacyCampaign();
    expect(legacy.generationConfig).toBeUndefined();

    const migrated = migrateCampaign(legacy);
    expect(migrated.generationConfig).toBeDefined();
    expect(migrated.generationConfig!.biomeClusteringStrength).toBe(0.6);
    expect(migrated.generationConfig!.encounterDensity).toBe(0.4);
    expect(migrated.generationConfig!.landmarkDensity).toBe(0.2);
    expect(migrated.generationConfig!.terrainVariety).toBe(0.5);
  });

  it('adds missing landmarkTables with defaults', () => {
    const legacy = makeLegacyCampaign();
    expect(legacy.landmarkTables).toBeUndefined();

    const migrated = migrateCampaign(legacy);
    expect(migrated.landmarkTables).toBeDefined();
    expect(migrated.landmarkTables).toEqual([]);
  });

  it('preserves existing generationConfig through migration', () => {
    const config = {
      seed: 'my-seed',
      biomeClusteringStrength: 0.8,
      encounterDensity: 0.5,
      landmarkDensity: 0.3,
      terrainVariety: 0.7,
    };
    const campaign = makeLegacyCampaign({ generationConfig: config });
    const migrated = migrateCampaign(campaign);
    expect(migrated.generationConfig).toEqual(config);
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

  it('migrates legacy NPC ContentItems to Npc type', () => {
    const legacyNpc: ContentItem = {
      id: 'npc-1',
      title: 'Old Guard',
      description: 'A guard from old data',
      isResolved: false
    };
    const hex = createHex({ q: 0, r: 0 });
    (hex as Hex).npcs = [legacyNpc as unknown as Npc];

    const campaign = makeLegacyCampaign({
      hexes: { '0,0': hex },
      encounterTemplates: [],
      bookmarkedHexes: []
    });

    const migrated = migrateCampaign(campaign);
    const npc = migrated.hexes['0,0'].npcs[0];
    expect(npc.relationships).toEqual([]);
    expect(npc.tags).toEqual([]);
    expect(npc.isAlive).toBe(true);
    expect(npc.title).toBe('Old Guard');
  });

  it('preserves existing Npc data through migration', () => {
    const existingNpc: Npc = {
      id: 'npc-2',
      title: 'Modern NPC',
      description: '',
      isResolved: false,
      relationships: [{ targetNpcId: 'npc-3', targetHexKey: '1,0', type: 'ally' }],
      tags: ['quest-giver'],
      isAlive: true,
      race: 'Elf',
      attitude: 'friendly'
    };
    const hex = createHex({ q: 0, r: 0 });
    hex.npcs = [existingNpc];

    const campaign = makeLegacyCampaign({
      hexes: { '0,0': hex },
      encounterTemplates: [],
      bookmarkedHexes: []
    });

    const migrated = migrateCampaign(campaign);
    const npc = migrated.hexes['0,0'].npcs[0];
    expect(npc.relationships).toHaveLength(1);
    expect(npc.tags).toEqual(['quest-giver']);
    expect(npc.race).toBe('Elf');
    expect(npc.attitude).toBe('friendly');
  });

  it('adds factions: [] when missing', () => {
    const legacy = makeLegacyCampaign();
    expect(legacy.factions).toBeUndefined();

    const migrated = migrateCampaign(legacy);
    expect(migrated.factions).toEqual([]);
  });

  it('preserves existing factions', () => {
    const factions = [{ id: 'f1', name: 'Guild', description: '', color: '#ff0000', tags: [], isKnownToPlayers: true }];
    const campaign = makeLegacyCampaign({ factions });
    const migrated = migrateCampaign(campaign);
    expect(migrated.factions).toEqual(factions);
  });

  it('adds sessions: [] and sessionLog: [] when missing', () => {
    const legacy = makeLegacyCampaign();
    expect(legacy.sessions).toBeUndefined();
    expect(legacy.sessionLog).toBeUndefined();

    const migrated = migrateCampaign(legacy);
    expect(migrated.sessions).toEqual([]);
    expect(migrated.sessionLog).toEqual([]);
  });

  it('adds schemaVersion and version when missing', () => {
    const legacy = makeLegacyCampaign();
    expect(legacy.schemaVersion).toBeUndefined();
    expect(legacy.version).toBeUndefined();

    const migrated = migrateCampaign(legacy);
    expect(migrated.schemaVersion).toBe(CAMPAIGN_SCHEMA_VERSION);
    expect(migrated.version).toBe(1);
  });

  it('updates schemaVersion to current when outdated', () => {
    const campaign = makeLegacyCampaign({
      schemaVersion: 1,
      version: 5,
      bookmarkedHexes: [],
      encounterTemplates: [],
      regions: [],
      generationConfig: { seed: '', biomeClusteringStrength: 0.6, encounterDensity: 0.4, landmarkDensity: 0.2, terrainVariety: 0.5 },
      landmarkTables: [],
      factions: [],
      sessions: [],
      sessionLog: [],
      quests: [],
      storyArcs: [],
      weatherSimulation: createDefaultSimulationState(),
    });
    const migrated = migrateCampaign(campaign);
    expect(migrated.schemaVersion).toBe(CAMPAIGN_SCHEMA_VERSION);
    expect(migrated.version).toBe(5); // preserved, not reset
  });

  it('preserves existing sessions and sessionLog', () => {
    const sessions = [{ id: 's1', number: 1, title: 'Session 1', summary: '', realWorldDate: '2026-01-01', hexesVisited: [], isVisibleToPlayers: true }];
    const sessionLog = [{ id: 'e1', sessionId: 's1', title: 'Event', description: '', inGameTime: { year: 1, month: 0, day: 1, hour: 8, minute: 0 }, hexKeys: [], tags: [] as any[], isVisibleToPlayers: true }];
    const campaign = makeLegacyCampaign({ sessions, sessionLog } as any);
    const migrated = migrateCampaign(campaign);
    expect(migrated.sessions).toEqual(sessions);
    expect(migrated.sessionLog).toEqual(sessionLog);
  });

  it('adds quests: [] and storyArcs: [] when missing', () => {
    const legacy = makeLegacyCampaign();
    expect(legacy.quests).toBeUndefined();
    expect(legacy.storyArcs).toBeUndefined();

    const migrated = migrateCampaign(legacy);
    expect(migrated.quests).toEqual([]);
    expect(migrated.storyArcs).toEqual([]);
  });

  it('adds weatherSimulation with defaults when missing', () => {
    const legacy = makeLegacyCampaign();
    expect(legacy.weatherSimulation).toBeUndefined();

    const migrated = migrateCampaign(legacy);
    expect(migrated.weatherSimulation).toBeDefined();
    expect(migrated.weatherSimulation!.config.enabled).toBe(false);
    expect(migrated.weatherSimulation!.config.engineType).toBe('perlin');
    expect(migrated.weatherSimulation!.field).toEqual({});
  });

  it('preserves existing quests and storyArcs', () => {
    const quests = [{ id: 'q1', title: 'Find the Gem', description: '', status: 'active', dmNotes: '', objectives: [], linkedHexKeys: [], linkedNpcRefs: [], linkedEncounterIds: [], linkedClueIds: [], linkedFactionIds: [], prerequisiteQuestIds: [], isVisibleToPlayers: true, tags: [], createdAt: '2026-01-01', modifiedAt: '2026-01-01' }];
    const storyArcs = [{ id: 'a1', title: 'Main Arc', description: '', dmNotes: '', questIds: ['q1'], status: 'active', isVisibleToPlayers: true, color: '#ff0000' }];
    const campaign = makeLegacyCampaign({ quests, storyArcs } as any);
    const migrated = migrateCampaign(campaign);
    expect(migrated.quests).toEqual(quests);
    expect(migrated.storyArcs).toEqual(storyArcs);
  });
});
