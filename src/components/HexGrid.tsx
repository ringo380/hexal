// HexGrid - Canvas-based hex grid with selection and zoom
import { useRef, useEffect, useCallback, useState } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import { useSelection } from '../stores/SelectionContext';
import {
  HEX_SIZE,
  hexCenter,
  canvasSize,
  drawHexPath,
  coordinateAt
} from '../services/hexGeometry';
import type { HexCoordinate, Hex, ContentCategory } from '../types';

// Zoom configuration
const MIN_ZOOM = 0.15;            // Allow more zoom out
const MAX_ZOOM = 5.0;             // Allow more zoom in
const ZOOM_STEP = 0.03;           // 3% per scroll tick
const ZOOM_ANIMATION_SPEED = 0.12; // Lerp factor for smooth zoom/pan

// Pan configuration
const PAN_SPEED = 20;              // Pixels per keypress
const DRAG_THRESHOLD_EMPTY = 3;    // Pixels before drag starts on empty area
const DRAG_THRESHOLD_HEX = 8;      // Pixels before drag starts on active hex

// LOD (Level of Detail) configuration - progressive detail at different zoom levels
interface LODConfig {
  minZoom: number;
  maxZoom: number;
  // Visibility flags
  showBorders: boolean;
  showStatusDot: boolean;
  showIndicators: boolean;
  showIndicatorLetters: boolean;
  showCountBadges: boolean;
  showCoordLabels: boolean;
  showTerrainLabels: boolean;
  showContentTitles: boolean;
  // Sizes (proportional to HEX_SIZE to fit within hex bounds)
  borderWidth: number;
  statusDotRadius: number;
  indicatorRadius: number;
  indicatorFont: number;
  indicatorSpacing: number;  // Horizontal spacing between indicator dots
  badgeRadius: number;
  badgeFont: number;
  coordFont: number;
  coordOpacity: number;
  terrainFont: number;
  contentTitleFont: number;
  // Y positions (offsets from hex center, must stay within ±26 for HEX_SIZE=30)
  indicatorY: number;     // Y offset for indicator row (negative = above center)
  terrainY: number;       // Y offset for terrain label
  contentTitleY: number;  // Y offset for content title
  coordY: number;         // Y offset for coordinate label
}

// Proportional sizes relative to HEX_SIZE (30) to keep elements within hex bounds
// Vertical space budget: ~26 units from center to edge (HEX_SIZE * sqrt(3)/2)
// INVERSE FONT SCALING: smaller fonts at higher zoom = more text fits without truncation
const LOD_LEVELS: LODConfig[] = [
  // Level 0: Minimal (0.15 - 0.25) - hex colors only
  { minZoom: 0.15, maxZoom: 0.25,
    showBorders: false, showStatusDot: false, showIndicators: false,
    showIndicatorLetters: false, showCountBadges: false, showCoordLabels: false,
    showTerrainLabels: false, showContentTitles: false,
    borderWidth: 0, statusDotRadius: 0, indicatorRadius: 0, indicatorFont: 0,
    indicatorSpacing: 0, badgeRadius: 0, badgeFont: 0, coordFont: 0, coordOpacity: 0,
    terrainFont: 0, contentTitleFont: 0, indicatorY: 0, terrainY: 0, contentTitleY: 0, coordY: 0 },

  // Level 1: Overview (0.25 - 0.40) - add hex borders
  { minZoom: 0.25, maxZoom: 0.40,
    showBorders: true, showStatusDot: false, showIndicators: false,
    showIndicatorLetters: false, showCountBadges: false, showCoordLabels: false,
    showTerrainLabels: false, showContentTitles: false,
    borderWidth: 0.5, statusDotRadius: 0, indicatorRadius: 0, indicatorFont: 0,
    indicatorSpacing: 0, badgeRadius: 0, badgeFont: 0, coordFont: 0, coordOpacity: 0,
    terrainFont: 0, contentTitleFont: 0, indicatorY: 0, terrainY: 0, contentTitleY: 0, coordY: 0 },

  // Level 2: Region (0.40 - 0.60) - add status dots
  { minZoom: 0.40, maxZoom: 0.60,
    showBorders: true, showStatusDot: true, showIndicators: false,
    showIndicatorLetters: false, showCountBadges: false, showCoordLabels: false,
    showTerrainLabels: false, showContentTitles: false,
    borderWidth: 0.75, statusDotRadius: 3, indicatorRadius: 0, indicatorFont: 0,
    indicatorSpacing: 0, badgeRadius: 0, badgeFont: 0, coordFont: 0, coordOpacity: 0,
    terrainFont: 0, contentTitleFont: 0, indicatorY: 0, terrainY: 0, contentTitleY: 0, coordY: 0 },

  // Level 3: Area (0.60 - 0.80) - tiny indicator dots in row (no letters)
  { minZoom: 0.60, maxZoom: 0.80,
    showBorders: true, showStatusDot: true, showIndicators: true,
    showIndicatorLetters: false, showCountBadges: false, showCoordLabels: false,
    showTerrainLabels: false, showContentTitles: false,
    borderWidth: 1, statusDotRadius: 3, indicatorRadius: 2, indicatorFont: 0,
    indicatorSpacing: 6, badgeRadius: 0, badgeFont: 0, coordFont: 0, coordOpacity: 0,
    terrainFont: 0, contentTitleFont: 0, indicatorY: -16, terrainY: 0, contentTitleY: 0, coordY: 0 },

  // Level 4: Standard (0.80 - 1.00) - dots + coords (larger font at lower zoom)
  { minZoom: 0.80, maxZoom: 1.00,
    showBorders: true, showStatusDot: true, showIndicators: true,
    showIndicatorLetters: false, showCountBadges: false, showCoordLabels: true,
    showTerrainLabels: false, showContentTitles: false,
    borderWidth: 1, statusDotRadius: 3, indicatorRadius: 2, indicatorFont: 0,
    indicatorSpacing: 6, badgeRadius: 0, badgeFont: 0, coordFont: 6, coordOpacity: 0.5,
    terrainFont: 0, contentTitleFont: 0, indicatorY: -16, terrainY: 0, contentTitleY: 0, coordY: 18 },

  // Level 5: Detailed (1.00 - 1.50) - dots + badges
  { minZoom: 1.00, maxZoom: 1.50,
    showBorders: true, showStatusDot: true, showIndicators: true,
    showIndicatorLetters: false, showCountBadges: true, showCoordLabels: true,
    showTerrainLabels: false, showContentTitles: false,
    borderWidth: 1, statusDotRadius: 4, indicatorRadius: 3, indicatorFont: 0,
    indicatorSpacing: 8, badgeRadius: 3, badgeFont: 4, coordFont: 5, coordOpacity: 0.7,
    terrainFont: 0, contentTitleFont: 0, indicatorY: -15, terrainY: 0, contentTitleY: 0, coordY: 18 },

  // Level 6: Close (1.50 - 2.50) - add terrain labels (smaller font)
  { minZoom: 1.50, maxZoom: 2.50,
    showBorders: true, showStatusDot: true, showIndicators: true,
    showIndicatorLetters: false, showCountBadges: true, showCoordLabels: true,
    showTerrainLabels: true, showContentTitles: false,
    borderWidth: 1, statusDotRadius: 4, indicatorRadius: 3, indicatorFont: 0,
    indicatorSpacing: 8, badgeRadius: 3, badgeFont: 4, coordFont: 4, coordOpacity: 0.8,
    terrainFont: 6, contentTitleFont: 0, indicatorY: -15, terrainY: 6, contentTitleY: 0, coordY: 20 },

  // Level 7: Immersive (2.50 - 5.00) - smallest fonts, maximum info displayed
  { minZoom: 2.50, maxZoom: 5.01,
    showBorders: true, showStatusDot: true, showIndicators: true,
    showIndicatorLetters: false, showCountBadges: false, showCoordLabels: false,
    showTerrainLabels: true, showContentTitles: true,
    borderWidth: 1.5, statusDotRadius: 3, indicatorRadius: 2, indicatorFont: 0,
    indicatorSpacing: 6, badgeRadius: 0, badgeFont: 0, coordFont: 0, coordOpacity: 0,
    terrainFont: 4, contentTitleFont: 3, indicatorY: -18, terrainY: 4, contentTitleY: 14, coordY: 0 },
];

// Get LOD config for current zoom level
function getLOD(zoomLevel: number): LODConfig {
  for (const level of LOD_LEVELS) {
    if (zoomLevel >= level.minZoom && zoomLevel < level.maxZoom) {
      return level;
    }
  }
  return LOD_LEVELS[LOD_LEVELS.length - 1];
}

// Truncate text to fit within hex width
// At higher zoom, hex is larger on screen so more characters fit
function truncateForHex(text: string, fontSize: number, zoomLevel: number = 1): string {
  // Approximate: each character is ~0.6 * fontSize wide
  // Available width scales with zoom (hex is bigger on screen at higher zoom)
  const effectiveWidth = 50 * Math.max(1, zoomLevel);
  const maxChars = Math.floor(effectiveWidth / (fontSize * 0.6));
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + '…';
}

// Content indicator configuration
const CONTENT_INDICATORS: Record<ContentCategory, {
  color: string;
  letter: string;
  label: string;
}> = {
  locations:  { color: '#e91e63', letter: 'L', label: 'Locations' },
  encounters: { color: '#ff5722', letter: 'E', label: 'Encounters' },
  npcs:       { color: '#2196f3', letter: 'N', label: 'NPCs' },
  treasures:  { color: '#ffc107', letter: 'T', label: 'Treasures' },
  clues:      { color: '#9c27b0', letter: 'C', label: 'Clues' }
};

const CONTENT_CATEGORIES: ContentCategory[] = ['locations', 'encounters', 'npcs', 'treasures', 'clues'];

// Get content counts and resolved status for a hex
function getContentSummary(hex: Hex): { category: ContentCategory; total: number; unresolved: number }[] {
  return CONTENT_CATEGORIES
    .map(category => {
      const items = hex[category];
      return {
        category,
        total: items.length,
        unresolved: items.filter(item => !item.isResolved).length
      };
    })
    .filter(summary => summary.total > 0);
}

// Tooltip state type
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  category: ContentCategory;
  items: { title: string; isResolved: boolean }[];
}

// Store indicator positions for hit testing
interface IndicatorPosition {
  x: number;
  y: number;
  radius: number;
  coord: HexCoordinate;
  category: ContentCategory;
}

function HexGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { campaign, getHex } = useCampaign();
  const { selectedCoordinate, selectHex, clearSelection } = useSelection();

  // Tooltip state
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Zoom state - both current and target for smooth animation
  const [zoomLevel, setZoomLevel] = useState(1);
  const [targetZoom, setTargetZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [targetPan, setTargetPan] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  // Store indicator positions for mouse hover detection
  const indicatorPositionsRef = useRef<IndicatorPosition[]>([]);

  // Drag-to-pan state
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [isPotentialDrag, setIsPotentialDrag] = useState(false);
  const dragMapStartRef = useRef({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
    onActiveHex: false
  });

  // Get terrain color
  const getTerrainColor = useCallback((terrain: string): string => {
    const terrainType = campaign?.terrainTypes.find(t => t.name === terrain);
    return terrainType?.colorHex ?? '#666666';
  }, [campaign]);

  // Draw the grid
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !campaign) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get current LOD configuration based on zoom level
    const lod = getLOD(zoomLevel);

    // Clear indicator positions for this draw cycle
    const indicatorPositions: IndicatorPosition[] = [];

    // Clear canvas (before transforms)
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transforms
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // Draw all hexes
    for (let q = 0; q < campaign.gridWidth; q++) {
      for (let r = 0; r < campaign.gridHeight; r++) {
        const coord: HexCoordinate = { q, r };
        const center = hexCenter(coord);
        const hex = getHex(coord);
        const isSelected = selectedCoordinate?.q === q && selectedCoordinate?.r === r;

        // Determine fill color
        let fillColor = 'rgba(50, 50, 50, 0.3)'; // Empty/inactive hex
        if (hex && hex.terrain) {
          // Only apply terrain color if terrain is assigned
          const baseColor = getTerrainColor(hex.terrain);
          const opacity = hex.status === 'undiscovered' ? 0.3 : 0.7;
          fillColor = hexToRgba(baseColor, opacity);
        }

        // Draw hex fill
        drawHexPath(ctx, center, HEX_SIZE);
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Draw border (LOD-controlled)
        if (lod.showBorders || isSelected) {
          ctx.strokeStyle = isSelected ? '#4a9eff' : '#555555';
          ctx.lineWidth = isSelected ? 3 : lod.borderWidth;
          ctx.stroke();
        }

        // Draw status indicator (LOD-controlled)
        if (lod.showStatusDot && hex && hex.status !== 'undiscovered') {
          ctx.beginPath();
          ctx.arc(center.x, center.y, lod.statusDotRadius, 0, Math.PI * 2);
          ctx.fillStyle = hex.status === 'discovered' ? 'rgba(74, 158, 255, 0.7)' : 'rgba(76, 175, 80, 0.7)';
          ctx.fill();
        }

        // Draw content indicators in a row near top of hex (LOD-controlled)
        if (lod.showIndicators && hex) {
          const contentSummary = getContentSummary(hex);
          if (contentSummary.length > 0) {
            // Calculate row layout - centered horizontally
            const totalWidth = (contentSummary.length - 1) * lod.indicatorSpacing;
            const startX = center.x - totalWidth / 2;
            const rowY = center.y + lod.indicatorY;

            contentSummary.forEach((summary, index) => {
              const config = CONTENT_INDICATORS[summary.category];
              const isFullyResolved = summary.unresolved === 0;

              // Calculate position in row
              const indicatorX = startX + index * lod.indicatorSpacing;
              const indicatorY = rowY;

              // Store position for hit testing (in world coordinates)
              indicatorPositions.push({
                x: indicatorX,
                y: indicatorY,
                radius: lod.indicatorRadius,
                coord,
                category: summary.category
              });

              // Draw circle background
              ctx.beginPath();
              ctx.arc(indicatorX, indicatorY, lod.indicatorRadius, 0, Math.PI * 2);
              ctx.fillStyle = isFullyResolved
                ? hexToRgba(config.color, 0.4)  // Dimmed for resolved
                : config.color;
              ctx.fill();

              // Draw letter (LOD-controlled) - only at mid-zoom levels
              if (lod.showIndicatorLetters && lod.indicatorFont > 0) {
                ctx.font = `bold ${lod.indicatorFont}px sans-serif`;
                ctx.fillStyle = isFullyResolved ? 'rgba(255,255,255,0.6)' : '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(config.letter, indicatorX, indicatorY);
              }

              // Draw count badge (LOD-controlled)
              if (lod.showCountBadges && summary.total > 1 && lod.badgeRadius > 0) {
                const badgeX = indicatorX + lod.indicatorRadius - 1;
                const badgeY = indicatorY - lod.indicatorRadius + 1;

                ctx.beginPath();
                ctx.arc(badgeX, badgeY, lod.badgeRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#1e1e1e';
                ctx.fill();

                ctx.font = `bold ${lod.badgeFont}px sans-serif`;
                ctx.fillStyle = isFullyResolved ? 'rgba(255,255,255,0.6)' : '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(summary.total > 9 ? '9+' : String(summary.total), badgeX, badgeY);
              }
            });
          }
        }

        // Draw terrain label (LOD-controlled - appears at high zoom)
        if (lod.showTerrainLabels && hex && hex.terrain && lod.terrainFont > 0) {
          ctx.font = `bold ${lod.terrainFont}px sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Truncate to fit within hex (more chars fit at higher zoom)
          const terrainText = truncateForHex(hex.terrain, lod.terrainFont, zoomLevel);
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 3;
          ctx.fillText(terrainText, center.x, center.y + lod.terrainY);
          ctx.shadowBlur = 0;
        }

        // Draw content title previews (LOD-controlled - appears at highest zoom)
        // Shows items from the first category that has content (e.g., locations)
        if (lod.showContentTitles && hex && lod.contentTitleFont > 0) {
          // Find the first category with items
          let primaryCategory: ContentCategory | null = null;
          let items: { title: string }[] = [];
          for (const cat of CONTENT_CATEGORIES) {
            if (hex[cat].length > 0) {
              primaryCategory = cat;
              items = hex[cat];
              break;
            }
          }

          if (items.length > 0) {
            ctx.font = `${lod.contentTitleFont}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 2;

            // Calculate how many lines fit in available space
            const lineHeight = lod.contentTitleFont * 1.6;
            const availableHeight = 26 - lod.contentTitleY; // From start Y to hex edge
            const maxLines = Math.max(1, Math.floor(availableHeight / lineHeight));

            // If all items fit, show them all; otherwise reserve last line for "+N more"
            const needsOverflow = items.length > maxLines;
            const itemsToShow = needsOverflow ? maxLines - 1 : items.length;
            const remaining = items.length - itemsToShow;

            // Draw visible items
            for (let i = 0; i < itemsToShow; i++) {
              const y = center.y + lod.contentTitleY + i * lineHeight;
              const title = truncateForHex(items[i].title, lod.contentTitleFont, zoomLevel);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
              ctx.fillText(title, center.x, y);
            }

            // Draw "+N more" indicator if there are more items in this category
            if (remaining > 0) {
              const y = center.y + lod.contentTitleY + itemsToShow * lineHeight;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.fillText(`+${remaining} more`, center.x, y);
            }

            ctx.shadowBlur = 0;
          }
        }

        // Draw coordinate label (LOD-controlled)
        if (lod.showCoordLabels && lod.coordFont > 0) {
          ctx.font = `${lod.coordFont}px sans-serif`;
          ctx.fillStyle = `rgba(136, 136, 136, ${lod.coordOpacity})`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(`${q},${r}`, center.x, center.y + lod.coordY);
        }
      }
    }

    // Restore canvas transform state
    ctx.restore();

    // Store indicator positions for hit testing
    indicatorPositionsRef.current = indicatorPositions;
  }, [campaign, getHex, selectedCoordinate, getTerrainColor, zoomLevel, panOffset]);

  // Update canvas size and redraw on campaign change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !campaign) return;

    const size = canvasSize(campaign.gridWidth, campaign.gridHeight);
    canvas.width = size.width;
    canvas.height = size.height;

    draw();
  }, [campaign, draw]);

  // Redraw on selection change
  useEffect(() => {
    draw();
  }, [selectedCoordinate, draw]);

  // Helper to select hex at position (used by mouseUp when not dragging)
  const selectHexAtPosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!campaign) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Convert screen coordinates to world coordinates (accounting for zoom and pan)
    const worldX = (canvasX - panOffset.x) / zoomLevel;
    const worldY = (canvasY - panOffset.y) / zoomLevel;

    const coord = coordinateAt({ x: worldX, y: worldY }, campaign.gridWidth, campaign.gridHeight);
    if (coord) {
      selectHex(coord);
    }
  }, [campaign, selectHex, zoomLevel, panOffset]);

  // Handle mouse down - start potential drag
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !campaign) return; // Left click only

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Convert to world coordinates
    const worldX = (canvasX - panOffset.x) / zoomLevel;
    const worldY = (canvasY - panOffset.y) / zoomLevel;

    // Check if clicking on an active hex
    const coord = coordinateAt({ x: worldX, y: worldY }, campaign.gridWidth, campaign.gridHeight);
    const hex = coord ? getHex(coord) : null;
    const hasContent = hex && (
      hex.terrain ||
      hex.locations.length > 0 ||
      hex.encounters.length > 0 ||
      hex.npcs.length > 0 ||
      hex.treasures.length > 0 ||
      hex.clues.length > 0
    );

    setIsPotentialDrag(true);
    dragMapStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panOffset.x,
      panY: panOffset.y,
      onActiveHex: !!hasContent
    };
  }, [campaign, getHex, panOffset, zoomLevel]);

  // Handle mouse up - either complete drag or select hex
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPotentialDrag && !isDraggingMap) {
      // Was a click, not a drag - select hex
      selectHexAtPosition(e);
    }
    // Sync targetPan with current panOffset after drag ends
    if (isDraggingMap) {
      setTargetPan(panOffset);
    }
    setIsPotentialDrag(false);
    setIsDraggingMap(false);
  }, [isPotentialDrag, isDraggingMap, selectHexAtPosition, panOffset]);

  // Handle mouse move for drag panning and tooltips
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !campaign) return;

    // Check if we should start dragging
    if (isPotentialDrag && !isDraggingMap) {
      const dx = e.clientX - dragMapStartRef.current.x;
      const dy = e.clientY - dragMapStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const threshold = dragMapStartRef.current.onActiveHex
        ? DRAG_THRESHOLD_HEX
        : DRAG_THRESHOLD_EMPTY;

      if (distance > threshold) {
        setIsDraggingMap(true);
      }
    }

    // Handle drag panning
    if (isDraggingMap) {
      const dx = e.clientX - dragMapStartRef.current.x;
      const dy = e.clientY - dragMapStartRef.current.y;
      setPanOffset({
        x: dragMapStartRef.current.panX + dx,
        y: dragMapStartRef.current.panY + dy
      });
      setTooltip(null); // Hide tooltip while dragging
      return;
    }

    // Skip tooltip logic while potential drag is happening
    if (isPotentialDrag) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Convert screen coordinates to world coordinates (accounting for zoom and pan)
    const worldX = (canvasX - panOffset.x) / zoomLevel;
    const worldY = (canvasY - panOffset.y) / zoomLevel;

    // Check if hovering over any indicator (using squared distance to avoid sqrt)
    // Indicator positions are stored in world coordinates
    const hitIndicator = indicatorPositionsRef.current.find(indicator => {
      const dx = worldX - indicator.x;
      const dy = worldY - indicator.y;
      const distanceSquared = dx * dx + dy * dy;
      const radiusWithBuffer = indicator.radius + 2; // Small buffer for easier hovering
      return distanceSquared <= radiusWithBuffer * radiusWithBuffer;
    });

    if (hitIndicator) {
      const hex = getHex(hitIndicator.coord);
      if (hex) {
        const items = hex[hitIndicator.category].map(item => ({
          title: item.title,
          isResolved: item.isResolved
        }));

        // Position tooltip relative to container
        const containerRect = container.getBoundingClientRect();
        const tooltipX = e.clientX - containerRect.left + 10;
        const tooltipY = e.clientY - containerRect.top - 10;

        setTooltip({
          visible: true,
          x: tooltipX,
          y: tooltipY,
          category: hitIndicator.category,
          items
        });
      }
    } else {
      setTooltip(null);
    }
  }, [campaign, getHex, zoomLevel, panOffset, isPotentialDrag, isDraggingMap]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    // Reset drag state if mouse leaves canvas
    if (isPotentialDrag || isDraggingMap) {
      setIsPotentialDrag(false);
      setIsDraggingMap(false);
    }
  }, [isPotentialDrag, isDraggingMap]);

  // Handle keyboard navigation and panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!campaign) return;

      // Don't handle if focus is on an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check if canvas has focus for pan controls
      const canvasHasFocus = document.activeElement === canvasRef.current;

      // Pan with WSAD or Arrow keys (only when canvas focused)
      if (canvasHasFocus) {
        let panDelta = { x: 0, y: 0 };
        const key = e.key.toLowerCase();

        switch (key) {
          case 'w':
          case 'arrowup':
            panDelta.y = PAN_SPEED;
            break;
          case 's':
          case 'arrowdown':
            panDelta.y = -PAN_SPEED;
            break;
          case 'a':
          case 'arrowleft':
            panDelta.x = PAN_SPEED;
            break;
          case 'd':
          case 'arrowright':
            panDelta.x = -PAN_SPEED;
            break;
          case 'escape':
            e.preventDefault();
            clearSelection();
            return;
        }

        if (panDelta.x !== 0 || panDelta.y !== 0) {
          e.preventDefault();
          // Use targetPan for smooth animated panning
          setTargetPan(prev => ({ x: prev.x + panDelta.x, y: prev.y + panDelta.y }));
          if (!isAnimatingRef.current) {
            isAnimatingRef.current = true;
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [campaign, clearSelection]);

  // Smooth zoom and pan animation loop - animates both in sync
  useEffect(() => {
    const animate = () => {
      const zoomDiff = Math.abs(targetZoom - zoomLevel);
      const panDiffX = Math.abs(targetPan.x - panOffset.x);
      const panDiffY = Math.abs(targetPan.y - panOffset.y);

      // Snap thresholds
      const zoomDone = zoomDiff < 0.001;
      const panDone = panDiffX < 0.5 && panDiffY < 0.5;

      if (zoomDone && panDone) {
        // Snap to final values
        if (zoomLevel !== targetZoom) setZoomLevel(targetZoom);
        if (panOffset.x !== targetPan.x || panOffset.y !== targetPan.y) {
          setPanOffset(targetPan);
        }
        isAnimatingRef.current = false;
        return;
      }

      // Lerp both zoom and pan together
      const newZoom = zoomLevel + (targetZoom - zoomLevel) * ZOOM_ANIMATION_SPEED;
      const newPanX = panOffset.x + (targetPan.x - panOffset.x) * ZOOM_ANIMATION_SPEED;
      const newPanY = panOffset.y + (targetPan.y - panOffset.y) * ZOOM_ANIMATION_SPEED;

      setZoomLevel(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (isAnimatingRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [zoomLevel, targetZoom, panOffset, targetPan]);

  // Handle wheel zoom (centered on selected hex, or cursor if no selection)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    // Determine zoom direction
    const zoomDelta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    const newTargetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom + zoomDelta));

    if (newTargetZoom !== targetZoom) {
      const containerRect = container.getBoundingClientRect();

      if (selectedCoordinate) {
        // If a hex is selected, zoom toward it (center it in viewport)
        const hexWorld = hexCenter(selectedCoordinate);
        const viewportCenterX = containerRect.width / 2;
        const viewportCenterY = containerRect.height / 2;
        const newPanX = viewportCenterX - hexWorld.x * newTargetZoom;
        const newPanY = viewportCenterY - hexWorld.y * newTargetZoom;
        setTargetPan({ x: newPanX, y: newPanY });
      } else {
        // No selection - zoom toward cursor position
        // Get cursor position relative to container
        const cursorX = e.clientX - containerRect.left;
        const cursorY = e.clientY - containerRect.top;

        // Convert cursor to world coordinates using current pan/zoom
        const worldX = (cursorX - targetPan.x) / targetZoom;
        const worldY = (cursorY - targetPan.y) / targetZoom;

        // Calculate new pan to keep the world point under cursor after zoom
        const newPanX = cursorX - worldX * newTargetZoom;
        const newPanY = cursorY - worldY * newTargetZoom;
        setTargetPan({ x: newPanX, y: newPanY });
      }

      setTargetZoom(newTargetZoom);

      // Start animation if not already running
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
      }
    }
  }, [targetZoom, targetPan, selectedCoordinate]);

  // Zoom control functions for keyboard shortcuts (centered on selected hex)
  const zoomIn = useCallback(() => {
    const container = containerRef.current;
    const newTargetZoom = Math.min(MAX_ZOOM, targetZoom + ZOOM_STEP);

    if (newTargetZoom !== targetZoom) {
      // Center on selected hex if one exists
      if (selectedCoordinate && container) {
        const containerRect = container.getBoundingClientRect();
        const hexWorld = hexCenter(selectedCoordinate);
        const viewportCenterX = containerRect.width / 2;
        const viewportCenterY = containerRect.height / 2;
        const newPanX = viewportCenterX - hexWorld.x * newTargetZoom;
        const newPanY = viewportCenterY - hexWorld.y * newTargetZoom;
        setTargetPan({ x: newPanX, y: newPanY });
      }

      setTargetZoom(newTargetZoom);
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
      }
    }
  }, [targetZoom, selectedCoordinate]);

  const zoomOut = useCallback(() => {
    const container = containerRef.current;
    const newTargetZoom = Math.max(MIN_ZOOM, targetZoom - ZOOM_STEP);

    if (newTargetZoom !== targetZoom) {
      // Center on selected hex if one exists
      if (selectedCoordinate && container) {
        const containerRect = container.getBoundingClientRect();
        const hexWorld = hexCenter(selectedCoordinate);
        const viewportCenterX = containerRect.width / 2;
        const viewportCenterY = containerRect.height / 2;
        const newPanX = viewportCenterX - hexWorld.x * newTargetZoom;
        const newPanY = viewportCenterY - hexWorld.y * newTargetZoom;
        setTargetPan({ x: newPanX, y: newPanY });
      }

      setTargetZoom(newTargetZoom);
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
      }
    }
  }, [targetZoom, selectedCoordinate]);

  const resetZoom = useCallback(() => {
    setTargetZoom(1);
    setTargetPan({ x: 0, y: 0 });
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
    }
  }, []);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleZoomKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          resetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleZoomKeyDown);
    return () => window.removeEventListener('keydown', handleZoomKeyDown);
  }, [zoomIn, zoomOut, resetZoom]);

  // Handle zoom slider change
  const handleZoomSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setTargetZoom(newZoom);
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
    }
  }, []);

  if (!campaign) return null;

  return (
    <div className="hex-grid-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className={`hex-grid-canvas ${isDraggingMap ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        tabIndex={0}
      />
      {/* Zoom controls - fixed position */}
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={zoomOut} title="Zoom out (Cmd/Ctrl -)">−</button>
        <input
          type="range"
          className="zoom-slider"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={targetZoom}
          onChange={handleZoomSliderChange}
          title={`Zoom: ${Math.round(zoomLevel * 100)}%`}
        />
        <button className="zoom-btn" onClick={zoomIn} title="Zoom in (Cmd/Ctrl +)">+</button>
        <span className="zoom-label">{Math.round(zoomLevel * 100)}%</span>
        <button className="zoom-btn zoom-reset" onClick={resetZoom} title="Reset zoom (Cmd/Ctrl 0)">⟲</button>
      </div>
      {/* Content indicator tooltip */}
      {tooltip && (
        <div
          className={`hex-content-tooltip ${tooltip.visible ? 'visible' : ''}`}
          style={{
            left: tooltip.x,
            top: tooltip.y
          }}
        >
          <div className="tooltip-header">
            <span
              className="tooltip-indicator"
              style={{ backgroundColor: CONTENT_INDICATORS[tooltip.category].color }}
            >
              {CONTENT_INDICATORS[tooltip.category].letter}
            </span>
            <span className="tooltip-title">
              {CONTENT_INDICATORS[tooltip.category].label}
            </span>
          </div>
          <ul className="tooltip-items">
            {tooltip.items.map((item, index) => (
              <li key={index} className={item.isResolved ? 'resolved' : ''}>
                <span className="item-status">{item.isResolved ? '✓' : '○'}</span>
                <span className="item-title">{item.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Helper to convert hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(100, 100, 100, ${alpha})`;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default HexGrid;
