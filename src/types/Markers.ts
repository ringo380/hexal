// Marker system types and defaults for hex map figurines

import type { HexCoordinate } from './Campaign';

// Marker categories for organization in the palette
export type MarkerCategory = 'settlement' | 'military' | 'landmark' | 'player' | 'custom';

// Individual marker placed on a hex
export interface HexMarker {
  id: string;
  typeId: string;          // References MarkerType.id
  label?: string;          // Optional custom label
  color?: string;          // Override color (hex code)
  isVisible: boolean;      // Can be hidden without removing
  worldX?: number;         // World X coordinate (optional, defaults to hex center)
  worldY?: number;         // World Y coordinate (optional, defaults to hex center)
}

// Campaign-level marker type definitions
export interface MarkerType {
  id: string;
  name: string;            // Display name
  icon: string;            // Unicode symbol or emoji
  category: MarkerCategory;
  defaultColor: string;    // Default color (hex code)
  isBuiltIn: boolean;      // System-provided vs user-created
}

// Marker position for hit testing during canvas interactions
export interface MarkerPosition {
  x: number;               // Screen-space X after transform
  y: number;               // Screen-space Y after transform
  worldX: number;          // World-space X
  worldY: number;          // World-space Y
  markerId: string;
  hexCoord: HexCoordinate;
  radius: number;          // Hit-test radius (adapts to zoom)
}

// State for marker drag operations
export interface MarkerDragState {
  markerId: string;
  sourceHex: HexCoordinate;
  currentPosition: { x: number; y: number };
}

// Selection state for markers
export interface MarkerSelection {
  markerId: string;
  hexCoord: HexCoordinate;
}

// Default built-in marker types - genre-agnostic
export const DEFAULT_MARKER_TYPES: MarkerType[] = [
  // Settlements
  { id: 'settlement-small', name: 'Village', icon: '●', category: 'settlement', defaultColor: '#8B4513', isBuiltIn: true },
  { id: 'settlement-medium', name: 'Town', icon: '◉', category: 'settlement', defaultColor: '#CD853F', isBuiltIn: true },
  { id: 'settlement-large', name: 'City', icon: '⬤', category: 'settlement', defaultColor: '#DAA520', isBuiltIn: true },
  { id: 'settlement-capital', name: 'Capital', icon: '★', category: 'settlement', defaultColor: '#FFD700', isBuiltIn: true },

  // Military/Security
  { id: 'military-camp', name: 'Camp', icon: '▲', category: 'military', defaultColor: '#8B0000', isBuiltIn: true },
  { id: 'military-fort', name: 'Fort', icon: '■', category: 'military', defaultColor: '#A52A2A', isBuiltIn: true },
  { id: 'military-patrol', name: 'Patrol', icon: '⚔', category: 'military', defaultColor: '#DC143C', isBuiltIn: true },
  { id: 'military-conflict', name: 'Battle', icon: '💥', category: 'military', defaultColor: '#FF4500', isBuiltIn: true },

  // Landmarks
  { id: 'landmark-tower', name: 'Tower', icon: '🗼', category: 'landmark', defaultColor: '#4682B4', isBuiltIn: true },
  { id: 'landmark-ruin', name: 'Ruins', icon: '🏚', category: 'landmark', defaultColor: '#696969', isBuiltIn: true },
  { id: 'landmark-sacred', name: 'Temple', icon: '⛪', category: 'landmark', defaultColor: '#9370DB', isBuiltIn: true },
  { id: 'landmark-monument', name: 'Monument', icon: '🗿', category: 'landmark', defaultColor: '#708090', isBuiltIn: true },
  { id: 'landmark-industrial', name: 'Factory', icon: '🏭', category: 'landmark', defaultColor: '#808080', isBuiltIn: true },
  { id: 'landmark-transport', name: 'Port', icon: '⚓', category: 'landmark', defaultColor: '#4169E1', isBuiltIn: true },

  // Nature/Hazards
  { id: 'nature-cave', name: 'Cave', icon: '◐', category: 'landmark', defaultColor: '#2F4F4F', isBuiltIn: true },
  { id: 'nature-water', name: 'Spring', icon: '💧', category: 'landmark', defaultColor: '#00CED1', isBuiltIn: true },
  { id: 'hazard-danger', name: 'Danger', icon: '⚠', category: 'landmark', defaultColor: '#FF6347', isBuiltIn: true },
  { id: 'hazard-blocked', name: 'Blocked', icon: '⛔', category: 'landmark', defaultColor: '#B22222', isBuiltIn: true },

  // Player Tokens
  { id: 'player-1', name: 'Player 1', icon: '◆', category: 'player', defaultColor: '#FF6B6B', isBuiltIn: true },
  { id: 'player-2', name: 'Player 2', icon: '◆', category: 'player', defaultColor: '#4ECDC4', isBuiltIn: true },
  { id: 'player-3', name: 'Player 3', icon: '◆', category: 'player', defaultColor: '#45B7D1', isBuiltIn: true },
  { id: 'player-4', name: 'Player 4', icon: '◆', category: 'player', defaultColor: '#96CEB4', isBuiltIn: true },
  { id: 'player-5', name: 'Player 5', icon: '◆', category: 'player', defaultColor: '#FFEAA7', isBuiltIn: true },
  { id: 'player-6', name: 'Player 6', icon: '◆', category: 'player', defaultColor: '#DDA0DD', isBuiltIn: true },
  { id: 'party', name: 'Party', icon: '👥', category: 'player', defaultColor: '#FFD700', isBuiltIn: true },
  { id: 'npc-ally', name: 'Ally NPC', icon: '🛡', category: 'player', defaultColor: '#32CD32', isBuiltIn: true },
  { id: 'npc-enemy', name: 'Enemy NPC', icon: '☠', category: 'player', defaultColor: '#8B0000', isBuiltIn: true },

  // Generic/Custom
  { id: 'marker-flag', name: 'Flag', icon: '🚩', category: 'custom', defaultColor: '#E74C3C', isBuiltIn: true },
  { id: 'marker-star', name: 'Objective', icon: '⭐', category: 'custom', defaultColor: '#F39C12', isBuiltIn: true },
  { id: 'marker-question', name: 'Unknown', icon: '❓', category: 'custom', defaultColor: '#9B59B6', isBuiltIn: true },
  { id: 'marker-exclaim', name: 'Important', icon: '❗', category: 'custom', defaultColor: '#E67E22', isBuiltIn: true },
  { id: 'marker-pin', name: 'Pin', icon: '📍', category: 'custom', defaultColor: '#3498DB', isBuiltIn: true },
];

// Category display info for palette organization
export const MARKER_CATEGORY_INFO: Record<MarkerCategory, { label: string; icon: string }> = {
  settlement: { label: 'Settlements', icon: '🏘' },
  military: { label: 'Military', icon: '⚔' },
  landmark: { label: 'Landmarks', icon: '🏛' },
  player: { label: 'Players', icon: '👤' },
  custom: { label: 'Custom', icon: '📍' },
};

// Helper functions

export function createMarker(
  typeId: string,
  label?: string,
  worldPosition?: { x: number; y: number }
): HexMarker {
  return {
    id: crypto.randomUUID(),
    typeId,
    label,
    isVisible: true,
    worldX: worldPosition?.x,
    worldY: worldPosition?.y,
  };
}

export function getMarkerType(typeId: string, markerTypes: MarkerType[]): MarkerType | undefined {
  return markerTypes.find(t => t.id === typeId);
}

export function getMarkerColor(marker: HexMarker, markerTypes: MarkerType[]): string {
  if (marker.color) return marker.color;
  const type = getMarkerType(marker.typeId, markerTypes);
  return type?.defaultColor || '#888888';
}

export function getMarkerIcon(marker: HexMarker, markerTypes: MarkerType[]): string {
  const type = getMarkerType(marker.typeId, markerTypes);
  return type?.icon || '●';
}

export function getMarkerDisplayName(marker: HexMarker, markerTypes: MarkerType[]): string {
  if (marker.label) return marker.label;
  const type = getMarkerType(marker.typeId, markerTypes);
  return type?.name || 'Marker';
}

// Group marker types by category for palette display
export function groupMarkersByCategory(markerTypes: MarkerType[]): Record<MarkerCategory, MarkerType[]> {
  const groups: Record<MarkerCategory, MarkerType[]> = {
    settlement: [],
    military: [],
    landmark: [],
    player: [],
    custom: [],
  };

  for (const type of markerTypes) {
    groups[type.category].push(type);
  }

  return groups;
}

// Create a custom marker type
export function createCustomMarkerType(
  name: string,
  icon: string,
  color: string,
  category: MarkerCategory = 'custom'
): MarkerType {
  return {
    id: `custom-${crypto.randomUUID()}`,
    name,
    icon,
    category,
    defaultColor: color,
    isBuiltIn: false,
  };
}
