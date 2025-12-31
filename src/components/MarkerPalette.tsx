// MarkerPalette - Collapsible panel for placing markers on hexes
import { useState, useEffect, useCallback } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import { useSelection } from '../stores/SelectionContext';
import { groupMarkersByCategory, MARKER_CATEGORY_INFO } from '../types/Markers';
import { generateFigurineSVG, getGlyphIdForMarker, FIGURINE_SIZES } from '../services/markerFigurines';
import type { MarkerType, MarkerCategory } from '../types';

interface MarkerPaletteProps {
  onMarkerSelected?: (markerType: MarkerType | null) => void;
  selectedMarkerType?: MarkerType | null;
}

// Figurine preview component for palette buttons
function FigurinePreview({ markerType }: { markerType: MarkerType }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    const glyphId = getGlyphIdForMarker(markerType.id);
    const svg = generateFigurineSVG(glyphId, markerType.defaultColor, 'small');
    setImgSrc(svg);
  }, [markerType.id, markerType.defaultColor]);

  if (!imgSrc) {
    // Fallback to icon while loading
    return <span className="marker-icon">{markerType.icon}</span>;
  }

  return (
    <img
      src={imgSrc}
      alt={markerType.name}
      className="figurine-preview"
      width={FIGURINE_SIZES.small.totalWidth}
      height={FIGURINE_SIZES.small.totalHeight}
      draggable={false}
    />
  );
}

function MarkerPalette({ onMarkerSelected, selectedMarkerType }: MarkerPaletteProps) {
  const { markerTypes, addMarker } = useCampaign();
  const { selectedCoordinate } = useSelection();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<MarkerCategory>>(
    new Set(['settlement', 'player', 'custom'])
  );

  const groupedMarkers = groupMarkersByCategory(markerTypes);

  const toggleCategory = (category: MarkerCategory) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleMarkerClick = (markerType: MarkerType) => {
    if (onMarkerSelected) {
      // Toggle selection mode
      if (selectedMarkerType?.id === markerType.id) {
        onMarkerSelected(null);
      } else {
        onMarkerSelected(markerType);
      }
    } else if (selectedCoordinate) {
      // Direct placement if hex is selected
      addMarker(selectedCoordinate, markerType.id);
    }
  };

  // Handle drag start for palette-to-canvas drag
  const handleDragStart = useCallback((e: React.DragEvent<HTMLButtonElement>, markerType: MarkerType) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/hexal-marker', JSON.stringify({
      typeId: markerType.id,
      color: markerType.defaultColor
    }));

    // Set custom drag image - show only the figurine, not the button box
    const figurineImg = e.currentTarget.querySelector('img.figurine-preview') as HTMLImageElement;
    if (figurineImg) {
      // Center the cursor on the figurine
      const width = figurineImg.width || FIGURINE_SIZES.small.totalWidth;
      const height = figurineImg.height || FIGURINE_SIZES.small.totalHeight;
      e.dataTransfer.setDragImage(figurineImg, width / 2, height / 2);
    }
  }, []);

  const categoryOrder: MarkerCategory[] = ['settlement', 'military', 'landmark', 'player', 'custom'];

  return (
    <div className="marker-palette">
      <div
        className="marker-palette-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="palette-icon">📍</span>
        <span className="palette-title">Markers</span>
        <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
      </div>

      {isExpanded && (
        <div className="marker-palette-content">
          {selectedMarkerType && (
            <div className="placement-mode-indicator">
              Click on a hex to place: {selectedMarkerType.name}
              <button
                className="cancel-placement"
                onClick={() => onMarkerSelected?.(null)}
              >
                Cancel
              </button>
            </div>
          )}

          {categoryOrder.map(category => {
            const markers = groupedMarkers[category];
            if (markers.length === 0) return null;

            const categoryInfo = MARKER_CATEGORY_INFO[category];
            const isCategoryExpanded = expandedCategories.has(category);

            return (
              <div key={category} className="marker-category">
                <div
                  className="category-header"
                  onClick={() => toggleCategory(category)}
                >
                  <span className="category-icon">{categoryInfo.icon}</span>
                  <span className="category-label">{categoryInfo.label}</span>
                  <span className={`category-arrow ${isCategoryExpanded ? 'expanded' : ''}`}>
                    ▶
                  </span>
                </div>

                {isCategoryExpanded && (
                  <div className="marker-grid">
                    {markers.map(markerType => (
                      <button
                        key={markerType.id}
                        className={`marker-button ${selectedMarkerType?.id === markerType.id ? 'selected' : ''}`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, markerType)}
                        onClick={() => handleMarkerClick(markerType)}
                        title={`${markerType.name} - Drag to place on map`}
                        style={{
                          '--marker-color': markerType.defaultColor
                        } as React.CSSProperties}
                      >
                        <FigurinePreview markerType={markerType} />
                        <span className="marker-label">{markerType.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {!selectedCoordinate && !selectedMarkerType && (
            <div className="marker-hint">
              Select a hex to place markers, or click a marker to enter placement mode.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MarkerPalette;
