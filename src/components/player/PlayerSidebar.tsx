// PlayerSidebar - Discovered hex list for Explorer mode

import { useState, useMemo } from 'react';
import type { PlayerCampaign } from '../../services/playerViewFilter';

interface PlayerSidebarProps {
  campaign: PlayerCampaign;
  selectedHexKey: string | null;
  onSelectHex: (key: string) => void;
}

function PlayerSidebar({ campaign, selectedHexKey, onSelectHex }: PlayerSidebarProps) {
  const [search, setSearch] = useState('');

  // Build list of discovered/cleared hexes
  const discoveredHexes = useMemo(() => {
    return Object.entries(campaign.hexes)
      .filter(([, hex]) => hex.status === 'discovered' || hex.status === 'cleared')
      .map(([key, hex]) => {
        const region = campaign.regions.find(r => r.hexKeys.includes(key));
        return { key, hex, regionName: region?.name, regionColor: region?.color };
      })
      .sort((a, b) => {
        // Sort by q then r
        const aq = a.hex.coordinate.q, ar = a.hex.coordinate.r;
        const bq = b.hex.coordinate.q, br = b.hex.coordinate.r;
        return aq !== bq ? aq - bq : ar - br;
      });
  }, [campaign]);

  // Filter by search
  const filteredHexes = useMemo(() => {
    if (!search.trim()) return discoveredHexes;
    const term = search.toLowerCase();
    return discoveredHexes.filter(({ key, hex, regionName }) =>
      key.includes(term) ||
      hex.terrain.toLowerCase().includes(term) ||
      (regionName && regionName.toLowerCase().includes(term))
    );
  }, [discoveredHexes, search]);

  return (
    <div className="player-sidebar">
      <div className="player-sidebar-header">
        <h2>Discovered Hexes</h2>
        <span className="player-sidebar-count">{discoveredHexes.length}</span>
      </div>

      <div className="player-sidebar-search">
        <input
          type="text"
          placeholder="Search by coord, terrain, region..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="player-sidebar-list">
        {filteredHexes.map(({ key, hex, regionName, regionColor }) => (
          <button
            key={key}
            className={`player-sidebar-item ${selectedHexKey === key ? 'selected' : ''}`}
            onClick={() => onSelectHex(key)}
          >
            <span className="player-sidebar-coord">{key}</span>
            <span className="player-sidebar-terrain">{hex.terrain || 'Unknown'}</span>
            {regionName && (
              <span className="player-sidebar-region">
                <span className="player-region-swatch" style={{ backgroundColor: regionColor }} />
                {regionName}
              </span>
            )}
            <span className={`player-sidebar-status player-sidebar-status--${hex.status}`}>
              {hex.status === 'cleared' ? 'Cleared' : 'Discovered'}
            </span>
          </button>
        ))}
        {filteredHexes.length === 0 && (
          <div className="player-sidebar-empty">
            {search ? 'No matching hexes found.' : 'No hexes discovered yet.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerSidebar;
