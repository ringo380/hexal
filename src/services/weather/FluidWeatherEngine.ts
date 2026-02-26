// Fluid dynamics-based weather engine (primary/full-featured)
// Simulates pressure gradients, advection, terrain modifiers, humidity transport,
// precipitation triggering, wind turbulence, front detection, and weather events

import type {
  WeatherField,
  WeatherSimulationConfig,
  WeatherEvent,
  WeatherEventType,
  PressureSystem,
  WeatherFront
} from '../../types/Weather';
import type { WeatherSimulator, SimGrid, SimHex, TickResult } from './WeatherSimulator';
import { clamp } from './WeatherField';
import { createWeatherEvent, WEATHER_EVENT_DEFS } from './WeatherEvents';
import { SeededRNG, stringToSeed } from '../rng';

/** Internal cell state with extra fields for the fluid simulation */
interface FluidCell {
  // Core fields (output to WeatherFieldCell)
  pressure: number;
  temperature: number;
  humidity: number;
  windU: number;
  windV: number;
  cloudCover: number;
  precipIntensity: number;
  turbulence: number;
  gustIntensity: number;
  frontType: 'none' | 'cold' | 'warm' | 'occluded';
  // Internal simulation fields
  terrain: string;
  elevation: number;
  isCoast: boolean;
  hasRiver: boolean;
  q: number;
  r: number;
}

// Neighbor offsets for odd-q hex layout
function getNeighborKeys(q: number, r: number): string[] {
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

// Terrain base humidity injection rate
const TERRAIN_MOISTURE: Record<string, number> = {
  Coast: 0.012, Swamp: 0.008, Jungle: 0.006,
  Forest: 0.003, Grassland: 0.001, Plains: 0.001
};

// Terrain base temperature bias
const TERRAIN_TEMP: Record<string, number> = {
  Desert: 4, Jungle: 2, Coast: 0, Plains: 0, Grassland: 0,
  Forest: -1, Hills: -2, Swamp: 0, Tundra: -6, Mountains: -5
};

export class FluidWeatherEngine implements WeatherSimulator {
  private grid!: SimGrid;
  private config!: WeatherSimulationConfig;
  private rng!: SeededRNG;
  private tickCount: number = 0;

  // Cell storage: indexed by hex key
  private cells: Map<string, FluidCell> = new Map();
  // Secondary buffer for double-buffered updates
  private nextCells: Map<string, FluidCell> = new Map();

  // Simulation entities
  private pressureSystems: PressureSystem[] = [];
  private activeEvents: WeatherEvent[] = [];

  // For deterministic spawning
  private pressureSystemCounter = 0;

  init(grid: SimGrid, seed: string, config: WeatherSimulationConfig): void {
    this.grid = grid;
    this.config = config;
    this.rng = new SeededRNG(stringToSeed(seed || 'default'));
    this.tickCount = 0;
    this.activeEvents = [];
    this.pressureSystems = [];
    this.pressureSystemCounter = 0;

    this.cells.clear();
    this.nextCells.clear();

    // Initialize cells
    for (const hex of grid.hexes) {
      const parts = hex.key.split(',');
      const q = parseInt(parts[0], 10);
      const r = parseInt(parts[1], 10);

      const cell: FluidCell = {
        pressure: 1013 + (this.rng.next() - 0.5) * 10,
        temperature: 15 + (TERRAIN_TEMP[hex.terrain] || 0) - hex.elevation * 1.3,
        humidity: 0.4 + (hex.isCoast ? 0.15 : 0) + (hex.hasRiver ? 0.08 : 0),
        windU: (this.rng.next() - 0.5) * 4,
        windV: (this.rng.next() - 0.5) * 4,
        cloudCover: 0.3 + this.rng.next() * 0.2,
        precipIntensity: 0,
        turbulence: 0,
        gustIntensity: 0,
        frontType: 'none',
        terrain: hex.terrain,
        elevation: hex.elevation,
        isCoast: hex.isCoast,
        hasRiver: hex.hasRiver,
        q, r
      };
      this.cells.set(hex.key, cell);
    }

    // Seed initial pressure systems
    this.seedPressureSystems();
  }

  tick(): TickResult {
    this.tickCount++;

    // 1. Update pressure systems (drift + spawn/decay)
    this.updatePressureSystems();

    // 2. Apply pressure system influence to cells
    this.applyPressureInfluence();

    // 3. Compute wind from pressure gradients
    this.computeWind();

    // 4. Advect humidity (transport by wind)
    this.advectHumidity();

    // 5. Compute temperature with terrain effects
    this.computeTemperature();

    // 6. Compute precipitation and cloud cover
    this.computePrecipitation();

    // 7. Detect fronts
    this.detectFronts();

    // 8. Compute turbulence
    this.computeTurbulence();

    // 9. Handle weather events
    const { spawnedEvents, endedEventIds } = this.updateEvents();

    // 10. Check for natural event spawning
    const naturalEvents = this.checkNaturalEventSpawning();
    spawnedEvents.push(...naturalEvents);

    // Swap buffers
    const tmp = this.cells;
    this.cells = this.nextCells;
    this.nextCells = tmp;

    // Build output
    const field = this.buildField();
    const fronts = this.buildFronts();

    return {
      field,
      pressureSystems: [...this.pressureSystems],
      fronts,
      activeEvents: [...this.activeEvents],
      spawnedEvents,
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
      const cell = this.cells.get(hex.key);
      if (cell) {
        cell.terrain = hex.terrain;
        cell.elevation = hex.elevation;
        cell.isCoast = hex.isCoast;
        cell.hasRiver = hex.hasRiver;
      }
    }
  }

  getField(): WeatherField {
    return this.buildField();
  }

  reset(): void {
    this.tickCount = 0;
    this.cells.clear();
    this.nextCells.clear();
    this.pressureSystems = [];
    this.activeEvents = [];
  }

  // ====== Internal simulation steps ======

  private seedPressureSystems(): void {
    // Create 2-4 initial pressure systems spread across the grid
    const count = 2 + Math.floor(this.rng.next() * 3);
    for (let i = 0; i < count; i++) {
      const hex = this.rng.pick(this.grid.hexes);
      const type = this.rng.next() > 0.5 ? 'high' : 'low';
      this.pressureSystemCounter++;
      this.pressureSystems.push({
        id: `ps-${this.pressureSystemCounter}`,
        type,
        centerKey: hex.key,
        pressure: type === 'high' ? 1025 + this.rng.next() * 15 : 995 - this.rng.next() * 10,
        radius: 3 + Math.floor(this.rng.next() * 4),
        driftVector: {
          u: (this.rng.next() - 0.5) * 0.3,
          v: (this.rng.next() - 0.5) * 0.3
        }
      });
    }
  }

  private updatePressureSystems(): void {
    // Drift pressure systems
    this.pressureSystems = this.pressureSystems.filter(ps => {
      const parts = ps.centerKey.split(',');
      const q = parseInt(parts[0], 10);
      const r = parseInt(parts[1], 10);

      // Drift (slow movement)
      const newQ = Math.round(q + ps.driftVector.u);
      const newR = Math.round(r + ps.driftVector.v);
      const newKey = `${newQ},${newR}`;

      // Remove if drifted off grid
      if (!this.cells.has(newKey)) return false;
      ps.centerKey = newKey;

      // Pressure systems gradually weaken
      if (ps.type === 'high') {
        ps.pressure -= 0.05;
        if (ps.pressure < 1018) return false;
      } else {
        ps.pressure += 0.05;
        if (ps.pressure > 1008) return false;
      }

      return true;
    });

    // Occasionally spawn new pressure systems
    if (this.tickCount % 30 === 0 && this.pressureSystems.length < 5) {
      const hex = this.rng.pick(this.grid.hexes);
      const type = this.rng.next() > 0.5 ? 'high' : 'low';
      this.pressureSystemCounter++;
      this.pressureSystems.push({
        id: `ps-${this.pressureSystemCounter}`,
        type,
        centerKey: hex.key,
        pressure: type === 'high' ? 1028 + this.rng.next() * 10 : 993 - this.rng.next() * 8,
        radius: 3 + Math.floor(this.rng.next() * 4),
        driftVector: {
          u: (this.rng.next() - 0.5) * 0.3,
          v: (this.rng.next() - 0.5) * 0.3
        }
      });
    }
  }

  private applyPressureInfluence(): void {
    // Apply pressure system influence to the field
    for (const [key, cell] of this.cells) {
      // Start with neutral tendency
      let pressureForce = 0;

      for (const ps of this.pressureSystems) {
        const psParts = ps.centerKey.split(',');
        const psQ = parseInt(psParts[0], 10);
        const psR = parseInt(psParts[1], 10);
        const dist = Math.sqrt((cell.q - psQ) ** 2 + (cell.r - psR) ** 2);

        if (dist < ps.radius) {
          const falloff = 1 - (dist / ps.radius);
          const influence = (ps.pressure - 1013) * falloff * 0.3;
          pressureForce += influence;
        }
      }

      // Blend pressure toward influence
      cell.pressure = cell.pressure * 0.95 + (1013 + pressureForce) * 0.05;
      cell.pressure = clamp(cell.pressure, 975, 1050);

      // Copy to next buffer
      this.nextCells.set(key, { ...cell });
    }
  }

  private computeWind(): void {
    // Wind from pressure gradients + Coriolis-like deflection
    for (const [, cell] of this.nextCells) {
      const neighbors = getNeighborKeys(cell.q, cell.r);
      let gradU = 0;
      let gradV = 0;
      let count = 0;

      for (const nk of neighbors) {
        const neighbor = this.nextCells.get(nk) || this.cells.get(nk);
        if (!neighbor) continue;
        // Pressure gradient force: wind flows from high to low pressure
        const dP = cell.pressure - neighbor.pressure;
        const dQ = neighbor.q - cell.q;
        const dR = neighbor.r - cell.r;
        gradU += dP * dQ;
        gradV += dP * dR;
        count++;
      }

      if (count > 0) {
        gradU /= count;
        gradV /= count;
      }

      // Scale pressure gradient to wind speed
      const windScale = 1.5;
      let newU = gradU * windScale;
      let newV = gradV * windScale;

      // Coriolis-like deflection (rotate wind 30° clockwise for Northern hemisphere feel)
      const cos30 = 0.866;
      const sin30 = 0.5;
      const rotU = newU * cos30 + newV * sin30;
      const rotV = -newU * sin30 + newV * cos30;

      // Blend with current wind (momentum)
      cell.windU = cell.windU * 0.8 + rotU * 0.2;
      cell.windV = cell.windV * 0.8 + rotV * 0.2;

      // Clamp wind speed
      const speed = Math.sqrt(cell.windU * cell.windU + cell.windV * cell.windV);
      if (speed > 20) {
        const scale = 20 / speed;
        cell.windU *= scale;
        cell.windV *= scale;
      }
    }
  }

  private advectHumidity(): void {
    // Transport humidity by wind (semi-Lagrangian advection)
    for (const [, cell] of this.nextCells) {
      // Source humidity injection
      const moistureRate = TERRAIN_MOISTURE[cell.terrain] || 0;
      const riverMoisture = cell.hasRiver ? 0.005 : 0;

      // Find upwind cell (trace back along wind vector)
      const srcQ = Math.round(cell.q - cell.windU * 0.15);
      const srcR = Math.round(cell.r - cell.windV * 0.15);
      const srcKey = `${srcQ},${srcR}`;
      const srcCell = this.cells.get(srcKey);

      let advectedHumidity = cell.humidity;
      if (srcCell) {
        // Blend current with upwind humidity
        advectedHumidity = cell.humidity * 0.7 + srcCell.humidity * 0.3;
      }

      // Orographic lift: mountains force moisture upward, increasing precipitation
      if (cell.elevation >= 4) {
        // Windward side gets more moisture, lee side gets less
        const windMag = Math.sqrt(cell.windU * cell.windU + cell.windV * cell.windV);
        if (windMag > 1) {
          // Check if wind is pushing into the mountain
          advectedHumidity += 0.02 * (windMag / 10);
        }
      }

      cell.humidity = clamp(
        advectedHumidity + moistureRate + riverMoisture - 0.002, // slow evaporation
        0, 1
      );
    }
  }

  private computeTemperature(): void {
    for (const [, cell] of this.nextCells) {
      const baseTempBias = TERRAIN_TEMP[cell.terrain] || 0;
      const elevationLapse = -6.5 * (cell.elevation / 5);

      // Pressure influence: high pressure = warmer, low pressure = cooler
      const pressureTempEffect = (cell.pressure - 1013) * 0.1;

      // Cloud cover moderates temperature (reduces extremes)
      const cloudModeration = cell.cloudCover * 2 * (cell.temperature > 15 ? -1 : 1);

      // Slowly blend toward target
      const targetTemp = 15 + baseTempBias + elevationLapse + pressureTempEffect + cloudModeration;
      cell.temperature = cell.temperature * 0.95 + targetTemp * 0.05;
      cell.temperature = clamp(cell.temperature, -25, 50);
    }
  }

  private computePrecipitation(): void {
    for (const [, cell] of this.nextCells) {
      // Saturation threshold: warmer air holds more moisture
      const saturation = 0.5 + clamp(cell.temperature / 60, -0.15, 0.3);

      if (cell.humidity > saturation) {
        const excess = cell.humidity - saturation;
        cell.precipIntensity = clamp(excess * 4, 0, 1);
        // Precipitation removes humidity
        cell.humidity -= excess * 0.15;
        // Cloud cover increases with precipitation
        cell.cloudCover = clamp(cell.cloudCover + 0.05, 0, 1);
      } else {
        // Precipitation fades
        cell.precipIntensity *= 0.85;
        if (cell.precipIntensity < 0.01) cell.precipIntensity = 0;
      }

      // Cloud cover from humidity (even without precipitation)
      const targetCloudCover = clamp(cell.humidity * 1.2 + (cell.pressure < 1010 ? 0.15 : -0.1), 0, 1);
      cell.cloudCover = cell.cloudCover * 0.9 + targetCloudCover * 0.1;
    }
  }

  private detectFronts(): void {
    for (const [, cell] of this.nextCells) {
      cell.frontType = 'none';

      const neighbors = getNeighborKeys(cell.q, cell.r);
      for (const nk of neighbors) {
        const neighbor = this.nextCells.get(nk);
        if (!neighbor) continue;

        const pressureDiff = Math.abs(cell.pressure - neighbor.pressure);
        const tempDiff = cell.temperature - neighbor.temperature;

        if (pressureDiff > 6 && Math.abs(tempDiff) > 3) {
          if (tempDiff > 0) {
            cell.frontType = 'warm';
          } else {
            cell.frontType = 'cold';
          }
          // Fronts boost precipitation
          cell.precipIntensity = clamp(cell.precipIntensity + 0.15, 0, 1);
          cell.cloudCover = clamp(cell.cloudCover + 0.2, 0, 1);
          break;
        }
      }
    }
  }

  private computeTurbulence(): void {
    for (const [, cell] of this.nextCells) {
      let turb = 0;

      // Mountains create lee-side turbulence
      if (cell.elevation >= 4) {
        turb += 0.3;
      } else if (cell.elevation >= 3) {
        turb += 0.15;
      }

      // Coast convergence zones
      if (cell.isCoast) {
        turb += 0.1;
      }

      // Wind shear between neighbors
      const neighbors = getNeighborKeys(cell.q, cell.r);
      let windShear = 0;
      for (const nk of neighbors) {
        const neighbor = this.nextCells.get(nk);
        if (!neighbor) continue;
        windShear += Math.abs(cell.windU - neighbor.windU) + Math.abs(cell.windV - neighbor.windV);
      }
      turb += clamp(windShear * 0.02, 0, 0.4);

      cell.turbulence = clamp(turb, 0, 1);

      // Gust intensity from wind speed + turbulence
      const windMag = Math.sqrt(cell.windU * cell.windU + cell.windV * cell.windV);
      cell.gustIntensity = clamp(cell.turbulence * 0.5 + (windMag / 15) * 0.5, 0, 1);
    }
  }

  private updateEvents(): { spawnedEvents: WeatherEvent[]; endedEventIds: string[] } {
    const endedEventIds: string[] = [];
    const spawnedEvents: WeatherEvent[] = [];

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

      // Move tornado along random path
      if (event.type === 'tornado' && event.path) {
        const currentKey = event.centerKey;
        const parts = currentKey.split(',');
        const q = parseInt(parts[0], 10);
        const r = parseInt(parts[1], 10);
        const neighbors = getNeighborKeys(q, r);
        const validNeighbors = neighbors.filter(nk => this.cells.has(nk));
        if (validNeighbors.length > 0) {
          event.centerKey = this.rng.pick(validNeighbors);
          event.path.push(event.centerKey);
        }
      }

      return true;
    });

    // Apply event effects to cells
    for (const event of this.activeEvents) {
      this.applyEventToField(event);
    }

    return { spawnedEvents, endedEventIds };
  }

  private applyEventToField(event: WeatherEvent): void {
    const centerParts = event.centerKey.split(',');
    const cq = parseInt(centerParts[0], 10);
    const cr = parseInt(centerParts[1], 10);

    for (const [, cell] of this.nextCells) {
      const dist = Math.sqrt((cell.q - cq) ** 2 + (cell.r - cr) ** 2);
      if (dist > event.radius) continue;

      const falloff = 1 - (dist / event.radius);
      const strength = falloff * event.intensity;

      switch (event.type) {
        case 'hurricane':
          cell.pressure -= strength * 25;
          cell.precipIntensity = clamp(cell.precipIntensity + strength * 0.8, 0, 1);
          // Spiral wind pattern
          const angle = Math.atan2(cell.r - cr, cell.q - cq) + Math.PI / 2;
          cell.windU += Math.cos(angle) * strength * 12;
          cell.windV += Math.sin(angle) * strength * 12;
          cell.cloudCover = clamp(cell.cloudCover + strength * 0.5, 0, 1);
          cell.turbulence = clamp(cell.turbulence + strength * 0.6, 0, 1);
          break;

        case 'blizzard':
          cell.temperature -= strength * 12;
          cell.precipIntensity = clamp(cell.precipIntensity + strength * 0.9, 0, 1);
          cell.windU += strength * 6 * (this.rng.next() - 0.5);
          cell.windV += strength * 6 * (this.rng.next() - 0.5);
          cell.cloudCover = clamp(cell.cloudCover + strength * 0.7, 0, 1);
          break;

        case 'heat-wave':
          cell.temperature += strength * 10;
          cell.pressure += strength * 12;
          cell.humidity = clamp(cell.humidity - strength * 0.25, 0, 1);
          cell.cloudCover = clamp(cell.cloudCover - strength * 0.4, 0, 1);
          break;

        case 'monsoon':
          cell.humidity = clamp(cell.humidity + strength * 0.35, 0, 1);
          cell.precipIntensity = clamp(cell.precipIntensity + strength * 0.7, 0, 1);
          cell.cloudCover = clamp(cell.cloudCover + strength * 0.6, 0, 1);
          cell.pressure -= strength * 8;
          break;

        case 'tornado':
          cell.pressure -= strength * 35;
          cell.turbulence = clamp(cell.turbulence + strength, 0, 1);
          cell.gustIntensity = clamp(cell.gustIntensity + strength, 0, 1);
          const tAngle = Math.atan2(cell.r - cr, cell.q - cq) + Math.PI / 2;
          cell.windU += Math.cos(tAngle) * strength * 18;
          cell.windV += Math.sin(tAngle) * strength * 18;
          break;
      }
    }
  }

  private checkNaturalEventSpawning(): WeatherEvent[] {
    const spawned: WeatherEvent[] = [];

    // Only check every 50 ticks
    if (this.tickCount % 50 !== 0) return spawned;
    // Limit active events
    if (this.activeEvents.length >= 3) return spawned;

    // Check each event type's natural spawning conditions
    for (const [hexKey, cell] of this.nextCells) {
      // Hurricane: low pressure near coast
      if (cell.pressure < 990 && cell.isCoast && !this.hasNearbyEvent(hexKey, 'hurricane', 8)) {
        if (this.rng.next() < 0.15) {
          const event = this.spawnEvent('hurricane', hexKey, 0.7, WEATHER_EVENT_DEFS.hurricane.defaultDuration);
          spawned.push(event);
        }
      }

      // Blizzard: very cold + high humidity
      if (cell.temperature < -10 && cell.humidity > 0.6 && !this.hasNearbyEvent(hexKey, 'blizzard', 6)) {
        if (this.rng.next() < 0.1) {
          const event = this.spawnEvent('blizzard', hexKey, 0.6, WEATHER_EVENT_DEFS.blizzard.defaultDuration);
          spawned.push(event);
        }
      }

      // Tornado: extreme turbulence + high humidity
      if (cell.turbulence > 0.7 && cell.humidity > 0.7 && !this.hasNearbyEvent(hexKey, 'tornado', 4)) {
        if (this.rng.next() < 0.05) {
          const event = this.spawnEvent('tornado', hexKey, 0.9, WEATHER_EVENT_DEFS.tornado.defaultDuration);
          spawned.push(event);
        }
      }

      if (spawned.length >= 1) break; // Max one natural spawn per check
    }

    return spawned;
  }

  private hasNearbyEvent(hexKey: string, type: WeatherEventType, radius: number): boolean {
    const parts = hexKey.split(',');
    const q = parseInt(parts[0], 10);
    const r = parseInt(parts[1], 10);

    return this.activeEvents.some(e => {
      if (e.type !== type) return false;
      const eParts = e.centerKey.split(',');
      const eq = parseInt(eParts[0], 10);
      const er = parseInt(eParts[1], 10);
      return Math.sqrt((q - eq) ** 2 + (r - er) ** 2) < radius;
    });
  }

  private buildField(): WeatherField {
    const field: WeatherField = {};
    for (const [key, cell] of this.cells) {
      field[key] = {
        pressure: cell.pressure,
        temperature: cell.temperature,
        humidity: cell.humidity,
        windVector: { u: cell.windU, v: cell.windV },
        gustIntensity: cell.gustIntensity,
        turbulence: cell.turbulence,
        precipIntensity: cell.precipIntensity,
        cloudCover: cell.cloudCover,
        frontType: cell.frontType
      };
    }
    return field;
  }

  private buildFronts(): WeatherFront[] {
    const fronts: WeatherFront[] = [];
    const coldFrontKeys: string[] = [];
    const warmFrontKeys: string[] = [];

    for (const [key, cell] of this.cells) {
      if (cell.frontType === 'cold') coldFrontKeys.push(key);
      else if (cell.frontType === 'warm') warmFrontKeys.push(key);
    }

    if (coldFrontKeys.length > 0) {
      fronts.push({
        id: `front-cold-${this.tickCount}`,
        type: 'cold',
        hexKeys: coldFrontKeys,
        direction: { u: 1, v: 0 },
        intensity: 0.6
      });
    }
    if (warmFrontKeys.length > 0) {
      fronts.push({
        id: `front-warm-${this.tickCount}`,
        type: 'warm',
        hexKeys: warmFrontKeys,
        direction: { u: -1, v: 0 },
        intensity: 0.5
      });
    }

    return fronts;
  }
}
