// PlayerHexInfo - Read-only info panel for a selected hex in the player view

import type { PlayerHex } from '../../services/playerViewFilter';

interface PlayerHexInfoProps {
  hex: PlayerHex;
  regionName?: string;
  regionColor?: string;
  terrainName: string;
  onClose: () => void;
}

function PlayerHexInfo({ hex, regionName, regionColor, terrainName, onClose }: PlayerHexInfoProps) {
  const statusLabel = hex.status === 'cleared' ? 'Cleared'
    : hex.status === 'discovered' ? 'Discovered'
    : 'Undiscovered';

  const statusClass = `player-hex-status player-hex-status--${hex.status}`;

  return (
    <div className="player-hex-info">
      <div className="player-hex-info-header">
        <h3>Hex {hex.coordinate.q},{hex.coordinate.r}</h3>
        <button className="player-hex-info-close" onClick={onClose}>&times;</button>
      </div>

      <div className="player-hex-info-body">
        {/* Status */}
        <div className="player-hex-info-row">
          <span className="player-hex-info-label">Status</span>
          <span className={statusClass}>{statusLabel}</span>
        </div>

        {/* Terrain */}
        {hex.terrain && (
          <div className="player-hex-info-row">
            <span className="player-hex-info-label">Terrain</span>
            <span>{terrainName}</span>
          </div>
        )}

        {/* Region */}
        {regionName && (
          <div className="player-hex-info-row">
            <span className="player-hex-info-label">Region</span>
            <span className="player-hex-info-region">
              {regionColor && <span className="player-region-swatch" style={{ backgroundColor: regionColor }} />}
              {regionName}
            </span>
          </div>
        )}

        {/* Locations */}
        {hex.locationNames.length > 0 && (
          <div className="player-hex-info-section">
            <h4>Locations</h4>
            <ul>
              {hex.locationNames.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </div>
        )}

        {/* NPCs */}
        {hex.npcNames.length > 0 && (
          <div className="player-hex-info-section">
            <h4>NPCs</h4>
            <ul>
              {hex.npcNames.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerHexInfo;
