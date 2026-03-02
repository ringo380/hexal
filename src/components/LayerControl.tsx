// LayerControl - Google Maps-style floating layer toggle for the DM hex grid

import { useState, useRef, useEffect } from 'react';
import { useLayerVisibility } from '../stores/LayerVisibilityContext';
import type { LayerVisibility } from '../types';
import Icon from './icons/Icon';

const LAYER_OPTIONS: { key: keyof LayerVisibility; label: string; tooltip: string }[] = [
  { key: 'terrainLabels', label: 'Terrain Labels', tooltip: 'Show terrain type names on each hex' },
  { key: 'coordinateLabels', label: 'Coordinates', tooltip: 'Show (q, r) coordinate labels' },
  { key: 'statusIndicators', label: 'Status Dots', tooltip: 'Show discovery status indicators' },
  { key: 'contentIndicators', label: 'Content Badges', tooltip: 'Show icons for encounters, NPCs, and items' },
  { key: 'connections', label: 'Rivers & Roads', tooltip: 'Show river and road connections between hexes' },
  { key: 'regionBorders', label: 'Region Borders', tooltip: 'Show colored borders around regions' },
  { key: 'regionLabels', label: 'Region Labels', tooltip: 'Show region name labels on the map' },
  { key: 'markers', label: 'Markers', tooltip: 'Show placed map markers' },
  { key: 'weatherOverlay', label: 'Weather Overlay', tooltip: 'Show temperature and precipitation colors' },
  { key: 'weatherParticles', label: 'Weather Particles', tooltip: 'Show animated rain, snow, and wind particles' },
  { key: 'isobars', label: 'Isobars', tooltip: 'Show atmospheric pressure contour lines' },
  { key: 'fronts', label: 'Fronts', tooltip: 'Show warm and cold front boundaries' },
  { key: 'cloudShadows', label: 'Cloud Cover', tooltip: 'Show cloud cover shadows on the map' },
  { key: 'pressureLabels', label: 'Pressure Labels', tooltip: 'Show high/low pressure center labels' },
  { key: 'windArrows', label: 'Wind Arrows', tooltip: 'Show wind direction and speed arrows' },
];

function LayerControl() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { layerVisibility, toggleLayer, weatherAudioEnabled, weatherAudioVolume, setWeatherAudioEnabled, setWeatherAudioVolume } = useLayerVisibility();

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
          {LAYER_OPTIONS.map(({ key, label, tooltip }) => (
            <label key={key} className="layer-controls-item" title={tooltip}>
              <input
                type="checkbox"
                checked={layerVisibility[key]}
                onChange={() => toggleLayer(key)}
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
              onChange={() => setWeatherAudioEnabled(!weatherAudioEnabled)}
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
                onChange={(e) => setWeatherAudioVolume(parseFloat(e.target.value))}
                aria-label="Weather audio volume"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LayerControl;
