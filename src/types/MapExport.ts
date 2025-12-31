// Map Export Types - Configuration for PNG, JPEG, and PDF exports

import type { ContentCategory } from './Campaign';

// Export format options
export type ExportFormat = 'png' | 'jpeg' | 'pdf';

// View mode - DM sees everything, Player sees only discovered
export type ViewMode = 'dm' | 'player';

// How to handle undiscovered hexes in player view
export type PlayerFogStyle = 'blank' | 'fog';

// Color mode for export
export type ColorMode = 'dark' | 'light' | 'print-bw';

// PDF paper sizes
export type PaperSize = 'letter' | 'a4' | 'a3' | 'tabloid';

// PDF page mode
export type PageMode = 'fit-to-page' | 'multi-page';

// PDF orientation
export type PageOrientation = 'portrait' | 'landscape';

// Export region selection
export interface ExportRegion {
  type: 'full' | 'custom';
  // For custom region (inclusive bounds)
  minQ?: number;
  maxQ?: number;
  minR?: number;
  maxR?: number;
}

// Main export options interface
export interface MapExportOptions {
  // Format settings
  format: ExportFormat;
  quality: number;              // 0.1-1.0, JPEG compression quality

  // Resolution multiplier (1x, 2x, 3x, 4x)
  scale: number;

  // View mode
  viewMode: ViewMode;
  playerFogStyle: PlayerFogStyle;

  // Color mode
  colorMode: ColorMode;

  // Elements to show
  showCoordinates: boolean;
  showTerrainLabels: boolean;
  showContentIndicators: boolean;
  showStatusDots: boolean;
  showHexBorders: boolean;

  // Metadata elements
  showLegend: boolean;
  showTitle: boolean;
  showScale: boolean;
  customTitle?: string;         // Override campaign name
  scaleText?: string;           // e.g., "1 hex = 6 miles"

  // Region to export
  region: ExportRegion;

  // PDF-specific settings
  paperSize: PaperSize;
  orientation: PageOrientation;
  margins: number;              // Margins in mm
  pageMode: PageMode;
}

// Default export options
export const DEFAULT_EXPORT_OPTIONS: MapExportOptions = {
  format: 'png',
  quality: 0.92,
  scale: 1,
  viewMode: 'dm',
  playerFogStyle: 'fog',
  colorMode: 'dark',
  showCoordinates: true,
  showTerrainLabels: true,
  showContentIndicators: true,
  showStatusDots: true,
  showHexBorders: true,
  showLegend: false,
  showTitle: false,
  showScale: false,
  region: { type: 'full' },
  paperSize: 'letter',
  orientation: 'landscape',
  margins: 10,
  pageMode: 'fit-to-page'
};

// Export presets for quick access
export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  options: Partial<MapExportOptions>;
}

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: 'quick',
    name: 'Quick Export',
    description: 'Fast PNG export with current settings',
    options: {
      format: 'png',
      scale: 1,
      viewMode: 'dm',
      colorMode: 'dark'
    }
  },
  {
    id: 'print-color',
    name: 'Print-Ready (Color)',
    description: 'High-res PDF optimized for color printing',
    options: {
      format: 'pdf',
      scale: 2,
      viewMode: 'dm',
      colorMode: 'light',
      showLegend: true,
      showTitle: true,
      showHexBorders: true
    }
  },
  {
    id: 'print-bw',
    name: 'Print-Ready (B&W)',
    description: 'High-res PDF optimized for grayscale printing',
    options: {
      format: 'pdf',
      scale: 2,
      viewMode: 'dm',
      colorMode: 'print-bw',
      showLegend: true,
      showTitle: true,
      showHexBorders: true
    }
  },
  {
    id: 'player-handout',
    name: 'Player Handout',
    description: 'Map showing only discovered areas',
    options: {
      format: 'png',
      scale: 2,
      viewMode: 'player',
      playerFogStyle: 'fog',
      colorMode: 'dark',
      showCoordinates: false,
      showContentIndicators: false
    }
  }
];

// Internal render configuration used by hexRenderer
export interface RenderConfig {
  // Canvas colors
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;

  // Opacity settings
  hexOpacityUndiscovered: number;
  hexOpacityDiscovered: number;

  // Visibility flags
  showUndiscovered: boolean;      // false = don't render at all (player blank mode)
  showUndiscoveredAsFog: boolean; // true = show as fog overlay
  showCoordinates: boolean;
  showTerrainLabels: boolean;
  showContentIndicators: boolean;
  showStatusDots: boolean;
  showBorders: boolean;

  // Font settings
  coordFontSize: number;
  terrainFontSize: number;
  fontColor: string;
  fontShadowColor: string;
  coordColor: string;

  // Status indicator colors
  statusDiscoveredColor: string;
  statusClearedColor: string;

  // Content indicator colors (keyed by category)
  contentIndicatorColors: Record<ContentCategory, string>;

  // Scale multiplier
  scale: number;

  // Color mode for terrain adjustments
  colorMode: ColorMode;
}

// Paper dimensions in mm
export const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
  letter: { width: 215.9, height: 279.4 },
  a4: { width: 210, height: 297 },
  a3: { width: 297, height: 420 },
  tabloid: { width: 279.4, height: 431.8 }
};

// Content indicator colors (matching HexGrid.tsx)
export const CONTENT_INDICATOR_COLORS: Record<ContentCategory, string> = {
  locations: '#e91e63',
  encounters: '#ff5722',
  npcs: '#2196f3',
  treasures: '#ffc107',
  clues: '#9c27b0'
};

// Status indicator colors
export const STATUS_COLORS = {
  discovered: 'rgba(74, 158, 255, 0.7)',
  cleared: 'rgba(76, 175, 80, 0.7)'
};

// Background colors by color mode
export const BACKGROUND_COLORS: Record<ColorMode, string> = {
  dark: '#1e1e1e',
  light: '#ffffff',
  'print-bw': '#ffffff'
};

// Border colors by color mode
export const BORDER_COLORS: Record<ColorMode, string> = {
  dark: '#555555',
  light: '#333333',
  'print-bw': '#000000'
};

// Font colors by color mode
export const FONT_COLORS: Record<ColorMode, { main: string; coord: string; shadow: string }> = {
  dark: {
    main: 'rgba(255, 255, 255, 0.85)',
    coord: 'rgba(136, 136, 136, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.7)'
  },
  light: {
    main: 'rgba(0, 0, 0, 0.85)',
    coord: 'rgba(80, 80, 80, 0.8)',
    shadow: 'rgba(255, 255, 255, 0.5)'
  },
  'print-bw': {
    main: '#000000',
    coord: '#444444',
    shadow: 'transparent'
  }
};
