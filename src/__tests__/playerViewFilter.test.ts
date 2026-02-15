import { describe, it, expect } from 'vitest';
import { filterCampaignForPlayer } from '../services/playerViewFilter';
// Types used implicitly via assertions on return values
import { createCampaign, createHex, createContentItem, createNpc, createEncounter, createFaction } from '../types/Campaign';
import type { Campaign, Hex, Region } from '../types/Campaign';
import type { HexMarker } from '../types/Markers';

// Helper to build a hex with content
function makeHex(
  q: number,
  r: number,
  overrides: Partial<Hex> = {}
): Hex {
  return {
    ...createHex({ q, r }, 'Forest'),
    ...overrides
  };
}

// Helper to build a campaign with specific hexes
function makeCampaign(hexes: Record<string, Hex>, overrides: Partial<Campaign> = {}): Campaign {
  const base = createCampaign('Test Campaign', 10, 10);
  return { ...base, hexes, ...overrides };
}

describe('filterCampaignForPlayer', () => {
  describe('campaign-level fields', () => {
    it('preserves id, name, grid dimensions', () => {
      const campaign = makeCampaign({});
      const result = filterCampaignForPlayer(campaign);

      expect(result.id).toBe(campaign.id);
      expect(result.name).toBe(campaign.name);
      expect(result.gridWidth).toBe(campaign.gridWidth);
      expect(result.gridHeight).toBe(campaign.gridHeight);
    });

    it('preserves terrainTypes', () => {
      const campaign = makeCampaign({});
      const result = filterCampaignForPlayer(campaign);

      expect(result.terrainTypes).toBe(campaign.terrainTypes);
    });

    it('preserves timeWeather', () => {
      const campaign = makeCampaign({});
      const result = filterCampaignForPlayer(campaign);

      expect(result.timeWeather).toBe(campaign.timeWeather);
    });

    it('preserves markerTypes', () => {
      const campaign = makeCampaign({});
      const result = filterCampaignForPlayer(campaign);

      expect(result.markerTypes).toBe(campaign.markerTypes);
    });
  });

  describe('undiscovered hexes', () => {
    it('includes coordinate, terrain, and status', () => {
      const hex = makeHex(2, 3, { status: 'undiscovered', terrain: 'Mountains' });
      const result = filterCampaignForPlayer(makeCampaign({ '2,3': hex }));
      const playerHex = result.hexes['2,3'];

      expect(playerHex.coordinate).toEqual({ q: 2, r: 3 });
      expect(playerHex.terrain).toBe('Mountains');
      expect(playerHex.status).toBe('undiscovered');
    });

    it('strips location names', () => {
      const hex = makeHex(0, 0, {
        status: 'undiscovered',
        locations: [createContentItem('Secret Temple')]
      });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      expect(result.hexes['0,0'].locationNames).toEqual([]);
    });

    it('strips NPC info', () => {
      const hex = makeHex(0, 0, {
        status: 'undiscovered',
        npcs: [createNpc('Hidden NPC')]
      });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      expect(result.hexes['0,0'].npcs).toEqual([]);
    });
  });

  describe('discovered hexes', () => {
    it('includes location titles', () => {
      const hex = makeHex(1, 1, {
        status: 'discovered',
        locations: [
          createContentItem('Old Tavern'),
          createContentItem('Town Gate')
        ]
      });
      const result = filterCampaignForPlayer(makeCampaign({ '1,1': hex }));

      expect(result.hexes['1,1'].locationNames).toEqual(['Old Tavern', 'Town Gate']);
    });

    it('includes NPC names', () => {
      const hex = makeHex(1, 1, {
        status: 'discovered',
        npcs: [createNpc('Gandalf'), createNpc('Elrond')]
      });
      const result = filterCampaignForPlayer(makeCampaign({ '1,1': hex }));

      expect(result.hexes['1,1'].npcs).toEqual([
        { name: 'Gandalf' },
        { name: 'Elrond' }
      ]);
    });

    it('filters out items with empty titles', () => {
      const hex = makeHex(1, 1, {
        status: 'discovered',
        locations: [createContentItem(''), createContentItem('Real Place')],
        npcs: [createNpc(''), createNpc('Named NPC')]
      });
      const result = filterCampaignForPlayer(makeCampaign({ '1,1': hex }));

      expect(result.hexes['1,1'].locationNames).toEqual(['Real Place']);
      expect(result.hexes['1,1'].npcs).toEqual([{ name: 'Named NPC' }]);
    });
  });

  describe('cleared hexes', () => {
    it('includes location titles and NPC info like discovered', () => {
      const hex = makeHex(3, 3, {
        status: 'cleared',
        locations: [createContentItem('Dungeon')],
        npcs: [createNpc('Boss NPC')]
      });
      const result = filterCampaignForPlayer(makeCampaign({ '3,3': hex }));

      expect(result.hexes['3,3'].locationNames).toEqual(['Dungeon']);
      expect(result.hexes['3,3'].npcs).toEqual([{ name: 'Boss NPC' }]);
    });
  });

  describe('NPC faction and attitude filtering', () => {
    it('includes faction name when faction isKnownToPlayers', () => {
      const faction = createFaction('Thieves Guild', '#ff0000');
      faction.isKnownToPlayers = true;
      const npc = createNpc('Rogue');
      npc.factionId = faction.id;
      const hex = makeHex(0, 0, { status: 'discovered', npcs: [npc] });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }, { factions: [faction] }));

      expect(result.hexes['0,0'].npcs).toEqual([{ name: 'Rogue', factionName: 'Thieves Guild' }]);
    });

    it('omits faction name when faction is not known to players', () => {
      const faction = createFaction('Secret Order', '#ff0000');
      faction.isKnownToPlayers = false;
      const npc = createNpc('Agent');
      npc.factionId = faction.id;
      const hex = makeHex(0, 0, { status: 'discovered', npcs: [npc] });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }, { factions: [faction] }));

      expect(result.hexes['0,0'].npcs).toEqual([{ name: 'Agent' }]);
    });

    it('includes attitude for cleared hexes', () => {
      const npc = createNpc('Guard');
      npc.attitude = 'hostile';
      const hex = makeHex(0, 0, { status: 'cleared', npcs: [npc] });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      expect(result.hexes['0,0'].npcs).toEqual([{ name: 'Guard', attitude: 'hostile' }]);
    });

    it('omits attitude for discovered (non-cleared) hexes', () => {
      const npc = createNpc('Guard');
      npc.attitude = 'hostile';
      const hex = makeHex(0, 0, { status: 'discovered', npcs: [npc] });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      expect(result.hexes['0,0'].npcs).toEqual([{ name: 'Guard' }]);
    });
  });

  describe('DM-only data is stripped', () => {
    it('does not include notes', () => {
      const hex = makeHex(0, 0, {
        status: 'discovered',
        notes: 'Secret DM notes about this hex'
      });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      expect(result.hexes['0,0']).not.toHaveProperty('notes');
    });

    it('does not include tags', () => {
      const hex = makeHex(0, 0, {
        status: 'discovered',
        tags: ['quest-hook', 'danger']
      });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      expect(result.hexes['0,0']).not.toHaveProperty('tags');
    });

    it('does not include encounters', () => {
      const hex = makeHex(0, 0, {
        status: 'discovered',
        encounters: [createEncounter('Ambush')]
      });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      expect(result.hexes['0,0']).not.toHaveProperty('encounters');
    });

    it('does not include treasures', () => {
      const hex = makeHex(0, 0, {
        status: 'discovered',
        treasures: [createContentItem('Gold Hoard')]
      });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      expect(result.hexes['0,0']).not.toHaveProperty('treasures');
    });

    it('does not include clues', () => {
      const hex = makeHex(0, 0, {
        status: 'discovered',
        clues: [createContentItem('Ancient Map')]
      });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      expect(result.hexes['0,0']).not.toHaveProperty('clues');
    });

    it('does not include location descriptions (only titles)', () => {
      const location = createContentItem('Tavern');
      location.description = 'A seedy place with hidden treasure underneath';
      const hex = makeHex(0, 0, {
        status: 'discovered',
        locations: [location]
      });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));
      const playerHex = result.hexes['0,0'];

      expect(playerHex.locationNames).toEqual(['Tavern']);
      // locationNames is string[] not ContentItem[] — no descriptions possible
      expect(typeof playerHex.locationNames[0]).toBe('string');
    });
  });

  describe('markers', () => {
    it('includes visible markers', () => {
      const markers: HexMarker[] = [
        { id: 'v1', typeId: 'party', isVisible: true },
        { id: 'v2', typeId: 'camp', isVisible: true }
      ];
      const hex = makeHex(0, 0, { status: 'discovered', markers });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      expect(result.hexes['0,0'].markers).toHaveLength(2);
    });

    it('filters out hidden markers', () => {
      const markers: HexMarker[] = [
        { id: 'v1', typeId: 'party', isVisible: true },
        { id: 'h1', typeId: 'secret', isVisible: false }
      ];
      const hex = makeHex(0, 0, { status: 'discovered', markers });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      expect(result.hexes['0,0'].markers).toHaveLength(1);
      expect(result.hexes['0,0'].markers![0].id).toBe('v1');
    });

    it('handles hexes without markers', () => {
      const hex = makeHex(0, 0, { status: 'discovered' });
      const result = filterCampaignForPlayer(makeCampaign({ '0,0': hex }));

      // markers array comes from createHex default (empty array), filtered stays empty
      expect(result.hexes['0,0'].markers).toEqual([]);
    });
  });

  describe('regions', () => {
    it('preserves id, name, color, hexKeys, isDiscovered', () => {
      const region: Region = {
        id: 'r1',
        name: 'Darkwood',
        color: '#228B22',
        description: 'A dark and foreboding forest',
        hexKeys: ['0,0', '1,0', '1,1'],
        tags: ['dangerous', 'forest'],
        isDiscovered: true,
        notes: 'DM: Dragon lives here'
      };
      const campaign = makeCampaign({}, { regions: [region] });
      const result = filterCampaignForPlayer(campaign);

      expect(result.regions).toHaveLength(1);
      expect(result.regions[0].id).toBe('r1');
      expect(result.regions[0].name).toBe('Darkwood');
      expect(result.regions[0].color).toBe('#228B22');
      expect(result.regions[0].hexKeys).toEqual(['0,0', '1,0', '1,1']);
      expect(result.regions[0].isDiscovered).toBe(true);
    });

    it('strips description, notes, and tags from regions', () => {
      const region: Region = {
        id: 'r1',
        name: 'Darkwood',
        color: '#228B22',
        description: 'Secret DM description',
        hexKeys: [],
        tags: ['plot-critical'],
        isDiscovered: false,
        notes: 'DM notes about this region'
      };
      const campaign = makeCampaign({}, { regions: [region] });
      const result = filterCampaignForPlayer(campaign);

      expect(result.regions[0]).not.toHaveProperty('description');
      expect(result.regions[0]).not.toHaveProperty('notes');
      expect(result.regions[0]).not.toHaveProperty('tags');
    });

    it('handles campaigns with no regions', () => {
      const campaign = makeCampaign({}, { regions: undefined });
      const result = filterCampaignForPlayer(campaign);

      expect(result.regions).toEqual([]);
    });
  });

  describe('multiple hexes', () => {
    it('filters all hexes independently', () => {
      const hexes: Record<string, Hex> = {
        '0,0': makeHex(0, 0, {
          status: 'undiscovered',
          locations: [createContentItem('Hidden Place')]
        }),
        '1,0': makeHex(1, 0, {
          status: 'discovered',
          locations: [createContentItem('Found Place')]
        }),
        '2,0': makeHex(2, 0, {
          status: 'cleared',
          npcs: [createNpc('Freed NPC')]
        })
      };
      const result = filterCampaignForPlayer(makeCampaign(hexes));

      expect(result.hexes['0,0'].locationNames).toEqual([]);
      expect(result.hexes['1,0'].locationNames).toEqual(['Found Place']);
      expect(result.hexes['2,0'].npcs).toEqual([{ name: 'Freed NPC' }]);
    });
  });
});
