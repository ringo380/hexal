// Player View Filter - Strips DM-only data from campaign for player consumption

import type { Campaign, Hex, TerrainType, HexCoordinate, DiscoveryStatus } from '../types';
import type { TimeWeatherState } from '../types/Weather';
import type { MarkerType, HexMarker } from '../types/Markers';

// Player-safe hex data (stripped of DM content)
export interface PlayerHex {
  id: string;
  coordinate: HexCoordinate;
  terrain: string;
  status: DiscoveryStatus;
  // For discovered/cleared: location titles and NPC names only
  locationNames: string[];
  npcNames: string[];
  // Markers (visual only)
  markers?: HexMarker[];
}

// Player-safe region data
export interface PlayerRegion {
  id: string;
  name: string;
  color: string;
  hexKeys: string[];
  isDiscovered: boolean;
}

// Player-safe campaign data
export interface PlayerCampaign {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  hexes: Record<string, PlayerHex>;
  terrainTypes: TerrainType[];
  timeWeather?: TimeWeatherState;
  markerTypes?: MarkerType[];
  regions: PlayerRegion[];
}

/**
 * Filter a full Campaign into a PlayerCampaign, stripping DM-only data.
 * - Undiscovered hexes: coordinate, terrain, status only (enough to render fog)
 * - Discovered/cleared hexes: adds location titles and NPC names
 * - Strips: notes, tags, encounter details, treasure details, clue details, descriptions
 * - Regions: strips description, notes, tags
 */
export function filterCampaignForPlayer(campaign: Campaign): PlayerCampaign {
  const hexes: Record<string, PlayerHex> = {};

  for (const [key, hex] of Object.entries(campaign.hexes)) {
    hexes[key] = filterHexForPlayer(hex);
  }

  const regions: PlayerRegion[] = (campaign.regions ?? []).map(r => ({
    id: r.id,
    name: r.name,
    color: r.color,
    hexKeys: r.hexKeys,
    isDiscovered: r.isDiscovered
  }));

  return {
    id: campaign.id,
    name: campaign.name,
    gridWidth: campaign.gridWidth,
    gridHeight: campaign.gridHeight,
    hexes,
    terrainTypes: campaign.terrainTypes,
    timeWeather: campaign.timeWeather,
    markerTypes: campaign.markerTypes,
    regions
  };
}

function filterHexForPlayer(hex: Hex): PlayerHex {
  const base: PlayerHex = {
    id: hex.id,
    coordinate: hex.coordinate,
    terrain: hex.terrain,
    status: hex.status,
    locationNames: [],
    npcNames: [],
    markers: hex.markers?.filter(m => m.isVisible)
  };

  // Only include content names for discovered/cleared hexes
  if (hex.status === 'discovered' || hex.status === 'cleared') {
    base.locationNames = hex.locations.map(l => l.title).filter(Boolean);
    base.npcNames = hex.npcs.map(n => n.title).filter(Boolean);
  }

  return base;
}
