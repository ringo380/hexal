// React context wrapping weather simulation worker lifecycle + field state
// Provides interpolated field data to render passes and UI components

import React, { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import type {
  WeatherField,
  WeatherSimulationConfig,
  WeatherEvent,
  WeatherEventType,
  PressureSystem,
  WeatherFront
} from '../types/Weather';
import type { WorkerInMessage, WorkerOutMessage } from '../services/weatherWorkerProtocol';
import type { SimGrid } from '../services/weather/WeatherSimulator';
import { interpolateField } from '../services/weather/WeatherField';

interface WeatherSimulationState {
  /** Whether the simulation is currently running */
  isRunning: boolean;
  /** Current weather field (interpolated for smooth 60fps) */
  field: WeatherField;
  /** Monotonic version counter — increments only on actual worker FIELD_UPDATE ticks */
  fieldVersion: number;
  /** Active pressure systems */
  pressureSystems: PressureSystem[];
  /** Active weather fronts */
  fronts: WeatherFront[];
  /** Active weather events */
  activeEvents: WeatherEvent[];
  /** Whether the worker is ready */
  isReady: boolean;
  /** Last error message */
  error: string | null;
}

interface WeatherSimulationActions {
  /** Initialize or restart the simulation with grid data */
  startSimulation: (grid: SimGrid, seed: string, config: WeatherSimulationConfig) => void;
  /** Stop the simulation and destroy the worker */
  stopSimulation: () => void;
  /** Pause ticking without destroying */
  pauseSimulation: () => void;
  /** Resume ticking */
  resumeSimulation: () => void;
  /** Update simulation configuration */
  setConfig: (config: Partial<WeatherSimulationConfig>) => void;
  /** Advance simulation by N ticks at once (for campaign time mode) */
  advanceTicks: (ticks: number) => void;
  /** Manually spawn a weather event */
  spawnEvent: (type: WeatherEventType, centerKey: string, intensity?: number, durationTicks?: number) => void;
  /** Cancel an active event */
  cancelEvent: (eventId: string) => void;
  /** Update terrain data */
  updateTerrain: (hexes: SimGrid['hexes']) => void;
}

type WeatherSimulationContextType = WeatherSimulationState & WeatherSimulationActions;

const WeatherSimulationContext = createContext<WeatherSimulationContextType | null>(null);

export function WeatherSimulationProvider({ children }: { children: React.ReactNode }) {
  const workerRef = useRef<Worker | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Double-buffered field snapshots for interpolation
  const prevFieldRef = useRef<WeatherField>({});
  const currentFieldRef = useRef<WeatherField>({});
  const lastTickTimeRef = useRef(0);
  const tickIntervalRef = useRef(100); // ms between worker ticks

  const [field, setField] = useState<WeatherField>({});
  // Monotonic version counter — only incremented on actual worker ticks, not interpolation frames
  const fieldVersionRef = useRef(0);
  const [fieldVersion, setFieldVersion] = useState(0);
  const [pressureSystems, setPressureSystems] = useState<PressureSystem[]>([]);
  const [fronts, setFronts] = useState<WeatherFront[]>([]);
  const [activeEvents, setActiveEvents] = useState<WeatherEvent[]>([]);

  // Animation loop for field interpolation
  const animFrameRef = useRef<number>(0);

  const animate = useCallback(() => {
    const now = performance.now();
    const elapsed = now - lastTickTimeRef.current;
    const t = Math.min(1, elapsed / tickIntervalRef.current);

    const prev = prevFieldRef.current;
    const curr = currentFieldRef.current;

    // Only interpolate if we have both snapshots and there's meaningful data
    if (Object.keys(prev).length > 0 && Object.keys(curr).length > 0 && t < 1) {
      setField(interpolateField(prev, curr, t));
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const postMessage = useCallback((msg: WorkerInMessage) => {
    workerRef.current?.postMessage(msg);
  }, []);

  const handleWorkerMessage = useCallback((e: MessageEvent<WorkerOutMessage>) => {
    const msg = e.data;
    switch (msg.type) {
      case 'READY':
        setIsReady(true);
        setError(null);
        break;

      case 'FIELD_UPDATE':
        // Shift current → prev, store new as current
        prevFieldRef.current = currentFieldRef.current;
        currentFieldRef.current = msg.field;
        lastTickTimeRef.current = performance.now();
        // Increment version counter (only on actual worker ticks, not interpolation)
        fieldVersionRef.current++;
        setFieldVersion(fieldVersionRef.current);
        // Also update the final state directly (particles etc. use non-interpolated)
        setField(msg.field);
        setPressureSystems(msg.pressureSystems);
        setFronts(msg.fronts);
        setActiveEvents(msg.activeEvents);
        break;

      case 'EVENT_SPAWNED':
        setActiveEvents(prev => [...prev, msg.event]);
        break;

      case 'EVENT_ENDED':
        setActiveEvents(prev => prev.filter(e => e.id !== msg.eventId));
        break;

      case 'ERROR':
        setError(msg.message);
        break;
    }
  }, []);

  const createWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    const worker = new Worker(
      new URL('../services/weatherWorker.ts', import.meta.url),
      { type: 'module' }
    );
    worker.onmessage = handleWorkerMessage;
    worker.onerror = (err) => {
      setError(err.message);
    };
    workerRef.current = worker;
    return worker;
  }, [handleWorkerMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'DESTROY' } as WorkerInMessage);
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const startSimulation = useCallback((grid: SimGrid, seed: string, config: WeatherSimulationConfig) => {
    const worker = createWorker();
    tickIntervalRef.current = Math.max(50, 100 / Math.max(1, config.simulationSpeed));
    worker.postMessage({ type: 'INIT', grid, seed, config } as WorkerInMessage);
    setIsRunning(true);
    setIsReady(false);
    // Start animation loop
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);
  }, [createWorker, animate]);

  const stopSimulation = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (workerRef.current) {
      postMessage({ type: 'DESTROY' });
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsRunning(false);
    setIsReady(false);
    setField({});
    fieldVersionRef.current = 0;
    setFieldVersion(0);
    setPressureSystems([]);
    setFronts([]);
    setActiveEvents([]);
    prevFieldRef.current = {};
    currentFieldRef.current = {};
  }, [postMessage]);

  const pauseSimulation = useCallback(() => {
    postMessage({ type: 'PAUSE' });
    cancelAnimationFrame(animFrameRef.current);
  }, [postMessage]);

  const resumeSimulation = useCallback(() => {
    postMessage({ type: 'RESUME' });
    animFrameRef.current = requestAnimationFrame(animate);
  }, [postMessage, animate]);

  const setConfig = useCallback((config: Partial<WeatherSimulationConfig>) => {
    postMessage({ type: 'SET_CONFIG', config });
    if (config.simulationSpeed !== undefined) {
      tickIntervalRef.current = Math.max(50, 100 / Math.max(1, config.simulationSpeed));
    }
  }, [postMessage]);

  const advanceTicks = useCallback((ticks: number) => {
    postMessage({ type: 'ADVANCE_TICKS', ticks });
  }, [postMessage]);

  const spawnEvent = useCallback((type: WeatherEventType, centerKey: string, intensity?: number, durationTicks?: number) => {
    postMessage({ type: 'SPAWN_EVENT', eventType: type, centerKey, intensity, durationTicks });
  }, [postMessage]);

  const cancelEvent = useCallback((eventId: string) => {
    postMessage({ type: 'CANCEL_EVENT', eventId });
  }, [postMessage]);

  const updateTerrain = useCallback((hexes: SimGrid['hexes']) => {
    postMessage({ type: 'UPDATE_TERRAIN', hexes });
  }, [postMessage]);

  const value: WeatherSimulationContextType = {
    isRunning,
    field,
    fieldVersion,
    pressureSystems,
    fronts,
    activeEvents,
    isReady,
    error,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    resumeSimulation,
    setConfig,
    advanceTicks,
    spawnEvent,
    cancelEvent,
    updateTerrain
  };

  return (
    <WeatherSimulationContext.Provider value={value}>
      {children}
    </WeatherSimulationContext.Provider>
  );
}

export function useWeatherSimulation(): WeatherSimulationContextType {
  const context = useContext(WeatherSimulationContext);
  if (!context) {
    throw new Error('useWeatherSimulation must be used within WeatherSimulationProvider');
  }
  return context;
}
