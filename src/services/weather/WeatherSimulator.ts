// Weather Simulator interface and factory
// Both FluidWeatherEngine and PerlinWeatherEngine implement this interface.

import type {
  WeatherField,
  WeatherSimulationConfig,
  PressureSystem,
  WeatherFront,
  WeatherEvent,
  WeatherEventType
} from '../../types/Weather';

/** Minimal hex data sent to the simulation engine */
export interface SimHex {
  key: string;
  terrain: string;
  elevation: number;
  isCoast: boolean;
  hasRiver: boolean;
}

/** Grid definition for initializing the simulation */
export interface SimGrid {
  width: number;
  height: number;
  hexes: SimHex[];
}

/** Result of a single simulation tick */
export interface TickResult {
  field: WeatherField;
  pressureSystems: PressureSystem[];
  fronts: WeatherFront[];
  activeEvents: WeatherEvent[];
  spawnedEvents: WeatherEvent[];
  endedEventIds: string[];
}

/** Interface implemented by both weather simulation engines */
export interface WeatherSimulator {
  /** Initialize the simulation with grid data and config */
  init(grid: SimGrid, seed: string, config: WeatherSimulationConfig): void;

  /** Run one simulation tick, returning updated field state */
  tick(): TickResult;

  /** Update configuration without full re-init */
  setConfig(config: Partial<WeatherSimulationConfig>): void;

  /** Manually spawn a weather event */
  spawnEvent(type: WeatherEventType, centerKey: string, intensity?: number, durationTicks?: number): WeatherEvent;

  /** Cancel an active event by ID */
  cancelEvent(eventId: string): void;

  /** Update terrain data (e.g., hex terrain changed) */
  updateTerrain(hexes: SimHex[]): void;

  /** Get the current field state without ticking */
  getField(): WeatherField;

  /** Reset to initial state */
  reset(): void;
}
