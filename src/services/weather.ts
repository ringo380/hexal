// Weather Generation and Management Service

import {
  Weather,
  WeatherCondition,
  Temperature,
  WindStrength,
  PrecipitationLevel,
  Season,
  TimeWeatherState,
  CurrentTime,
  WeatherEffects
} from '../types/Weather';
import { getWeatherEffects } from '../data/weatherEffects';

// ============ TERRAIN-WEATHER MAPPINGS ============

interface TerrainWeatherProfile {
  baseConditions: WeatherCondition[];
  seasonalConditions: Record<Season, WeatherCondition[]>;
  temperatureModifier: number;  // Offset from normal (-2 to +2)
}

/**
 * Weather profiles for each terrain type
 */
export const TERRAIN_WEATHER_PROFILES: Record<string, TerrainWeatherProfile> = {
  'Plains': {
    baseConditions: ['clear', 'partly-cloudy', 'cloudy', 'windy'],
    seasonalConditions: {
      spring: ['rain', 'light-rain', 'thunderstorm'],
      summer: ['clear', 'hot', 'thunderstorm'],
      autumn: ['cloudy', 'fog', 'rain'],
      winter: ['cold', 'snow', 'light-snow']
    },
    temperatureModifier: 0
  },
  'Forest': {
    baseConditions: ['partly-cloudy', 'cloudy', 'mist'],
    seasonalConditions: {
      spring: ['rain', 'drizzle', 'fog'],
      summer: ['partly-cloudy', 'rain', 'thunderstorm'],
      autumn: ['fog', 'mist', 'rain', 'cloudy'],
      winter: ['cold', 'snow', 'light-snow', 'fog']
    },
    temperatureModifier: -1
  },
  'Hills': {
    baseConditions: ['partly-cloudy', 'cloudy', 'windy'],
    seasonalConditions: {
      spring: ['rain', 'windy', 'fog'],
      summer: ['clear', 'partly-cloudy', 'thunderstorm'],
      autumn: ['cloudy', 'rain', 'windy'],
      winter: ['cold', 'snow', 'windy']
    },
    temperatureModifier: -1
  },
  'Mountains': {
    baseConditions: ['cloudy', 'windy', 'cold'],
    seasonalConditions: {
      spring: ['rain', 'snow', 'windy', 'fog'],
      summer: ['partly-cloudy', 'thunderstorm', 'rain'],
      autumn: ['cold', 'windy', 'snow', 'fog'],
      winter: ['freezing', 'blizzard', 'heavy-snow', 'snow']
    },
    temperatureModifier: -2
  },
  'Swamp': {
    baseConditions: ['fog', 'mist', 'cloudy', 'overcast'],
    seasonalConditions: {
      spring: ['fog', 'rain', 'drizzle'],
      summer: ['hot', 'thunderstorm', 'heavy-rain', 'fog'],
      autumn: ['fog', 'mist', 'rain'],
      winter: ['cold', 'fog', 'drizzle', 'sleet']
    },
    temperatureModifier: 0
  },
  'Desert': {
    baseConditions: ['clear', 'hot', 'windy'],
    seasonalConditions: {
      spring: ['clear', 'hot', 'windy'],
      summer: ['hot', 'clear', 'windy'],
      autumn: ['clear', 'partly-cloudy', 'windy'],
      winter: ['cold', 'clear', 'windy']
    },
    temperatureModifier: 2
  },
  'Coast': {
    baseConditions: ['partly-cloudy', 'windy', 'mist'],
    seasonalConditions: {
      spring: ['rain', 'fog', 'windy'],
      summer: ['clear', 'partly-cloudy', 'thunderstorm'],
      autumn: ['rain', 'windy', 'fog', 'thunderstorm'],
      winter: ['cold', 'rain', 'sleet', 'windy']
    },
    temperatureModifier: 0
  },
  'Jungle': {
    baseConditions: ['hot', 'rain', 'fog', 'overcast'],
    seasonalConditions: {
      spring: ['rain', 'heavy-rain', 'thunderstorm', 'fog'],
      summer: ['heavy-rain', 'thunderstorm', 'hot'],
      autumn: ['rain', 'fog', 'drizzle'],
      winter: ['rain', 'drizzle', 'fog']
    },
    temperatureModifier: 1
  },
  'Tundra': {
    baseConditions: ['cold', 'freezing', 'windy'],
    seasonalConditions: {
      spring: ['cold', 'light-snow', 'windy'],
      summer: ['cold', 'partly-cloudy', 'rain'],
      autumn: ['cold', 'snow', 'windy'],
      winter: ['freezing', 'blizzard', 'heavy-snow']
    },
    temperatureModifier: -2
  },
  'Grassland': {
    baseConditions: ['clear', 'partly-cloudy', 'windy'],
    seasonalConditions: {
      spring: ['rain', 'light-rain', 'clear'],
      summer: ['hot', 'clear', 'thunderstorm'],
      autumn: ['cloudy', 'windy', 'rain'],
      winter: ['cold', 'light-snow', 'windy']
    },
    temperatureModifier: 0
  }
};

// Default profile for unknown terrains
const DEFAULT_PROFILE: TerrainWeatherProfile = {
  baseConditions: ['clear', 'partly-cloudy', 'cloudy'],
  seasonalConditions: {
    spring: ['rain', 'clear'],
    summer: ['clear', 'hot'],
    autumn: ['cloudy', 'rain'],
    winter: ['cold', 'snow']
  },
  temperatureModifier: 0
};

// ============ TEMPERATURE HELPERS ============

const TEMPERATURE_ORDER: Temperature[] = [
  'freezing', 'cold', 'cool', 'mild', 'warm', 'hot', 'scorching'
];

const SEASON_BASE_TEMP: Record<Season, number> = {
  winter: 1,    // cold
  spring: 3,    // mild
  summer: 4,    // warm
  autumn: 2     // cool
};

function getTemperature(season: Season, modifier: number): Temperature {
  const baseIndex = SEASON_BASE_TEMP[season];
  const adjustedIndex = Math.max(0, Math.min(TEMPERATURE_ORDER.length - 1, baseIndex + modifier));
  return TEMPERATURE_ORDER[adjustedIndex];
}

// ============ RANDOM HELPERS ============

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============ WEATHER GENERATION ============

/**
 * Generate random weather based on terrain and season
 */
export function generateWeather(terrain: string, season: Season): Weather {
  const profile = TERRAIN_WEATHER_PROFILES[terrain] || DEFAULT_PROFILE;

  // Combine base conditions with seasonal
  const availableConditions = [
    ...profile.baseConditions,
    ...(profile.seasonalConditions[season] || [])
  ];

  const condition = randomFromArray(availableConditions);
  const temperature = getTemperature(season, profile.temperatureModifier + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0));

  // Determine wind based on condition
  let wind: WindStrength = 'calm';
  if (condition === 'windy' || condition === 'blizzard' || condition === 'thunderstorm') {
    wind = randomFromArray(['strong', 'gale']);
  } else if (Math.random() > 0.7) {
    wind = randomFromArray(['light', 'moderate']);
  }

  // Determine precipitation
  let precipitation: PrecipitationLevel = 'none';
  if (['drizzle', 'light-rain', 'mist'].includes(condition)) {
    precipitation = 'light';
  } else if (['rain', 'snow', 'light-snow', 'sleet'].includes(condition)) {
    precipitation = 'moderate';
  } else if (['heavy-rain', 'thunderstorm', 'heavy-snow', 'blizzard', 'hail'].includes(condition)) {
    precipitation = 'heavy';
  }

  return {
    condition,
    temperature,
    wind,
    precipitation
  };
}

/**
 * Generate weather that transitions smoothly from previous weather
 */
export function generateTransitionWeather(
  previous: Weather,
  terrain: string,
  season: Season
): Weather {
  // 30% chance to keep similar weather
  if (Math.random() < 0.3) {
    // Small variation of current weather
    const newWeather = { ...previous };

    // Maybe shift temperature slightly
    if (Math.random() > 0.7) {
      const tempIndex = TEMPERATURE_ORDER.indexOf(previous.temperature);
      const shift = Math.random() > 0.5 ? 1 : -1;
      const newIndex = Math.max(0, Math.min(TEMPERATURE_ORDER.length - 1, tempIndex + shift));
      newWeather.temperature = TEMPERATURE_ORDER[newIndex];
    }

    // Maybe shift wind
    if (Math.random() > 0.8) {
      const winds: WindStrength[] = ['calm', 'light', 'moderate', 'strong'];
      newWeather.wind = randomFromArray(winds);
    }

    return newWeather;
  }

  // 70% chance of new weather
  return generateWeather(terrain, season);
}

/**
 * Get weather for a specific hex, considering global, zone, and override weather
 */
export function getHexWeather(
  state: TimeWeatherState,
  hexKey: string,
  terrain: string
): Weather {
  // Check for hex-specific override first
  if (state.hexWeatherOverrides[hexKey]) {
    return state.hexWeatherOverrides[hexKey];
  }

  // Check for zone weather (terrain-based)
  if (state.zoneWeathers[terrain]) {
    return state.zoneWeathers[terrain];
  }

  // Fall back to global weather
  return state.globalWeather;
}

/**
 * Get the effects for weather at a specific hex
 */
export function getHexWeatherEffects(
  state: TimeWeatherState,
  hexKey: string,
  terrain: string
): WeatherEffects {
  const weather = getHexWeather(state, hexKey, terrain);
  return getWeatherEffects(weather);
}

/**
 * Generate weather description string
 */
export function describeWeather(weather: Weather): string {
  const parts: string[] = [];

  // Condition
  const conditionLabels: Record<WeatherCondition, string> = {
    'clear': 'clear skies',
    'partly-cloudy': 'partly cloudy',
    'cloudy': 'cloudy',
    'overcast': 'overcast skies',
    'light-rain': 'light rain',
    'rain': 'rain',
    'heavy-rain': 'heavy rain',
    'thunderstorm': 'thunderstorm',
    'drizzle': 'drizzle',
    'fog': 'fog',
    'mist': 'mist',
    'light-snow': 'light snow',
    'snow': 'snow',
    'heavy-snow': 'heavy snow',
    'blizzard': 'blizzard',
    'hail': 'hail',
    'sleet': 'sleet',
    'windy': 'strong winds',
    'hot': 'hot',
    'cold': 'cold',
    'freezing': 'freezing'
  };

  parts.push(conditionLabels[weather.condition] || weather.condition);

  // Temperature (if notably different from condition)
  if (!['hot', 'cold', 'freezing'].includes(weather.condition)) {
    if (weather.temperature === 'scorching' || weather.temperature === 'freezing') {
      parts.push(weather.temperature);
    }
  }

  // Wind (if notable)
  if (weather.wind === 'strong' || weather.wind === 'gale') {
    if (weather.condition !== 'windy') {
      parts.push(weather.wind === 'gale' ? 'with gale-force winds' : 'and windy');
    }
  }

  // Capitalize first letter
  const description = parts.join(', ');
  return description.charAt(0).toUpperCase() + description.slice(1);
}

/**
 * Get a short weather summary (for toolbar)
 */
export function getWeatherSummary(weather: Weather): string {
  const conditionLabels: Record<WeatherCondition, string> = {
    'clear': 'Clear',
    'partly-cloudy': 'Partly Cloudy',
    'cloudy': 'Cloudy',
    'overcast': 'Overcast',
    'light-rain': 'Light Rain',
    'rain': 'Rain',
    'heavy-rain': 'Heavy Rain',
    'thunderstorm': 'Thunderstorm',
    'drizzle': 'Drizzle',
    'fog': 'Foggy',
    'mist': 'Misty',
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

  const tempLabels: Record<Temperature, string> = {
    'freezing': 'Freezing',
    'cold': 'Cold',
    'cool': 'Cool',
    'mild': 'Mild',
    'warm': 'Warm',
    'hot': 'Hot',
    'scorching': 'Scorching'
  };

  const condition = conditionLabels[weather.condition] || weather.condition;
  const temp = tempLabels[weather.temperature];

  return `${condition}, ${temp}`;
}

/**
 * Check if weather should change (based on interval)
 */
export function shouldWeatherChange(
  lastChangeTime: CurrentTime,
  currentTime: CurrentTime,
  intervalHours: number,
  hoursPerDay: number
): boolean {
  // Simple check: compare total hours
  const lastTotalHours = (lastChangeTime.day * hoursPerDay) + lastChangeTime.hour;
  const currentTotalHours = (currentTime.day * hoursPerDay) + currentTime.hour;

  return (currentTotalHours - lastTotalHours) >= intervalHours;
}
