// Direct port from Swift ExportService

import type { Campaign, Hex, ContentItem } from '../types';
import type { Encounter } from '../types/Campaign';
import { ENCOUNTER_TYPE_INFO, OUTCOME_INFO } from '../types/Campaign';

/**
 * Export campaign as formatted JSON string
 */
export function exportJSON(campaign: Campaign): string {
  return JSON.stringify(campaign, null, 2);
}

/**
 * Export campaign as Markdown for DM reference
 */
export function exportMarkdown(campaign: Campaign, includeUndiscovered: boolean = false): string {
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  let md = `# ${campaign.name}

**Grid Size:** ${campaign.gridWidth} x ${campaign.gridHeight}
**Created:** ${formatDate(campaign.createdAt)}
**Last Modified:** ${formatDate(campaign.modifiedAt)}

---

## Hexes

`;

  // Sort hexes by coordinate
  const sortedHexes = Object.values(campaign.hexes)
    .filter(hex => includeUndiscovered || hex.status !== 'undiscovered')
    .sort((a, b) => {
      if (a.coordinate.r !== b.coordinate.r) {
        return a.coordinate.r - b.coordinate.r;
      }
      return a.coordinate.q - b.coordinate.q;
    });

  for (const hex of sortedHexes) {
    md += renderHex(hex);
  }

  return md;
}

function renderHex(hex: Hex): string {
  let md = `### Hex (${hex.coordinate.q}, ${hex.coordinate.r}) - ${hex.terrain}

**Status:** ${hex.status.charAt(0).toUpperCase() + hex.status.slice(1)}

`;

  if (hex.tags.length > 0) {
    md += `**Tags:** ${hex.tags.join(', ')}\n\n`;
  }

  if (hex.notes) {
    md += `**Notes:** ${hex.notes}\n\n`;
  }

  md += renderContentSection('Locations', hex.locations, '📍');
  md += renderEncounterSection(hex.encounters);
  md += renderContentSection('NPCs', hex.npcs, '👤');
  md += renderContentSection('Treasures', hex.treasures, '✨');
  md += renderContentSection('Clues & Hooks', hex.clues, '💡');

  md += '---\n\n';

  return md;
}

function renderEncounterSection(encounters: Encounter[]): string {
  if (encounters.length === 0) return '';

  let md = `#### ⚔️ Encounters\n\n`;

  for (const enc of encounters) {
    const status = enc.isResolved ? '~~' : '';
    const typeLabel = ENCOUNTER_TYPE_INFO[enc.encounterType]?.label || enc.encounterType;
    md += `- ${status}**${enc.title}**${status} [${typeLabel}]`;
    if (enc.difficulty) {
      md += ` (${enc.difficulty})`;
    }
    if (enc.outcome !== 'pending') {
      md += ` — ${OUTCOME_INFO[enc.outcome]?.label || enc.outcome}`;
    }
    md += '\n';
    if (enc.description) {
      md += `  ${enc.description}\n`;
    }
    if (enc.creatures.length > 0) {
      md += `  Creatures: ${enc.creatures.map(c => `${c.count}x ${c.name}${c.cr ? ` (${c.cr})` : ''}`).join(', ')}\n`;
    }
    if (enc.rewards.length > 0) {
      md += `  Rewards: ${enc.rewards.map(r => `${r.description}${r.quantity ? ` x${r.quantity}` : ''}`).join(', ')}\n`;
    }
    if (enc.outcomeNotes) {
      md += `  Notes: ${enc.outcomeNotes}\n`;
    }
  }

  md += '\n';
  return md;
}

function renderContentSection(title: string, items: ContentItem[], icon: string): string {
  if (items.length === 0) return '';

  let md = `#### ${icon} ${title}\n\n`;

  for (const item of items) {
    const status = item.isResolved ? '~~' : '';
    md += `- ${status}**${item.title}**${status}`;
    if (item.difficulty) {
      md += ` (${item.difficulty})`;
    }
    md += '\n';
    if (item.description) {
      md += `  ${item.description}\n`;
    }
  }

  md += '\n';
  return md;
}
