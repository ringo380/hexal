// PlayerHexGrid - Read-only canvas hex grid with fog-of-war for player view

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import type { PlayerCampaign } from '../../services/playerViewFilter';
import type { HexCoordinate } from '../../types';
import { DEFAULT_MARKER_TYPES } from '../../types/Markers';
import {
  HEX_SIZE,
  hexCenter,
  drawHexPath,
  hexPoints,
  coordinateAt,
  getVisibleHexRange
} from '../../services/hexGeometry';
import { hexToRgba, renderMarkers } from '../../services/hexRenderer';
import { figurineCache } from '../../services/markerFigurines';
import { createHexRegionMap, getRegionBorderSegments } from '../../services/regions';
import type { Region } from '../../types';
import type { WeatherField, WeatherSimulationConfig } from '../../types/Weather';
import { useWeatherOverlay } from '../../hooks/useWeatherOverlay';
import { useWeatherAudio } from '../../hooks/useWeatherAudio';
import PlayerLayerControl, { DEFAULT_PLAYER_LAYERS, type PlayerLayerVisibility } from './PlayerLayerControl';

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
  weatherField?: WeatherField;
  weatherConfig?: WeatherSimulationConfig;
}

function PlayerHexGrid({ campaign, selectedHexKey, onHexSelect, onHexDeselect, weatherField, weatherConfig }: PlayerHexGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track weather field version locally (increments when prop reference changes)
  const weatherFieldVersionRef = useRef(0);
  const prevWeatherFieldRef = useRef(weatherField);
  if (weatherField !== prevWeatherFieldRef.current) {
    weatherFieldVersionRef.current++;
    prevWeatherFieldRef.current = weatherField;
  }

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

  // Touch state
  const touchStartRef = useRef<{ x: number; y: number; time: number; panX: number; panY: number } | null>(null);
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);

  // Touch device detection for performance tuning
  const isTouchDevice = useMemo(() => 'ontouchstart' in window, []);

  // Layer visibility (local state — player view has reduced set)
  const [playerLayers, setPlayerLayers] = useState<PlayerLayerVisibility>(DEFAULT_PLAYER_LAYERS);
  const togglePlayerLayer = useCallback((key: keyof PlayerLayerVisibility) => {
    setPlayerLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Weather overlay with layer visibility applied (halve particle density on touch devices)
  const effectiveWeatherConfig = useMemo(() => {
    if (!weatherConfig) return undefined;
    return {
      ...weatherConfig,
      showIsobars: weatherConfig.showIsobars && playerLayers.isobars,
      showFronts: weatherConfig.showFronts && playerLayers.fronts,
      showParticles: weatherConfig.showParticles && playerLayers.weatherParticles,
      ...(isTouchDevice && weatherConfig.particleDensity != null
        ? { particleDensity: weatherConfig.particleDensity * 0.5 }
        : {}),
    };
  }, [weatherConfig, playerLayers.isobars, playerLayers.fronts, playerLayers.weatherParticles, isTouchDevice]);

  const playerWeatherLayerFlags = useMemo(() => ({
    cloudShadows: playerLayers.cloudShadows,
    pressureLabels: playerLayers.pressureLabels,
    windArrows: playerLayers.windArrows,
  }), [playerLayers.cloudShadows, playerLayers.pressureLabels, playerLayers.windArrows]);

  const { renderOverlay: renderWeatherOverlay } = useWeatherOverlay({
    field: weatherField || {},
    fieldVersion: weatherFieldVersionRef.current,
    config: effectiveWeatherConfig,
    gridWidth: campaign.gridWidth,
    gridHeight: campaign.gridHeight,
    isDMView: false,
    layerFlags: playerWeatherLayerFlags
  });

  // Weather audio (local state for player view)
  const [playerAudioEnabled, setPlayerAudioEnabled] = useState(false);
  const [playerAudioVolume, setPlayerAudioVolume] = useState(0.5);

  const { updateAudio } = useWeatherAudio({
    field: weatherField || {},
    enabled: playerAudioEnabled,
    volume: playerAudioVolume,
    gridWidth: campaign.gridWidth,
    gridHeight: campaign.gridHeight,
  });

  const getTerrainColor = useCallback((terrain: string): string => {
    const terrainType = campaign.terrainTypes.find(t => t.name === terrain);
    return terrainType?.colorHex ?? '#666666';
  }, [campaign.terrainTypes]);

  // Parse selectedHexKey to coordinate
  const selectedCoord = selectedHexKey
    ? { q: parseInt(selectedHexKey.split(',')[0]), r: parseInt(selectedHexKey.split(',')[1]) }
    : null;

  // Memoize region adapters — only recompute when regions change
  const regionAdapters: Region[] = useMemo(() =>
    campaign.regions.map(r => ({ ...r, description: '', tags: [], notes: '' })),
    [campaign.regions]
  );

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
    const hexRegionMap = createHexRegionMap(regionAdapters);
    const NEIGHBOR_TO_EDGE = [5, 0, 1, 2, 3, 4];

    // Calculate visible hex range for viewport culling
    const visibleRange = getVisibleHexRange(
      panOffset.x, panOffset.y, zoomLevel,
      canvas.width, canvas.height,
      campaign.gridWidth, campaign.gridHeight
    );

    // PASS 1: Draw hex backgrounds
    // Track current canvas text properties to avoid redundant assignments
    let currentFont = '';
    let currentAlign = '';
    let currentBaseline = '';

    for (let q = visibleRange.qMin; q <= visibleRange.qMax; q++) {
      for (let r = visibleRange.rMin; r <= visibleRange.rMax; r++) {
        const coord: HexCoordinate = { q, r };
        const center = hexCenter(coord);
        const key = `${q},${r}`;
        const hex = campaign.hexes[key] || null;
        const isSelected = selectedCoord?.q === q && selectedCoord?.r === r;

        // Determine fill color based on status and adjacency visibility
        let fillColor = 'rgba(50, 50, 50, 0.3)';
        const adjVis = hex?.adjacencyVisibility;
        if (hex && hex.terrain) {
          const baseColor = getTerrainColor(hex.terrain);
          let opacity: number;
          if (hex.status === 'undiscovered') {
            if (adjVis === 'silhouette') {
              opacity = 0.08;
            } else if (adjVis === 'dim') {
              opacity = 0.05;
            } else {
              opacity = 0.15;
            }
          } else {
            opacity = 0.7;
          }
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

        // Fog overlay for undiscovered (with adjacency-aware darkening)
        if (hex && hex.status === 'undiscovered') {
          drawHexPath(ctx, center, HEX_SIZE);
          let fogOpacity: number;
          if (adjVis === 'silhouette') {
            fogOpacity = 0.75;
          } else if (adjVis === 'dim') {
            fogOpacity = 0.85;
          } else {
            fogOpacity = 0.6;
          }
          ctx.fillStyle = hexToRgba('#1e1e1e', fogOpacity);
          ctx.fill();
        }

        // Border
        ctx.strokeStyle = isSelected ? '#4a9eff' : '#555555';
        ctx.lineWidth = isSelected ? 3 : 0.75;
        ctx.stroke();

        // Status indicator (discovered/cleared dots, layer visibility gated)
        if (playerLayers.statusIndicators && hex && hex.status !== 'undiscovered' && zoomLevel >= 0.40) {
          ctx.beginPath();
          ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = hex.status === 'discovered' ? 'rgba(74, 158, 255, 0.7)' : 'rgba(76, 175, 80, 0.7)';
          ctx.fill();
        }

        // Terrain label (layer visibility gated)
        if (playerLayers.terrainLabels && hex && hex.terrain && hex.status !== 'undiscovered' && zoomLevel >= 1.5) {
          const wantFont = 'bold 6px sans-serif';
          if (currentFont !== wantFont) { ctx.font = wantFont; currentFont = wantFont; }
          if (currentAlign !== 'center') { ctx.textAlign = 'center'; currentAlign = 'center'; }
          if (currentBaseline !== 'middle') { ctx.textBaseline = 'middle'; currentBaseline = 'middle'; }
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 3;
          ctx.fillText(hex.terrain, center.x, center.y + 6);
          ctx.shadowBlur = 0;
        }

        // Coordinate label (layer visibility gated)
        if (playerLayers.coordinateLabels && hex && hex.status !== 'undiscovered' && zoomLevel >= 0.8) {
          const wantFont = '5px sans-serif';
          if (currentFont !== wantFont) { ctx.font = wantFont; currentFont = wantFont; }
          if (currentAlign !== 'center') { ctx.textAlign = 'center'; currentAlign = 'center'; }
          if (currentBaseline !== 'alphabetic') { ctx.textBaseline = 'alphabetic'; currentBaseline = 'alphabetic'; }
          ctx.fillStyle = 'rgba(136, 136, 136, 0.5)';
          ctx.fillText(`${q},${r}`, center.x, center.y + 18);
        }
      }
    }

    // CONNECTION PASS: Draw rivers and roads (layer visibility gated)
    if (playerLayers.connections && zoomLevel >= 0.25) {
      for (let q = visibleRange.qMin; q <= visibleRange.qMax; q++) {
        for (let r = visibleRange.rMin; r <= visibleRange.rMax; r++) {
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

    // PASS 2: Region borders (layer visibility gated)
    if (playerLayers.regionBorders) for (const region of regionAdapters) {
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

    // PASS 3: Region name labels (layer visibility gated)
    if (playerLayers.regionLabels && zoomLevel >= 0.25 && zoomLevel <= 0.80) {
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
        const wantFont = `bold ${fontSize}px sans-serif`;
        if (currentFont !== wantFont) { ctx.font = wantFont; currentFont = wantFont; }
        if (currentAlign !== 'center') { ctx.textAlign = 'center'; currentAlign = 'center'; }
        if (currentBaseline !== 'middle') { ctx.textBaseline = 'middle'; currentBaseline = 'middle'; }
        ctx.fillStyle = hexToRgba(region.color, 0.9);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(region.name, cx, cy);
        ctx.shadowBlur = 0;
      }
    }

    // WEATHER OVERLAY PASS: Gradient overlay (layer visibility gated)
    if (playerLayers.weatherOverlay) {
      ctx.save();
      ctx.scale(1 / zoomLevel, 1 / zoomLevel);
      ctx.translate(-panOffset.x, -panOffset.y);
      renderWeatherOverlay(ctx, canvas.width, canvas.height, panOffset.x, panOffset.y, zoomLevel);
      ctx.restore();
    }

    // Update weather audio with current camera state
    updateAudio(zoomLevel, panOffset.x, panOffset.y, canvas.width, canvas.height);

    // PASS 4: Markers (layer visibility gated)
    if (playerLayers.markers) for (let q = visibleRange.qMin; q <= visibleRange.qMax; q++) {
      for (let r = visibleRange.rMin; r <= visibleRange.rMax; r++) {
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
  }, [campaign, zoomLevel, panOffset, selectedCoord, getTerrainColor, renderWeatherOverlay, playerLayers, updateAudio, regionAdapters]);

  // Track container size for responsive canvas
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Update canvas size and redraw on campaign or container size change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (containerSize.width === 0 || containerSize.height === 0) return;
    canvas.width = containerSize.width;
    canvas.height = containerSize.height;
    draw();
  }, [campaign, draw, containerSize]);

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
          const key = `${coord.q},${coord.r}`;
          const hex = campaign.hexes[key];
          // Only allow selecting discovered/cleared hexes — prevent leaking terrain info
          if (hex && hex.status !== 'undiscovered') {
            onHexSelect(coord);
          }
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

  // Touch handlers for mobile pan, pinch-to-zoom, and tap-to-select
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        panX: panOffset.x,
        panY: panOffset.y
      };
      pinchStartRef.current = null;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartRef.current = {
        dist: Math.sqrt(dx * dx + dy * dy),
        zoom: zoomLevel
      };
      touchStartRef.current = null;
    }
  }, [panOffset, zoomLevel]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      setPanOffset({
        x: touchStartRef.current.panX + dx,
        y: touchStartRef.current.panY + dy
      });
    } else if (e.touches.length === 2 && pinchStartRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchStartRef.current.dist;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStartRef.current.zoom * scale));

      const container = containerRef.current;
      if (container) {
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const containerRect = container.getBoundingClientRect();
        const px = cx - containerRect.left;
        const py = cy - containerRect.top;
        const worldX = (px - panOffset.x) / zoomLevel;
        const worldY = (py - panOffset.y) / zoomLevel;
        setPanOffset({
          x: px - worldX * newZoom,
          y: py - worldY * newZoom
        });
      }
      setZoomLevel(newZoom);
      setTargetZoom(newZoom);
    }
  }, [panOffset, zoomLevel]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (touchStartRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const duration = Date.now() - touchStartRef.current.time;

      if (dist < 10 && duration < 300) {
        // Tap — select hex
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const canvasX = (touch.clientX - rect.left) * scaleX;
          const canvasY = (touch.clientY - rect.top) * scaleY;
          const worldX = (canvasX - panOffset.x) / zoomLevel;
          const worldY = (canvasY - panOffset.y) / zoomLevel;

          const coord = coordinateAt({ x: worldX, y: worldY }, campaign.gridWidth, campaign.gridHeight);
          if (coord) {
            onHexSelect(coord);
          }
        }
      } else {
        // Drag ended — sync target pan
        setTargetPan(panOffset);
      }
    }
    touchStartRef.current = null;
    pinchStartRef.current = null;
  }, [panOffset, zoomLevel, campaign, onHexSelect]);

  return (
    <div className="player-hex-grid-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className={`player-hex-grid-canvas ${isDragging ? 'dragging' : ''}`}
        role="img"
        aria-label="Player hex grid map"
        style={{ touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
      />
      <PlayerLayerControl
        layers={playerLayers}
        onToggle={togglePlayerLayer}
        weatherAudioEnabled={playerAudioEnabled}
        weatherAudioVolume={playerAudioVolume}
        onWeatherAudioToggle={() => setPlayerAudioEnabled(prev => !prev)}
        onWeatherAudioVolumeChange={setPlayerAudioVolume}
      />
    </div>
  );
}

export default PlayerHexGrid;
