import { describe, it, expect } from 'vitest';
import { moveNpc, deleteNpcCleanup, getNpcById } from '../services/npcService';
import { createCampaign, createHex, createNpc, createEncounter, createNpcRelationship } from '../types/Campaign';
import type { Campaign, Hex } from '../types/Campaign';

function makeHex(q: number, r: number, overrides: Partial<Hex> = {}): Hex {
  return { ...createHex({ q, r }, 'Forest'), ...overrides };
}

function makeCampaign(hexes: Record<string, Hex>, overrides: Partial<Campaign> = {}): Campaign {
  const base = createCampaign('Test', 10, 10);
  return { ...base, hexes, ...overrides };
}

describe('moveNpc', () => {
  it('removes NPC from source hex and adds to target hex', () => {
    const npc = createNpc('Gandalf');
    const hexes: Record<string, Hex> = {
      '0,0': makeHex(0, 0, { npcs: [npc] }),
      '1,0': makeHex(1, 0)
    };
    const campaign = makeCampaign(hexes);
    const result = moveNpc(campaign, npc.id, '0,0', '1,0');

    expect(result.hexes['0,0'].npcs).toHaveLength(0);
    expect(result.hexes['1,0'].npcs).toHaveLength(1);
    expect(result.hexes['1,0'].npcs[0].id).toBe(npc.id);
  });

  it('updates relationship targetHexKey references across all NPCs', () => {
    const npcA = createNpc('NPC A');
    const npcB = createNpc('NPC B');
    npcB.relationships = [createNpcRelationship(npcA.id, '0,0', 'ally')];

    const hexes: Record<string, Hex> = {
      '0,0': makeHex(0, 0, { npcs: [npcA] }),
      '1,0': makeHex(1, 0, { npcs: [npcB] }),
      '2,0': makeHex(2, 0)
    };
    const campaign = makeCampaign(hexes);
    const result = moveNpc(campaign, npcA.id, '0,0', '2,0');

    // NPC B's relationship should now point to '2,0'
    const updatedB = result.hexes['1,0'].npcs.find(n => n.id === npcB.id)!;
    expect(updatedB.relationships[0].targetHexKey).toBe('2,0');
  });

  it('updates encounter LinkedNpcRef.hexKey references', () => {
    const npc = createNpc('Linked NPC');
    const encounter = createEncounter('Ambush');
    encounter.linkedNpcIds = [{ npcId: npc.id, hexKey: '0,0' }];

    const hexes: Record<string, Hex> = {
      '0,0': makeHex(0, 0, { npcs: [npc] }),
      '1,0': makeHex(1, 0, { encounters: [encounter] }),
      '2,0': makeHex(2, 0)
    };
    const campaign = makeCampaign(hexes);
    const result = moveNpc(campaign, npc.id, '0,0', '2,0');

    const updatedEncounter = result.hexes['1,0'].encounters[0];
    expect(updatedEncounter.linkedNpcIds[0].hexKey).toBe('2,0');
  });

  it('returns unchanged hexes when source hex does not exist', () => {
    const campaign = makeCampaign({ '0,0': makeHex(0, 0) });
    const result = moveNpc(campaign, 'missing', '9,9', '0,0');

    expect(result.hexes['0,0'].npcs).toHaveLength(0);
  });

  it('rejects move when target hex does not exist (prevents data loss)', () => {
    const npc = createNpc('Safe NPC');
    const hexes: Record<string, Hex> = {
      '0,0': makeHex(0, 0, { npcs: [npc] })
    };
    const campaign = makeCampaign(hexes);
    const result = moveNpc(campaign, npc.id, '0,0', '9,9');

    // NPC should still be in source hex
    expect(result.hexes['0,0'].npcs).toHaveLength(1);
    expect(result.hexes['0,0'].npcs[0].id).toBe(npc.id);
  });

  it('returns unchanged hexes when NPC is not found in source', () => {
    const hexes: Record<string, Hex> = {
      '0,0': makeHex(0, 0),
      '1,0': makeHex(1, 0)
    };
    const campaign = makeCampaign(hexes);
    const result = moveNpc(campaign, 'missing-npc', '0,0', '1,0');

    expect(result.hexes['0,0'].npcs).toHaveLength(0);
    expect(result.hexes['1,0'].npcs).toHaveLength(0);
  });
});

describe('deleteNpcCleanup', () => {
  it('removes stale NpcRelationship entries from other NPCs', () => {
    const npcA = createNpc('NPC A');
    const npcB = createNpc('NPC B');
    npcB.relationships = [
      createNpcRelationship(npcA.id, '0,0', 'ally'),
      createNpcRelationship('other-npc', '2,0', 'rival')
    ];

    const hexes: Record<string, Hex> = {
      '0,0': makeHex(0, 0, { npcs: [npcA] }),
      '1,0': makeHex(1, 0, { npcs: [npcB] })
    };
    const campaign = makeCampaign(hexes);
    const result = deleteNpcCleanup(campaign, npcA.id, '0,0');

    const updatedB = result.hexes['1,0'].npcs.find(n => n.id === npcB.id)!;
    expect(updatedB.relationships).toHaveLength(1);
    expect(updatedB.relationships[0].targetNpcId).toBe('other-npc');
  });

  it('removes stale LinkedNpcRef entries from encounters', () => {
    const npc = createNpc('Deleted NPC');
    const encounter = createEncounter('Battle');
    encounter.linkedNpcIds = [
      { npcId: npc.id, hexKey: '0,0' },
      { npcId: 'other-npc', hexKey: '2,0' }
    ];

    const hexes: Record<string, Hex> = {
      '0,0': makeHex(0, 0, { npcs: [npc] }),
      '1,0': makeHex(1, 0, { encounters: [encounter] })
    };
    const campaign = makeCampaign(hexes);
    const result = deleteNpcCleanup(campaign, npc.id, '0,0');

    const updatedEncounter = result.hexes['1,0'].encounters[0];
    expect(updatedEncounter.linkedNpcIds).toHaveLength(1);
    expect(updatedEncounter.linkedNpcIds[0].npcId).toBe('other-npc');
  });

  it('does not modify hexes with no references to deleted NPC', () => {
    const npcA = createNpc('NPC A');
    const npcB = createNpc('NPC B');

    const hexes: Record<string, Hex> = {
      '0,0': makeHex(0, 0, { npcs: [npcA] }),
      '1,0': makeHex(1, 0, { npcs: [npcB] })
    };
    const campaign = makeCampaign(hexes);
    const result = deleteNpcCleanup(campaign, npcA.id, '0,0');

    // Hex '1,0' had no references, should be unchanged object
    expect(result.hexes['1,0']).toBe(hexes['1,0']);
  });
});

describe('getNpcById', () => {
  it('finds NPC by ID across hexes', () => {
    const npc = createNpc('Target');
    const hexes: Record<string, Hex> = {
      '0,0': makeHex(0, 0),
      '3,2': makeHex(3, 2, { npcs: [npc] })
    };
    const campaign = makeCampaign(hexes);
    const result = getNpcById(campaign, npc.id);

    expect(result).not.toBeNull();
    expect(result!.npc.id).toBe(npc.id);
    expect(result!.hexKey).toBe('3,2');
  });

  it('returns null for missing NPC', () => {
    const campaign = makeCampaign({ '0,0': makeHex(0, 0) });
    const result = getNpcById(campaign, 'nonexistent');

    expect(result).toBeNull();
  });
});
