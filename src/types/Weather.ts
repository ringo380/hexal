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

export const WEATHER_ICONS: Record<WeatherCondition, string> = {
  'clear': '☀️',
  'partly-cloudy': '⛅',
  'cloudy': '☁️',
  'overcast': '🌥️',
  'light-rain': '🌦️',
  'rain': '🌧️',
  'heavy-rain': '🌧️',
  'thunderstorm': '⛈️',
  'drizzle': '🌦️',
  'fog': '🌫️',
  'mist': '🌫️',
  'light-snow': '🌨️',
  'snow': '❄️',
  'heavy-snow': '❄️',
  'blizzard': '🌨️',
  'hail': '🌨️',
  'sleet': '🌨️',
  'windy': '💨',
  'hot': '🔥',
  'cold': '🥶',
  'freezing': '🧊'
};

export const SEASON_ICONS: Record<Season, string> = {
  'spring': '🌸',
  'summer': '☀️',
  'autumn': '🍂',
  'winter': '❄️'
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
