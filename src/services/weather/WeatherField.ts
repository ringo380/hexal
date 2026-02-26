// WeatherField utility: interpolation helpers, cell creation, field operations

import type { WeatherFieldCell, WeatherField } from '../../types/Weather';

/** Create a default (neutral) weather field cell */
export function createDefaultCell(): WeatherFieldCell {
  return {
    pressure: 1013,
    temperature: 15,
    humidity: 0.4,
    windVector: { u: 0, v: 0 },
    gustIntensity: 0,
    turbulence: 0,
    precipIntensity: 0,
    cloudCover: 0.3,
    frontType: 'none'
  };
}

/** Linearly interpolate between two weather field cells by factor t in [0,1] */
export function interpolateCell(a: WeatherFieldCell, b: WeatherFieldCell, t: number): WeatherFieldCell {
  const s = 1 - t;
  return {
    pressure: s * a.pressure + t * b.pressure,
    temperature: s * a.temperature + t * b.temperature,
    humidity: s * a.humidity + t * b.humidity,
    windVector: {
      u: s * a.windVector.u + t * b.windVector.u,
      v: s * a.windVector.v + t * b.windVector.v
    },
    gustIntensity: s * a.gustIntensity + t * b.gustIntensity,
    turbulence: s * a.turbulence + t * b.turbulence,
    precipIntensity: s * a.precipIntensity + t * b.precipIntensity,
    cloudCover: s * a.cloudCover + t * b.cloudCover,
    frontType: t < 0.5 ? a.frontType : b.frontType
  };
}

/** Interpolate an entire field between two snapshots */
export function interpolateField(fieldA: WeatherField, fieldB: WeatherField, t: number): WeatherField {
  const result: WeatherField = {};
  for (const key of Object.keys(fieldB)) {
    const a = fieldA[key];
    const b = fieldB[key];
    if (a && b) {
      result[key] = interpolateCell(a, b, t);
    } else {
      result[key] = b || a;
    }
  }
  return result;
}

/** Clamp a number to [min, max] */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Wind speed magnitude from vector */
export function windSpeed(cell: WeatherFieldCell): number {
  return Math.sqrt(cell.windVector.u * cell.windVector.u + cell.windVector.v * cell.windVector.v);
}

/** Wind direction in radians (0 = east, PI/2 = south) */
export function windDirection(cell: WeatherFieldCell): number {
  return Math.atan2(cell.windVector.v, cell.windVector.u);
}
