// Sidebar - List of hexes with filtering, grouping, and quick-edit actions
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import { useHexSelection } from '../stores/HexSelectionContext';
import { useFilter } from '../stores/FilterContext';
import { useAnnounce } from '../stores/AnnouncerContext';
import type { Hex, ContentCategory, DiscoveryStatus } from '../types';
import { hexHasUnresolvedContent, hexKey } from '../types';
import { searchHex, getMatchHint } from '../services/search';
import { createHexRegionMap } from '../services/regions';
import Icon from './icons/Icon';
import type { IconName } from './icons/Icon';
import { onActivate } from '../utils/keyboard';

type GroupBy = 'none' | 'region' | 'status' | 'terrain';

const STATUS_ORDER: DiscoveryStatus[] = ['undiscovered', 'discovered', 'cleared'];

const CONTENT_ICONS: Record<string, IconName> = {
  locations: 'pin',
  encounters: 'sword',
  npcs: 'user',
  treasures: 'sparkle',
  clues: 'lightbulb'
};

function nextStatus(status: DiscoveryStatus): DiscoveryStatus {
  const idx = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

function Sidebar() {
  const announce = useAnnounce();
  const { campaign, bookmarkedHexes, regions, updateHex, toggleBookmark } = useCampaign();
  const { selectedCoordinate, selectHex } = useHexSelection();
  const {
    searchQuery,
    filterTerrain,
    filterStatus,
    filterHasUnresolvedHooks,
    filterContentTypes,
    filterBookmarked,
    filterRegion
  } = useFilter();

  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [collapsed, setCollapsed] = useState<Map<string, boolean>>(new Map());

  // Clear session-only state on campaign change
  useEffect(() => {
    setCollapsed(new Map());
  }, [campaign?.id]);

  // Build hex-to-region lookup
  const hexRegionMap = useMemo(() => createHexRegionMap(regions), [regions]);

  // Build search results map when search is active
  const searchMatchMap = useMemo(() => {
    if (!campaign || !searchQuery.trim()) return new Map<string, ReturnType<typeof searchHex>>();
    const map = new Map<string, ReturnType<typeof searchHex>>();
    for (const [key, hex] of Object.entries(campaign.hexes)) {
      const regionName = hexRegionMap.get(key)?.name;
      const matches = searchHex(hex, key, searchQuery, regionName);
      if (matches.length > 0) {
        map.set(key, matches);
      }
    }
    return map;
  }, [campaign, searchQuery, hexRegionMap]);

  const filteredHexes = useMemo(() => {
    if (!campaign) return [];

    return Object.values(campaign.hexes)
      .filter((hex) => {
        const key = hexKey(hex.coordinate);

        if (searchQuery.trim()) {
          if (!searchMatchMap.has(key)) return false;
        }
        if (filterTerrain && hex.terrain !== filterTerrain) return false;
        if (filterStatus && hex.status !== filterStatus) return false;
        if (filterHasUnresolvedHooks && !hexHasUnresolvedContent(hex)) return false;
        if (filterContentTypes.size > 0) {
          const hasMatchingContent = Array.from(filterContentTypes).some((cat: ContentCategory) => hex[cat].length > 0);
          if (!hasMatchingContent) return false;
        }
        if (filterBookmarked && !bookmarkedHexes.includes(key)) return false;
        if (filterRegion) {
          const hexRegion = hexRegionMap.get(key);
          if (!hexRegion || hexRegion.id !== filterRegion) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.coordinate.r !== b.coordinate.r) return a.coordinate.r - b.coordinate.r;
        return a.coordinate.q - b.coordinate.q;
      });
  }, [campaign, searchQuery, searchMatchMap, filterTerrain, filterStatus, filterHasUnresolvedHooks, filterContentTypes, filterBookmarked, bookmarkedHexes, filterRegion, hexRegionMap]);

  // Group hexes
  const groupedHexes = useMemo(() => {
    if (groupBy === 'none') return new Map([['all', filteredHexes]]);

    const groups = new Map<string, Hex[]>();
    for (const hex of filteredHexes) {
      let groupKey: string;
      switch (groupBy) {
        case 'region': {
          const region = hexRegionMap.get(hexKey(hex.coordinate));
          groupKey = region ? region.name || 'Unnamed Region' : 'Unassigned';
          break;
        }
        case 'status':
          groupKey = hex.status.charAt(0).toUpperCase() + hex.status.slice(1);
          break;
        case 'terrain':
          groupKey = hex.terrain;
          break;
      }
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(hex);
    }
    return groups;
  }, [filteredHexes, groupBy, hexRegionMap]);

  // Announce filtered hex count to screen readers (debounced, skip initial mount)
  const announceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    clearTimeout(announceTimerRef.current);
    announceTimerRef.current = setTimeout(() => {
      announce(`${filteredHexes.length} hex${filteredHexes.length === 1 ? '' : 'es'} shown`);
    }, 300);
    return () => clearTimeout(announceTimerRef.current);
  }, [filteredHexes.length, announce]);

  const getTerrainColor = (terrain: string): string => {
    const terrainType = campaign?.terrainTypes.find(t => t.name === terrain);
    return terrainType?.colorHex ?? '#666666';
  };

  const isSelected = (hex: Hex): boolean => {
    return selectedCoordinate?.q === hex.coordinate.q &&
           selectedCoordinate?.r === hex.coordinate.r;
  };

  const toggleGroup = useCallback((key: string) => {
    setCollapsed(prev => {
      const next = new Map(prev);
      next.set(key, !prev.get(key));
      return next;
    });
  }, []);

  const handleStatusCycle = useCallback((hex: Hex) => {
    updateHex({ ...hex, status: nextStatus(hex.status) });
  }, [updateHex]);

  const handleBookmarkToggle = useCallback((hex: Hex) => {
    toggleBookmark(hex.coordinate);
  }, [toggleBookmark]);

  const getGroupColor = (groupKey: string): string | undefined => {
    if (groupBy === 'region') {
      const region = regions.find(r => (r.name || 'Unnamed Region') === groupKey);
      return region?.color;
    }
    if (groupBy === 'terrain') {
      return getTerrainColor(groupKey);
    }
    return undefined;
  };

  const renderHexItem = (hex: Hex) => {
    const key = hexKey(hex.coordinate);
    const isBookmarked = bookmarkedHexes.includes(key);
    const matchHint = searchQuery.trim() ? getMatchHint(searchMatchMap.get(key) || []) : '';
    const hexRegion = hexRegionMap.get(key);
    const contentCounts = {
      locations: hex.locations.length,
      encounters: hex.encounters.length,
      npcs: hex.npcs.length,
      treasures: hex.treasures.length,
      clues: hex.clues.length
    };
    const hasContent = Object.values(contentCounts).some(c => c > 0);

    return (
      <li
        key={key}
        className={`hex-item ${isSelected(hex) ? 'selected' : ''}`}
      >
        <div
          className="hex-item-content"
          role="button"
          tabIndex={0}
          aria-label={`Hex ${hex.coordinate.q}, ${hex.coordinate.r} — ${hex.terrain}`}
          onClick={() => selectHex(hex.coordinate)}
          onKeyDown={onActivate(() => selectHex(hex.coordinate))}
        >
          <span
            className="terrain-indicator"
            style={{ backgroundColor: getTerrainColor(hex.terrain) }}
          />
          <div className="hex-info">
            <div className="hex-info-row">
              <span className="hex-coord">
                ({hex.coordinate.q}, {hex.coordinate.r})
              </span>
              <span className="hex-terrain">{hex.terrain}</span>
              {isBookmarked && (
                <span className="bookmark-indicator" title="Bookmarked">
                  <Icon name="star" size={12} />
                </span>
              )}
            </div>
            {groupBy !== 'region' && hexRegion && (
              <span className="hex-region-label">
                <span className="region-swatch" style={{ backgroundColor: hexRegion.color }} />
                {hexRegion.name || 'Unnamed'}
              </span>
            )}
            {hasContent && (
              <div className="hex-content-badges">
                {Object.entries(contentCounts).map(([cat, count]) =>
                  count > 0 ? (
                    <span key={cat} className="content-badge" title={`${count} ${cat}`}>
                      <Icon name={CONTENT_ICONS[cat]} size={10} />
                      <span>{count}</span>
                    </span>
                  ) : null
                )}
              </div>
            )}
            {hex.notes && (
              <span className="hex-notes-preview">{hex.notes.slice(0, 40)}{hex.notes.length > 40 ? '...' : ''}</span>
            )}
            {matchHint && (
              <span className="match-hint">{matchHint}</span>
            )}
          </div>
          <div className="hex-status">
            {hexHasUnresolvedContent(hex) && (
              <span className="unresolved-indicator" title="Has unresolved content">!</span>
            )}
            <span className={`status-badge status-${hex.status}`}>
              {hex.status.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="hex-quick-actions">
          <button
            className="btn-icon-small"
            title={`Change to ${nextStatus(hex.status)}`}
            aria-label={`Change status to ${nextStatus(hex.status)}`}
            onClick={() => handleStatusCycle(hex)}
          >
            <Icon name="circle" size={12} />
          </button>
          <button
            className="btn-icon-small"
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark hex'}
            onClick={() => handleBookmarkToggle(hex)}
          >
            <Icon name="star" size={12} />
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Hexes</h2>
        <span className="hex-count">{filteredHexes.length}</span>
        <div className="group-selector">
          {(['none', 'region', 'status', 'terrain'] as GroupBy[]).map(mode => (
            <button
              key={mode}
              className={`group-selector-btn ${groupBy === mode ? 'active' : ''}`}
              onClick={() => setGroupBy(mode)}
              title={`Group by ${mode === 'none' ? 'none' : mode}`}
              aria-label={`Group by ${mode === 'none' ? 'none' : mode}`}
            >
              {mode === 'none' ? 'All' : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ul className="hex-list">
        {filteredHexes.length === 0 ? (
          <li className="empty-state">
            <Icon name="search" size={24} />
            <p>No hexes match filters</p>
            <p className="empty-state-hint">Try adjusting your search or filters to see results.</p>
          </li>
        ) : groupBy === 'none' ? (
          filteredHexes.map(renderHexItem)
        ) : (
          Array.from(groupedHexes.entries()).map(([groupKey, hexes]) => {
            const isCollapsed = collapsed.get(groupKey) ?? false;
            const groupColor = getGroupColor(groupKey);
            return (
              <li key={groupKey} className="sidebar-group">
                <button
                  className="sidebar-group-header"
                  onClick={() => toggleGroup(groupKey)}
                  aria-expanded={!isCollapsed}
                >
                  <Icon name={isCollapsed ? 'chevron-right' : 'chevron-down'} size={12} />
                  {groupColor && (
                    <span className="group-swatch" style={{ backgroundColor: groupColor }} />
                  )}
                  <span className="group-name">{groupKey}</span>
                  <span className="group-count">{hexes.length}</span>
                </button>
                {!isCollapsed && (
                  <ul className="sidebar-group-items">
                    {hexes.map(renderHexItem)}
                  </ul>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export default Sidebar;
