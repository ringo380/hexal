// Marker Figurines - SVG generation and caching for tabletop-style markers
// Creates circular base figurines with symbolic glyphs

import type { HexMarker, MarkerType } from '../types';

// ============================================================================
// Types
// ============================================================================

export type FigurineSize = 'small' | 'medium' | 'large';

export interface FigurineDimensions {
  baseRadius: number;
  glyphSize: number;
  shadowOffsetY: number;
  totalWidth: number;
  totalHeight: number;
}

// ============================================================================
// Size Configurations
// ============================================================================

export const FIGURINE_SIZES: Record<FigurineSize, FigurineDimensions> = {
  small: {
    baseRadius: 12,
    glyphSize: 10,
    shadowOffsetY: 2,
    totalWidth: 28,
    totalHeight: 32
  },
  medium: {
    baseRadius: 16,
    glyphSize: 14,
    shadowOffsetY: 3,
    totalWidth: 36,
    totalHeight: 42
  },
  large: {
    baseRadius: 20,
    glyphSize: 18,
    shadowOffsetY: 4,
    totalWidth: 44,
    totalHeight: 52
  }
};

// ============================================================================
// Zoom-based Visibility and Scaling
// ============================================================================

// Target screen-space sizes for figurines (in pixels) at different zoom ranges
export const MARKER_SCREEN_SIZE = {
  small: 16,   // At zooms 0.40-0.80
  normal: 24,  // At zooms 0.80-2.00
  large: 32,   // At zooms 2.00-5.00
};

// Player marker type IDs that remain visible at all zoom levels
export const PLAYER_MARKER_TYPES = [
  'player-1', 'player-2', 'player-3', 'player-4', 'player-5', 'player-6',
  'party', 'npc-ally', 'npc-enemy'
];

// Zoom thresholds for marker visibility
export const ZOOM_THRESHOLDS = {
  minZoom: 0.15,           // Absolute minimum zoom
  playerOnlyMax: 0.40,     // Below this, only player markers visible
  allMarkersMin: 0.40,     // Above this, all markers visible
  normalSizeMin: 0.80,     // Above this, use normal size
  largeSizeMin: 2.00,      // Above this, use large size
  maxZoom: 5.00,           // Maximum zoom
};

/**
 * Determine if a marker should be visible at the given zoom level
 */
export function isMarkerVisibleAtZoom(typeId: string, zoomLevel: number): boolean {
  // Below minimum zoom, nothing is visible
  if (zoomLevel < ZOOM_THRESHOLDS.minZoom) return false;

  // Player markers always visible (above minZoom)
  if (PLAYER_MARKER_TYPES.includes(typeId)) {
    return true;
  }

  // Other markers only visible at zoom >= 0.40
  return zoomLevel >= ZOOM_THRESHOLDS.allMarkersMin;
}

/**
 * Calculate the render scale for a marker to maintain consistent screen-space size
 * Returns a multiplier to apply to the base figurine dimensions
 * This compensates for canvas zoom to keep figurines at a readable size
 */
export function getMarkerRenderScale(zoomLevel: number): number {
  // Determine target screen size based on zoom level
  let targetScreenSize: number;
  if (zoomLevel < ZOOM_THRESHOLDS.normalSizeMin) {
    targetScreenSize = MARKER_SCREEN_SIZE.small;
  } else if (zoomLevel < ZOOM_THRESHOLDS.largeSizeMin) {
    targetScreenSize = MARKER_SCREEN_SIZE.normal;
  } else {
    targetScreenSize = MARKER_SCREEN_SIZE.large;
  }

  // Base medium figurine is 36px wide (from FIGURINE_SIZES.medium.totalWidth)
  // We want targetScreenSize pixels on screen
  // Canvas applies ctx.scale(zoomLevel), so world-space size = screenSize / zoomLevel
  const baseWorldSize = FIGURINE_SIZES.medium.totalWidth;
  const desiredWorldSize = targetScreenSize / zoomLevel;

  return desiredWorldSize / baseWorldSize;
}

// ============================================================================
// Color Helpers
// ============================================================================

/**
 * Parse hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 128, g: 128, b: 128 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  );
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r * (1 - amount),
    g * (1 - amount),
    b * (1 - amount)
  );
}

/**
 * Get contrasting color (white or dark) for text on background
 */
export function getContrastingColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#2D2D2D' : '#FFFFFF';
}

/**
 * Calculate relative luminance of a color
 */
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// ============================================================================
// Glyph SVG Paths
// ============================================================================

// SVG paths designed for 24x24 viewbox, centered
// These are simplified symbolic icons for tabletop readability
export const GLYPH_PATHS: Record<string, string> = {
  // Settlements - buildings/structures
  'settlement-small': 'M12 4L4 12h3v6h10v-6h3L12 4zm0 2.5l5 5v4.5H7v-4.5l5-5z', // Hut/house
  'settlement-medium': 'M8 20V10l4-6 4 6v10h-3v-5h-2v5H8zm4-12l-2 3v7h4v-7l-2-3z', // Tower
  'settlement-large': 'M4 20V12l2-3V6l2-2h8l2 2v3l2 3v8H4zm2-2h3v-4H6v4zm7 0h3v-4h-3v4zm-3-6h4v-2h-4v2z', // Castle
  'settlement-capital': 'M12 2l2 4h3l-2.5 3L16 14H8l1.5-5L7 6h3l2-4zm0 4l-1 2h2l-1-2zm-2 5h4l-.5 2h-3l-.5-2z', // Crown

  // Military - weapons/shields
  'military-camp': 'M12 4L4 16h16L12 4zm0 3l5 7H7l5-7z', // Tent/triangle
  'military-fort': 'M6 6h12v12H6V6zm2 2v8h8V8H8zm2 2h4v4h-4v-4z', // Fort/shield
  'military-patrol': 'M7 4l5 8-5 8M17 4l-5 8 5 8', // Crossed swords simplified
  'military-battle': 'M12 2l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z', // Burst/star

  // Landmarks - structures
  'landmark-tower': 'M10 4h4v3h2v13H8V7h2V4zm2 2v1h-0v12h2V6h-2z', // Watchtower
  'landmark-ruin': 'M6 18V10h2v-2h2V6h2v2h2V6h2v2h2v8l-2-2v-2h-2v4h-4v-4H8v2l-2 2z', // Broken column
  'landmark-sacred': 'M10 4h4v4h4v2h-4v8H10v-8H6V8h4V4zm2 2v2h-2v2h4V8h-2V6z', // Temple/altar
  'landmark-monument': 'M10 4h4l1 14H9l1-14zm2 2l-.5 10h1L14 6h-0z', // Obelisk
  'landmark-industrial': 'M4 18V10h4v-4h4V4h4v2h4v12H4zm6-8v8h4v-6h2V8h-2V6h-2v4H10z', // Factory
  'landmark-transport': 'M4 16l4-8h8l4 8H4zm6-6l-2 4h8l-2-4h-4z', // Port/ship

  // Nature/Hazards
  'nature-cave': 'M4 18C4 12 8 8 12 8s8 4 8 10H4zm8-8c-3 0-6 3-6 6h12c0-3-3-6-6-6z', // Cave entrance
  'nature-water': 'M12 4c2 2 4 6 4 10 0 3-2 4-4 4s-4-1-4-4c0-4 2-8 4-10zm0 4c-1 1-2 3-2 6 0 1.5 1 2 2 2s2-.5 2-2c0-3-1-5-2-6z', // Water drop
  'hazard-danger': 'M12 4L3 19h18L12 4zm0 5l5 8H7l5-8zm-1 3v3h2v-3h-2zm0 4v2h2v-2h-2z', // Warning triangle
  'hazard-blocked': 'M12 4a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 016 6 6 6 0 01-6 6 6 6 0 01-6-6 6 6 0 016-6zm-4 5h8v2H8v-2z', // Blocked/no entry

  // Players - shields/tokens
  'player-token': 'M12 4c-4 0-7 3-7 7v7l7 2 7-2v-7c0-4-3-7-7-7zm0 2c2.8 0 5 2.2 5 5v5.5l-5 1.5-5-1.5V11c0-2.8 2.2-5 5-5z', // Shield shape
  'party': 'M8 4v12l4 4 4-4V4H8zm2 2h4v9l-2 2-2-2V6z', // Banner/flag

  // NPCs
  'npc-ally': 'M12 4a3 3 0 100 6 3 3 0 000-6zm0 8c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z', // Friendly figure
  'npc-enemy': 'M8 4h8l-1 4h2l-2 4h1l-4 8-4-8h1L7 8h2L8 4zm4 4l2 4-2 4-2-4 2-4z', // Skull/hostile

  // Custom/Generic
  'marker-flag': 'M6 4v16h2V4H6zm2 0h8l-2 4 2 4H8V4z', // Flag on pole
  'marker-star': 'M12 2l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6L7.1 17.2l.9-5.5-4-3.9 5.5-.8L12 2z', // Star
  'marker-question': 'M12 4a6 6 0 00-6 6h2a4 4 0 118 0c0 1.5-1.5 2-2 3v2h-2v-2c0-2 2-2 2-4a2 2 0 00-2-2zm-1 12h2v2h-2v-2z', // Question mark
  'marker-exclaim': 'M11 4h2v10h-2V4zm0 12h2v2h-2v-2z', // Exclamation
  'marker-pin': 'M12 2c-3.3 0-6 2.7-6 6 0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z', // Map pin
};

// Mapping from marker type IDs to glyph IDs
export const MARKER_TO_GLYPH: Record<string, string> = {
  'settlement-small': 'settlement-small',
  'settlement-medium': 'settlement-medium',
  'settlement-large': 'settlement-large',
  'settlement-capital': 'settlement-capital',
  'military-camp': 'military-camp',
  'military-fort': 'military-fort',
  'military-patrol': 'military-patrol',
  'military-battle': 'military-battle',
  'landmark-tower': 'landmark-tower',
  'landmark-ruin': 'landmark-ruin',
  'landmark-sacred': 'landmark-sacred',
  'landmark-monument': 'landmark-monument',
  'landmark-industrial': 'landmark-industrial',
  'landmark-transport': 'landmark-transport',
  'nature-cave': 'nature-cave',
  'nature-water': 'nature-water',
  'hazard-danger': 'hazard-danger',
  'hazard-blocked': 'hazard-blocked',
  'player-1': 'player-token',
  'player-2': 'player-token',
  'player-3': 'player-token',
  'player-4': 'player-token',
  'player-5': 'player-token',
  'player-6': 'player-token',
  'party': 'party',
  'npc-ally': 'npc-ally',
  'npc-enemy': 'npc-enemy',
  'marker-flag': 'marker-flag',
  'marker-star': 'marker-star',
  'marker-question': 'marker-question',
  'marker-exclaim': 'marker-exclaim',
  'marker-pin': 'marker-pin',
};

// ============================================================================
// SVG Generation
// ============================================================================

/**
 * Generate an SVG figurine as a data URI
 */
export function generateFigurineSVG(
  glyphId: string,
  color: string,
  size: FigurineSize = 'medium'
): string {
  const dims = FIGURINE_SIZES[size];
  const glyphPath = GLYPH_PATHS[glyphId] || GLYPH_PATHS['marker-pin'];

  // Derive colors from base color
  const bevelLight = lightenColor(color, 0.25);
  const bevelDark = darkenColor(color, 0.35);
  const glyphColor = getContrastingColor(color);
  const shadowColor = 'rgba(0,0,0,0.35)';

  // Calculate positions
  const centerX = dims.totalWidth / 2;
  const baseY = dims.totalHeight / 2;
  const shadowY = dims.totalHeight - dims.shadowOffsetY - 2;

  // Scale factor for glyph (designed for 24x24, scale to fit in base)
  const glyphScale = dims.glyphSize / 24;
  const glyphOffsetX = centerX - (12 * glyphScale);
  const glyphOffsetY = baseY - (12 * glyphScale) - 2;

  // Generate unique ID for gradient (avoid conflicts when multiple SVGs)
  const gradId = `bevel-${Math.random().toString(36).substr(2, 9)}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dims.totalWidth}" height="${dims.totalHeight}" viewBox="0 0 ${dims.totalWidth} ${dims.totalHeight}">
  <!-- Shadow ellipse -->
  <ellipse cx="${centerX}" cy="${shadowY}" rx="${dims.baseRadius * 1.1}" ry="${dims.baseRadius * 0.35}" fill="${shadowColor}" filter="url(#shadow-blur)"/>

  <!-- Definitions -->
  <defs>
    <filter id="shadow-blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1"/>
    </filter>
    <radialGradient id="${gradId}" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${bevelLight}"/>
      <stop offset="70%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${bevelDark}"/>
    </radialGradient>
  </defs>

  <!-- Base circle with bevel -->
  <circle cx="${centerX}" cy="${baseY - 2}" r="${dims.baseRadius}" fill="url(#${gradId})" stroke="${bevelDark}" stroke-width="0.5"/>

  <!-- Glyph symbol -->
  <g transform="translate(${glyphOffsetX}, ${glyphOffsetY}) scale(${glyphScale})">
    <path d="${glyphPath}" fill="${glyphColor}" fill-opacity="0.9"/>
  </g>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Get the glyph ID for a marker type
 */
export function getGlyphIdForMarker(typeId: string): string {
  return MARKER_TO_GLYPH[typeId] || 'marker-pin';
}

// ============================================================================
// Figurine Image Cache
// ============================================================================

interface CacheEntry {
  image: HTMLImageElement;
  lastUsed: number;
}

/**
 * LRU cache for figurine images
 * Caches rendered SVG images for efficient canvas drawing
 */
export class FigurineCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Generate cache key from parameters
   */
  private getKey(glyphId: string, color: string, size: FigurineSize): string {
    return `${glyphId}-${color}-${size}`;
  }

  /**
   * Load an SVG data URI into an HTMLImageElement
   */
  private async loadImage(dataUri: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load figurine image: ${e}`));
      img.src = dataUri;
    });
  }

  /**
   * Evict least recently used entries if cache is full
   */
  private evictLRU(): void {
    if (this.cache.size < this.maxSize) return;

    // Find and remove oldest entry
    let oldestKey = '';
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get a figurine image, loading it if not cached
   */
  async getImage(
    glyphId: string,
    color: string,
    size: FigurineSize = 'medium'
  ): Promise<HTMLImageElement> {
    const key = this.getKey(glyphId, color, size);

    // Check cache
    const cached = this.cache.get(key);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.image;
    }

    // Check if already loading
    const loading = this.loadingPromises.get(key);
    if (loading) {
      return loading;
    }

    // Generate and load
    const loadPromise = (async () => {
      const dataUri = generateFigurineSVG(glyphId, color, size);
      const image = await this.loadImage(dataUri);

      // Evict if needed
      this.evictLRU();

      // Cache the result
      this.cache.set(key, {
        image,
        lastUsed: Date.now()
      });

      this.loadingPromises.delete(key);
      return image;
    })();

    this.loadingPromises.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * Get a figurine image synchronously (returns undefined if not cached)
   */
  getImageSync(
    glyphId: string,
    color: string,
    size: FigurineSize = 'medium'
  ): HTMLImageElement | undefined {
    const key = this.getKey(glyphId, color, size);
    const cached = this.cache.get(key);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.image;
    }
    return undefined;
  }

  /**
   * Preload figurines for a set of marker types
   */
  async preload(markerTypes: MarkerType[]): Promise<void> {
    const sizes: FigurineSize[] = ['small', 'medium', 'large'];
    const promises: Promise<HTMLImageElement>[] = [];

    for (const type of markerTypes) {
      const glyphId = getGlyphIdForMarker(type.id);
      for (const size of sizes) {
        promises.push(this.getImage(glyphId, type.defaultColor, size));
      }
    }

    await Promise.all(promises);
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Global cache instance
export const figurineCache = new FigurineCache(100);

// ============================================================================
// Helper Functions for Rendering
// ============================================================================

/**
 * Get the appropriate figurine size based on marker type
 */
export function getFigurineSizeForMarker(typeId: string): FigurineSize {
  // Large: capitals, party, major threats
  if (typeId.includes('capital') || typeId === 'party' || typeId.includes('battle')) {
    return 'large';
  }
  // Small: minor POIs, hazards
  if (typeId.includes('small') || typeId.includes('hazard') || typeId.includes('nature')) {
    return 'small';
  }
  // Default: medium
  return 'medium';
}

/**
 * Get figurine for a marker instance
 */
export async function getFigurineForMarker(
  marker: HexMarker,
  markerTypes: MarkerType[]
): Promise<HTMLImageElement | undefined> {
  const markerType = markerTypes.find(t => t.id === marker.typeId);
  if (!markerType) return undefined;

  const glyphId = getGlyphIdForMarker(marker.typeId);
  const color = marker.color || markerType.defaultColor;
  const size = getFigurineSizeForMarker(marker.typeId);

  return figurineCache.getImage(glyphId, color, size);
}

/**
 * Get figurine synchronously (for render loop)
 */
export function getFigurineSync(
  marker: HexMarker,
  markerTypes: MarkerType[]
): HTMLImageElement | undefined {
  const markerType = markerTypes.find(t => t.id === marker.typeId);
  if (!markerType) return undefined;

  const glyphId = getGlyphIdForMarker(marker.typeId);
  const color = marker.color || markerType.defaultColor;
  const size = getFigurineSizeForMarker(marker.typeId);

  return figurineCache.getImageSync(glyphId, color, size);
}
