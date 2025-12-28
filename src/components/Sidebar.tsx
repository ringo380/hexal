// Sidebar - List of hexes with filtering
import { useMemo } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import { useSelection } from '../stores/SelectionContext';
import type { Hex } from '../types';
import { hexHasUnresolvedContent } from '../types';

function Sidebar() {
  const { campaign } = useCampaign();
  const {
    selectedCoordinate,
    selectHex,
    searchQuery,
    filterTerrain,
    filterStatus,
    filterHasUnresolvedHooks
  } = useSelection();

  const filteredHexes = useMemo(() => {
    if (!campaign) return [];

    return Object.values(campaign.hexes)
      .filter((hex) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesNotes = hex.notes.toLowerCase().includes(query);
          const matchesTerrain = hex.terrain.toLowerCase().includes(query);
          const matchesContent = [...hex.locations, ...hex.encounters, ...hex.npcs, ...hex.treasures, ...hex.clues]
            .some(item =>
              item.title.toLowerCase().includes(query) ||
              item.description.toLowerCase().includes(query)
            );

          if (!matchesNotes && !matchesTerrain && !matchesContent) {
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

        return true;
      })
      .sort((a, b) => {
        if (a.coordinate.r !== b.coordinate.r) {
          return a.coordinate.r - b.coordinate.r;
        }
        return a.coordinate.q - b.coordinate.q;
      });
  }, [campaign, searchQuery, filterTerrain, filterStatus, filterHasUnresolvedHooks]);

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
          filteredHexes.map((hex) => (
            <li
              key={`${hex.coordinate.q},${hex.coordinate.r}`}
              className={`hex-item ${isSelected(hex) ? 'selected' : ''}`}
              onClick={() => selectHex(hex.coordinate)}
            >
              <span
                className="terrain-indicator"
                style={{ backgroundColor: getTerrainColor(hex.terrain) }}
              />
              <div className="hex-info">
                <span className="hex-coord">
                  ({hex.coordinate.q}, {hex.coordinate.r})
                </span>
                <span className="hex-terrain">{hex.terrain}</span>
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
          ))
        )}
      </ul>
    </div>
  );
}

export default Sidebar;
