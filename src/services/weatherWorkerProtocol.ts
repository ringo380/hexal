// Worker <-> main thread message types for weather simulation

import type {
  WeatherField,
  WeatherSimulationConfig,
  WeatherEvent,
  WeatherEventType,
  PressureSystem,
  WeatherFront
} from '../types/Weather';
import type { SimGrid } from './weather/WeatherSimulator';

// ============ Main → Worker Messages ============

export type WorkerInMessage =
  | { type: 'INIT'; grid: SimGrid; seed: string; config: WeatherSimulationConfig }
  | { type: 'TICK' }
  | { type: 'ADVANCE_TICKS'; ticks: number }
  | { type: 'SET_CONFIG'; config: Partial<WeatherSimulationConfig> }
  | { type: 'SPAWN_EVENT'; eventType: WeatherEventType; centerKey: string; intensity?: number; durationTicks?: number }
  | { type: 'CANCEL_EVENT'; eventId: string }
  | { type: 'UPDATE_TERRAIN'; hexes: SimGrid['hexes'] }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'DESTROY' };

// ============ Worker → Main Messages ============

export type WorkerOutMessage =
  | { type: 'READY' }
  | { type: 'FIELD_UPDATE'; field: WeatherField; pressureSystems: PressureSystem[]; fronts: WeatherFront[]; activeEvents: WeatherEvent[] }
  | { type: 'EVENT_SPAWNED'; event: WeatherEvent }
  | { type: 'EVENT_ENDED'; eventId: string }
  | { type: 'ERROR'; message: string };
