// useMarkerDrag - Drag state machine for tabletop figurine markers
import { useState, useRef, useCallback, useEffect } from 'react';
import type { HexCoordinate, HexMarker } from '../types';

// Drag state phases
export type MarkerDragPhase = 'idle' | 'pending' | 'dragging' | 'dropping';

// Drag state
export interface MarkerDragState {
  phase: MarkerDragPhase;
  marker: HexMarker | null;
  sourceHex: HexCoordinate | null;
  currentPosition: { x: number; y: number } | null;
  tiltAngle: number;
}

// Configuration
const DRAG_THRESHOLD = 8; // Pixels before drag starts
const MAX_TILT = 5; // Degrees
const MAX_VELOCITY_FOR_TILT = 500; // px/sec
const DROP_ANIMATION_DURATION = 150; // ms

// Velocity tracker for tilt calculation
interface VelocityState {
  lastX: number;
  lastTime: number;
  velocity: number;
}

interface UseMarkerDragOptions {
  onDragStart?: (marker: HexMarker, sourceHex: HexCoordinate) => void;
  onDragEnd?: (
    marker: HexMarker,
    sourceHex: HexCoordinate,
    targetHex: HexCoordinate | null,
    wasMoved: boolean,
    dropPosition: { x: number; y: number } | null
  ) => void;
  onPickup?: () => void; // For audio
  onDrop?: () => void; // For audio
}

interface UseMarkerDragReturn {
  state: MarkerDragState;
  startDrag: (marker: HexMarker, hexCoord: HexCoordinate, screenX: number, screenY: number) => void;
  updateDrag: (screenX: number, screenY: number) => void;
  endDrag: (targetHex: HexCoordinate | null) => void;
  cancelDrag: () => void;
  isDragging: boolean;
  isPending: boolean;
}

export function useMarkerDrag(options: UseMarkerDragOptions = {}): UseMarkerDragReturn {
  const { onDragStart, onDragEnd, onPickup, onDrop } = options;

  // State
  const [state, setState] = useState<MarkerDragState>({
    phase: 'idle',
    marker: null,
    sourceHex: null,
    currentPosition: null,
    tiltAngle: 0,
  });

  // Refs for drag tracking
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const velocityRef = useRef<VelocityState>({
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  });
  const dropAnimationRef = useRef<number | null>(null);

  // Calculate tilt from horizontal velocity
  const calculateTilt = useCallback((velocity: number): number => {
    // Clamp velocity and map to tilt angle
    const clampedVelocity = Math.max(-MAX_VELOCITY_FOR_TILT, Math.min(MAX_VELOCITY_FOR_TILT, velocity));
    return (clampedVelocity / MAX_VELOCITY_FOR_TILT) * MAX_TILT;
  }, []);

  // Update velocity and tilt
  const updateVelocity = useCallback((screenX: number): number => {
    const now = performance.now();
    const dt = now - velocityRef.current.lastTime;

    if (dt > 0 && dt < 100) { // Only calculate if reasonable time delta
      const dx = screenX - velocityRef.current.lastX;
      const newVelocity = (dx / dt) * 1000; // px/sec

      // Smooth the velocity with lerp
      velocityRef.current.velocity =
        velocityRef.current.velocity * 0.7 + newVelocity * 0.3;
    }

    velocityRef.current.lastX = screenX;
    velocityRef.current.lastTime = now;

    return velocityRef.current.velocity;
  }, []);

  // Start potential drag (mousedown on marker)
  const startDrag = useCallback(
    (marker: HexMarker, hexCoord: HexCoordinate, screenX: number, screenY: number) => {
      dragStartRef.current = { x: screenX, y: screenY };
      velocityRef.current = { lastX: screenX, lastTime: performance.now(), velocity: 0 };

      setState({
        phase: 'pending',
        marker,
        sourceHex: hexCoord,
        currentPosition: { x: screenX, y: screenY },
        tiltAngle: 0,
      });
    },
    []
  );

  // Update drag position (mousemove)
  const updateDrag = useCallback(
    (screenX: number, screenY: number) => {
      setState((prev) => {
        if (prev.phase === 'idle' || prev.phase === 'dropping') {
          return prev;
        }

        // Check if we should transition from pending to dragging
        if (prev.phase === 'pending' && dragStartRef.current) {
          const dx = screenX - dragStartRef.current.x;
          const dy = screenY - dragStartRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance >= DRAG_THRESHOLD) {
            // Transition to dragging
            onDragStart?.(prev.marker!, prev.sourceHex!);
            onPickup?.();

            const velocity = updateVelocity(screenX);
            return {
              ...prev,
              phase: 'dragging',
              currentPosition: { x: screenX, y: screenY },
              tiltAngle: calculateTilt(velocity),
            };
          }

          // Still pending, just update position
          return {
            ...prev,
            currentPosition: { x: screenX, y: screenY },
          };
        }

        // Already dragging, update position and tilt
        const velocity = updateVelocity(screenX);
        return {
          ...prev,
          currentPosition: { x: screenX, y: screenY },
          tiltAngle: calculateTilt(velocity),
        };
      });
    },
    [onDragStart, onPickup, updateVelocity, calculateTilt]
  );

  // End drag (mouseup)
  const endDrag = useCallback(
    (targetHex: HexCoordinate | null) => {
      setState((prev) => {
        if (prev.phase === 'idle') return prev;

        const wasMoved =
          prev.phase === 'dragging' &&
          targetHex !== null &&
          (targetHex.q !== prev.sourceHex?.q || targetHex.r !== prev.sourceHex?.r);

        // If was just a click (pending phase), don't play drop sound
        if (prev.phase === 'dragging') {
          onDrop?.();
        }

        // Notify drag end with drop position for free-form positioning
        if (prev.marker && prev.sourceHex) {
          onDragEnd?.(prev.marker, prev.sourceHex, targetHex, wasMoved, prev.currentPosition);
        }

        // If was dragging, do drop animation
        if (prev.phase === 'dragging') {
          // Start drop animation
          return {
            ...prev,
            phase: 'dropping',
            tiltAngle: 0, // Reset tilt for drop
          };
        }

        // Was pending (click without drag), just reset
        return {
          phase: 'idle',
          marker: null,
          sourceHex: null,
          currentPosition: null,
          tiltAngle: 0,
        };
      });
    },
    [onDragEnd, onDrop]
  );

  // Handle drop animation completion
  useEffect(() => {
    if (state.phase === 'dropping') {
      dropAnimationRef.current = window.setTimeout(() => {
        setState({
          phase: 'idle',
          marker: null,
          sourceHex: null,
          currentPosition: null,
          tiltAngle: 0,
        });
      }, DROP_ANIMATION_DURATION);

      return () => {
        if (dropAnimationRef.current) {
          clearTimeout(dropAnimationRef.current);
        }
      };
    }
  }, [state.phase]);

  // Cancel drag (escape key, mouse leave, etc.)
  const cancelDrag = useCallback(() => {
    setState({
      phase: 'idle',
      marker: null,
      sourceHex: null,
      currentPosition: null,
      tiltAngle: 0,
    });
    dragStartRef.current = null;
  }, []);

  return {
    state,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    isDragging: state.phase === 'dragging' || state.phase === 'dropping',
    isPending: state.phase === 'pending',
  };
}

export default useMarkerDrag;
