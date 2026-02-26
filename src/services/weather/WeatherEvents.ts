// Weather event definitions: Hurricane, Blizzard, Heat Wave, Monsoon, Tornado

import type { WeatherEventType, WeatherEvent } from '../../types/Weather';

/** Configuration for each weather event type */
export interface WeatherEventDef {
  type: WeatherEventType;
  label: string;
  description: string;
  defaultRadius: number;
  defaultDuration: number;     // ticks
  defaultFadeout: number;      // ticks for gradual decay
  minIntensity: number;
  maxIntensity: number;
  // Thresholds for natural spawning (fluid engine)
  naturalSpawn?: {
    pressureThreshold?: number;    // hPa below which event can spawn
    temperatureThreshold?: number; // Celsius threshold
    humidityThreshold?: number;    // 0-1
    requiresCoast?: boolean;
    requiresCold?: boolean;
  };
}

export const WEATHER_EVENT_DEFS: Record<WeatherEventType, WeatherEventDef> = {
  hurricane: {
    type: 'hurricane',
    label: 'Hurricane',
    description: 'Spiraling low-pressure system with extreme winds and rain',
    defaultRadius: 5,
    defaultDuration: 120,
    defaultFadeout: 30,
    minIntensity: 0.6,
    maxIntensity: 1.0,
    naturalSpawn: {
      pressureThreshold: 990,
      requiresCoast: true
    }
  },
  blizzard: {
    type: 'blizzard',
    label: 'Blizzard',
    description: 'Extreme cold with heavy snow and whiteout conditions',
    defaultRadius: 4,
    defaultDuration: 80,
    defaultFadeout: 20,
    minIntensity: 0.5,
    maxIntensity: 1.0,
    naturalSpawn: {
      temperatureThreshold: -10,
      humidityThreshold: 0.6,
      requiresCold: true
    }
  },
  'heat-wave': {
    type: 'heat-wave',
    label: 'Heat Wave',
    description: 'Persistent high-pressure dome causing extreme temperatures',
    defaultRadius: 6,
    defaultDuration: 150,
    defaultFadeout: 40,
    minIntensity: 0.4,
    maxIntensity: 0.9,
    naturalSpawn: {
      pressureThreshold: 1035, // high pressure
      temperatureThreshold: 35
    }
  },
  monsoon: {
    type: 'monsoon',
    label: 'Monsoon',
    description: 'Sustained regional rainfall with flooding',
    defaultRadius: 7,
    defaultDuration: 200,
    defaultFadeout: 50,
    minIntensity: 0.5,
    maxIntensity: 1.0,
    naturalSpawn: {
      humidityThreshold: 0.8,
      requiresCoast: true
    }
  },
  tornado: {
    type: 'tornado',
    label: 'Tornado',
    description: 'Localized extreme vortex with random path',
    defaultRadius: 1,
    defaultDuration: 15,
    defaultFadeout: 5,
    minIntensity: 0.8,
    maxIntensity: 1.0,
    naturalSpawn: {
      pressureThreshold: 995,
      humidityThreshold: 0.7
    }
  }
};

let eventCounter = 0;

/** Create a new weather event instance */
export function createWeatherEvent(
  type: WeatherEventType,
  centerKey: string,
  intensity?: number,
  durationTicks?: number
): WeatherEvent {
  const def = WEATHER_EVENT_DEFS[type];
  eventCounter++;
  return {
    id: `event-${type}-${eventCounter}-${Date.now()}`,
    type,
    centerKey,
    radius: def.defaultRadius,
    intensity: intensity ?? (def.minIntensity + def.maxIntensity) / 2,
    remainingTicks: durationTicks ?? def.defaultDuration,
    fadeoutTicks: def.defaultFadeout,
    path: type === 'tornado' ? [centerKey] : undefined
  };
}
