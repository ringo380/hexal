import { describe, it, expect } from 'vitest';
import {
  getQuestById,
  getQuestsForHex,
  getQuestsForNpc,
  getQuestsForArc,
  getArcForQuest,
  getPrerequisites,
  getDependentQuests,
  deleteQuestCleanup,
  removeNpcFromQuests,
  removeEncounterFromQuests,
  removeClueFromQuests,
  removeFactionFromQuests,
  updateQuestNpcHexKey,
  deleteStoryArcCleanup
} from '../services/questService';
import { createCampaign } from '../types/Campaign';
import type { Campaign } from '../types/Campaign';
import { createQuest, createQuestObjective, createStoryArc } from '../types/Quest';
import type { Quest, StoryArc } from '../types/Quest';

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return { ...createCampaign('Test', 10, 10), ...overrides };
}

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return { ...createQuest('Test Quest'), ...overrides };
}

describe('getQuestById', () => {
  it('finds quest by id', () => {
    const q = makeQuest({ id: 'q1' });
    const campaign = makeCampaign({ quests: [q] });
    expect(getQuestById(campaign, 'q1')).toBe(q);
  });

  it('returns undefined for missing id', () => {
    const campaign = makeCampaign({ quests: [makeQuest({ id: 'q1' })] });
    expect(getQuestById(campaign, 'missing')).toBeUndefined();
  });

  it('handles undefined quests', () => {
    const campaign = makeCampaign({ quests: undefined });
    expect(getQuestById(campaign, 'q1')).toBeUndefined();
  });
});

describe('getQuestsForHex', () => {
  it('returns quests linked to the hex', () => {
    const q1 = makeQuest({ id: 'q1', linkedHexKeys: ['0,0', '1,1'] });
    const q2 = makeQuest({ id: 'q2', linkedHexKeys: ['2,2'] });
    const q3 = makeQuest({ id: 'q3', linkedHexKeys: ['0,0'] });
    const campaign = makeCampaign({ quests: [q1, q2, q3] });

    const result = getQuestsForHex(campaign, '0,0');
    expect(result).toHaveLength(2);
    expect(result.map(q => q.id)).toEqual(['q1', 'q3']);
  });

  it('returns empty array for unlinked hex', () => {
    const q1 = makeQuest({ id: 'q1', linkedHexKeys: ['0,0'] });
    const campaign = makeCampaign({ quests: [q1] });
    expect(getQuestsForHex(campaign, '5,5')).toEqual([]);
  });

  it('handles no quests', () => {
    const campaign = makeCampaign({ quests: [] });
    expect(getQuestsForHex(campaign, '0,0')).toEqual([]);
  });
});

describe('getQuestsForNpc', () => {
  it('returns quests linked to the NPC', () => {
    const q1 = makeQuest({ id: 'q1', linkedNpcRefs: [{ npcId: 'npc1', hexKey: '0,0' }] });
    const q2 = makeQuest({ id: 'q2', linkedNpcRefs: [{ npcId: 'npc2', hexKey: '1,1' }] });
    const q3 = makeQuest({ id: 'q3', linkedNpcRefs: [{ npcId: 'npc1', hexKey: '2,2' }] });
    const campaign = makeCampaign({ quests: [q1, q2, q3] });

    const result = getQuestsForNpc(campaign, 'npc1');
    expect(result).toHaveLength(2);
    expect(result.map(q => q.id)).toEqual(['q1', 'q3']);
  });

  it('returns empty for unlinked NPC', () => {
    const q1 = makeQuest({ id: 'q1', linkedNpcRefs: [{ npcId: 'npc1', hexKey: '0,0' }] });
    const campaign = makeCampaign({ quests: [q1] });
    expect(getQuestsForNpc(campaign, 'npc-none')).toEqual([]);
  });
});

describe('getQuestsForArc', () => {
  it('returns quests in arc order', () => {
    const q1 = makeQuest({ id: 'q1', storyArcId: 'arc1' });
    const q2 = makeQuest({ id: 'q2', storyArcId: 'arc1' });
    const q3 = makeQuest({ id: 'q3' });
    const arc: StoryArc = { ...createStoryArc('Arc'), id: 'arc1', questIds: ['q2', 'q1'] };
    const campaign = makeCampaign({ quests: [q1, q2, q3], storyArcs: [arc] });

    const result = getQuestsForArc(campaign, 'arc1');
    expect(result.map(q => q.id)).toEqual(['q2', 'q1']); // arc order, not array order
  });

  it('returns empty for missing arc', () => {
    const campaign = makeCampaign({ quests: [makeQuest({ id: 'q1' })], storyArcs: [] });
    expect(getQuestsForArc(campaign, 'missing')).toEqual([]);
  });
});

describe('getArcForQuest', () => {
  it('returns the story arc', () => {
    const arc: StoryArc = { ...createStoryArc('Arc'), id: 'arc1' };
    const q = makeQuest({ id: 'q1', storyArcId: 'arc1' });
    const campaign = makeCampaign({ quests: [q], storyArcs: [arc] });
    expect(getArcForQuest(campaign, q)).toBe(arc);
  });

  it('returns undefined when no storyArcId', () => {
    const q = makeQuest({ id: 'q1' });
    const campaign = makeCampaign({ quests: [q] });
    expect(getArcForQuest(campaign, q)).toBeUndefined();
  });
});

describe('getPrerequisites', () => {
  it('returns prerequisite quests', () => {
    const q1 = makeQuest({ id: 'q1' });
    const q2 = makeQuest({ id: 'q2', prerequisiteQuestIds: ['q1'] });
    const campaign = makeCampaign({ quests: [q1, q2] });
    expect(getPrerequisites(campaign, q2).map(q => q.id)).toEqual(['q1']);
  });
});

describe('getDependentQuests', () => {
  it('returns quests that depend on the given quest', () => {
    const q1 = makeQuest({ id: 'q1' });
    const q2 = makeQuest({ id: 'q2', prerequisiteQuestIds: ['q1'] });
    const q3 = makeQuest({ id: 'q3', prerequisiteQuestIds: ['q1', 'q2'] });
    const campaign = makeCampaign({ quests: [q1, q2, q3] });

    const result = getDependentQuests(campaign, 'q1');
    expect(result.map(q => q.id)).toEqual(['q2', 'q3']);
  });
});

describe('deleteQuestCleanup', () => {
  it('removes quest from story arc questIds', () => {
    const arc: StoryArc = { ...createStoryArc('Arc'), id: 'arc1', questIds: ['q1', 'q2'] };
    const q1 = makeQuest({ id: 'q1', storyArcId: 'arc1' });
    const q2 = makeQuest({ id: 'q2', storyArcId: 'arc1' });
    const campaign = makeCampaign({ quests: [q1, q2], storyArcs: [arc] });

    const result = deleteQuestCleanup(campaign, 'q1');
    expect(result.storyArcs![0].questIds).toEqual(['q2']);
  });

  it('removes quest from other quests prerequisiteQuestIds', () => {
    const q1 = makeQuest({ id: 'q1' });
    const q2 = makeQuest({ id: 'q2', prerequisiteQuestIds: ['q1'] });
    const campaign = makeCampaign({ quests: [q1, q2] });

    const result = deleteQuestCleanup(campaign, 'q1');
    expect(result.quests).toHaveLength(1);
    expect(result.quests![0].id).toBe('q2');
    expect(result.quests![0].prerequisiteQuestIds).toEqual([]);
  });

  it('removes the deleted quest itself', () => {
    const q1 = makeQuest({ id: 'q1' });
    const q2 = makeQuest({ id: 'q2' });
    const campaign = makeCampaign({ quests: [q1, q2] });

    const result = deleteQuestCleanup(campaign, 'q1');
    expect(result.quests).toHaveLength(1);
    expect(result.quests![0].id).toBe('q2');
  });

  it('does not return sessionLog in result', () => {
    const campaign = makeCampaign({
      quests: [makeQuest({ id: 'q1' })]
    });

    const result = deleteQuestCleanup(campaign, 'q1');
    expect(result).not.toHaveProperty('sessionLog');
  });
});

describe('removeNpcFromQuests', () => {
  it('removes NPC from linkedNpcRefs', () => {
    const q = makeQuest({
      id: 'q1',
      linkedNpcRefs: [
        { npcId: 'npc1', hexKey: '0,0' },
        { npcId: 'npc2', hexKey: '1,1' }
      ]
    });
    const campaign = makeCampaign({ quests: [q] });

    const result = removeNpcFromQuests(campaign, 'npc1');
    expect(result.quests[0].linkedNpcRefs).toHaveLength(1);
    expect(result.quests[0].linkedNpcRefs[0].npcId).toBe('npc2');
  });

  it('clears npcRef from objectives', () => {
    const obj = { ...createQuestObjective('Test'), npcRef: { npcId: 'npc1', hexKey: '0,0' } };
    const q = makeQuest({ id: 'q1', objectives: [obj] });
    const campaign = makeCampaign({ quests: [q] });

    const result = removeNpcFromQuests(campaign, 'npc1');
    expect(result.quests[0].objectives[0]).not.toHaveProperty('npcRef');
  });

  it('preserves quest unchanged when NPC not referenced', () => {
    const q = makeQuest({ id: 'q1', linkedNpcRefs: [{ npcId: 'npc2', hexKey: '0,0' }] });
    const campaign = makeCampaign({ quests: [q] });

    const result = removeNpcFromQuests(campaign, 'npc-other');
    expect(result.quests[0]).toBe(q); // same reference
  });
});

describe('removeEncounterFromQuests', () => {
  it('removes encounter ID from linkedEncounterIds', () => {
    const q = makeQuest({ id: 'q1', linkedEncounterIds: ['enc1', 'enc2'] });
    const campaign = makeCampaign({ quests: [q] });

    const result = removeEncounterFromQuests(campaign, 'enc1');
    expect(result.quests[0].linkedEncounterIds).toEqual(['enc2']);
  });

  it('preserves quest unchanged when encounter not linked', () => {
    const q = makeQuest({ id: 'q1', linkedEncounterIds: ['enc1'] });
    const campaign = makeCampaign({ quests: [q] });

    const result = removeEncounterFromQuests(campaign, 'enc-other');
    expect(result.quests[0]).toBe(q);
  });
});

describe('removeClueFromQuests', () => {
  it('removes clue ID from linkedClueIds', () => {
    const q = makeQuest({ id: 'q1', linkedClueIds: ['clue1', 'clue2'] });
    const campaign = makeCampaign({ quests: [q] });

    const result = removeClueFromQuests(campaign, 'clue1');
    expect(result.quests[0].linkedClueIds).toEqual(['clue2']);
  });
});

describe('removeFactionFromQuests', () => {
  it('removes faction ID from linkedFactionIds', () => {
    const q = makeQuest({ id: 'q1', linkedFactionIds: ['f1', 'f2'] });
    const campaign = makeCampaign({ quests: [q] });

    const result = removeFactionFromQuests(campaign, 'f1');
    expect(result.quests[0].linkedFactionIds).toEqual(['f2']);
  });

  it('preserves quest unchanged when faction not linked', () => {
    const q = makeQuest({ id: 'q1', linkedFactionIds: ['f1'] });
    const campaign = makeCampaign({ quests: [q] });

    const result = removeFactionFromQuests(campaign, 'f-other');
    expect(result.quests[0]).toBe(q); // same reference
  });

  it('handles quests with no linkedFactionIds', () => {
    const q = makeQuest({ id: 'q1' });
    const campaign = makeCampaign({ quests: [q] });

    const result = removeFactionFromQuests(campaign, 'f1');
    expect(result.quests[0]).toBe(q);
  });
});

describe('updateQuestNpcHexKey', () => {
  it('updates hex key in linkedNpcRefs', () => {
    const q = makeQuest({
      id: 'q1',
      linkedNpcRefs: [{ npcId: 'npc1', hexKey: '0,0' }]
    });
    const campaign = makeCampaign({ quests: [q] });

    const result = updateQuestNpcHexKey(campaign, 'npc1', '0,0', '2,3');
    expect(result.quests[0].linkedNpcRefs[0].hexKey).toBe('2,3');
  });

  it('updates hex key in objective npcRefs', () => {
    const obj = { ...createQuestObjective('Test'), npcRef: { npcId: 'npc1', hexKey: '0,0' } };
    const q = makeQuest({ id: 'q1', objectives: [obj] });
    const campaign = makeCampaign({ quests: [q] });

    const result = updateQuestNpcHexKey(campaign, 'npc1', '0,0', '3,4');
    expect(result.quests[0].objectives[0].npcRef?.hexKey).toBe('3,4');
  });

  it('does not change refs for other NPCs', () => {
    const q = makeQuest({
      id: 'q1',
      linkedNpcRefs: [
        { npcId: 'npc1', hexKey: '0,0' },
        { npcId: 'npc2', hexKey: '0,0' }
      ]
    });
    const campaign = makeCampaign({ quests: [q] });

    const result = updateQuestNpcHexKey(campaign, 'npc1', '0,0', '2,3');
    expect(result.quests[0].linkedNpcRefs[0].hexKey).toBe('2,3');
    expect(result.quests[0].linkedNpcRefs[1].hexKey).toBe('0,0'); // unchanged
  });
});

describe('deleteStoryArcCleanup', () => {
  it('clears storyArcId from member quests', () => {
    const q1 = makeQuest({ id: 'q1', storyArcId: 'arc1' });
    const q2 = makeQuest({ id: 'q2', storyArcId: 'arc1' });
    const q3 = makeQuest({ id: 'q3', storyArcId: 'arc2' });
    const arc1: StoryArc = { ...createStoryArc('Arc1'), id: 'arc1', questIds: ['q1', 'q2'] };
    const arc2: StoryArc = { ...createStoryArc('Arc2'), id: 'arc2', questIds: ['q3'] };
    const campaign = makeCampaign({ quests: [q1, q2, q3], storyArcs: [arc1, arc2] });

    const result = deleteStoryArcCleanup(campaign, 'arc1');
    // q1 and q2 should have storyArcId cleared
    expect(result.quests.find(q => q.id === 'q1')?.storyArcId).toBeUndefined();
    expect(result.quests.find(q => q.id === 'q2')?.storyArcId).toBeUndefined();
    // q3 should be unchanged
    expect(result.quests.find(q => q.id === 'q3')?.storyArcId).toBe('arc2');
  });

  it('removes the arc from storyArcs', () => {
    const arc: StoryArc = { ...createStoryArc('Arc'), id: 'arc1' };
    const campaign = makeCampaign({ storyArcs: [arc] });

    const result = deleteStoryArcCleanup(campaign, 'arc1');
    expect(result.storyArcs).toEqual([]);
  });
});
