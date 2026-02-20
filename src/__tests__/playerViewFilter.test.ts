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

  describe('sessions and session log', () => {
    it('includes visible sessions and entries', () => {
      const sessions = [
        { id: 's1', number: 1, title: 'Session 1', summary: 'A fun session', realWorldDate: '2026-01-01', hexesVisited: [], isVisibleToPlayers: true },
        { id: 's2', number: 2, title: 'Session 2', summary: 'Secret', realWorldDate: '2026-01-08', hexesVisited: [], isVisibleToPlayers: false }
      ];
      const sessionLog = [
        { id: 'e1', sessionId: 's1', title: 'Battle', description: 'Fought goblins', inGameTime: { year: 1, month: 0, day: 1, hour: 8, minute: 0 }, hexKeys: ['0,0'], tags: ['combat' as const], isVisibleToPlayers: true },
        { id: 'e2', sessionId: 's1', title: 'Secret DM note', description: '', inGameTime: { year: 1, month: 0, day: 1, hour: 10, minute: 0 }, hexKeys: [], tags: [], isVisibleToPlayers: false },
        { id: 'e3', sessionId: 's2', title: 'Hidden session entry', description: '', inGameTime: { year: 1, month: 0, day: 2, hour: 8, minute: 0 }, hexKeys: [], tags: [], isVisibleToPlayers: true }
      ];
      const campaign = makeCampaign({}, { sessions, sessionLog } as any);
      const result = filterCampaignForPlayer(campaign);

      // Only visible session included
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].title).toBe('Session 1');

      // Only visible entry from visible session included
      expect(result.sessionLog).toHaveLength(1);
      expect(result.sessionLog[0].title).toBe('Battle');
    });

    it('strips DM-only fields from sessions and entries', () => {
      const sessions = [
        { id: 's1', number: 1, title: 'Session 1', summary: 'Recap', realWorldDate: '2026-01-01', hexesVisited: ['0,0'], isVisibleToPlayers: true, inGameTimeStart: { year: 1, month: 0, day: 1, hour: 8, minute: 0 } }
      ];
      const sessionLog = [
        { id: 'e1', sessionId: 's1', title: 'Event', description: 'Desc', inGameTime: { year: 1, month: 0, day: 1, hour: 8, minute: 0 }, hexKeys: ['0,0'], tags: ['combat' as const], isVisibleToPlayers: true, customTag: 'special' }
      ];
      const campaign = makeCampaign({}, { sessions, sessionLog } as any);
      const result = filterCampaignForPlayer(campaign);

      // Player session should not have hexesVisited or inGameTimeStart
      expect(result.sessions[0]).not.toHaveProperty('hexesVisited');
      expect(result.sessions[0]).not.toHaveProperty('inGameTimeStart');
      expect(result.sessions[0]).not.toHaveProperty('isVisibleToPlayers');

      // Player entry should not have tags, customTag, inGameTime, isVisibleToPlayers
      expect(result.sessionLog[0]).not.toHaveProperty('tags');
      expect(result.sessionLog[0]).not.toHaveProperty('customTag');
      expect(result.sessionLog[0]).not.toHaveProperty('inGameTime');
      expect(result.sessionLog[0]).not.toHaveProperty('isVisibleToPlayers');
    });

    it('handles campaigns with no sessions', () => {
      const campaign = makeCampaign({});
      const result = filterCampaignForPlayer(campaign);
      expect(result.sessions).toEqual([]);
      expect(result.sessionLog).toEqual([]);
    });
  });

  describe('quests and story arcs', () => {
    it('includes visible quests and strips DM-only fields', () => {
      const campaign = makeCampaign({}, {
        quests: [
          {
            id: 'q1', title: 'Find the Gem', description: 'A quest', status: 'active',
            dmNotes: 'Secret DM info', objectives: [
              { id: 'o1', description: 'Visit the cave', isComplete: false, isVisibleToPlayers: true },
              { id: 'o2', description: 'DM-only objective', isComplete: false, isVisibleToPlayers: false }
            ],
            linkedHexKeys: ['0,0'], linkedNpcRefs: [{ npcId: 'npc1', hexKey: '0,0' }],
            linkedEncounterIds: ['enc1'], linkedClueIds: ['clue1'], linkedFactionIds: ['f1'],
            prerequisiteQuestIds: ['q0'], isVisibleToPlayers: true,
            difficulty: 'hard', estimatedSessions: 3, xpReward: 500,
            tags: ['main'], createdAt: '2026-01-01', modifiedAt: '2026-01-01'
          },
          {
            id: 'q2', title: 'Hidden Quest', description: 'Not for players', status: 'unknown',
            dmNotes: '', objectives: [], linkedHexKeys: [], linkedNpcRefs: [],
            linkedEncounterIds: [], linkedClueIds: [], linkedFactionIds: [],
            prerequisiteQuestIds: [], isVisibleToPlayers: false,
            tags: [], createdAt: '2026-01-01', modifiedAt: '2026-01-01'
          }
        ] as any[]
      });

      const result = filterCampaignForPlayer(campaign);

      // Only visible quest included
      expect(result.quests).toHaveLength(1);
      expect(result.quests[0].id).toBe('q1');
      expect(result.quests[0].title).toBe('Find the Gem');
      expect(result.quests[0].status).toBe('active');
      expect(result.quests[0].difficulty).toBe('hard');

      // DM-only fields stripped
      expect(result.quests[0]).not.toHaveProperty('dmNotes');
      expect(result.quests[0]).not.toHaveProperty('linkedHexKeys');
      expect(result.quests[0]).not.toHaveProperty('linkedNpcRefs');
      expect(result.quests[0]).not.toHaveProperty('linkedEncounterIds');
      expect(result.quests[0]).not.toHaveProperty('linkedClueIds');
      expect(result.quests[0]).not.toHaveProperty('linkedFactionIds');
      expect(result.quests[0]).not.toHaveProperty('prerequisiteQuestIds');
      expect(result.quests[0]).not.toHaveProperty('tags');
      expect(result.quests[0]).not.toHaveProperty('estimatedSessions');
      expect(result.quests[0]).not.toHaveProperty('xpReward');
      expect(result.quests[0]).not.toHaveProperty('createdAt');
      expect(result.quests[0]).not.toHaveProperty('modifiedAt');

      // Only visible objectives included, stripped of hex/npc refs
      expect(result.quests[0].objectives).toHaveLength(1);
      expect(result.quests[0].objectives[0].description).toBe('Visit the cave');
      expect(result.quests[0].objectives[0]).not.toHaveProperty('isVisibleToPlayers');
      expect(result.quests[0].objectives[0]).not.toHaveProperty('hexKey');
      expect(result.quests[0].objectives[0]).not.toHaveProperty('npcRef');
    });

    it('includes visible story arcs and strips DM-only fields', () => {
      const campaign = makeCampaign({}, {
        quests: [
          {
            id: 'q1', title: 'Quest 1', description: '', status: 'active',
            dmNotes: '', objectives: [], linkedHexKeys: [], linkedNpcRefs: [],
            linkedEncounterIds: [], linkedClueIds: [], linkedFactionIds: [],
            prerequisiteQuestIds: [], isVisibleToPlayers: true,
            tags: [], createdAt: '2026-01-01', modifiedAt: '2026-01-01'
          },
          {
            id: 'q2', title: 'Hidden Quest', description: '', status: 'active',
            dmNotes: '', objectives: [], linkedHexKeys: [], linkedNpcRefs: [],
            linkedEncounterIds: [], linkedClueIds: [], linkedFactionIds: [],
            prerequisiteQuestIds: [], isVisibleToPlayers: false,
            tags: [], createdAt: '2026-01-01', modifiedAt: '2026-01-01'
          }
        ] as any[],
        storyArcs: [
          {
            id: 'a1', title: 'Main Arc', description: 'The main story',
            dmNotes: 'DM secret arc notes', questIds: ['q1', 'q2'],
            status: 'active', isVisibleToPlayers: true, color: '#ff6b6b'
          },
          {
            id: 'a2', title: 'Hidden Arc', description: 'Secret',
            dmNotes: '', questIds: [], status: 'planned',
            isVisibleToPlayers: false, color: '#4ecdc4'
          }
        ] as any[]
      });

      const result = filterCampaignForPlayer(campaign);

      // Only visible arc included
      expect(result.storyArcs).toHaveLength(1);
      expect(result.storyArcs[0].id).toBe('a1');
      expect(result.storyArcs[0].title).toBe('Main Arc');
      expect(result.storyArcs[0].color).toBe('#ff6b6b');
      expect(result.storyArcs[0].status).toBe('active');

      // DM-only fields stripped
      expect(result.storyArcs[0]).not.toHaveProperty('dmNotes');
      expect(result.storyArcs[0]).not.toHaveProperty('isVisibleToPlayers');

      // questIds filtered to only visible quests
      expect(result.storyArcs[0].questIds).toEqual(['q1']);
    });

    it('handles campaigns with no quests or story arcs', () => {
      const campaign = makeCampaign({});
      const result = filterCampaignForPlayer(campaign);

      expect(result.quests).toEqual([]);
      expect(result.storyArcs).toEqual([]);
    });

    it('handles campaigns with undefined quests/storyArcs', () => {
      const campaign = makeCampaign({}, { quests: undefined, storyArcs: undefined } as any);
      const result = filterCampaignForPlayer(campaign);

      expect(result.quests).toEqual([]);
      expect(result.storyArcs).toEqual([]);
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
