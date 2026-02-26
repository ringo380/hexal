export interface LayerVisibility {
  terrainLabels: boolean;
  coordinateLabels: boolean;
  statusIndicators: boolean;
  contentIndicators: boolean;
  connections: boolean;       // rivers + roads
  regionBorders: boolean;
  regionLabels: boolean;
  markers: boolean;
  weatherOverlay: boolean;
  weatherParticles: boolean;
  isobars: boolean;           // DM only
  fronts: boolean;            // DM only
}

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  terrainLabels: true,
  coordinateLabels: true,
  statusIndicators: true,
  contentIndicators: true,
  connections: true,
  regionBorders: true,
  regionLabels: true,
  markers: true,
  weatherOverlay: true,
  weatherParticles: true,
  isobars: true,
  fronts: true,
};
