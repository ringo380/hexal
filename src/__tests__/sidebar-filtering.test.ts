import { describe, it, expect } from 'vitest';
import type { Hex, ContentCategory } from '../types/Campaign';
import { hexKey, hexHasUnresolvedContent } from '../types/Campaign';
import { searchHex } from '../services/search';

/**
 * These tests validate the sidebar filtering logic by testing the same
 * filtering predicates used in Sidebar.tsx, without requiring React rendering.
 * This tests the core filtering behavior exhaustively.
 */

function makeHex(q: number, r: number, overrides: Partial<Hex> = {}): Hex {
  return {
    id: `hex-${q}-${r}`,
    coordinate: { q, r },
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

// Reproduces the Sidebar filtering logic as pure functions
function filterHexes(
  hexes: Hex[],
  options: {
    searchQuery?: string;
    filterTerrain?: string | null;
    filterStatus?: string | null;
    filterHasUnresolvedHooks?: boolean;
    filterContentTypes?: Set<ContentCategory>;
    filterBookmarked?: boolean;
    bookmarkedHexes?: string[];
  }
): Hex[] {
  const {
    searchQuery = '',
    filterTerrain = null,
    filterStatus = null,
    filterHasUnresolvedHooks = false,
    filterContentTypes = new Set<ContentCategory>(),
    filterBookmarked = false,
    bookmarkedHexes = []
  } = options;

  // Build search match map
  const searchMatchMap = new Map<string, ReturnType<typeof searchHex>>();
  if (searchQuery.trim()) {
    for (const hex of hexes) {
      const key = hexKey(hex.coordinate);
      const matches = searchHex(hex, key, searchQuery);
      if (matches.length > 0) {
        searchMatchMap.set(key, matches);
      }
    }
  }

  return hexes.filter((hex) => {
    const key = hexKey(hex.coordinate);

    // Search filter
    if (searchQuery.trim()) {
      if (!searchMatchMap.has(key)) return false;
    }

    // Terrain filter
    if (filterTerrain && hex.terrain !== filterTerrain) return false;

    // Status filter
    if (filterStatus && hex.status !== filterStatus) return false;

    // Unresolved hooks filter
    if (filterHasUnresolvedHooks && !hexHasUnresolvedContent(hex)) return false;

    // Content type filter
    if (filterContentTypes.size > 0) {
      const hasMatchingContent = Array.from(filterContentTypes).some(
        (cat: ContentCategory) => hex[cat].length > 0
      );
      if (!hasMatchingContent) return false;
    }

    // Bookmark filter
    if (filterBookmarked && !bookmarkedHexes.includes(key)) return false;

    return true;
  });
}

describe('Sidebar filtering logic', () => {
  const testHexes: Hex[] = [
    makeHex(0, 0, {
      terrain: 'Forest',
      status: 'undiscovered',
      notes: 'Dense forest with wolves',
      npcs: [{ id: 'npc1', title: 'Ranger', description: 'Forest patrol', isResolved: false }]
    }),
    makeHex(1, 0, {
      terrain: 'Mountains',
      status: 'discovered',
      locations: [{ id: 'loc1', title: 'Dragon Cave', description: 'Lair entrance', isResolved: false }]
    }),
    makeHex(2, 0, {
      terrain: 'Forest',
      status: 'cleared',
      treasures: [{ id: 't1', title: 'Gold Chest', description: 'Shiny gold', isResolved: true }]
    }),
    makeHex(3, 0, {
      terrain: 'Plains',
      status: 'undiscovered',
      clues: [{ id: 'c1', title: 'Ancient Map', description: 'Points to treasure', isResolved: false }]
    }),
    makeHex(4, 0, {
      terrain: 'Swamp',
      status: 'discovered',
      encounters: [{
        id: 'enc1',
        title: 'Goblin Ambush',
        description: 'Goblins attack',
        isResolved: false,
        encounterType: 'combat',
        creatures: [{ id: 'cr1', name: 'Goblin', count: 4 }],
        linkedNpcIds: [],
        rewards: [{ id: 'rw1', type: 'gold', description: '50 gold pieces' }],
        outcome: 'pending',
        outcomeNotes: ''
      } as any]
    })
  ];

  describe('no filters', () => {
    it('returns all hexes when no filters active', () => {
      const result = filterHexes(testHexes, {});
      expect(result).toHaveLength(5);
    });
  });

  describe('search filter', () => {
    it('filters by search query matching notes', () => {
      const result = filterHexes(testHexes, { searchQuery: 'wolves' });
      expect(result).toHaveLength(1);
      expect(result[0].coordinate).toEqual({ q: 0, r: 0 });
    });

    it('filters by search query matching content title', () => {
      const result = filterHexes(testHexes, { searchQuery: 'dragon' });
      expect(result).toHaveLength(1);
      expect(result[0].coordinate).toEqual({ q: 1, r: 0 });
    });

    it('filters by search query matching creature name', () => {
      const result = filterHexes(testHexes, { searchQuery: 'goblin' });
      expect(result).toHaveLength(1);
      expect(result[0].coordinate).toEqual({ q: 4, r: 0 });
    });

    it('returns empty for no matches', () => {
      const result = filterHexes(testHexes, { searchQuery: 'nonexistent' });
      expect(result).toHaveLength(0);
    });

    it('ignores empty/whitespace queries', () => {
      expect(filterHexes(testHexes, { searchQuery: '' })).toHaveLength(5);
      expect(filterHexes(testHexes, { searchQuery: '   ' })).toHaveLength(5);
    });
  });

  describe('terrain filter', () => {
    it('filters by terrain type', () => {
      const result = filterHexes(testHexes, { filterTerrain: 'Forest' });
      expect(result).toHaveLength(2);
      expect(result.every(h => h.terrain === 'Forest')).toBe(true);
    });

    it('returns empty for unmatched terrain', () => {
      const result = filterHexes(testHexes, { filterTerrain: 'Desert' });
      expect(result).toHaveLength(0);
    });
  });

  describe('status filter', () => {
    it('filters by discovery status', () => {
      const result = filterHexes(testHexes, { filterStatus: 'discovered' });
      expect(result).toHaveLength(2);
      expect(result.every(h => h.status === 'discovered')).toBe(true);
    });

    it('filters cleared hexes', () => {
      const result = filterHexes(testHexes, { filterStatus: 'cleared' });
      expect(result).toHaveLength(1);
      expect(result[0].coordinate).toEqual({ q: 2, r: 0 });
    });
  });

  describe('unresolved content filter', () => {
    it('shows only hexes with unresolved content', () => {
      const result = filterHexes(testHexes, { filterHasUnresolvedHooks: true });
      // hex(0,0) has unresolved NPC, hex(1,0) has unresolved location,
      // hex(3,0) has unresolved clue, hex(4,0) has unresolved encounter
      // hex(2,0) has resolved treasure only
      expect(result).toHaveLength(4);
      expect(result.every(h => hexHasUnresolvedContent(h))).toBe(true);
    });
  });

  describe('content type filter', () => {
    it('filters hexes with locations', () => {
      const result = filterHexes(testHexes, {
        filterContentTypes: new Set(['locations'] as ContentCategory[])
      });
      expect(result).toHaveLength(1);
      expect(result[0].coordinate).toEqual({ q: 1, r: 0 });
    });

    it('filters hexes with NPCs', () => {
      const result = filterHexes(testHexes, {
        filterContentTypes: new Set(['npcs'] as ContentCategory[])
      });
      expect(result).toHaveLength(1);
      expect(result[0].coordinate).toEqual({ q: 0, r: 0 });
    });

    it('filters hexes with encounters', () => {
      const result = filterHexes(testHexes, {
        filterContentTypes: new Set(['encounters'] as ContentCategory[])
      });
      expect(result).toHaveLength(1);
      expect(result[0].coordinate).toEqual({ q: 4, r: 0 });
    });

    it('filters with multiple content types (OR logic)', () => {
      const result = filterHexes(testHexes, {
        filterContentTypes: new Set(['locations', 'npcs'] as ContentCategory[])
      });
      expect(result).toHaveLength(2);
    });

    it('returns empty when no hexes have the content type', () => {
      // No hex has both locations and npcs in this test set
      // But let's test a content type that no hex has
      const emptyHexes = [makeHex(0, 0)]; // Empty hex
      const result = filterHexes(emptyHexes, {
        filterContentTypes: new Set(['locations'] as ContentCategory[])
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('bookmark filter', () => {
    it('filters to bookmarked hexes only', () => {
      const result = filterHexes(testHexes, {
        filterBookmarked: true,
        bookmarkedHexes: ['0,0', '3,0']
      });
      expect(result).toHaveLength(2);
      expect(result[0].coordinate).toEqual({ q: 0, r: 0 });
      expect(result[1].coordinate).toEqual({ q: 3, r: 0 });
    });

    it('returns empty when no hexes are bookmarked', () => {
      const result = filterHexes(testHexes, {
        filterBookmarked: true,
        bookmarkedHexes: []
      });
      expect(result).toHaveLength(0);
    });

    it('does not filter when bookmark filter is off', () => {
      const result = filterHexes(testHexes, {
        filterBookmarked: false,
        bookmarkedHexes: ['0,0']
      });
      expect(result).toHaveLength(5); // All hexes returned
    });
  });

  describe('combined filters', () => {
    it('applies terrain + status together', () => {
      const result = filterHexes(testHexes, {
        filterTerrain: 'Forest',
        filterStatus: 'undiscovered'
      });
      expect(result).toHaveLength(1);
      expect(result[0].coordinate).toEqual({ q: 0, r: 0 });
    });

    it('applies search + content type together', () => {
      const result = filterHexes(testHexes, {
        searchQuery: 'forest',
        filterContentTypes: new Set(['npcs'] as ContentCategory[])
      });
      // hex(0,0) matches 'forest' in notes AND has NPCs
      expect(result).toHaveLength(1);
      expect(result[0].coordinate).toEqual({ q: 0, r: 0 });
    });

    it('applies bookmark + terrain together', () => {
      const result = filterHexes(testHexes, {
        filterBookmarked: true,
        bookmarkedHexes: ['0,0', '1,0', '2,0'],
        filterTerrain: 'Forest'
      });
      // hex(0,0) is Forest+bookmarked, hex(2,0) is Forest+bookmarked
      expect(result).toHaveLength(2);
    });

    it('applies all filters simultaneously', () => {
      const result = filterHexes(testHexes, {
        searchQuery: 'forest',
        filterTerrain: 'Forest',
        filterStatus: 'undiscovered',
        filterHasUnresolvedHooks: true,
        filterContentTypes: new Set(['npcs'] as ContentCategory[]),
        filterBookmarked: true,
        bookmarkedHexes: ['0,0']
      });
      // Only hex(0,0) passes all filters
      expect(result).toHaveLength(1);
      expect(result[0].coordinate).toEqual({ q: 0, r: 0 });
    });

    it('returns empty when filters are contradictory', () => {
      const result = filterHexes(testHexes, {
        filterTerrain: 'Forest',
        filterStatus: 'discovered'
        // No Forest hex is 'discovered' — hex(0,0) is undiscovered, hex(2,0) is cleared
      });
      expect(result).toHaveLength(0);
    });
  });
});
