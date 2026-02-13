// SelectionContext - UI selection state management
// Direct port from Swift SelectionState

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { HexCoordinate, DiscoveryStatus, ContentCategory } from '../types';
import { hexKey } from '../types';

interface SelectedMarker {
  markerId: string;
  hexCoord: HexCoordinate;
}

interface SelectionState {
  selectedCoordinate: HexCoordinate | null;
  selectedMarker: SelectedMarker | null;
  searchQuery: string;
  filterTerrain: string | null;
  filterStatus: DiscoveryStatus | null;
  filterHasUnresolvedHooks: boolean;
}

interface SelectionContextValue extends SelectionState {
  // Selection operations
  selectHex: (coord: HexCoordinate | null) => void;
  selectMarker: (markerId: string | null, hexCoord?: HexCoordinate) => void;
  clearSelection: () => void;
  // Filter operations
  setSearchQuery: (query: string) => void;
  setFilterTerrain: (terrain: string | null) => void;
  setFilterStatus: (status: DiscoveryStatus | null) => void;
  setFilterHasUnresolvedHooks: (value: boolean) => void;
  clearFilters: () => void;
  // Content type filters
  filterContentTypes: Set<ContentCategory>;
  toggleContentTypeFilter: (category: ContentCategory) => void;
  // Bookmark filter
  filterBookmarked: boolean;
  setFilterBookmarked: (value: boolean) => void;
  // Active filter count
  activeFilterCount: number;
  // Recent hexes (session-only)
  recentHexes: HexCoordinate[];
  // Command palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  // Navigation
  moveSelection: (dq: number, dr: number, gridWidth: number, gridHeight: number) => void;
  // Region paint mode
  regionPaintMode: string | null;
  setRegionPaintMode: (regionId: string | null) => void;
  // Region filter
  filterRegion: string | null;
  setFilterRegion: (regionId: string | null) => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedCoordinate, setSelectedCoordinate] = useState<HexCoordinate | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);
  const [searchQuery, setSearchQueryState] = useState('');
  const [filterTerrain, setFilterTerrainState] = useState<string | null>(null);
  const [filterStatus, setFilterStatusState] = useState<DiscoveryStatus | null>(null);
  const [filterHasUnresolvedHooks, setFilterHasUnresolvedHooksState] = useState(false);
  const [filterContentTypes, setFilterContentTypes] = useState<Set<ContentCategory>>(new Set());
  const [filterBookmarked, setFilterBookmarkedState] = useState(false);
  const [recentHexes, setRecentHexes] = useState<HexCoordinate[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [regionPaintMode, setRegionPaintModeState] = useState<string | null>(null);
  const [filterRegion, setFilterRegionState] = useState<string | null>(null);

  const selectHex = useCallback((coord: HexCoordinate | null) => {
    setSelectedCoordinate(coord);
    // Clear marker selection when selecting a different hex
    setSelectedMarker(null);
    // Track recent hexes
    if (coord) {
      setRecentHexes(prev => {
        const key = hexKey(coord);
        const filtered = prev.filter(c => hexKey(c) !== key);
        return [coord, ...filtered].slice(0, 20);
      });
    }
  }, []);

  const selectMarker = useCallback((markerId: string | null, hexCoord?: HexCoordinate) => {
    if (markerId && hexCoord) {
      setSelectedMarker({ markerId, hexCoord });
      // Also select the hex containing the marker
      setSelectedCoordinate(hexCoord);
    } else {
      setSelectedMarker(null);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCoordinate(null);
    setSelectedMarker(null);
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const setFilterTerrain = useCallback((terrain: string | null) => {
    setFilterTerrainState(terrain);
  }, []);

  const setFilterStatus = useCallback((status: DiscoveryStatus | null) => {
    setFilterStatusState(status);
  }, []);

  const setFilterHasUnresolvedHooks = useCallback((value: boolean) => {
    setFilterHasUnresolvedHooksState(value);
  }, []);

  const setRegionPaintMode = useCallback((regionId: string | null) => {
    setRegionPaintModeState(regionId);
  }, []);

  const setFilterRegion = useCallback((regionId: string | null) => {
    setFilterRegionState(regionId);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQueryState('');
    setFilterTerrainState(null);
    setFilterStatusState(null);
    setFilterHasUnresolvedHooksState(false);
    setFilterContentTypes(new Set());
    setFilterBookmarkedState(false);
    setFilterRegionState(null);
  }, []);

  const toggleContentTypeFilter = useCallback((category: ContentCategory) => {
    setFilterContentTypes(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const setFilterBookmarked = useCallback((value: boolean) => {
    setFilterBookmarkedState(value);
  }, []);

  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
  }, []);

  // Move selection with arrow keys (accounting for odd-q offset)
  const moveSelection = useCallback((
    dq: number,
    dr: number,
    gridWidth: number,
    gridHeight: number
  ) => {
    if (!selectedCoordinate) {
      // If nothing selected, select center hex
      const centerQ = Math.floor(gridWidth / 2);
      const centerR = Math.floor(gridHeight / 2);
      setSelectedCoordinate({ q: centerQ, r: centerR });
      return;
    }

    let newQ = selectedCoordinate.q + dq;
    let newR = selectedCoordinate.r + dr;

    // Clamp to grid bounds
    newQ = Math.max(0, Math.min(gridWidth - 1, newQ));
    newR = Math.max(0, Math.min(gridHeight - 1, newR));

    setSelectedCoordinate({ q: newQ, r: newR });
  }, [selectedCoordinate]);

  // Compute active filter count
  const activeFilterCount =
    (filterTerrain ? 1 : 0) +
    (filterStatus ? 1 : 0) +
    (filterHasUnresolvedHooks ? 1 : 0) +
    filterContentTypes.size +
    (filterBookmarked ? 1 : 0) +
    (filterRegion ? 1 : 0);

  const value: SelectionContextValue = {
    selectedCoordinate,
    selectedMarker,
    searchQuery,
    filterTerrain,
    filterStatus,
    filterHasUnresolvedHooks,
    selectHex,
    selectMarker,
    clearSelection,
    setSearchQuery,
    setFilterTerrain,
    setFilterStatus,
    setFilterHasUnresolvedHooks,
    clearFilters,
    filterContentTypes,
    toggleContentTypeFilter,
    filterBookmarked,
    setFilterBookmarked,
    activeFilterCount,
    recentHexes,
    isCommandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    moveSelection,
    regionPaintMode,
    setRegionPaintMode,
    filterRegion,
    setFilterRegion
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection(): SelectionContextValue {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}
