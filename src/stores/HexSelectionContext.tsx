// HexSelectionContext - Hex selection, multi-selection, markers, region paint, recent hexes

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { HexCoordinate } from '../types';
import { hexKey } from '../types';

interface SelectedMarker {
  markerId: string;
  hexCoord: HexCoordinate;
}

interface HexSelectionContextValue {
  selectedCoordinate: HexCoordinate | null;
  selectedMarker: SelectedMarker | null;
  selectHex: (coord: HexCoordinate | null) => void;
  selectMarker: (markerId: string | null, hexCoord?: HexCoordinate) => void;
  clearSelection: () => void;
  moveSelection: (dq: number, dr: number, gridWidth: number, gridHeight: number) => void;
  recentHexes: HexCoordinate[];
  multiSelectedKeys: Set<string>;
  toggleMultiSelectHex: (coord: HexCoordinate) => void;
  setMultiSelection: (keys: Set<string>) => void;
  clearMultiSelection: () => void;
  regionPaintMode: string | null;
  setRegionPaintMode: (regionId: string | null) => void;
}

const HexSelectionContext = createContext<HexSelectionContextValue | null>(null);

export function HexSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedCoordinate, setSelectedCoordinate] = useState<HexCoordinate | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);
  const [recentHexes, setRecentHexes] = useState<HexCoordinate[]>([]);
  const [multiSelectedKeys, setMultiSelectedKeys] = useState<Set<string>>(new Set());
  const [regionPaintMode, setRegionPaintModeState] = useState<string | null>(null);

  const selectHex = useCallback((coord: HexCoordinate | null) => {
    setSelectedCoordinate(coord);
    setSelectedMarker(null);
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
      setSelectedCoordinate(hexCoord);
    } else {
      setSelectedMarker(null);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCoordinate(null);
    setSelectedMarker(null);
  }, []);

  const moveSelection = useCallback((
    dq: number,
    dr: number,
    gridWidth: number,
    gridHeight: number
  ) => {
    if (!selectedCoordinate) {
      const centerQ = Math.floor(gridWidth / 2);
      const centerR = Math.floor(gridHeight / 2);
      setSelectedCoordinate({ q: centerQ, r: centerR });
      return;
    }
    let newQ = selectedCoordinate.q + dq;
    let newR = selectedCoordinate.r + dr;
    newQ = Math.max(0, Math.min(gridWidth - 1, newQ));
    newR = Math.max(0, Math.min(gridHeight - 1, newR));
    setSelectedCoordinate({ q: newQ, r: newR });
  }, [selectedCoordinate]);

  const toggleMultiSelectHex = useCallback((coord: HexCoordinate) => {
    const key = hexKey(coord);
    setMultiSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const setMultiSelection = useCallback((keys: Set<string>) => {
    setMultiSelectedKeys(keys);
  }, []);

  const clearMultiSelection = useCallback(() => {
    setMultiSelectedKeys(new Set());
  }, []);

  const setRegionPaintMode = useCallback((regionId: string | null) => {
    setRegionPaintModeState(regionId);
  }, []);

  const value: HexSelectionContextValue = {
    selectedCoordinate,
    selectedMarker,
    selectHex,
    selectMarker,
    clearSelection,
    moveSelection,
    recentHexes,
    multiSelectedKeys,
    toggleMultiSelectHex,
    setMultiSelection,
    clearMultiSelection,
    regionPaintMode,
    setRegionPaintMode,
  };

  return (
    <HexSelectionContext.Provider value={value}>
      {children}
    </HexSelectionContext.Provider>
  );
}

export function useHexSelection(): HexSelectionContextValue {
  const context = useContext(HexSelectionContext);
  if (!context) {
    throw new Error('useHexSelection must be used within a HexSelectionProvider');
  }
  return context;
}
