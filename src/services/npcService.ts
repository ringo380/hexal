// NPC Service - Cross-cutting NPC operations (move, delete cleanup, lookup)

import type { Campaign, Hex, Npc } from '../types/Campaign';

/**
 * Move an NPC from one hex to another.
 * Returns partial campaign updates: updated hexes with the NPC moved,
 * plus all NpcRelationship.targetHexKey and LinkedNpcRef.hexKey references updated.
 */
export function moveNpc(
  campaign: Campaign,
  npcId: string,
  fromHexKey: string,
  toHexKey: string
): { hexes: Record<string, Hex> } {
  const hexes = { ...campaign.hexes };
  const fromHex = hexes[fromHexKey];
  if (!fromHex) return { hexes };

  const npc = fromHex.npcs.find(n => n.id === npcId);
  if (!npc) return { hexes };

  // Reject move if target hex doesn't exist (prevents NPC data loss)
  const toHex = hexes[toHexKey];
  if (!toHex) return { hexes };

  // Remove NPC from source hex
  hexes[fromHexKey] = {
    ...fromHex,
    npcs: fromHex.npcs.filter(n => n.id !== npcId)
  };

  // Add NPC to target hex
  hexes[toHexKey] = {
    ...toHex,
    npcs: [...toHex.npcs, npc]
  };

  // Update relationship targetHexKey references across all NPCs
  // and encounter LinkedNpcRef.hexKey references
  for (const [key, hex] of Object.entries(hexes)) {
    let hexChanged = false;

    // Update NPC relationships pointing to the moved NPC
    const updatedNpcs = hex.npcs.map(n => {
      let relsChanged = false;
      const updatedRels = n.relationships.map(r => {
        if (r.targetNpcId === npcId && r.targetHexKey === fromHexKey) {
          hexChanged = true;
          relsChanged = true;
          return { ...r, targetHexKey: toHexKey };
        }
        return r;
      });
      return relsChanged ? { ...n, relationships: updatedRels } : n;
    });

    // Update encounter LinkedNpcRef references
    const updatedEncounters = hex.encounters.map(e => {
      let refsChanged = false;
      const updatedRefs = e.linkedNpcIds.map(ref => {
        if (ref.npcId === npcId && ref.hexKey === fromHexKey) {
          hexChanged = true;
          refsChanged = true;
          return { ...ref, hexKey: toHexKey };
        }
        return ref;
      });
      return refsChanged ? { ...e, linkedNpcIds: updatedRefs } : e;
    });

    if (hexChanged) {
      hexes[key] = { ...hex, npcs: updatedNpcs, encounters: updatedEncounters };
    }
  }

  return { hexes };
}

/**
 * Clean up all references to a deleted NPC across the campaign.
 * Removes stale NpcRelationship entries and LinkedNpcRef entries.
 */
export function deleteNpcCleanup(
  campaign: Campaign,
  npcId: string,
  _hexKey: string
): { hexes: Record<string, Hex> } {
  const hexes = { ...campaign.hexes };

  for (const [key, hex] of Object.entries(hexes)) {
    let hexChanged = false;

    // Remove relationships pointing to the deleted NPC
    const updatedNpcs = hex.npcs.map(n => {
      const filtered = n.relationships.filter(r => r.targetNpcId !== npcId);
      if (filtered.length !== n.relationships.length) {
        hexChanged = true;
        return { ...n, relationships: filtered };
      }
      return n;
    });

    // Remove LinkedNpcRef entries in encounters
    const updatedEncounters = hex.encounters.map(e => {
      const filtered = e.linkedNpcIds.filter(ref => ref.npcId !== npcId);
      if (filtered.length !== e.linkedNpcIds.length) {
        hexChanged = true;
        return { ...e, linkedNpcIds: filtered };
      }
      return e;
    });

    if (hexChanged) {
      hexes[key] = { ...hex, npcs: updatedNpcs, encounters: updatedEncounters };
    }
  }

  return { hexes };
}

/**
 * Find an NPC by ID across all hexes.
 */
export function getNpcById(
  campaign: Campaign,
  npcId: string
): { npc: Npc; hexKey: string } | null {
  for (const [key, hex] of Object.entries(campaign.hexes)) {
    const npc = hex.npcs.find(n => n.id === npcId);
    if (npc) return { npc, hexKey: key };
  }
  return null;
}
