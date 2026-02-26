// Weather & Time System Types

// ============ CALENDAR SYSTEM ============

export type CalendarPreset = 'greyhawk' | 'forgotten-realms' | 'eberron' | 'simple' | 'custom';

export interface CalendarMonth {
  name: string;
  days: number;
  season: Season;
}

export interface CalendarSystem {
  preset: CalendarPreset;
  name: string;
  months: CalendarMonth[];
  daysPerWeek: number;
  weekDayNames: string[];
  hoursPerDay: number;
}

export interface CurrentTime {
  year: number;
  month: number;      // 0-indexed
  day: number;        // 1-indexed
  hour: number;       // 0-23
  minute: number;     // 0-59
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'midnight';

// ============ WEATHER SYSTEM ============

export type WeatherCondition =
  | 'clear' | 'partly-cloudy' | 'cloudy' | 'overcast'
  | 'light-rain' | 'rain' | 'heavy-rain' | 'thunderstorm'
  | 'drizzle' | 'fog' | 'mist'
  | 'light-snow' | 'snow' | 'heavy-snow' | 'blizzard'
  | 'hail' | 'sleet'
  | 'windy' | 'hot' | 'cold' | 'freezing';

export type Temperature = 'freezing' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot' | 'scorching';

export type WindStrength = 'calm' | 'light' | 'moderate' | 'strong' | 'gale';

export type PrecipitationLevel = 'none' | 'light' | 'moderate' | 'heavy';

export interface Weather {
  condition: WeatherCondition;
  temperature: Temperature;
  wind: WindStrength;
  precipitation: PrecipitationLevel;
}

export interface WeatherEffects {
  travelModifier: number;      // 1.0 = normal, 1.5 = 50% slower
  visibilityModifier: number;  // 1.0 = normal, 0.5 = halved
  encounterModifier: number;   // 1.0 = normal, 0.7 = 30% fewer
  description: string;         // "Heavy rain reduces visibility and slows travel"
}

// ============ REGIONAL WEATHER ============

export interface TerrainWeatherPattern {
  terrain: string;             // Matches terrainTypes[].name
  baseConditions: WeatherCondition[];
  seasonalModifiers: Record<Season, WeatherCondition[]>;
  temperatureRange: Record<Season, Temperature[]>;
}

export interface WeatherZone {
  id: string;
  name: string;
  terrains: string[];          // Which terrain types belong to this zone
  patterns: TerrainWeatherPattern[];
}

// ============ CAMPAIGN INTEGRATION ============

export type TimeSpeed = 'paused' | 'normal' | 'fast';

export interface TimeWeatherState {
  // Time
  calendar: CalendarSystem;
  currentTime: CurrentTime;
  timeSpeed: TimeSpeed;

  // Weather
  globalWeather: Weather;
  zoneWeathers: Record<string, Weather>;  // By zone ID
  hexWeatherOverrides: Record<string, Weather>;  // By "q,r" key
  weatherHistory: WeatherHistoryEntry[];

  // Settings
  dynamicWeather: boolean;
  seasonalEffects: boolean;
  weatherChangeInterval: number;  // Hours between weather changes
}

export interface WeatherHistoryEntry {
  timestamp: CurrentTime;
  weather: Weather;
  zone?: string;
  notes?: string;
}

// ============ WEATHER ICONS ============
// Icon names that map to the Icon component

import type { IconName } from '../components/icons/Icon';

export const WEATHER_ICONS: Record<WeatherCondition, IconName> = {
  'clear': 'sun',
  'partly-cloudy': 'cloud-partial',
  'cloudy': 'cloud',
  'overcast': 'cloud',
  'light-rain': 'cloud-rain',
  'rain': 'cloud-rain',
  'heavy-rain': 'cloud-rain',
  'thunderstorm': 'cloud-storm',
  'drizzle': 'cloud-rain',
  'fog': 'fog',
  'mist': 'fog',
  'light-snow': 'snowflake',
  'snow': 'snowflake',
  'heavy-snow': 'snowflake',
  'blizzard': 'snowflake',
  'hail': 'snowflake',
  'sleet': 'snowflake',
  'windy': 'wind',
  'hot': 'thermometer-hot',
  'cold': 'thermometer-cold',
  'freezing': 'thermometer-cold'
};

export const SEASON_ICONS: Record<Season, IconName> = {
  'spring': 'flower',
  'summer': 'sun',
  'autumn': 'leaf',
  'winter': 'snowflake'
};

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
  'freezing': 'Freezing',
  'cold': 'Cold',
  'cool': 'Cool',
  'mild': 'Mild',
  'warm': 'Warm',
  'hot': 'Hot',
  'scorching': 'Scorching'
};

export const WIND_LABELS: Record<WindStrength, string> = {
  'calm': 'Calm',
  'light': 'Light Breeze',
  'moderate': 'Moderate Wind',
  'strong': 'Strong Wind',
  'gale': 'Gale Force'
};

export const WEATHER_CONDITION_LABELS: Record<WeatherCondition, string> = {
  'clear': 'Clear',
  'partly-cloudy': 'Partly Cloudy',
  'cloudy': 'Cloudy',
  'overcast': 'Overcast',
  'light-rain': 'Light Rain',
  'rain': 'Rain',
  'heavy-rain': 'Heavy Rain',
  'thunderstorm': 'Thunderstorm',
  'drizzle': 'Drizzle',
  'fog': 'Fog',
  'mist': 'Mist',
  'light-snow': 'Light Snow',
  'snow': 'Snow',
  'heavy-snow': 'Heavy Snow',
  'blizzard': 'Blizzard',
  'hail': 'Hail',
  'sleet': 'Sleet',
  'windy': 'Windy',
  'hot': 'Hot',
  'cold': 'Cold',
  'freezing': 'Freezing'
};

// ============ WEATHER SIMULATION SYSTEM ============

/** Per-hex output from the weather simulation engine */
export interface WeatherFieldCell {
  pressure: number;         // hPa ~990-1040
  temperature: number;      // Celsius
  humidity: number;          // 0-1
  windVector: { u: number; v: number };
  gustIntensity: number;    // 0-1 (turbulence near terrain features)
  turbulence: number;       // 0-1
  precipIntensity: number;  // 0-1
  cloudCover: number;       // 0-1
  frontType: 'none' | 'cold' | 'warm' | 'occluded';
}

/** Full simulation field: a map of hex keys to field cells */
export type WeatherField = Record<string, WeatherFieldCell>;

/** A pressure system center (high or low) */
export interface PressureSystem {
  id: string;
  type: 'high' | 'low';
  centerKey: string;       // hex key "q,r"
  pressure: number;        // hPa at center
  radius: number;          // influence radius in hex units
  driftVector: { u: number; v: number };
}

/** A weather front between opposing pressure systems */
export interface WeatherFront {
  id: string;
  type: 'cold' | 'warm' | 'occluded';
  hexKeys: string[];       // hex keys along the front line
  direction: { u: number; v: number };
  intensity: number;       // 0-1
}

/** Weather event type identifiers */
export type WeatherEventType = 'hurricane' | 'blizzard' | 'heat-wave' | 'monsoon' | 'tornado';

/** An active weather event on the map */
export interface WeatherEvent {
  id: string;
  type: WeatherEventType;
  centerKey: string;
  radius: number;
  intensity: number;       // 0-1
  remainingTicks: number;
  fadeoutTicks: number;
  path?: string[];         // hex keys for moving events (tornado)
}

/** Configuration for the weather simulation (persisted on Campaign) */
export interface WeatherSimulationConfig {
  engineType: 'fluid' | 'perlin';
  simulationSpeed: number;       // 1-10
  overlayOpacity: number;        // 0-1, default 0.35
  overlayMode: 'precipitation' | 'temperature' | 'pressure' | 'wind';
  showIsobars: boolean;          // DM only
  showFronts: boolean;           // DM only
  showParticles: boolean;
  particleDensity: number;       // 0-1
  enabled: boolean;
}

/** Runtime simulation state (persisted snapshot for save/restore) */
export interface WeatherSimulationState {
  config: WeatherSimulationConfig;
  field: WeatherField;
  pressureSystems: PressureSystem[];
  fronts: WeatherFront[];
  activeEvents: WeatherEvent[];
  tickCount: number;
  seed: string;
}

export function createDefaultSimulationConfig(): WeatherSimulationConfig {
  return {
    engineType: 'perlin',
    simulationSpeed: 3,
    overlayOpacity: 0.35,
    overlayMode: 'precipitation',
    showIsobars: false,
    showFronts: false,
    showParticles: true,
    particleDensity: 0.5,
    enabled: false
  };
}

export function createDefaultSimulationState(): WeatherSimulationState {
  return {
    config: createDefaultSimulationConfig(),
    field: {},
    pressureSystems: [],
    fronts: [],
    activeEvents: [],
    tickCount: 0,
    seed: ''
  };
}

// ============ DEFAULT VALUES ============

export const DEFAULT_WEATHER: Weather = {
  condition: 'clear',
  temperature: 'mild',
  wind: 'calm',
  precipitation: 'none'
};

export const DEFAULT_TIME: CurrentTime = {
  year: 1,
  month: 0,
  day: 1,
  hour: 8,
  minute: 0
};
