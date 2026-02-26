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
];

interface PlayerLayerControlProps {
  layers: PlayerLayerVisibility;
  onToggle: (key: keyof PlayerLayerVisibility) => void;
}

function PlayerLayerControl({ layers, onToggle }: PlayerLayerControlProps) {
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
        </div>
      )}
    </div>
  );
}

export default PlayerLayerControl;
