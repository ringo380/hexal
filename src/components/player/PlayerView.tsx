// PlayerView - Layout wrapper with Presentation/Explorer mode toggle

import { useState, useCallback } from 'react';
import type { PlayerCampaign } from '../../services/playerViewFilter';
import PlayerHexGrid from './PlayerHexGrid';
import PlayerHexInfo from './PlayerHexInfo';
import PlayerSidebar from './PlayerSidebar';
import type { HexCoordinate } from '../../types';

type LayoutMode = 'presentation' | 'explorer';

interface PlayerViewProps {
  campaign: PlayerCampaign;
}

function PlayerView({ campaign }: PlayerViewProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('presentation');
  const [selectedHexKey, setSelectedHexKey] = useState<string | null>(null);

  const selectedHex = selectedHexKey ? campaign.hexes[selectedHexKey] ?? null : null;

  const handleHexSelect = useCallback((coord: HexCoordinate) => {
    const key = `${coord.q},${coord.r}`;
    setSelectedHexKey(prev => prev === key ? null : key);
  }, []);

  const handleSidebarSelect = useCallback((key: string) => {
    setSelectedHexKey(key);
  }, []);

  const toggleLayout = useCallback(() => {
    setLayoutMode(prev => prev === 'presentation' ? 'explorer' : 'presentation');
  }, []);

  // Find the region for the selected hex
  const selectedHexRegion = selectedHexKey
    ? campaign.regions.find(r => r.hexKeys.includes(selectedHexKey))
    : undefined;

  // Get terrain name from terrainTypes
  const getTerrainName = (terrain: string) => {
    const t = campaign.terrainTypes.find(tt => tt.name === terrain);
    return t?.name ?? terrain;
  };

  // Weather display
  const weather = campaign.timeWeather?.globalWeather;
  const weatherText = weather
    ? `${weather.condition} | ${weather.temperature}°`
    : null;

  return (
    <div className={`player-view player-view--${layoutMode}`}>
      {/* Weather bar */}
      {weatherText && (
        <div className="player-weather-bar">
          {weatherText}
        </div>
      )}

      {/* Layout toggle */}
      <button
        className="player-layout-toggle"
        onClick={toggleLayout}
        title={layoutMode === 'presentation' ? 'Switch to Explorer mode' : 'Switch to Presentation mode'}
      >
        {layoutMode === 'presentation' ? 'Explorer' : 'Presentation'}
      </button>

      {/* Campaign name overlay (presentation mode) */}
      {layoutMode === 'presentation' && (
        <div className="player-campaign-name">{campaign.name}</div>
      )}

      {/* Explorer mode sidebar */}
      {layoutMode === 'explorer' && (
        <PlayerSidebar
          campaign={campaign}
          selectedHexKey={selectedHexKey}
          onSelectHex={handleSidebarSelect}
        />
      )}

      {/* Hex grid */}
      <div className="player-grid-area">
        <PlayerHexGrid
          campaign={campaign}
          selectedHexKey={selectedHexKey}
          onHexSelect={handleHexSelect}
        />
      </div>

      {/* Info panel */}
      {selectedHex && (
        <div className={`player-info-panel player-info-panel--${layoutMode}`}>
          <PlayerHexInfo
            hex={selectedHex}
            regionName={selectedHexRegion?.name}
            regionColor={selectedHexRegion?.color}
            terrainName={getTerrainName(selectedHex.terrain)}
            onClose={() => setSelectedHexKey(null)}
          />
        </div>
      )}
    </div>
  );
}

export default PlayerView;
