import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SelectionProvider, useSelection } from '../stores/SelectionContext';

function renderSelectionHook() {
  return renderHook(() => useSelection(), {
    wrapper: ({ children }) => (
      <SelectionProvider>{children}</SelectionProvider>
    )
  });
}

describe('SelectionContext', () => {
  describe('initial state', () => {
    it('starts with no selection', () => {
      const { result } = renderSelectionHook();
      expect(result.current.selectedCoordinate).toBeNull();
      expect(result.current.selectedMarker).toBeNull();
    });

    it('starts with empty filters', () => {
      const { result } = renderSelectionHook();
      expect(result.current.searchQuery).toBe('');
      expect(result.current.filterTerrain).toBeNull();
      expect(result.current.filterStatus).toBeNull();
      expect(result.current.filterHasUnresolvedHooks).toBe(false);
      expect(result.current.filterContentTypes.size).toBe(0);
      expect(result.current.filterBookmarked).toBe(false);
    });

    it('starts with activeFilterCount of 0', () => {
      const { result } = renderSelectionHook();
      expect(result.current.activeFilterCount).toBe(0);
    });

    it('starts with empty recent hexes', () => {
      const { result } = renderSelectionHook();
      expect(result.current.recentHexes).toEqual([]);
    });

    it('starts with command palette closed', () => {
      const { result } = renderSelectionHook();
      expect(result.current.isCommandPaletteOpen).toBe(false);
    });
  });

  describe('hex selection', () => {
    it('selects a hex', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.selectHex({ q: 3, r: 4 }));
      expect(result.current.selectedCoordinate).toEqual({ q: 3, r: 4 });
    });

    it('clears selection with null', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.selectHex({ q: 3, r: 4 }));
      act(() => result.current.selectHex(null));
      expect(result.current.selectedCoordinate).toBeNull();
    });

    it('tracks recent hexes on selection', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.selectHex({ q: 1, r: 0 }));
      act(() => result.current.selectHex({ q: 2, r: 1 }));
      expect(result.current.recentHexes).toHaveLength(2);
      expect(result.current.recentHexes[0]).toEqual({ q: 2, r: 1 }); // Most recent first
      expect(result.current.recentHexes[1]).toEqual({ q: 1, r: 0 });
    });

    it('does not add duplicates to recent hexes', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.selectHex({ q: 1, r: 0 }));
      act(() => result.current.selectHex({ q: 2, r: 1 }));
      act(() => result.current.selectHex({ q: 1, r: 0 })); // re-select
      expect(result.current.recentHexes).toHaveLength(2);
      expect(result.current.recentHexes[0]).toEqual({ q: 1, r: 0 }); // Moved to front
    });

    it('limits recent hexes to 20', () => {
      const { result } = renderSelectionHook();
      for (let i = 0; i < 25; i++) {
        act(() => result.current.selectHex({ q: i, r: 0 }));
      }
      expect(result.current.recentHexes).toHaveLength(20);
    });

    it('does not track null selections', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.selectHex(null));
      expect(result.current.recentHexes).toEqual([]);
    });
  });

  describe('content type filters', () => {
    it('toggles content type filter on', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.toggleContentTypeFilter('locations'));
      expect(result.current.filterContentTypes.has('locations')).toBe(true);
    });

    it('toggles content type filter off', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.toggleContentTypeFilter('locations'));
      act(() => result.current.toggleContentTypeFilter('locations'));
      expect(result.current.filterContentTypes.has('locations')).toBe(false);
    });

    it('supports multiple content types', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.toggleContentTypeFilter('locations'));
      act(() => result.current.toggleContentTypeFilter('npcs'));
      expect(result.current.filterContentTypes.has('locations')).toBe(true);
      expect(result.current.filterContentTypes.has('npcs')).toBe(true);
      expect(result.current.filterContentTypes.size).toBe(2);
    });
  });

  describe('bookmark filter', () => {
    it('sets bookmark filter', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.setFilterBookmarked(true));
      expect(result.current.filterBookmarked).toBe(true);
    });

    it('clears bookmark filter', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.setFilterBookmarked(true));
      act(() => result.current.setFilterBookmarked(false));
      expect(result.current.filterBookmarked).toBe(false);
    });
  });

  describe('activeFilterCount', () => {
    it('counts terrain filter', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.setFilterTerrain('Forest'));
      expect(result.current.activeFilterCount).toBe(1);
    });

    it('counts status filter', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.setFilterStatus('discovered'));
      expect(result.current.activeFilterCount).toBe(1);
    });

    it('counts unresolved hooks filter', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.setFilterHasUnresolvedHooks(true));
      expect(result.current.activeFilterCount).toBe(1);
    });

    it('counts each content type filter individually', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.toggleContentTypeFilter('locations'));
      act(() => result.current.toggleContentTypeFilter('npcs'));
      expect(result.current.activeFilterCount).toBe(2);
    });

    it('counts bookmark filter', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.setFilterBookmarked(true));
      expect(result.current.activeFilterCount).toBe(1);
    });

    it('sums all active filters', () => {
      const { result } = renderSelectionHook();
      act(() => {
        result.current.setFilterTerrain('Forest');
        result.current.setFilterStatus('discovered');
        result.current.setFilterHasUnresolvedHooks(true);
        result.current.toggleContentTypeFilter('locations');
        result.current.toggleContentTypeFilter('encounters');
        result.current.setFilterBookmarked(true);
      });
      // 1 (terrain) + 1 (status) + 1 (unresolved) + 2 (content types) + 1 (bookmark) = 6
      expect(result.current.activeFilterCount).toBe(6);
    });
  });

  describe('clearFilters', () => {
    it('resets all filters to defaults', () => {
      const { result } = renderSelectionHook();
      act(() => {
        result.current.setSearchQuery('test');
        result.current.setFilterTerrain('Forest');
        result.current.setFilterStatus('discovered');
        result.current.setFilterHasUnresolvedHooks(true);
        result.current.toggleContentTypeFilter('locations');
        result.current.setFilterBookmarked(true);
      });
      act(() => result.current.clearFilters());
      expect(result.current.searchQuery).toBe('');
      expect(result.current.filterTerrain).toBeNull();
      expect(result.current.filterStatus).toBeNull();
      expect(result.current.filterHasUnresolvedHooks).toBe(false);
      expect(result.current.filterContentTypes.size).toBe(0);
      expect(result.current.filterBookmarked).toBe(false);
      expect(result.current.activeFilterCount).toBe(0);
    });
  });

  describe('command palette', () => {
    it('opens command palette', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.openCommandPalette());
      expect(result.current.isCommandPaletteOpen).toBe(true);
    });

    it('closes command palette', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.openCommandPalette());
      act(() => result.current.closeCommandPalette());
      expect(result.current.isCommandPaletteOpen).toBe(false);
    });
  });

  describe('moveSelection', () => {
    it('selects center hex when nothing selected', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.moveSelection(0, 0, 10, 10));
      expect(result.current.selectedCoordinate).toEqual({ q: 5, r: 5 });
    });

    it('moves selection by delta', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.selectHex({ q: 3, r: 3 }));
      act(() => result.current.moveSelection(1, 0, 10, 10));
      expect(result.current.selectedCoordinate).toEqual({ q: 4, r: 3 });
    });

    it('clamps to grid bounds', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.selectHex({ q: 0, r: 0 }));
      act(() => result.current.moveSelection(-1, -1, 10, 10));
      expect(result.current.selectedCoordinate).toEqual({ q: 0, r: 0 });
    });

    it('clamps to max grid bounds', () => {
      const { result } = renderSelectionHook();
      act(() => result.current.selectHex({ q: 9, r: 9 }));
      act(() => result.current.moveSelection(1, 1, 10, 10));
      expect(result.current.selectedCoordinate).toEqual({ q: 9, r: 9 });
    });
  });
});
