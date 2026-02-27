// Perlin noise-based weather engine (fallback/lightweight)
// Generates smooth, evolving weather patterns using layered noise + terrain rules

import type {
  WeatherField,
  WeatherSimulationConfig,
  WeatherEvent,
  WeatherEventType,
  PressureSystem,
  WeatherFront
} from '../../types/Weather';
import type { WeatherSimulator, SimGrid, SimHex, TickResult } from './WeatherSimulator';
import { PerlinNoise2D } from './perlin';
import { clamp } from './WeatherField';
import { createWeatherEvent } from './WeatherEvents';
import { SeededRNG, stringToSeed } from '../rng';

/** Terrain modifiers for the Perlin engine */
const TERRAIN_MODIFIERS: Record<string, { tempMod: number; humidMod: number; windMod: number }> = {
  Mountains: { tempMod: -8, humidMod: -0.1, windMod: 0.3 },
  Hills: { tempMod: -3, humidMod: 0, windMod: 0.15 },
  Forest: { tempMod: -2, humidMod: 0.1, windMod: -0.1 },
  Swamp: { tempMod: 0, humidMod: 0.3, windMod: -0.15 },
  Desert: { tempMod: 6, humidMod: -0.3, windMod: 0.1 },
  Coast: { tempMod: 0, humidMod: 0.25, windMod: 0.2 },
  Jungle: { tempMod: 3, humidMod: 0.35, windMod: -0.1 },
  Tundra: { tempMod: -10, humidMod: -0.1, windMod: 0.2 },
  Plains: { tempMod: 0, humidMod: 0, windMod: 0 },
  Grassland: { tempMod: 0, humidMod: 0, windMod: 0.05 }
};

const DEFAULT_MOD = { tempMod: 0, humidMod: 0, windMod: 0 };

/** Hex 6-neighbor offsets for odd-q vertical layout (inline to avoid DOM imports in worker) */
function hexNeighborKeys(q: number, r: number): string[] {
  const isOdd = q % 2 !== 0;
  if (isOdd) {
    return [
      `${q + 1},${r}`, `${q + 1},${r + 1}`, `${q},${r + 1}`,
      `${q - 1},${r + 1}`, `${q - 1},${r}`, `${q},${r - 1}`
    ];
  }
  return [
    `${q + 1},${r - 1}`, `${q + 1},${r}`, `${q},${r + 1}`,
    `${q - 1},${r}`, `${q - 1},${r - 1}`, `${q},${r - 1}`
  ];
}

export class PerlinWeatherEngine implements WeatherSimulator {
  private grid!: SimGrid;
  private hexMap: Map<string, SimHex> = new Map();
  private config!: WeatherSimulationConfig;
  private seed: number = 0;
  private tickCount: number = 0;
  private field: WeatherField = {};
  private activeEvents: WeatherEvent[] = [];
  private rng!: SeededRNG;

  // Noise layers (initialized on init)
  private pressureNoise!: PerlinNoise2D;
  private temperatureNoise!: PerlinNoise2D;
  private humidityNoise!: PerlinNoise2D;
  private windUNoise!: PerlinNoise2D;
  private windVNoise!: PerlinNoise2D;
  private cloudNoise!: PerlinNoise2D;

  init(grid: SimGrid, seed: string, config: WeatherSimulationConfig): void {
    this.grid = grid;
    this.config = config;
    this.seed = stringToSeed(seed || 'default');
    this.rng = new SeededRNG(this.seed + 9000);
    this.tickCount = 0;
    this.activeEvents = [];

    this.hexMap.clear();
    for (const hex of grid.hexes) {
      this.hexMap.set(hex.key, hex);
    }

    // Create noise layers with different seed offsets
    this.pressureNoise = new PerlinNoise2D(this.seed);
    this.temperatureNoise = new PerlinNoise2D(this.seed + 1000);
    this.humidityNoise = new PerlinNoise2D(this.seed + 2000);
    this.windUNoise = new PerlinNoise2D(this.seed + 3000);
    this.windVNoise = new PerlinNoise2D(this.seed + 4000);
    this.cloudNoise = new PerlinNoise2D(this.seed + 5000);

    // Generate initial field
    this.generateField();
  }

  tick(): TickResult {
    this.tickCount++;
    this.generateField();

    // Update events
    const endedEventIds: string[] = [];
    this.activeEvents = this.activeEvents.filter(event => {
      event.remainingTicks--;
      if (event.remainingTicks <= 0) {
        endedEventIds.push(event.id);
        return false;
      }
      // Fade intensity during fadeout phase
      if (event.remainingTicks <= event.fadeoutTicks) {
        event.intensity *= event.remainingTicks / event.fadeoutTicks;
      }
      return true;
    });

    // Apply event effects to field
    this.applyEventEffects();

    return {
      field: { ...this.field },
      pressureSystems: this.extractPressureSystems(),
      fronts: this.extractFronts(),
      activeEvents: [...this.activeEvents],
      spawnedEvents: [],
      endedEventIds
    };
  }

  setConfig(config: Partial<WeatherSimulationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  spawnEvent(type: WeatherEventType, centerKey: string, intensity?: number, durationTicks?: number): WeatherEvent {
    const event = createWeatherEvent(type, centerKey, intensity, durationTicks);
    this.activeEvents.push(event);
    return event;
  }

  cancelEvent(eventId: string): void {
    this.activeEvents = this.activeEvents.filter(e => e.id !== eventId);
  }

  updateTerrain(hexes: SimHex[]): void {
    for (const hex of hexes) {
      this.hexMap.set(hex.key, hex);
    }
  }

  getField(): WeatherField {
    return this.field;
  }

  reset(): void {
    this.tickCount = 0;
    this.activeEvents = [];
    this.field = {};
  }

  private generateField(): void {
    // Time offset for animation (slowly evolving patterns)
    const t = this.tickCount * 0.02 * (this.config.simulationSpeed / 3);
    const field: WeatherField = {};

    for (const hex of this.grid.hexes) {
      const { key, terrain, elevation } = hex;
      // Parse coordinate from key
      const parts = key.split(',');
      const q = parseInt(parts[0], 10);
      const r = parseInt(parts[1], 10);

      // Noise coordinates (scaled for smooth patterns)
      const nx = q * 0.15;
      const ny = r * 0.15;

      // Terrain modifiers
      const mod = TERRAIN_MODIFIERS[terrain] || DEFAULT_MOD;

      // Pressure: base 1013 hPa, vary ±25 with noise
      const pressureRaw = this.pressureNoise.fbm(nx, ny + t * 0.3, 3);
      const pressure = clamp(1013 + pressureRaw * 25, 985, 1045);

      // Temperature: base 15°C, elevation lapse rate, terrain modifier
      const tempRaw = this.temperatureNoise.fbm(nx, ny + t * 0.2, 3);
      const elevationLapse = -6.5 * (elevation / 5); // -6.5C per max elevation
      const temperature = clamp(15 + tempRaw * 12 + elevationLapse + mod.tempMod, -20, 45);

      // Humidity: 0-1, influenced by coast/rivers/terrain
      const humRaw = this.humidityNoise.fbm(nx, ny + t * 0.25, 3);
      const coastBonus = hex.isCoast ? 0.2 : 0;
      const riverBonus = hex.hasRiver ? 0.1 : 0;
      const humidity = clamp(0.4 + humRaw * 0.35 + coastBonus + riverBonus + mod.humidMod, 0, 1);

      // Wind vector
      const windU = this.windUNoise.fbm(nx, ny + t * 0.4, 2) * 8 * (1 + mod.windMod);
      const windV = this.windVNoise.fbm(nx + t * 0.4, ny, 2) * 8 * (1 + mod.windMod);

      // Turbulence: higher near mountains and coast
      const turbulence = clamp(
        (elevation >= 4 ? 0.4 : elevation >= 3 ? 0.2 : 0) +
        (hex.isCoast ? 0.15 : 0) +
        Math.abs(this.pressureNoise.noise(nx * 3, ny * 3 + t)) * 0.3,
        0, 1
      );

      // Cloud cover: derived from humidity and pressure
      const cloudRaw = this.cloudNoise.fbm(nx, ny + t * 0.15, 3);
      const cloudCover = clamp(humidity * 0.6 + cloudRaw * 0.3 + (pressure < 1010 ? 0.2 : -0.1), 0, 1);

      // Precipitation: triggers when humidity high + clouds + low pressure
      const precipThreshold = 0.55 + (temperature < 0 ? -0.1 : 0); // easier to precipitate when cold
      const precipIntensity = humidity > precipThreshold
        ? clamp((humidity - precipThreshold) * 3 * cloudCover, 0, 1)
        : 0;

      // Gust intensity
      const windMag = Math.sqrt(windU * windU + windV * windV);
      const gustIntensity = clamp(turbulence * 0.5 + (windMag / 12) * 0.5, 0, 1);

      field[key] = {
        pressure,
        temperature,
        humidity,
        windVector: { u: windU, v: windV },
        gustIntensity,
        turbulence,
        precipIntensity,
        cloudCover,
        frontType: 'none'
      };
    }

    this.field = field;
  }

  private applyEventEffects(): void {
    for (const event of this.activeEvents) {
      const centerParts = event.centerKey.split(',');
      const cq = parseInt(centerParts[0], 10);
      const cr = parseInt(centerParts[1], 10);

      for (const [key, cell] of Object.entries(this.field)) {
        const parts = key.split(',');
        const q = parseInt(parts[0], 10);
        const r = parseInt(parts[1], 10);
        const dist = Math.sqrt((q - cq) ** 2 + (r - cr) ** 2);

        if (dist > event.radius) continue;

        const falloff = 1 - (dist / event.radius);
        const strength = falloff * event.intensity;

        switch (event.type) {
          case 'hurricane':
            cell.pressure -= strength * 30;
            cell.precipIntensity = clamp(cell.precipIntensity + strength * 0.8, 0, 1);
            cell.windVector.u += Math.cos(Math.atan2(r - cr, q - cq) + Math.PI / 2) * strength * 15;
            cell.windVector.v += Math.sin(Math.atan2(r - cr, q - cq) + Math.PI / 2) * strength * 15;
            cell.cloudCover = clamp(cell.cloudCover + strength * 0.5, 0, 1);
            cell.turbulence = clamp(cell.turbulence + strength * 0.6, 0, 1);
            break;

          case 'blizzard':
            cell.temperature -= strength * 15;
            cell.precipIntensity = clamp(cell.precipIntensity + strength * 0.9, 0, 1);
            cell.windVector.u += strength * 8 * (this.rng.next() - 0.5);
            cell.windVector.v += strength * 8 * (this.rng.next() - 0.5);
            cell.cloudCover = clamp(cell.cloudCover + strength * 0.7, 0, 1);
            break;

          case 'heat-wave':
            cell.temperature += strength * 12;
            cell.pressure += strength * 15;
            cell.humidity = clamp(cell.humidity - strength * 0.3, 0, 1);
            cell.cloudCover = clamp(cell.cloudCover - strength * 0.4, 0, 1);
            break;

          case 'monsoon':
            cell.humidity = clamp(cell.humidity + strength * 0.4, 0, 1);
            cell.precipIntensity = clamp(cell.precipIntensity + strength * 0.7, 0, 1);
            cell.cloudCover = clamp(cell.cloudCover + strength * 0.6, 0, 1);
            cell.pressure -= strength * 10;
            break;

          case 'tornado':
            cell.pressure -= strength * 40;
            cell.turbulence = clamp(cell.turbulence + strength, 0, 1);
            cell.gustIntensity = clamp(cell.gustIntensity + strength, 0, 1);
            cell.windVector.u += Math.cos(Math.atan2(r - cr, q - cq) + Math.PI / 2) * strength * 20;
            cell.windVector.v += Math.sin(Math.atan2(r - cr, q - cq) + Math.PI / 2) * strength * 20;
            break;
        }
      }
    }
  }

  private extractPressureSystems(): PressureSystem[] {
    // Simple extraction: find local pressure extremes
    const systems: PressureSystem[] = [];
    const checked = new Set<string>();

    for (const [key, cell] of Object.entries(this.field)) {
      if (checked.has(key)) continue;
      if (cell.pressure < 1000 || cell.pressure > 1025) {
        const type = cell.pressure < 1013 ? 'low' : 'high';
        systems.push({
          id: `ps-${key}-${this.tickCount}`,
          type,
          centerKey: key,
          pressure: cell.pressure,
          radius: 3,
          driftVector: { u: cell.windVector.u * 0.1, v: cell.windVector.v * 0.1 }
        });
        // Mark neighbors as checked to avoid duplicates
        const parts = key.split(',');
        const q = parseInt(parts[0], 10);
        const r = parseInt(parts[1], 10);
        for (let dq = -2; dq <= 2; dq++) {
          for (let dr = -2; dr <= 2; dr++) {
            checked.add(`${q + dq},${r + dr}`);
          }
        }
      }
    }
    return systems;
  }

  private extractFronts(): WeatherFront[] {
    // Detect fronts where pressure gradient is steep
    const fronts: WeatherFront[] = [];
    const frontCells: string[] = [];

    for (const [key, cell] of Object.entries(this.field)) {
      const parts = key.split(',');
      const q = parseInt(parts[0], 10);
      const r = parseInt(parts[1], 10);

      // Check hex 6-neighbors for pressure difference
      const neighborKeyList = hexNeighborKeys(q, r);

      for (const nk of neighborKeyList) {
        const neighbor = this.field[nk];
        if (!neighbor) continue;
        const pressureDiff = Math.abs(cell.pressure - neighbor.pressure);
        if (pressureDiff > 3) {
          const tempDiff = cell.temperature - neighbor.temperature;
          cell.frontType = tempDiff > 0 ? 'warm' : tempDiff < 0 ? 'cold' : 'occluded';
          frontCells.push(key);
          break;
        }
      }
    }

    if (frontCells.length > 0) {
      const firstFrontType = this.field[frontCells[0]]?.frontType;
      const frontType: 'cold' | 'warm' | 'occluded' =
        firstFrontType === 'warm' ? 'warm' :
        firstFrontType === 'occluded' ? 'occluded' : 'cold';
      fronts.push({
        id: `front-${this.tickCount}`,
        type: frontType,
        hexKeys: frontCells,
        direction: { u: 1, v: 0 },
        intensity: 0.5
      });
    }

    return fronts;
  }
}
