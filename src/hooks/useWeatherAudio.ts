// Hook bridging camera state + weather field to WeatherAudioService
// Samples weather around viewport center, blends values, and updates audio params

import { useRef, useCallback, useEffect } from 'react';
import type { WeatherField } from '../types/Weather';
import { coordinateAt, getHexNeighbors } from '../services/hexGeometry';
import { weatherAudio } from '../services/weatherAudioService';
import type { WeatherAudioParams } from '../services/weatherAudioService';

interface UseWeatherAudioOptions {
  field: WeatherField;
  enabled: boolean;
  volume: number;
  gridWidth: number;
  gridHeight: number;
}

// Throttle interval in ms (~10 updates/sec)
const UPDATE_INTERVAL = 100;

/**
 * Hook that provides a function to update weather audio based on camera state.
 * Call updateAudio() in your draw loop alongside weather overlay rendering.
 */
export function useWeatherAudio({
  field,
  enabled,
  volume,
  gridWidth,
  gridHeight,
}: UseWeatherAudioOptions): {
  updateAudio: (zoom: number, panX: number, panY: number, canvasW: number, canvasH: number) => void;
} {
  const lastUpdateRef = useRef(0);

  // Sync enabled/volume to the service
  useEffect(() => {
    weatherAudio.setEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    weatherAudio.setVolume(volume);
  }, [volume]);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      weatherAudio.setEnabled(false);
    };
  }, []);

  const updateAudio = useCallback((
    zoom: number,
    panX: number,
    panY: number,
    canvasW: number,
    canvasH: number
  ) => {
    if (!enabled || Object.keys(field).length === 0) return;

    // Throttle updates
    const now = performance.now();
    if (now - lastUpdateRef.current < UPDATE_INTERVAL) return;
    lastUpdateRef.current = now;

    // Compute viewport center in world coords
    const centerWorldX = (canvasW / 2 - panX) / zoom;
    const centerWorldY = (canvasH / 2 - panY) / zoom;

    // Find center hex
    const centerCoord = coordinateAt(
      { x: centerWorldX, y: centerWorldY },
      gridWidth,
      gridHeight
    );

    if (!centerCoord) return;

    // Determine sampling rings based on zoom level
    // Far zoom = more rings (wider area), close zoom = fewer rings
    const maxRings = zoom < 0.4 ? 3 : zoom < 0.8 ? 2 : 1;

    // Collect hex keys with distance weights
    const samples: { key: string; weight: number }[] = [];
    const centerKey = `${centerCoord.q},${centerCoord.r}`;

    if (field[centerKey]) {
      samples.push({ key: centerKey, weight: 1.0 });
    }

    // BFS to collect rings of neighbors
    const visited = new Set<string>([centerKey]);
    let frontier = [centerCoord];

    for (let ring = 1; ring <= maxRings; ring++) {
      const nextFrontier: typeof frontier = [];
      const ringWeight = 1 / (1 + ring * 0.5);

      for (const coord of frontier) {
        const neighbors = getHexNeighbors(coord);
        for (const n of neighbors) {
          if (n.q < 0 || n.q >= gridWidth || n.r < 0 || n.r >= gridHeight) continue;
          const nKey = `${n.q},${n.r}`;
          if (visited.has(nKey)) continue;
          visited.add(nKey);
          nextFrontier.push(n);

          if (field[nKey]) {
            samples.push({ key: nKey, weight: ringWeight });
          }
        }
      }

      frontier = nextFrontier;
    }

    if (samples.length === 0) return;

    // Weighted blend of weather values
    let totalWeight = 0;
    let precipIntensity = 0;
    let temperature = 0;
    let windSpeed = 0;
    let gustIntensity = 0;
    let humidity = 0;
    let cloudCover = 0;

    for (const { key, weight } of samples) {
      const cell = field[key];
      totalWeight += weight;
      precipIntensity += cell.precipIntensity * weight;
      temperature += cell.temperature * weight;
      const ws = Math.sqrt(cell.windVector.u ** 2 + cell.windVector.v ** 2);
      windSpeed += ws * weight;
      gustIntensity += cell.gustIntensity * weight;
      humidity += cell.humidity * weight;
      cloudCover += cell.cloudCover * weight;
    }

    const inv = 1 / totalWeight;
    precipIntensity *= inv;
    temperature *= inv;
    windSpeed *= inv;
    gustIntensity *= inv;
    humidity *= inv;
    cloudCover *= inv;

    // Derive storm intensity from blended precip × cloudCover
    const stormIntensity = precipIntensity * cloudCover;

    const params: WeatherAudioParams = {
      zoomLevel: zoom,
      precipIntensity,
      temperature,
      windSpeed,
      gustIntensity,
      humidity,
      cloudCover,
      stormIntensity,
    };

    weatherAudio.updateParams(params);
  }, [field, enabled, gridWidth, gridHeight]);

  return { updateAudio };
}
