// LayerControl - Google Maps-style floating layer toggle for the DM hex grid

import { useState, useRef, useEffect } from 'react';
import { useSelection } from '../stores/SelectionContext';
import type { LayerVisibility } from '../stores/SelectionContext';
import Icon from './icons/Icon';

const LAYER_OPTIONS: { key: keyof LayerVisibility; label: string }[] = [
  { key: 'terrainLabels', label: 'Terrain Labels' },
  { key: 'coordinateLabels', label: 'Coordinates' },
  { key: 'statusIndicators', label: 'Status Dots' },
  { key: 'contentIndicators', label: 'Content Badges' },
  { key: 'connections', label: 'Rivers & Roads' },
  { key: 'regionBorders', label: 'Region Borders' },
  { key: 'regionLabels', label: 'Region Labels' },
  { key: 'markers', label: 'Markers' },
  { key: 'weatherOverlay', label: 'Weather Overlay' },
  { key: 'weatherParticles', label: 'Weather Particles' },
  { key: 'isobars', label: 'Isobars' },
  { key: 'fronts', label: 'Fronts' },
];

function LayerControl() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { layerVisibility, toggleLayer } = useSelection();

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
          {LAYER_OPTIONS.map(({ key, label }) => (
            <label key={key} className="layer-controls-item">
              <input
                type="checkbox"
                checked={layerVisibility[key]}
                onChange={() => toggleLayer(key)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default LayerControl;
