// Player View Filter - Strips DM-only data from campaign for player consumption

import type { Campaign, Hex, TerrainType, HexCoordinate, DiscoveryStatus, HexConnections, Faction, NpcAttitude } from '../types';
import type { TimeWeatherState } from '../types/Weather';
import type { MarkerType, HexMarker } from '../types/Markers';
import type { QuestStatus, StoryArcStatus } from '../types/Quest';

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

// Player-safe session data
export interface PlayerSession {
  id: string;
  number: number;
  title: string;
  summary: string;
  realWorldDate: string;
}

// Player-safe session log entry
export interface PlayerSessionLogEntry {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  hexKeys: string[];
}

// Player-safe quest objective (visible objectives only)
export interface PlayerQuestObjective {
  id: string;
  description: string;
  isComplete: boolean;
}

// Player-safe quest data (stripped of DM info)
export interface PlayerQuest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  objectives: PlayerQuestObjective[];
  storyArcId?: string;
  difficulty?: string;
}

// Player-safe story arc
export interface PlayerStoryArc {
  id: string;
  title: string;
  description: string;
  questIds: string[];
  status: StoryArcStatus;
  color: string;
}

// Player-safe weather simulation config (no analytical overlays)
export interface PlayerWeatherSimConfig {
  enabled: boolean;
  overlayOpacity: number;
  overlayMode: 'precipitation' | 'temperature' | 'pressure' | 'wind';
  showParticles: boolean;
  particleDensity: number;
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
  sessions: PlayerSession[];
  sessionLog: PlayerSessionLogEntry[];
  quests: PlayerQuest[];
  storyArcs: PlayerStoryArc[];
  weatherSimConfig?: PlayerWeatherSimConfig;
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

  // Filter sessions to only visible ones
  const sessions: PlayerSession[] = (campaign.sessions ?? [])
    .filter(s => s.isVisibleToPlayers)
    .map(s => ({
      id: s.id,
      number: s.number,
      title: s.title,
      summary: s.summary,
      realWorldDate: s.realWorldDate
    }));

  // Filter session log to only visible entries from visible sessions
  const visibleSessionIds = new Set(sessions.map(s => s.id));
  const sessionLog: PlayerSessionLogEntry[] = (campaign.sessionLog ?? [])
    .filter(e => e.isVisibleToPlayers && visibleSessionIds.has(e.sessionId))
    .map(e => ({
      id: e.id,
      sessionId: e.sessionId,
      title: e.title,
      description: e.description,
      hexKeys: e.hexKeys
    }));

  // Filter quests to only player-visible ones, strip DM-only fields
  const quests: PlayerQuest[] = (campaign.quests ?? [])
    .filter(q => q.isVisibleToPlayers)
    .map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      status: q.status,
      objectives: q.objectives
        .filter(o => o.isVisibleToPlayers)
        .map(o => ({
          id: o.id,
          description: o.description,
          isComplete: o.isComplete
        })),
      storyArcId: q.storyArcId,
      difficulty: q.difficulty
    }));

  // Build set of visible quest IDs for filtering story arc questIds
  const visibleQuestIds = new Set(quests.map(q => q.id));

  // Filter story arcs to only player-visible ones, strip DM-only fields
  const storyArcs: PlayerStoryArc[] = (campaign.storyArcs ?? [])
    .filter(a => a.isVisibleToPlayers)
    .map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      questIds: a.questIds.filter(qId => visibleQuestIds.has(qId)),
      status: a.status,
      color: a.color
    }));

  // Filter weather simulation config for player (strip DM analytical overlays)
  let weatherSimConfig: PlayerWeatherSimConfig | undefined;
  if (campaign.weatherSimulation?.config?.enabled) {
    const cfg = campaign.weatherSimulation.config;
    weatherSimConfig = {
      enabled: cfg.enabled,
      overlayOpacity: cfg.overlayOpacity,
      overlayMode: cfg.overlayMode,
      showParticles: cfg.showParticles,
      particleDensity: cfg.particleDensity
    };
  }

  return {
    id: campaign.id,
    name: campaign.name,
    gridWidth: campaign.gridWidth,
    gridHeight: campaign.gridHeight,
    hexes,
    terrainTypes: campaign.terrainTypes,
    timeWeather: campaign.timeWeather,
    markerTypes: campaign.markerTypes,
    regions,
    sessions,
    sessionLog,
    quests,
    storyArcs,
    weatherSimConfig
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
    markers: hex.status !== 'undiscovered' ? hex.markers?.filter(m => m.isVisible) : undefined,
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
