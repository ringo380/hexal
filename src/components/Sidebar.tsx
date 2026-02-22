// Sidebar - List of hexes with filtering
import { useMemo, useEffect, useRef } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import { useSelection } from '../stores/SelectionContext';
import { useAnnounce } from '../stores/AnnouncerContext';
import type { Hex, ContentCategory } from '../types';
import { hexHasUnresolvedContent, hexKey } from '../types';
import { searchHex, getMatchHint } from '../services/search';
import { createHexRegionMap } from '../services/regions';
import Icon from './icons/Icon';
import { onActivate } from '../utils/keyboard';

function Sidebar() {
  const announce = useAnnounce();
  const { campaign, bookmarkedHexes, regions } = useCampaign();
  const {
    selectedCoordinate,
    selectHex,
    searchQuery,
    filterTerrain,
    filterStatus,
    filterHasUnresolvedHooks,
    filterContentTypes,
    filterBookmarked,
    filterRegion
  } = useSelection();

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

        // Search filter (use enhanced search)
        if (searchQuery.trim()) {
          if (!searchMatchMap.has(key)) {
            return false;
          }
        }

        // Terrain filter
        if (filterTerrain && hex.terrain !== filterTerrain) {
          return false;
        }

        // Status filter
        if (filterStatus && hex.status !== filterStatus) {
          return false;
        }

        // Unresolved content filter
        if (filterHasUnresolvedHooks && !hexHasUnresolvedContent(hex)) {
          return false;
        }

        // Content type filter (show hexes that have items in any selected category)
        if (filterContentTypes.size > 0) {
          const hasMatchingContent = Array.from(filterContentTypes).some((cat: ContentCategory) => hex[cat].length > 0);
          if (!hasMatchingContent) return false;
        }

        // Bookmark filter
        if (filterBookmarked && !bookmarkedHexes.includes(key)) {
          return false;
        }

        // Region filter
        if (filterRegion) {
          const hexRegion = hexRegionMap.get(key);
          if (!hexRegion || hexRegion.id !== filterRegion) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.coordinate.r !== b.coordinate.r) {
          return a.coordinate.r - b.coordinate.r;
        }
        return a.coordinate.q - b.coordinate.q;
      });
  }, [campaign, searchQuery, searchMatchMap, filterTerrain, filterStatus, filterHasUnresolvedHooks, filterContentTypes, filterBookmarked, bookmarkedHexes, filterRegion, hexRegionMap]);

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

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Hexes</h2>
        <span className="hex-count">{filteredHexes.length}</span>
      </div>
      <ul className="hex-list">
        {filteredHexes.length === 0 ? (
          <li className="empty-state">No hexes match filters</li>
        ) : (
          filteredHexes.map((hex) => {
            const key = hexKey(hex.coordinate);
            const isBookmarked = bookmarkedHexes.includes(key);
            const matchHint = searchQuery.trim() ? getMatchHint(searchMatchMap.get(key) || []) : '';
            const hexRegion = hexRegionMap.get(key);

            return (
              <li
                key={key}
                className={`hex-item ${isSelected(hex) ? 'selected' : ''}`}
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
                  {hexRegion && (
                    <span className="hex-region-label">
                      <span className="region-swatch" style={{ backgroundColor: hexRegion.color }} />
                      {hexRegion.name || 'Unnamed'}
                    </span>
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
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export default Sidebar;
