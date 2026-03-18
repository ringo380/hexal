// PlayerView - Layout wrapper with Presentation/Explorer mode toggle

import { useState, useCallback } from 'react';
import type { PlayerCampaign } from '../../services/playerViewFilter';
import { createDefaultSimulationConfig } from '../../types/Weather';
import PlayerHexGrid from './PlayerHexGrid';
import PlayerHexInfo from './PlayerHexInfo';
import PlayerSidebar from './PlayerSidebar';
import PlayerQuestLog from './PlayerQuestLog';
import type { HexCoordinate } from '../../types';
import { WEATHER_CONDITION_LABELS, TEMPERATURE_LABELS } from '../../types/Weather';

type LayoutMode = 'presentation' | 'explorer';

interface PlayerViewProps {
  campaign: PlayerCampaign;
}

function PlayerView({ campaign }: PlayerViewProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('presentation');
  const [selectedHexKey, setSelectedHexKey] = useState<string | null>(null);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [infoCollapsed, setInfoCollapsed] = useState(false);

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
    ? `${WEATHER_CONDITION_LABELS[weather.condition]} | ${TEMPERATURE_LABELS[weather.temperature]}`
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

      {/* Quest log toggle */}
      {campaign.quests.length > 0 && (
        <button
          className="player-quest-log-toggle"
          onClick={() => setShowQuestLog(!showQuestLog)}
        >
          {showQuestLog ? 'Hide Quests' : 'Quest Log'}
        </button>
      )}

      {/* Campaign name overlay (presentation mode) */}
      {layoutMode === 'presentation' && (
        <div className="player-campaign-name">{campaign.name}</div>
      )}

      {/* Mobile collapse toggles */}
      {layoutMode === 'explorer' && (
        <button
          className="player-collapse-toggle player-collapse-toggle--sidebar"
          onClick={() => setSidebarCollapsed(prev => !prev)}
          aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {sidebarCollapsed ? 'Hexes' : 'Hide'}
        </button>
      )}
      {selectedHex && (
        <button
          className="player-collapse-toggle player-collapse-toggle--info"
          onClick={() => setInfoCollapsed(prev => !prev)}
          aria-label={infoCollapsed ? 'Show hex info' : 'Hide hex info'}
        >
          {infoCollapsed ? 'Info' : 'Hide'}
        </button>
      )}

      {/* Explorer mode sidebar */}
      {layoutMode === 'explorer' && (
        <div className={sidebarCollapsed ? 'player-sidebar-wrapper collapsed' : 'player-sidebar-wrapper'}>
          <PlayerSidebar
            campaign={campaign}
            selectedHexKey={selectedHexKey}
            onSelectHex={handleSidebarSelect}
          />
        </div>
      )}

      {/* Hex grid */}
      <div className="player-grid-area">
        <PlayerHexGrid
          campaign={campaign}
          selectedHexKey={selectedHexKey}
          onHexSelect={handleHexSelect}
          onHexDeselect={() => setSelectedHexKey(null)}
          weatherField={campaign.weatherField}
          weatherConfig={campaign.weatherSimConfig ? {
            ...createDefaultSimulationConfig(),
            ...campaign.weatherSimConfig
          } : undefined}
        />
      </div>

      {/* Info panel */}
      {selectedHex && (
        <div className={`player-info-panel player-info-panel--${layoutMode}${infoCollapsed ? ' collapsed' : ''}`}>
          <PlayerHexInfo
            hex={selectedHex}
            regionName={selectedHexRegion?.name}
            regionColor={selectedHexRegion?.color}
            terrainName={getTerrainName(selectedHex.terrain)}
            onClose={() => setSelectedHexKey(null)}
          />
        </div>
      )}

      {/* Quest log panel */}
      {showQuestLog && campaign.quests.length > 0 && (
        <div className="player-quest-log-panel">
          <PlayerQuestLog campaign={campaign} />
        </div>
      )}
    </div>
  );
}

export default PlayerView;
