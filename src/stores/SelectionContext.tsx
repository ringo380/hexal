// SelectionContext - UI selection state management
// Direct port from Swift SelectionState

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { HexCoordinate, DiscoveryStatus } from '../types';

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
  // Navigation
  moveSelection: (dq: number, dr: number, gridWidth: number, gridHeight: number) => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedCoordinate, setSelectedCoordinate] = useState<HexCoordinate | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);
  const [searchQuery, setSearchQueryState] = useState('');
  const [filterTerrain, setFilterTerrainState] = useState<string | null>(null);
  const [filterStatus, setFilterStatusState] = useState<DiscoveryStatus | null>(null);
  const [filterHasUnresolvedHooks, setFilterHasUnresolvedHooksState] = useState(false);

  const selectHex = useCallback((coord: HexCoordinate | null) => {
    setSelectedCoordinate(coord);
    // Clear marker selection when selecting a different hex
    setSelectedMarker(null);
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

  const clearFilters = useCallback(() => {
    setSearchQueryState('');
    setFilterTerrainState(null);
    setFilterStatusState(null);
    setFilterHasUnresolvedHooksState(false);
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
    moveSelection
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
