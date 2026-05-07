import { useState, useRef, useCallback, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
}

interface GridNavigationOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  animationSpeed?: number;
  dragThresholdEmpty?: number;
  dragThresholdHex?: number;
  initialZoom?: number;
  initialPan?: Point;
  /**
   * Invoked on every animation frame after refs are updated. Use to redraw
   * a canvas that reads zoom/pan from refs (so the canvas stays smooth
   * while React state is throttled for UI labels).
   */
  onTick?: () => void;
  /**
   * Throttle for syncing zoomLevel/panOffset React state during animation
   * (ms). Defaults to 100ms (matches the documented HexGrid pattern).
   * Consumers whose draw() reads zoom/pan from React state (rather than
   * refs) should pass a smaller value (e.g. 16) to keep their canvas
   * smooth at the cost of more re-renders.
   */
  stateSyncIntervalMs?: number;
}

export function useGridNavigation(options: GridNavigationOptions = {}) {
  const {
    minZoom = 0.15,
    maxZoom = 5.0,
    zoomStep = 0.03,
    animationSpeed = 0.12,
    dragThresholdEmpty = 3,
    dragThresholdHex = 8,
    initialZoom = 1,
    initialPan = { x: 0, y: 0 },
    onTick,
    stateSyncIntervalMs = 100
  } = options;

  // Mirror onTick into a ref so the animation callback stays stable.
  const onTickRef = useRef(onTick);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);

  // State for React UI
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  const [panOffset, setPanOffset] = useState(initialPan);
  
  // Target values for animation
  const [targetZoom, setTargetZoom] = useState(initialZoom);
  const [targetPan, setTargetPan] = useState(initialPan);

  // Refs as source of truth for high-frequency updates and animation loop
  const zoomRef = useRef(initialZoom);
  const panRef = useRef(initialPan);
  const targetZoomRef = useRef(initialZoom);
  const targetPanRef = useRef(initialPan);

  const isAnimatingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastStateSyncRef = useRef(0);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isPotentialDrag, setIsPotentialDrag] = useState(false);
  const dragStartRef = useRef({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
    onActiveHex: false
  });

  // Keep refs in sync with external state changes (if any)
  useEffect(() => {
    zoomRef.current = zoomLevel;
    panRef.current = panOffset;
  }, [zoomLevel, panOffset]);

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const animate = (time: number) => {
      let needsMoreFrames = false;

      // Smoothly interpolate zoom
      const zoomDiff = targetZoomRef.current - zoomRef.current;
      if (Math.abs(zoomDiff) > 0.001) {
        zoomRef.current += zoomDiff * animationSpeed;
        needsMoreFrames = true;
      } else {
        zoomRef.current = targetZoomRef.current;
      }

      // Smoothly interpolate pan
      const panDiffX = targetPanRef.current.x - panRef.current.x;
      const panDiffY = targetPanRef.current.y - panRef.current.y;
      if (Math.abs(panDiffX) > 0.1 || Math.abs(panDiffY) > 0.1) {
        panRef.current.x += panDiffX * animationSpeed;
        panRef.current.y += panDiffY * animationSpeed;
        needsMoreFrames = true;
      } else {
        panRef.current = { ...targetPanRef.current };
      }

      // Throttle React state updates (default ~10fps for zoom labels) — the
      // canvas redraws every frame via onTick using the refs directly, so
      // React state doesn't need to update on every animation frame.
      if (time - lastStateSyncRef.current > stateSyncIntervalMs) {
        setZoomLevel(zoomRef.current);
        setPanOffset({ ...panRef.current });
        lastStateSyncRef.current = time;
      }

      // Per-frame canvas redraw (consumer reads from zoomRef/panRef).
      onTickRef.current?.();

      if (needsMoreFrames) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
        animationFrameRef.current = null;
        // Final sync to lock React state on the exact target.
        setZoomLevel(zoomRef.current);
        setPanOffset({ ...panRef.current });
        onTickRef.current?.();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animationSpeed, stateSyncIntervalMs]);

  // Sync target refs with state and kick the animation loop
  useEffect(() => {
    targetZoomRef.current = targetZoom;
    targetPanRef.current = targetPan;
    startAnimation();
  }, [targetZoom, targetPan, startAnimation]);

  const handleZoom = useCallback((deltaY: number, clientX: number, clientY: number, containerRect: DOMRect) => {
    const zoomFactor = deltaY > 0 ? (1 - zoomStep) : (1 + zoomStep);
    const newZoom = Math.min(Math.max(targetZoomRef.current * zoomFactor, minZoom), maxZoom);
    
    if (newZoom === targetZoomRef.current) return;

    // Zoom toward mouse position
    const mouseX = clientX - containerRect.left;
    const mouseY = clientY - containerRect.top;

    // Current world position under mouse
    const worldX = (mouseX - targetPanRef.current.x) / targetZoomRef.current;
    const worldY = (mouseY - targetPanRef.current.y) / targetZoomRef.current;

    // New pan to keep that world position under mouse
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    targetZoomRef.current = newZoom;
    targetPanRef.current = { x: newPanX, y: newPanY };
    setTargetZoom(newZoom);
    setTargetPan({ x: newPanX, y: newPanY });

    startAnimation();
  }, [minZoom, maxZoom, zoomStep, startAnimation]);

  const handlePan = useCallback((dx: number, dy: number) => {
    targetPanRef.current = {
      x: targetPanRef.current.x + dx,
      y: targetPanRef.current.y + dy
    };
    setTargetPan({ ...targetPanRef.current });
    startAnimation();
  }, [startAnimation]);

  const handleDragStart = useCallback((clientX: number, clientY: number, onActiveHex: boolean = false) => {
    setIsPotentialDrag(true);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
      onActiveHex
    };
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (isPotentialDrag && !isDragging) {
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const threshold = dragStartRef.current.onActiveHex ? dragThresholdHex : dragThresholdEmpty;

      if (distance > threshold) {
        setIsDragging(true);
      }
    }

    if (isDragging) {
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      
      const newPan = {
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy
      };
      
      panRef.current = newPan;
      targetPanRef.current = { ...newPan };
      setPanOffset(newPan);
      setTargetPan(newPan);
      return true; // Indicates drag was handled
    }
    return false;
  }, [isPotentialDrag, isDragging, dragThresholdHex, dragThresholdEmpty]);

  const handleDragEnd = useCallback(() => {
    const wasDragging = isDragging;
    setIsPotentialDrag(false);
    setIsDragging(false);
    return wasDragging;
  }, [isDragging]);

  const centerOnWorldPoint = useCallback((worldX: number, worldY: number, containerWidth: number, containerHeight: number) => {
    const newPanX = containerWidth / 2 - worldX * zoomRef.current;
    const newPanY = containerHeight / 2 - worldY * zoomRef.current;
    
    targetPanRef.current = { x: newPanX, y: newPanY };
    setTargetPan({ x: newPanX, y: newPanY });
    startAnimation();
  }, [startAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    zoomLevel,
    panOffset,
    targetZoom,
    targetPan,
    zoomRef,
    panRef,
    isDragging,
    isPotentialDrag,
    handleZoom,
    handlePan,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    centerOnWorldPoint,
    setZoomLevel,
    setPanOffset,
    setTargetZoom,
    setTargetPan
  };
}
