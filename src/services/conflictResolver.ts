// conflictResolver — Computes diffs between local and remote campaign states
// and assembles merged campaigns from user resolution choices.

import type { Campaign, Hex } from '../types';
import type { CampaignConflict, FieldDiff, HexConflict } from '../types/Sync';

// Campaign metadata fields to compare (excludes hexes, id, version, timestamps).
const METADATA_FIELDS: Array<{ field: keyof Campaign; label: string }> = [
  { field: 'name', label: 'Name' },
  { field: 'gridWidth', label: 'Grid Width' },
  { field: 'gridHeight', label: 'Grid Height' },
  { field: 'terrainTypes', label: 'Terrain Types' },
  { field: 'encounterTables', label: 'Encounter Tables' },
  { field: 'timeWeather', label: 'Time & Weather' },
  { field: 'markerTypes', label: 'Marker Types' },
  { field: 'encounterTemplates', label: 'Encounter Templates' },
  { field: 'bookmarkedHexes', label: 'Bookmarked Hexes' },
  { field: 'regions', label: 'Regions' },
  { field: 'generationConfig', label: 'Generation Config' },
  { field: 'landmarkTables', label: 'Landmark Tables' },
  { field: 'factions', label: 'Factions' },
  { field: 'sessions', label: 'Sessions' },
  { field: 'sessionLog', label: 'Session Log' },
  { field: 'quests', label: 'Quests' },
  { field: 'storyArcs', label: 'Story Arcs' },
  { field: 'weatherSimulation', label: 'Weather Simulation' },
  { field: 'fogOfWarConfig', label: 'Fog of War Config' },
  { field: 'playerCharacters', label: 'Player Characters' },
  { field: 'parties', label: 'Parties' },
  { field: 'playerNotes', label: 'Player Notes' },
  { field: 'partyPosition', label: 'Party Position' },
  { field: 'travelLog', label: 'Travel Log' },
];

function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Compute the full conflict description between local and remote campaigns.
 * Categorizes changes into metadata diffs, hex conflicts, and auto-mergeable hex changes.
 */
export function computeCampaignConflict(
  local: Campaign,
  remote: Campaign
): CampaignConflict {
  // Compare metadata fields
  const metadataDiffs: FieldDiff[] = [];
  for (const { field, label } of METADATA_FIELDS) {
    const localVal = local[field];
    const remoteVal = remote[field];
    if (!jsonEqual(localVal, remoteVal)) {
      metadataDiffs.push({
        field,
        label,
        localValue: localVal,
        remoteValue: remoteVal,
      });
    }
  }

  // Compare hexes
  const hexConflicts: HexConflict[] = [];
  const autoMergedHexKeys: string[] = [];

  const localKeys = new Set(Object.keys(local.hexes));
  const remoteKeys = new Set(Object.keys(remote.hexes));

  // Hexes only in local — auto-merge (local addition)
  localKeys.forEach(key => {
    if (!remoteKeys.has(key)) {
      autoMergedHexKeys.push(key);
    }
  });

  // Hexes only in remote — auto-merge (remote addition)
  remoteKeys.forEach(key => {
    if (!localKeys.has(key)) {
      autoMergedHexKeys.push(key);
    }
  });

  // Hexes in both — compare content
  localKeys.forEach(key => {
    if (remoteKeys.has(key)) {
      const localHex = local.hexes[key];
      const remoteHex = remote.hexes[key];
      if (!jsonEqual(localHex, remoteHex)) {
        hexConflicts.push({ hexKey: key, localHex, remoteHex });
      }
    }
  });

  return {
    campaignId: local.id,
    localVersion: local.version ?? 0,
    remoteVersion: remote.version ?? 0,
    localCampaign: local,
    remoteCampaign: remote,
    metadataDiffs,
    hexConflicts,
    autoMergedHexKeys,
  };
}

/**
 * Build a merged campaign from conflict resolution choices.
 *
 * @param conflict - The computed conflict
 * @param metadataChoices - For each differing metadata field, 'local' or 'remote'
 * @param hexChoices - For each conflicting hex key, 'local' or 'remote'
 */
export function buildMergedCampaign(
  conflict: CampaignConflict,
  metadataChoices: Record<string, 'local' | 'remote'>,
  hexChoices: Record<string, 'local' | 'remote'>
): Campaign {
  const { localCampaign, remoteCampaign } = conflict;

  // Start from local as base
  const merged: Campaign = { ...localCampaign };

  // Apply metadata choices
  for (const diff of conflict.metadataDiffs) {
    const choice = metadataChoices[diff.field] ?? 'local';
    if (choice === 'remote') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (merged as any)[diff.field] = diff.remoteValue;
    }
  }

  // Build merged hex record
  const mergedHexes: Record<string, Hex> = {};

  // Include all hexes from local
  for (const [key, hex] of Object.entries(localCampaign.hexes)) {
    mergedHexes[key] = hex;
  }

  // Include hexes only in remote (auto-merged additions)
  for (const key of conflict.autoMergedHexKeys) {
    if (remoteCampaign.hexes[key] && !localCampaign.hexes[key]) {
      mergedHexes[key] = remoteCampaign.hexes[key];
    }
  }

  // Apply hex conflict choices
  for (const hc of conflict.hexConflicts) {
    const choice = hexChoices[hc.hexKey] ?? 'local';
    mergedHexes[hc.hexKey] = choice === 'remote' ? hc.remoteHex : hc.localHex;
  }

  merged.hexes = mergedHexes;

  // Use the remote version so the next save passes the version check
  merged.version = conflict.remoteVersion;

  return merged;
}
