// Color Utilities - Consolidated color manipulation functions
// Used by hexRenderer.ts, markerFigurines.ts, and other rendering services

// ============================================================================
// RGB Conversion
// ============================================================================

/**
 * Parse hex color to RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
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
 * Convert RGB to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Convert hex color to rgba string
 */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================================
// Color Manipulation
// ============================================================================

/**
 * Lighten a color by a percentage (0-1)
 * @param hex - Hex color string (e.g., "#ff0000")
 * @param amount - Amount to lighten (0-1, where 1 is white)
 * @returns Hex color string
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
 * Darken a color by a percentage (0-1)
 * @param hex - Hex color string (e.g., "#ff0000")
 * @param amount - Amount to darken (0-1, where 1 is black)
 * @returns Hex color string
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
 * Convert color to grayscale
 */
export function colorToGrayscale(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Luminance formula
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  return rgbToHex(gray, gray, gray);
}

// ============================================================================
// Color Analysis
// ============================================================================

/**
 * Calculate relative luminance of a color (0-1)
 */
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Get contrasting color (white or dark) for text on background
 */
export function getContrastingColor(hex: string): string {
  const luminance = getLuminance(hex);
  return luminance > 0.5 ? '#2D2D2D' : '#FFFFFF';
}
