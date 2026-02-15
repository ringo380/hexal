// Player View Filter - Strips DM-only data from campaign for player consumption

import type { Campaign, Hex, TerrainType, HexCoordinate, DiscoveryStatus, HexConnections, Faction, NpcAttitude } from '../types';
import type { TimeWeatherState } from '../types/Weather';
import type { MarkerType, HexMarker } from '../types/Markers';

// Player-safe NPC data (name + optional faction/attitude)
export interface PlayerNpc {
  name: string;
  factionName?: string;
  attitude?: NpcAttitude;
}

// Player-safe hex data (stripped of DM content)
export interface PlayerHex {
  id: string;
  coordinate: HexCoordinate;
  terrain: string;
  status: DiscoveryStatus;
  // For discovered/cleared: location titles and NPC info only
  locationNames: string[];
  npcs: PlayerNpc[];
  // Markers (visual only)
  markers?: HexMarker[];
  // River and road connections (map features, not DM secrets)
  connections?: HexConnections;
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
  const factions = campaign.factions ?? [];

  for (const [key, hex] of Object.entries(campaign.hexes)) {
    hexes[key] = filterHexForPlayer(hex, factions);
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

function filterHexForPlayer(hex: Hex, factions: Faction[]): PlayerHex {
  const base: PlayerHex = {
    id: hex.id,
    coordinate: hex.coordinate,
    terrain: hex.terrain,
    status: hex.status,
    locationNames: [],
    npcs: [],
    markers: hex.markers?.filter(m => m.isVisible),
    connections: hex.connections
  };

  // Only include content names for discovered/cleared hexes
  if (hex.status === 'discovered' || hex.status === 'cleared') {
    base.locationNames = hex.locations.map(l => l.title).filter(Boolean);
    base.npcs = hex.npcs
      .filter(n => n.title)
      .map(npc => {
        const playerNpc: PlayerNpc = { name: npc.title };
        // Include faction name only if faction is known to players
        if (npc.factionId) {
          const faction = factions.find(f => f.id === npc.factionId);
          if (faction?.isKnownToPlayers) {
            playerNpc.factionName = faction.name;
          }
        }
        // Include attitude only for cleared hexes
        if (hex.status === 'cleared' && npc.attitude) {
          playerNpc.attitude = npc.attitude;
        }
        return playerNpc;
      });
  }

  return base;
}
