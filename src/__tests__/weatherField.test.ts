import { describe, it, expect } from 'vitest';
import {
  createDefaultCell,
  interpolateCell,
  interpolateField,
  clamp,
  windSpeed,
  windDirection
} from '../services/weather/WeatherField';
import type { WeatherFieldCell, WeatherField } from '../types/Weather';

describe('WeatherField utilities', () => {
  describe('createDefaultCell', () => {
    it('returns neutral weather values', () => {
      const cell = createDefaultCell();
      expect(cell.pressure).toBe(1013);
      expect(cell.temperature).toBe(15);
      expect(cell.humidity).toBe(0.4);
      expect(cell.windVector).toEqual({ u: 0, v: 0 });
      expect(cell.gustIntensity).toBe(0);
      expect(cell.turbulence).toBe(0);
      expect(cell.precipIntensity).toBe(0);
      expect(cell.cloudCover).toBe(0.3);
      expect(cell.frontType).toBe('none');
    });

    it('returns distinct objects each call', () => {
      const a = createDefaultCell();
      const b = createDefaultCell();
      expect(a).not.toBe(b);
      expect(a.windVector).not.toBe(b.windVector);
    });
  });

  describe('interpolateCell', () => {
    const cellA: WeatherFieldCell = {
      pressure: 1000,
      temperature: 10,
      humidity: 0.2,
      windVector: { u: 0, v: 0 },
      gustIntensity: 0,
      turbulence: 0,
      precipIntensity: 0,
      cloudCover: 0,
      frontType: 'none'
    };

    const cellB: WeatherFieldCell = {
      pressure: 1020,
      temperature: 30,
      humidity: 0.8,
      windVector: { u: 10, v: -4 },
      gustIntensity: 1,
      turbulence: 0.5,
      precipIntensity: 0.6,
      cloudCover: 1,
      frontType: 'cold'
    };

    it('returns cellA when t=0', () => {
      const result = interpolateCell(cellA, cellB, 0);
      expect(result.pressure).toBe(1000);
      expect(result.temperature).toBe(10);
      expect(result.humidity).toBe(0.2);
      expect(result.frontType).toBe('none');
    });

    it('returns cellB when t=1', () => {
      const result = interpolateCell(cellA, cellB, 1);
      expect(result.pressure).toBe(1020);
      expect(result.temperature).toBe(30);
      expect(result.frontType).toBe('cold');
    });

    it('interpolates midpoint at t=0.5', () => {
      const result = interpolateCell(cellA, cellB, 0.5);
      expect(result.pressure).toBe(1010);
      expect(result.temperature).toBe(20);
      expect(result.humidity).toBeCloseTo(0.5);
      expect(result.windVector.u).toBe(5);
      expect(result.windVector.v).toBe(-2);
      expect(result.cloudCover).toBeCloseTo(0.5);
    });

    it('picks frontType from A when t<0.5, from B when t>=0.5', () => {
      expect(interpolateCell(cellA, cellB, 0.3).frontType).toBe('none');
      expect(interpolateCell(cellA, cellB, 0.5).frontType).toBe('cold');
      expect(interpolateCell(cellA, cellB, 0.7).frontType).toBe('cold');
    });
  });

  describe('interpolateField', () => {
    it('interpolates matching keys from both fields', () => {
      const fieldA: WeatherField = {
        '0,0': createDefaultCell(),
        '1,0': createDefaultCell()
      };
      const fieldB: WeatherField = {
        '0,0': { ...createDefaultCell(), pressure: 1020 },
        '1,0': { ...createDefaultCell(), temperature: 25 }
      };

      const result = interpolateField(fieldA, fieldB, 0.5);
      expect(result['0,0']!.pressure).toBeCloseTo(1016.5);
      expect(result['1,0']!.temperature).toBe(20);
    });

    it('uses B cell if A is missing for a key', () => {
      const fieldA: WeatherField = {};
      const fieldB: WeatherField = {
        '2,2': { ...createDefaultCell(), pressure: 990 }
      };

      const result = interpolateField(fieldA, fieldB, 0.5);
      expect(result['2,2']!.pressure).toBe(990);
    });

    it('returns empty field when both are empty', () => {
      const result = interpolateField({}, {}, 0.5);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('clamp', () => {
    it('returns value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
    it('clamps to min', () => {
      expect(clamp(-3, 0, 10)).toBe(0);
    });
    it('clamps to max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
    it('handles equal min/max', () => {
      expect(clamp(50, 5, 5)).toBe(5);
    });
  });

  describe('windSpeed', () => {
    it('returns 0 for no wind', () => {
      const cell = createDefaultCell();
      expect(windSpeed(cell)).toBe(0);
    });

    it('computes magnitude correctly', () => {
      const cell = { ...createDefaultCell(), windVector: { u: 3, v: 4 } };
      expect(windSpeed(cell)).toBe(5);
    });
  });

  describe('windDirection', () => {
    it('returns 0 for eastward wind', () => {
      const cell = { ...createDefaultCell(), windVector: { u: 5, v: 0 } };
      expect(windDirection(cell)).toBe(0);
    });

    it('returns PI/2 for southward wind', () => {
      const cell = { ...createDefaultCell(), windVector: { u: 0, v: 5 } };
      expect(windDirection(cell)).toBeCloseTo(Math.PI / 2);
    });
  });
});
