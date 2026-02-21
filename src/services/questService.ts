// Quest Service - Cross-cutting quest/story-arc operations (lookup, delete cleanup, ref management)

import type { Campaign } from '../types/Campaign';
import type { Quest, StoryArc } from '../types/Quest';

/**
 * Find a quest by ID.
 */
export function getQuestById(
  campaign: Campaign,
  id: string
): Quest | undefined {
  return (campaign.quests ?? []).find(q => q.id === id);
}

/**
 * Reverse lookup: quests whose linkedHexKeys includes the given hexKey.
 */
export function getQuestsForHex(
  campaign: Campaign,
  hexKey: string
): Quest[] {
  return (campaign.quests ?? []).filter(q => q.linkedHexKeys.includes(hexKey));
}

/**
 * Reverse lookup: quests whose linkedNpcRefs includes the given npcId.
 */
export function getQuestsForNpc(
  campaign: Campaign,
  npcId: string
): Quest[] {
  return (campaign.quests ?? []).filter(q =>
    q.linkedNpcRefs.some(ref => ref.npcId === npcId)
  );
}

/**
 * Get quests belonging to a story arc, ordered by the arc's questIds array.
 */
export function getQuestsForArc(
  campaign: Campaign,
  arcId: string
): Quest[] {
  const arc = (campaign.storyArcs ?? []).find(a => a.id === arcId);
  if (!arc) return [];
  const questMap = new Map((campaign.quests ?? []).map(q => [q.id, q]));
  const ordered: Quest[] = [];
  for (const qid of arc.questIds) {
    const q = questMap.get(qid);
    if (q) ordered.push(q);
  }
  return ordered;
}

/**
 * Find the story arc that a quest belongs to (via quest.storyArcId).
 */
export function getArcForQuest(
  campaign: Campaign,
  quest: Quest
): StoryArc | undefined {
  if (!quest.storyArcId) return undefined;
  return (campaign.storyArcs ?? []).find(a => a.id === quest.storyArcId);
}

/**
 * Get prerequisite quests for a quest.
 */
export function getPrerequisites(
  campaign: Campaign,
  quest: Quest
): Quest[] {
  const questMap = new Map((campaign.quests ?? []).map(q => [q.id, q]));
  const result: Quest[] = [];
  for (const pid of quest.prerequisiteQuestIds) {
    const q = questMap.get(pid);
    if (q) result.push(q);
  }
  return result;
}

/**
 * Reverse prerequisite lookup: quests whose prerequisiteQuestIds includes questId.
 */
export function getDependentQuests(
  campaign: Campaign,
  questId: string
): Quest[] {
  return (campaign.quests ?? []).filter(q =>
    q.prerequisiteQuestIds.includes(questId)
  );
}

/**
 * Cascade cleanup when deleting a quest.
 * - Removes questId from all story arcs' questIds arrays
 * - Removes questId from all other quests' prerequisiteQuestIds
 * Returns partial campaign update: { storyArcs, quests }
 */
export function deleteQuestCleanup(
  campaign: Campaign,
  questId: string
): Partial<Campaign> {
  // Clean story arcs
  const storyArcs = (campaign.storyArcs ?? []).map(arc => {
    const filtered = arc.questIds.filter(id => id !== questId);
    return filtered.length !== arc.questIds.length
      ? { ...arc, questIds: filtered }
      : arc;
  });

  // Clean prerequisiteQuestIds from other quests and remove the deleted quest itself
  const quests = (campaign.quests ?? [])
    .filter(q => q.id !== questId)
    .map(q => {
      const filtered = q.prerequisiteQuestIds.filter(id => id !== questId);
      return filtered.length !== q.prerequisiteQuestIds.length
        ? { ...q, prerequisiteQuestIds: filtered }
        : q;
    });

  return { storyArcs, quests };
}

/**
 * Remove an NPC reference from all quests' linkedNpcRefs and objective npcRef fields.
 */
export function removeNpcFromQuests(
  campaign: Campaign,
  npcId: string
): { quests: Quest[] } {
  const quests = (campaign.quests ?? []).map(q => {
    let changed = false;

    // Filter linkedNpcRefs
    const linkedNpcRefs = q.linkedNpcRefs.filter(ref => ref.npcId !== npcId);
    if (linkedNpcRefs.length !== q.linkedNpcRefs.length) changed = true;

    // Clear npcRef from objectives where npcRef.npcId matches
    const objectives = q.objectives.map(obj => {
      if (obj.npcRef && obj.npcRef.npcId === npcId) {
        changed = true;
        const { npcRef: _, ...rest } = obj;
        return rest;
      }
      return obj;
    });

    return changed ? { ...q, linkedNpcRefs, objectives } : q;
  });

  return { quests };
}

/**
 * Remove an encounter reference from all quests' linkedEncounterIds.
 */
export function removeEncounterFromQuests(
  campaign: Campaign,
  encId: string
): { quests: Quest[] } {
  const quests = (campaign.quests ?? []).map(q => {
    const filtered = q.linkedEncounterIds.filter(id => id !== encId);
    return filtered.length !== q.linkedEncounterIds.length
      ? { ...q, linkedEncounterIds: filtered }
      : q;
  });

  return { quests };
}

/**
 * Remove a clue reference from all quests' linkedClueIds.
 */
export function removeClueFromQuests(
  campaign: Campaign,
  clueId: string
): { quests: Quest[] } {
  const quests = (campaign.quests ?? []).map(q => {
    const filtered = q.linkedClueIds.filter(id => id !== clueId);
    return filtered.length !== q.linkedClueIds.length
      ? { ...q, linkedClueIds: filtered }
      : q;
  });

  return { quests };
}

/**
 * Remove a faction reference from all quests' linkedFactionIds.
 */
export function removeFactionFromQuests(
  campaign: Campaign,
  factionId: string
): { quests: Quest[] } {
  const quests = (campaign.quests ?? []).map(q => {
    const filtered = q.linkedFactionIds.filter(id => id !== factionId);
    return filtered.length !== q.linkedFactionIds.length
      ? { ...q, linkedFactionIds: filtered }
      : q;
  });

  return { quests };
}

/**
 * Update hex key references when an NPC moves.
 * Updates linkedNpcRefs and objective npcRefs where npcId and oldHexKey match.
 */
export function updateQuestNpcHexKey(
  campaign: Campaign,
  npcId: string,
  oldHexKey: string,
  newHexKey: string
): { quests: Quest[] } {
  const quests = (campaign.quests ?? []).map(q => {
    let changed = false;

    // Update linkedNpcRefs
    const linkedNpcRefs = q.linkedNpcRefs.map(ref => {
      if (ref.npcId === npcId && ref.hexKey === oldHexKey) {
        changed = true;
        return { ...ref, hexKey: newHexKey };
      }
      return ref;
    });

    // Update objective npcRefs
    const objectives = q.objectives.map(obj => {
      if (obj.npcRef && obj.npcRef.npcId === npcId && obj.npcRef.hexKey === oldHexKey) {
        changed = true;
        return { ...obj, npcRef: { ...obj.npcRef, hexKey: newHexKey } };
      }
      return obj;
    });

    return changed ? { ...q, linkedNpcRefs, objectives } : q;
  });

  return { quests };
}

/**
 * Cleanup when deleting a story arc.
 * Clears storyArcId from member quests and removes the arc from storyArcs.
 */
export function deleteStoryArcCleanup(
  campaign: Campaign,
  arcId: string
): { quests: Quest[]; storyArcs: StoryArc[] } {
  const quests = (campaign.quests ?? []).map(q => {
    if (q.storyArcId === arcId) {
      const { storyArcId: _, ...rest } = q;
      return rest as Quest;
    }
    return q;
  });

  const storyArcs = (campaign.storyArcs ?? []).filter(a => a.id !== arcId);

  return { quests, storyArcs };
}
