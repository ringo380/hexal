// PlayerLayerControl - Google Maps-style floating layer toggle for the player hex grid
// Uses local state (no SelectionContext in player view) with a reduced layer set.

import { useState, useRef, useEffect } from 'react';
import Icon from '../icons/Icon';

export interface PlayerLayerVisibility {
  terrainLabels: boolean;
  coordinateLabels: boolean;
  statusIndicators: boolean;
  connections: boolean;
  regionBorders: boolean;
  regionLabels: boolean;
  markers: boolean;
  weatherOverlay: boolean;
  weatherParticles: boolean;
  isobars: boolean;
  fronts: boolean;
  cloudShadows: boolean;
  pressureLabels: boolean;
  windArrows: boolean;
}

export const DEFAULT_PLAYER_LAYERS: PlayerLayerVisibility = {
  terrainLabels: true,
  coordinateLabels: true,
  statusIndicators: true,
  connections: true,
  regionBorders: true,
  regionLabels: true,
  markers: true,
  weatherOverlay: true,
  weatherParticles: true,
  isobars: true,
  fronts: true,
  cloudShadows: true,
  pressureLabels: true,
  windArrows: true,
};

const PLAYER_LAYER_OPTIONS: { key: keyof PlayerLayerVisibility; label: string }[] = [
  { key: 'terrainLabels', label: 'Terrain Labels' },
  { key: 'coordinateLabels', label: 'Coordinates' },
  { key: 'statusIndicators', label: 'Status Dots' },
  { key: 'connections', label: 'Rivers & Roads' },
  { key: 'regionBorders', label: 'Region Borders' },
  { key: 'regionLabels', label: 'Region Labels' },
  { key: 'markers', label: 'Markers' },
  { key: 'weatherOverlay', label: 'Weather Overlay' },
  { key: 'weatherParticles', label: 'Weather Particles' },
  { key: 'isobars', label: 'Isobars' },
  { key: 'fronts', label: 'Fronts' },
  { key: 'cloudShadows', label: 'Cloud Cover' },
  { key: 'pressureLabels', label: 'Pressure Labels' },
  { key: 'windArrows', label: 'Wind Arrows' },
];

interface PlayerLayerControlProps {
  layers: PlayerLayerVisibility;
  onToggle: (key: keyof PlayerLayerVisibility) => void;
  weatherAudioEnabled: boolean;
  weatherAudioVolume: number;
  onWeatherAudioToggle: () => void;
  onWeatherAudioVolumeChange: (volume: number) => void;
}

function PlayerLayerControl({ layers, onToggle, weatherAudioEnabled, weatherAudioVolume, onWeatherAudioToggle, onWeatherAudioVolumeChange }: PlayerLayerControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Outside-click dismissal via ref + contains()
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="layer-controls" ref={panelRef}>
      <button
        className="layer-controls-btn"
        onClick={() => setIsOpen(prev => !prev)}
        title="Toggle map layers"
        aria-label="Toggle map layers"
        aria-expanded={isOpen}
      >
        <Icon name="layers" size={16} />
      </button>
      {isOpen && (
        <div className="layer-controls-panel" role="group" aria-label="Map layers">
          <div className="layer-controls-header">Layers</div>
          {PLAYER_LAYER_OPTIONS.map(({ key, label }) => (
            <label key={key} className="layer-controls-item">
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={() => onToggle(key)}
              />
              <span>{label}</span>
            </label>
          ))}
          <div className="layer-controls-divider" />
          <div className="layer-controls-header">
            <Icon name="speaker" size={12} /> Audio
          </div>
          <label className="layer-controls-item">
            <input
              type="checkbox"
              checked={weatherAudioEnabled}
              onChange={onWeatherAudioToggle}
            />
            <span>Weather Sounds</span>
          </label>
          {weatherAudioEnabled && (
            <div className="layer-controls-slider">
              <Icon name="speaker" size={12} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weatherAudioVolume}
                onChange={(e) => onWeatherAudioVolumeChange(parseFloat(e.target.value))}
                aria-label="Weather audio volume"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PlayerLayerControl;
