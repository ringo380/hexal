// Weather Effects Lookup Table

import { WeatherCondition, WeatherEffects, Weather } from '../types/Weather';

/**
 * Effects for each weather condition
 * - travelModifier: Multiplier for travel time (1.0 = normal, 2.0 = double time)
 * - visibilityModifier: Multiplier for visibility range (1.0 = normal, 0.5 = halved)
 * - encounterModifier: Multiplier for encounter chance (1.0 = normal, 0.5 = half as likely)
 */
export const WEATHER_EFFECTS: Record<WeatherCondition, WeatherEffects> = {
  // Clear conditions
  'clear': {
    travelModifier: 1.0,
    visibilityModifier: 1.0,
    encounterModifier: 1.0,
    description: 'Clear skies, ideal travel conditions'
  },
  'partly-cloudy': {
    travelModifier: 1.0,
    visibilityModifier: 1.0,
    encounterModifier: 1.0,
    description: 'Partly cloudy skies, normal travel conditions'
  },
  'cloudy': {
    travelModifier: 1.0,
    visibilityModifier: 0.9,
    encounterModifier: 1.0,
    description: 'Overcast skies, slightly reduced visibility'
  },
  'overcast': {
    travelModifier: 1.0,
    visibilityModifier: 0.85,
    encounterModifier: 0.95,
    description: 'Heavy cloud cover, dim light conditions'
  },

  // Rain conditions
  'drizzle': {
    travelModifier: 1.1,
    visibilityModifier: 0.85,
    encounterModifier: 0.9,
    description: 'Light drizzle, slightly dampening conditions'
  },
  'light-rain': {
    travelModifier: 1.15,
    visibilityModifier: 0.8,
    encounterModifier: 0.85,
    description: 'Light rain, minor travel impediment'
  },
  'rain': {
    travelModifier: 1.25,
    visibilityModifier: 0.7,
    encounterModifier: 0.8,
    description: 'Rain slows travel and reduces visibility'
  },
  'heavy-rain': {
    travelModifier: 1.5,
    visibilityModifier: 0.5,
    encounterModifier: 0.6,
    description: 'Heavy rain significantly impairs travel'
  },
  'thunderstorm': {
    travelModifier: 2.0,
    visibilityModifier: 0.3,
    encounterModifier: 0.4,
    description: 'Dangerous storm, shelter recommended'
  },

  // Fog and mist
  'mist': {
    travelModifier: 1.1,
    visibilityModifier: 0.6,
    encounterModifier: 1.1,
    description: 'Light mist reduces visibility'
  },
  'fog': {
    travelModifier: 1.25,
    visibilityModifier: 0.25,
    encounterModifier: 1.2,
    description: 'Dense fog severely limits visibility'
  },

  // Snow conditions
  'light-snow': {
    travelModifier: 1.25,
    visibilityModifier: 0.8,
    encounterModifier: 0.85,
    description: 'Light snowfall, minor travel impediment'
  },
  'snow': {
    travelModifier: 1.5,
    visibilityModifier: 0.6,
    encounterModifier: 0.7,
    description: 'Snow slows movement and obscures vision'
  },
  'heavy-snow': {
    travelModifier: 2.0,
    visibilityModifier: 0.4,
    encounterModifier: 0.5,
    description: 'Heavy snowfall severely impedes travel'
  },
  'blizzard': {
    travelModifier: 3.0,
    visibilityModifier: 0.1,
    encounterModifier: 0.3,
    description: 'Blizzard conditions, travel extremely dangerous'
  },

  // Other precipitation
  'hail': {
    travelModifier: 1.75,
    visibilityModifier: 0.5,
    encounterModifier: 0.5,
    description: 'Hail poses danger to exposed travelers'
  },
  'sleet': {
    travelModifier: 1.5,
    visibilityModifier: 0.6,
    encounterModifier: 0.6,
    description: 'Icy sleet makes travel treacherous'
  },

  // Special conditions
  'windy': {
    travelModifier: 1.2,
    visibilityModifier: 0.9,
    encounterModifier: 0.9,
    description: 'Strong winds impede progress'
  },
  'hot': {
    travelModifier: 1.25,
    visibilityModifier: 1.0,
    encounterModifier: 0.85,
    description: 'Extreme heat requires more rest'
  },
  'cold': {
    travelModifier: 1.15,
    visibilityModifier: 1.0,
    encounterModifier: 0.9,
    description: 'Cold temperatures slow travel'
  },
  'freezing': {
    travelModifier: 1.5,
    visibilityModifier: 1.0,
    encounterModifier: 0.7,
    description: 'Freezing conditions, risk of frostbite'
  }
};

/**
 * Get the combined effects for a full weather state
 * Takes into account condition, temperature, wind, and precipitation
 */
export function getWeatherEffects(weather: Weather): WeatherEffects {
  const baseEffects = WEATHER_EFFECTS[weather.condition];

  // Start with base effects
  let travelModifier = baseEffects.travelModifier;
  let visibilityModifier = baseEffects.visibilityModifier;
  let encounterModifier = baseEffects.encounterModifier;

  // Adjust for wind (additive modifier)
  switch (weather.wind) {
    case 'strong':
      travelModifier += 0.15;
      break;
    case 'gale':
      travelModifier += 0.35;
      visibilityModifier *= 0.9;
      break;
  }

  // Adjust for temperature extremes (additive modifier)
  switch (weather.temperature) {
    case 'scorching':
      travelModifier += 0.25;
      encounterModifier *= 0.85;
      break;
    case 'hot':
      travelModifier += 0.1;
      break;
    case 'freezing':
      travelModifier += 0.15;
      encounterModifier *= 0.9;
      break;
  }

  // Build description
  const descriptions: string[] = [baseEffects.description];

  if (weather.wind === 'gale') {
    descriptions.push('Gale-force winds make travel treacherous.');
  } else if (weather.wind === 'strong') {
    descriptions.push('Strong winds slow progress.');
  }

  if (weather.temperature === 'scorching') {
    descriptions.push('Scorching heat requires frequent rest.');
  } else if (weather.temperature === 'freezing') {
    descriptions.push('Freezing temperatures pose danger.');
  }

  return {
    travelModifier: Math.round(travelModifier * 100) / 100,
    visibilityModifier: Math.round(visibilityModifier * 100) / 100,
    encounterModifier: Math.round(encounterModifier * 100) / 100,
    description: descriptions.join(' ')
  };
}

/**
 * Format travel modifier as percentage change
 */
export function formatTravelModifier(modifier: number): string {
  if (modifier === 1.0) return 'Normal';
  const percent = Math.round((modifier - 1) * 100);
  return `${percent}% slower`;
}

/**
 * Format visibility modifier as percentage
 */
export function formatVisibilityModifier(modifier: number): string {
  if (modifier >= 1.0) return 'Normal';
  const percent = Math.round(modifier * 100);
  return `${percent}%`;
}

/**
 * Format encounter modifier as description
 */
export function formatEncounterModifier(modifier: number): string {
  if (modifier >= 0.95) return 'Normal';
  if (modifier >= 0.8) return 'Fewer';
  if (modifier >= 0.5) return 'Much fewer';
  return 'Rare';
}

/**
 * Get severity rating for weather (used for UI indicators)
 */
export function getWeatherSeverity(weather: Weather): 'calm' | 'mild' | 'moderate' | 'severe' | 'extreme' {
  const effects = getWeatherEffects(weather);

  if (effects.travelModifier >= 2.5 || effects.visibilityModifier <= 0.2) {
    return 'extreme';
  }
  if (effects.travelModifier >= 1.75 || effects.visibilityModifier <= 0.4) {
    return 'severe';
  }
  if (effects.travelModifier >= 1.25 || effects.visibilityModifier <= 0.7) {
    return 'moderate';
  }
  if (effects.travelModifier >= 1.1 || effects.visibilityModifier <= 0.9) {
    return 'mild';
  }
  return 'calm';
}
