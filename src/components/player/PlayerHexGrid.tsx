// PlayerHexGrid - Read-only canvas hex grid with fog-of-war for player view

import { useRef, useEffect, useCallback, useState } from 'react';
import type { PlayerCampaign } from '../../services/playerViewFilter';
import type { HexCoordinate } from '../../types';
import { DEFAULT_MARKER_TYPES } from '../../types/Markers';
import {
  HEX_SIZE,
  hexCenter,
  canvasSize,
  drawHexPath,
  hexPoints,
  coordinateAt
} from '../../services/hexGeometry';
import { hexToRgba, renderMarkers } from '../../services/hexRenderer';
import { figurineCache } from '../../services/markerFigurines';
import { createHexRegionMap, getRegionBorderSegments } from '../../services/regions';
import type { Region } from '../../types';

// Zoom config
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 0.03;
const ZOOM_ANIMATION_SPEED = 0.12;
const DRAG_THRESHOLD = 3;
const PAN_SPEED = 20;

interface PlayerHexGridProps {
  campaign: PlayerCampaign;
  selectedHexKey: string | null;
  onHexSelect: (coord: HexCoordinate) => void;
  onHexDeselect: () => void;
}

function PlayerHexGrid({ campaign, selectedHexKey, onHexSelect, onHexDeselect }: PlayerHexGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom/pan state
  const [zoomLevel, setZoomLevel] = useState(0.8);
  const [targetZoom, setTargetZoom] = useState(0.8);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [targetPan, setTargetPan] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isPotentialDrag, setIsPotentialDrag] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const getTerrainColor = useCallback((terrain: string): string => {
    const terrainType = campaign.terrainTypes.find(t => t.name === terrain);
    return terrainType?.colorHex ?? '#666666';
  }, [campaign.terrainTypes]);

  // Parse selectedHexKey to coordinate
  const selectedCoord = selectedHexKey
    ? { q: parseInt(selectedHexKey.split(',')[0]), r: parseInt(selectedHexKey.split(',')[1]) }
    : null;

  // Draw the grid
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const markerTypes = campaign.markerTypes || DEFAULT_MARKER_TYPES;

    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // Build hex-to-region lookup
    const regionAdapters: Region[] = campaign.regions.map(r => ({
      ...r,
      description: '',
      tags: [],
      notes: ''
    }));
    const hexRegionMap = createHexRegionMap(regionAdapters);
    const NEIGHBOR_TO_EDGE = [5, 0, 1, 2, 3, 4];

    // PASS 1: Draw hex backgrounds
    for (let q = 0; q < campaign.gridWidth; q++) {
      for (let r = 0; r < campaign.gridHeight; r++) {
        const coord: HexCoordinate = { q, r };
        const center = hexCenter(coord);
        const key = `${q},${r}`;
        const hex = campaign.hexes[key] || null;
        const isSelected = selectedCoord?.q === q && selectedCoord?.r === r;

        // Determine fill color
        let fillColor = 'rgba(50, 50, 50, 0.3)';
        if (hex && hex.terrain) {
          const baseColor = getTerrainColor(hex.terrain);
          const opacity = hex.status === 'undiscovered' ? 0.15 : 0.7;
          fillColor = hexToRgba(baseColor, opacity);
        }

        // Draw hex fill
        drawHexPath(ctx, center, HEX_SIZE);
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Region overlay
        const region = hexRegionMap.get(key);
        if (region && hex?.status !== 'undiscovered') {
          drawHexPath(ctx, center, HEX_SIZE);
          ctx.fillStyle = hexToRgba(region.color, 0.25);
          ctx.fill();
        }

        // Fog overlay for undiscovered
        if (hex && hex.status === 'undiscovered') {
          drawHexPath(ctx, center, HEX_SIZE);
          ctx.fillStyle = hexToRgba('#1e1e1e', 0.6);
          ctx.fill();
        }

        // Border
        ctx.strokeStyle = isSelected ? '#4a9eff' : '#555555';
        ctx.lineWidth = isSelected ? 3 : 0.75;
        ctx.stroke();

        // Status indicator (discovered/cleared dots)
        if (hex && hex.status !== 'undiscovered' && zoomLevel >= 0.40) {
          ctx.beginPath();
          ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = hex.status === 'discovered' ? 'rgba(74, 158, 255, 0.7)' : 'rgba(76, 175, 80, 0.7)';
          ctx.fill();
        }

        // Terrain label (only for discovered/cleared, at sufficient zoom)
        if (hex && hex.terrain && hex.status !== 'undiscovered' && zoomLevel >= 1.5) {
          ctx.font = 'bold 6px sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 3;
          ctx.fillText(hex.terrain, center.x, center.y + 6);
          ctx.shadowBlur = 0;
        }

        // Coordinate label (only for discovered/cleared, at sufficient zoom)
        if (hex && hex.status !== 'undiscovered' && zoomLevel >= 0.8) {
          ctx.font = '5px sans-serif';
          ctx.fillStyle = 'rgba(136, 136, 136, 0.5)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(`${q},${r}`, center.x, center.y + 18);
        }
      }
    }

    // CONNECTION PASS: Draw rivers and roads (visible on discovered/cleared hexes)
    if (zoomLevel >= 0.25) {
      for (let q = 0; q < campaign.gridWidth; q++) {
        for (let r = 0; r < campaign.gridHeight; r++) {
          const key = `${q},${r}`;
          const hex = campaign.hexes[key];
          if (!hex?.connections) continue;
          if (hex.status === 'undiscovered') continue;
          const coord: HexCoordinate = { q, r };
          const center = hexCenter(coord);
          const points = hexPoints(center, HEX_SIZE);

          // Draw rivers (blue curved lines)
          if (hex.connections.rivers.length > 0) {
            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (const edge of hex.connections.rivers) {
              const p1 = points[edge];
              const p2 = points[(edge + 1) % 6];
              const edgeMidX = (p1.x + p2.x) / 2;
              const edgeMidY = (p1.y + p2.y) / 2;

              ctx.beginPath();
              ctx.moveTo(edgeMidX, edgeMidY);
              const cpX = center.x + (edgeMidX - center.x) * 0.3;
              const cpY = center.y + (edgeMidY - center.y) * 0.3;
              ctx.quadraticCurveTo(cpX, cpY, center.x, center.y);
              ctx.stroke();
            }
          }

          // Draw roads (brown dashed lines)
          if (hex.connections.roads.length > 0 && zoomLevel >= 0.40) {
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.setLineDash([3, 3]);

            for (const edge of hex.connections.roads) {
              const p1 = points[edge];
              const p2 = points[(edge + 1) % 6];
              const edgeMidX = (p1.x + p2.x) / 2;
              const edgeMidY = (p1.y + p2.y) / 2;

              ctx.beginPath();
              ctx.moveTo(edgeMidX, edgeMidY);
              ctx.lineTo(center.x, center.y);
              ctx.stroke();
            }

            ctx.setLineDash([]);
          }
        }
      }
    }

    // PASS 2: Region borders
    for (const region of regionAdapters) {
      if (region.hexKeys.length === 0) continue;
      const borderSegments = getRegionBorderSegments(region);

      ctx.strokeStyle = hexToRgba(region.color, 0.6);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      for (const segment of borderSegments) {
        const center = hexCenter(segment.coord);
        const points = hexPoints(center, HEX_SIZE);
        const edgeIndex = NEIGHBOR_TO_EDGE[segment.edgeIndex];
        const p1 = points[edgeIndex];
        const p2 = points[(edgeIndex + 1) % 6];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // PASS 3: Region name labels
    if (zoomLevel >= 0.25 && zoomLevel <= 0.80) {
      for (const region of campaign.regions) {
        if (region.hexKeys.length === 0) continue;

        let sumX = 0, sumY = 0;
        for (const key of region.hexKeys) {
          const parsed = key.split(',');
          const rq = parseInt(parsed[0], 10);
          const rr = parseInt(parsed[1], 10);
          const c = hexCenter({ q: rq, r: rr });
          sumX += c.x;
          sumY += c.y;
        }
        const cx = sumX / region.hexKeys.length;
        const cy = sumY / region.hexKeys.length;

        const fontSize = Math.max(8, Math.min(14, 10 / zoomLevel));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = hexToRgba(region.color, 0.9);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(region.name, cx, cy);
        ctx.shadowBlur = 0;
      }
    }

    // PASS 4: Markers (visible on discovered/cleared hexes)
    for (let q = 0; q < campaign.gridWidth; q++) {
      for (let r = 0; r < campaign.gridHeight; r++) {
        const key = `${q},${r}`;
        const hex = campaign.hexes[key];
        if (hex && hex.markers && hex.markers.length > 0 && hex.status !== 'undiscovered') {
          const center = hexCenter({ q, r });
          // Adapt hex data for renderMarkers (needs full Hex-like shape)
          const adaptedHex = {
            ...hex,
            notes: '',
            tags: [] as string[],
            locations: [],
            encounters: [],
            npcs: [],
            treasures: [],
            clues: []
          };
          renderMarkers(ctx, adaptedHex as any, center, markerTypes, zoomLevel);
        }
      }
    }

    ctx.restore();
  }, [campaign, zoomLevel, panOffset, selectedCoord, getTerrainColor]);

  // Canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = canvasSize(campaign.gridWidth, campaign.gridHeight);
    canvas.width = size.width;
    canvas.height = size.height;

    draw();
  }, [campaign, draw]);

  // Preload figurine cache when campaign data arrives
  useEffect(() => {
    const markerTypes = campaign.markerTypes || DEFAULT_MARKER_TYPES;
    figurineCache.preload(markerTypes).then(() => {
      draw();
    }).catch(err => {
      console.warn('Failed to preload figurine cache:', err);
    });
  }, [campaign.markerTypes, draw]);

  // Smooth animation loop
  useEffect(() => {
    const animate = () => {
      const zoomDiff = Math.abs(targetZoom - zoomLevel);
      const panDiffX = Math.abs(targetPan.x - panOffset.x);
      const panDiffY = Math.abs(targetPan.y - panOffset.y);

      if (zoomDiff < 0.001 && panDiffX < 0.5 && panDiffY < 0.5) {
        if (zoomLevel !== targetZoom) setZoomLevel(targetZoom);
        if (panOffset.x !== targetPan.x || panOffset.y !== targetPan.y) {
          setPanOffset(targetPan);
        }
        isAnimatingRef.current = false;
        return;
      }

      setZoomLevel(zoomLevel + (targetZoom - zoomLevel) * ZOOM_ANIMATION_SPEED);
      setPanOffset({
        x: panOffset.x + (targetPan.x - panOffset.x) * ZOOM_ANIMATION_SPEED,
        y: panOffset.y + (targetPan.y - panOffset.y) * ZOOM_ANIMATION_SPEED
      });

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

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const zoomDelta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    const newTargetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom + zoomDelta));

    if (newTargetZoom !== targetZoom) {
      const containerRect = container.getBoundingClientRect();
      const cursorX = e.clientX - containerRect.left;
      const cursorY = e.clientY - containerRect.top;
      const worldX = (cursorX - targetPan.x) / targetZoom;
      const worldY = (cursorY - targetPan.y) / targetZoom;
      const newPanX = cursorX - worldX * newTargetZoom;
      const newPanY = cursorY - worldY * newTargetZoom;

      setTargetPan({ x: newPanX, y: newPanY });
      setTargetZoom(newTargetZoom);

      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
      }
    }
  }, [targetZoom, targetPan]);

  // Mouse handlers for pan + click-to-select
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    setIsPotentialDrag(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panOffset.x,
      panY: panOffset.y
    };
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPotentialDrag && !isDragging) return;

    if (isPotentialDrag && !isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        setIsDragging(true);
      }
    }

    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPanOffset({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy
      });
    }
  }, [isPotentialDrag, isDragging]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPotentialDrag && !isDragging) {
      // Click — select hex
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        const worldX = (canvasX - panOffset.x) / zoomLevel;
        const worldY = (canvasY - panOffset.y) / zoomLevel;

        const coord = coordinateAt({ x: worldX, y: worldY }, campaign.gridWidth, campaign.gridHeight);
        if (coord) {
          onHexSelect(coord);
        }
      }
    }
    if (isDragging) {
      setTargetPan(panOffset);
    }
    setIsPotentialDrag(false);
    setIsDragging(false);
  }, [isPotentialDrag, isDragging, panOffset, zoomLevel, campaign, onHexSelect]);

  const handleMouseLeave = useCallback(() => {
    setIsPotentialDrag(false);
    setIsDragging(false);
  }, []);

  // Zoom control functions for keyboard shortcuts
  const selectedCoordForZoom = selectedCoord;

  const zoomIn = useCallback(() => {
    const container = containerRef.current;
    const newTargetZoom = Math.min(MAX_ZOOM, targetZoom + ZOOM_STEP);
    if (newTargetZoom !== targetZoom) {
      if (selectedCoordForZoom && container) {
        const containerRect = container.getBoundingClientRect();
        const hexWorld = hexCenter(selectedCoordForZoom);
        setTargetPan({
          x: containerRect.width / 2 - hexWorld.x * newTargetZoom,
          y: containerRect.height / 2 - hexWorld.y * newTargetZoom
        });
      }
      setTargetZoom(newTargetZoom);
      if (!isAnimatingRef.current) isAnimatingRef.current = true;
    }
  }, [targetZoom, selectedCoordForZoom]);

  const zoomOut = useCallback(() => {
    const container = containerRef.current;
    const newTargetZoom = Math.max(MIN_ZOOM, targetZoom - ZOOM_STEP);
    if (newTargetZoom !== targetZoom) {
      if (selectedCoordForZoom && container) {
        const containerRect = container.getBoundingClientRect();
        const hexWorld = hexCenter(selectedCoordForZoom);
        setTargetPan({
          x: containerRect.width / 2 - hexWorld.x * newTargetZoom,
          y: containerRect.height / 2 - hexWorld.y * newTargetZoom
        });
      }
      setTargetZoom(newTargetZoom);
      if (!isAnimatingRef.current) isAnimatingRef.current = true;
    }
  }, [targetZoom, selectedCoordForZoom]);

  const resetZoom = useCallback(() => {
    setTargetZoom(1);
    setTargetPan({ x: 0, y: 0 });
    if (!isAnimatingRef.current) isAnimatingRef.current = true;
  }, []);

  // Keyboard navigation: WSAD/Arrow pan, Escape deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const canvasHasFocus = document.activeElement === canvasRef.current;
      if (!canvasHasFocus) return;

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
          onHexDeselect();
          return;
      }

      if (panDelta.x !== 0 || panDelta.y !== 0) {
        e.preventDefault();
        setTargetPan(prev => ({ x: prev.x + panDelta.x, y: prev.y + panDelta.y }));
        if (!isAnimatingRef.current) isAnimatingRef.current = true;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onHexDeselect]);

  // Keyboard zoom: Cmd/Ctrl + Plus/Minus/Zero
  useEffect(() => {
    const handleZoomKeyDown = (e: KeyboardEvent) => {
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

  return (
    <div className="player-hex-grid-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className={`player-hex-grid-canvas ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        tabIndex={0}
      />
    </div>
  );
}

export default PlayerHexGrid;
