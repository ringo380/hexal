// FilterContext - Search and filter state for hex sidebar

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DiscoveryStatus, ContentCategory } from '../types';

interface FilterContextValue {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterTerrain: string | null;
  setFilterTerrain: (terrain: string | null) => void;
  filterStatus: DiscoveryStatus | null;
  setFilterStatus: (status: DiscoveryStatus | null) => void;
  filterHasUnresolvedHooks: boolean;
  setFilterHasUnresolvedHooks: (value: boolean) => void;
  filterContentTypes: Set<ContentCategory>;
  toggleContentTypeFilter: (category: ContentCategory) => void;
  filterBookmarked: boolean;
  setFilterBookmarked: (value: boolean) => void;
  filterRegion: string | null;
  setFilterRegion: (regionId: string | null) => void;
  activeFilterCount: number;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQueryState] = useState('');
  const [filterTerrain, setFilterTerrainState] = useState<string | null>(null);
  const [filterStatus, setFilterStatusState] = useState<DiscoveryStatus | null>(null);
  const [filterHasUnresolvedHooks, setFilterHasUnresolvedHooksState] = useState(false);
  const [filterContentTypes, setFilterContentTypes] = useState<Set<ContentCategory>>(new Set());
  const [filterBookmarked, setFilterBookmarkedState] = useState(false);
  const [filterRegion, setFilterRegionState] = useState<string | null>(null);

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

  const setFilterRegion = useCallback((regionId: string | null) => {
    setFilterRegionState(regionId);
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

  const clearFilters = useCallback(() => {
    setSearchQueryState('');
    setFilterTerrainState(null);
    setFilterStatusState(null);
    setFilterHasUnresolvedHooksState(false);
    setFilterContentTypes(new Set());
    setFilterBookmarkedState(false);
    setFilterRegionState(null);
  }, []);

  const activeFilterCount =
    (filterTerrain ? 1 : 0) +
    (filterStatus ? 1 : 0) +
    (filterHasUnresolvedHooks ? 1 : 0) +
    filterContentTypes.size +
    (filterBookmarked ? 1 : 0) +
    (filterRegion ? 1 : 0);

  const value: FilterContextValue = {
    searchQuery,
    setSearchQuery,
    filterTerrain,
    setFilterTerrain,
    filterStatus,
    setFilterStatus,
    filterHasUnresolvedHooks,
    setFilterHasUnresolvedHooks,
    filterContentTypes,
    toggleContentTypeFilter,
    filterBookmarked,
    setFilterBookmarked,
    filterRegion,
    setFilterRegion,
    activeFilterCount,
    clearFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
