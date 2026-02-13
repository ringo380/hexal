// Search service - enhanced search across all hex fields

import type { Campaign, Hex, ContentCategory, Encounter } from '../types/Campaign';

export type SearchMatchType =
  | 'notes'
  | 'terrain'
  | 'tag'
  | 'marker'
  | 'content-title'
  | 'content-description'
  | 'creature'
  | 'reward'
  | 'outcome';

export interface SearchMatch {
  hexKey: string;
  matchType: SearchMatchType;
  category?: ContentCategory;
  itemTitle?: string;
  matchText: string;
}

export interface SearchResult {
  hexKey: string;
  hex: Hex;
  matches: SearchMatch[];
}

/** Search all hexes in a campaign for the given query string */
export function searchCampaign(campaign: Campaign, query: string): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const [key, hex] of Object.entries(campaign.hexes)) {
    const matches = searchHex(hex, key, query);
    if (matches.length > 0) {
      results.push({ hexKey: key, hex, matches });
    }
  }

  return results;
}

/** Search a single hex for matches against the query */
export function searchHex(hex: Hex, hexKey: string, query: string): SearchMatch[] {
  const q = query.toLowerCase();
  const matches: SearchMatch[] = [];

  // Notes
  if (hex.notes.toLowerCase().includes(q)) {
    matches.push({ hexKey, matchType: 'notes', matchText: hex.notes });
  }

  // Terrain
  if (hex.terrain.toLowerCase().includes(q)) {
    matches.push({ hexKey, matchType: 'terrain', matchText: hex.terrain });
  }

  // Tags
  for (const tag of hex.tags) {
    if (tag.toLowerCase().includes(q)) {
      matches.push({ hexKey, matchType: 'tag', matchText: tag });
    }
  }

  // Markers
  if (hex.markers) {
    for (const marker of hex.markers) {
      if (marker.label && marker.label.toLowerCase().includes(q)) {
        matches.push({ hexKey, matchType: 'marker', matchText: marker.label });
      }
    }
  }

  // Content categories (non-encounter)
  const categories: ContentCategory[] = ['locations', 'npcs', 'treasures', 'clues'];
  for (const category of categories) {
    for (const item of hex[category]) {
      if (item.title.toLowerCase().includes(q)) {
        matches.push({ hexKey, matchType: 'content-title', category, itemTitle: item.title, matchText: item.title });
      } else if (item.description.toLowerCase().includes(q)) {
        matches.push({ hexKey, matchType: 'content-description', category, itemTitle: item.title, matchText: item.description });
      }
    }
  }

  // Encounters (extended fields)
  for (const enc of hex.encounters) {
    const encounter = enc as Encounter;

    // Title/description
    if (encounter.title.toLowerCase().includes(q)) {
      matches.push({ hexKey, matchType: 'content-title', category: 'encounters', itemTitle: encounter.title, matchText: encounter.title });
    } else if (encounter.description.toLowerCase().includes(q)) {
      matches.push({ hexKey, matchType: 'content-description', category: 'encounters', itemTitle: encounter.title, matchText: encounter.description });
    }

    // Creature names
    if (encounter.creatures) {
      for (const creature of encounter.creatures) {
        if (creature.name.toLowerCase().includes(q)) {
          matches.push({ hexKey, matchType: 'creature', category: 'encounters', itemTitle: encounter.title, matchText: creature.name });
        }
      }
    }

    // Reward descriptions
    if (encounter.rewards) {
      for (const reward of encounter.rewards) {
        if (reward.description.toLowerCase().includes(q)) {
          matches.push({ hexKey, matchType: 'reward', category: 'encounters', itemTitle: encounter.title, matchText: reward.description });
        }
      }
    }

    // Outcome notes
    if (encounter.outcomeNotes && encounter.outcomeNotes.toLowerCase().includes(q)) {
      matches.push({ hexKey, matchType: 'outcome', category: 'encounters', itemTitle: encounter.title, matchText: encounter.outcomeNotes });
    }
  }

  return matches;
}

/** Get a human-readable hint string for the first match */
export function getMatchHint(matches: SearchMatch[]): string {
  if (matches.length === 0) return '';
  const m = matches[0];
  switch (m.matchType) {
    case 'notes': return 'notes';
    case 'terrain': return `terrain: ${m.matchText}`;
    case 'tag': return `tag: ${m.matchText}`;
    case 'marker': return `marker: ${m.matchText}`;
    case 'creature': return `creature: ${m.matchText}`;
    case 'reward': return `reward: ${m.matchText}`;
    case 'outcome': return `outcome: ${m.matchText}`;
    case 'content-title': return `${m.category}: ${m.matchText}`;
    case 'content-description': return `${m.category}: ${m.itemTitle}`;
    default: return '';
  }
}
