import { describe, it, expect } from 'vitest';
import { searchHex, searchCampaign, getMatchHint, type SearchMatch } from '../services/search';
import type { Hex, Campaign, Encounter } from '../types/Campaign';

// Helper to create a minimal hex for testing
function makeHex(overrides: Partial<Hex> = {}): Hex {
  return {
    id: 'test-hex',
    coordinate: { q: 0, r: 0 },
    terrain: 'Forest',
    status: 'undiscovered',
    notes: '',
    tags: [],
    locations: [],
    encounters: [],
    npcs: [],
    treasures: [],
    clues: [],
    markers: [],
    ...overrides
  };
}

function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: 'enc-1',
    title: 'Wolf Pack',
    description: 'A pack of wolves',
    isResolved: false,
    encounterType: 'combat',
    creatures: [],
    linkedNpcIds: [],
    rewards: [],
    outcome: 'pending',
    outcomeNotes: '',
    ...overrides
  };
}

describe('searchHex', () => {
  it('returns empty array for non-matching query', () => {
    const hex = makeHex({ terrain: 'Forest', notes: 'Nothing here' });
    expect(searchHex(hex, '0,0', 'dragon')).toEqual([]);
  });

  it('matches notes (case-insensitive)', () => {
    const hex = makeHex({ notes: 'An ancient Dragon lair' });
    const matches = searchHex(hex, '0,0', 'dragon');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('notes');
    expect(matches[0].hexKey).toBe('0,0');
  });

  it('matches terrain', () => {
    const hex = makeHex({ terrain: 'Mountains' });
    const matches = searchHex(hex, '1,2', 'mountain');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('terrain');
    expect(matches[0].matchText).toBe('Mountains');
  });

  it('matches tags', () => {
    const hex = makeHex({ tags: ['dangerous', 'boss area'] });
    const matches = searchHex(hex, '0,0', 'boss');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('tag');
    expect(matches[0].matchText).toBe('boss area');
  });

  it('matches multiple tags', () => {
    const hex = makeHex({ tags: ['boss fight', 'boss area'] });
    const matches = searchHex(hex, '0,0', 'boss');
    expect(matches).toHaveLength(2);
    expect(matches.every(m => m.matchType === 'tag')).toBe(true);
  });

  it('matches marker labels', () => {
    const hex = makeHex({
      markers: [
        { id: 'm1', typeId: 'town', label: 'Silverton Village', isVisible: true }
      ]
    });
    const matches = searchHex(hex, '0,0', 'silver');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('marker');
    expect(matches[0].matchText).toBe('Silverton Village');
  });

  it('does not crash on markers without labels', () => {
    const hex = makeHex({
      markers: [
        { id: 'm1', typeId: 'town', isVisible: true } // no label
      ]
    });
    const matches = searchHex(hex, '0,0', 'town');
    expect(matches).toEqual([]);
  });

  it('matches location titles', () => {
    const hex = makeHex({
      locations: [
        { id: 'loc1', title: 'Ancient Temple', description: 'A crumbling ruin', isResolved: false }
      ]
    });
    const matches = searchHex(hex, '0,0', 'temple');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('content-title');
    expect(matches[0].category).toBe('locations');
  });

  it('matches location description when title does not match', () => {
    const hex = makeHex({
      locations: [
        { id: 'loc1', title: 'Old Ruin', description: 'Contains a hidden treasure vault', isResolved: false }
      ]
    });
    const matches = searchHex(hex, '0,0', 'vault');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('content-description');
    expect(matches[0].itemTitle).toBe('Old Ruin');
  });

  it('prefers title match over description match for the same item', () => {
    const hex = makeHex({
      locations: [
        { id: 'loc1', title: 'Dragon Vault', description: 'A dragon guards the vault', isResolved: false }
      ]
    });
    const matches = searchHex(hex, '0,0', 'dragon');
    // Should only match title, not also description (else clause)
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('content-title');
  });

  it('matches NPC titles', () => {
    const hex = makeHex({
      npcs: [
        { id: 'npc1', title: 'Gandalf the Grey', description: 'A wise wizard', isResolved: false }
      ]
    });
    const matches = searchHex(hex, '0,0', 'gandalf');
    expect(matches).toHaveLength(1);
    expect(matches[0].category).toBe('npcs');
  });

  it('matches treasure titles', () => {
    const hex = makeHex({
      treasures: [
        { id: 't1', title: 'Sword of Flame', description: 'Deals fire damage', isResolved: false }
      ]
    });
    const matches = searchHex(hex, '0,0', 'flame');
    expect(matches).toHaveLength(1);
    expect(matches[0].category).toBe('treasures');
  });

  it('matches clue titles', () => {
    const hex = makeHex({
      clues: [
        { id: 'c1', title: 'Cryptic Map', description: 'Points to buried gold', isResolved: false }
      ]
    });
    const matches = searchHex(hex, '0,0', 'cryptic');
    expect(matches).toHaveLength(1);
    expect(matches[0].category).toBe('clues');
  });

  it('matches encounter titles', () => {
    const hex = makeHex({
      encounters: [makeEncounter({ title: 'Ambush at the Bridge' })]
    });
    const matches = searchHex(hex, '0,0', 'ambush');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('content-title');
    expect(matches[0].category).toBe('encounters');
  });

  it('matches encounter creature names', () => {
    const hex = makeHex({
      encounters: [makeEncounter({
        creatures: [{ id: 'cr1', name: 'Dire Wolf', count: 3 }]
      })]
    });
    const matches = searchHex(hex, '0,0', 'dire wolf');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('creature');
  });

  it('matches encounter reward descriptions', () => {
    const hex = makeHex({
      encounters: [makeEncounter({
        rewards: [{ id: 'r1', type: 'item', description: 'Potion of Healing' }]
      })]
    });
    const matches = searchHex(hex, '0,0', 'potion');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('reward');
  });

  it('matches encounter outcome notes', () => {
    const hex = makeHex({
      encounters: [makeEncounter({ outcomeNotes: 'The party fled to the hills' })]
    });
    const matches = searchHex(hex, '0,0', 'fled');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('outcome');
  });

  it('returns multiple matches from different fields', () => {
    const hex = makeHex({
      terrain: 'Forest',
      notes: 'A dense forest with wolves',
      npcs: [
        { id: 'npc1', title: 'Forest Ranger', description: 'Patrols the forest', isResolved: false }
      ]
    });
    const matches = searchHex(hex, '0,0', 'forest');
    // Should match: terrain, notes, NPC title (description deferred since title matches)
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it('is case insensitive', () => {
    const hex = makeHex({ notes: 'DRAGON LAIR' });
    expect(searchHex(hex, '0,0', 'dragon')).toHaveLength(1);
    expect(searchHex(hex, '0,0', 'DRAGON')).toHaveLength(1);
    expect(searchHex(hex, '0,0', 'DrAgOn')).toHaveLength(1);
  });
});

describe('searchCampaign', () => {
  function makeCampaign(hexes: Record<string, Hex>): Campaign {
    return {
      id: 'camp-1',
      name: 'Test Campaign',
      gridWidth: 10,
      gridHeight: 10,
      hexes,
      terrainTypes: [],
      encounterTables: [],
      createdAt: '2025-01-01',
      modifiedAt: '2025-01-01'
    };
  }

  it('returns empty array for empty query', () => {
    const campaign = makeCampaign({
      '0,0': makeHex({ notes: 'Something here' })
    });
    expect(searchCampaign(campaign, '')).toEqual([]);
    expect(searchCampaign(campaign, '   ')).toEqual([]);
  });

  it('finds matching hexes across the campaign', () => {
    const campaign = makeCampaign({
      '0,0': makeHex({ notes: 'Dragon cave' }),
      '1,0': makeHex({ notes: 'Empty plains' }),
      '2,0': makeHex({ terrain: 'Dragon Mountains' })
    });
    const results = searchCampaign(campaign, 'dragon');
    expect(results).toHaveLength(2);
    expect(results.map(r => r.hexKey).sort()).toEqual(['0,0', '2,0']);
  });

  it('returns results with correct hex references', () => {
    const hex = makeHex({ notes: 'Goblin camp' });
    const campaign = makeCampaign({ '3,4': hex });
    const results = searchCampaign(campaign, 'goblin');
    expect(results).toHaveLength(1);
    expect(results[0].hexKey).toBe('3,4');
    expect(results[0].hex).toBe(hex);
    expect(results[0].matches).toHaveLength(1);
  });

  it('returns no results for non-matching query', () => {
    const campaign = makeCampaign({
      '0,0': makeHex({ notes: 'Forest clearing' })
    });
    expect(searchCampaign(campaign, 'volcano')).toEqual([]);
  });
});

describe('getMatchHint', () => {
  it('returns empty string for no matches', () => {
    expect(getMatchHint([])).toBe('');
  });

  it('returns hint for notes match', () => {
    const matches: SearchMatch[] = [
      { hexKey: '0,0', matchType: 'notes', matchText: 'some notes' }
    ];
    expect(getMatchHint(matches)).toBe('notes');
  });

  it('returns hint for terrain match', () => {
    const matches: SearchMatch[] = [
      { hexKey: '0,0', matchType: 'terrain', matchText: 'Forest' }
    ];
    expect(getMatchHint(matches)).toBe('terrain: Forest');
  });

  it('returns hint for tag match', () => {
    const matches: SearchMatch[] = [
      { hexKey: '0,0', matchType: 'tag', matchText: 'dangerous' }
    ];
    expect(getMatchHint(matches)).toBe('tag: dangerous');
  });

  it('returns hint for marker match', () => {
    const matches: SearchMatch[] = [
      { hexKey: '0,0', matchType: 'marker', matchText: 'Town Hall' }
    ];
    expect(getMatchHint(matches)).toBe('marker: Town Hall');
  });

  it('returns hint for creature match', () => {
    const matches: SearchMatch[] = [
      { hexKey: '0,0', matchType: 'creature', matchText: 'Goblin', category: 'encounters' }
    ];
    expect(getMatchHint(matches)).toBe('creature: Goblin');
  });

  it('returns hint for reward match', () => {
    const matches: SearchMatch[] = [
      { hexKey: '0,0', matchType: 'reward', matchText: 'Gold coins', category: 'encounters' }
    ];
    expect(getMatchHint(matches)).toBe('reward: Gold coins');
  });

  it('returns hint for outcome match', () => {
    const matches: SearchMatch[] = [
      { hexKey: '0,0', matchType: 'outcome', matchText: 'Victory achieved', category: 'encounters' }
    ];
    expect(getMatchHint(matches)).toBe('outcome: Victory achieved');
  });

  it('returns hint for content-title match with category', () => {
    const matches: SearchMatch[] = [
      { hexKey: '0,0', matchType: 'content-title', category: 'locations', itemTitle: 'Temple', matchText: 'Temple' }
    ];
    expect(getMatchHint(matches)).toBe('locations: Temple');
  });

  it('returns hint for content-description match using itemTitle', () => {
    const matches: SearchMatch[] = [
      { hexKey: '0,0', matchType: 'content-description', category: 'npcs', itemTitle: 'Gandalf', matchText: 'A wise wizard' }
    ];
    expect(getMatchHint(matches)).toBe('npcs: Gandalf');
  });

  it('uses only the first match for the hint', () => {
    const matches: SearchMatch[] = [
      { hexKey: '0,0', matchType: 'terrain', matchText: 'Forest' },
      { hexKey: '0,0', matchType: 'notes', matchText: 'Dense trees' }
    ];
    expect(getMatchHint(matches)).toBe('terrain: Forest');
  });
});
