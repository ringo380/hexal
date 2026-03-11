// Weather particle system: pre-allocated pool with ring buffer
// Renders rain, snow, wind streaks, fog, and storm sparks

import type { WeatherField, WeatherFieldCell } from '../types/Weather';
import { hexCenter, HEX_SIZE, type HexRange } from './hexGeometry';
import { clamp } from './weather/WeatherField';

// ============ Particle Types ============

export type ParticleType = 'rain' | 'snow' | 'wind' | 'fog' | 'storm';

interface Particle {
  alive: boolean;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;       // Remaining life (0-1, decrements per frame)
  maxLife: number;
  size: number;
  opacity: number;
  // Type-specific
  wobblePhase: number; // Snow horizontal wobble
  length: number;      // Rain/wind streak length
}

// ============ Constants ============

const MAX_PARTICLES = 800;
const PARTICLE_CONFIGS: Record<ParticleType, {
  color: string;
  minSize: number;
  maxSize: number;
  minLife: number;
  maxLife: number;
  baseOpacity: number;
}> = {
  rain: { color: '180, 210, 255', minSize: 1.5, maxSize: 3, minLife: 0.3, maxLife: 0.8, baseOpacity: 0.8 },
  snow: { color: '240, 245, 255', minSize: 2, maxSize: 4, minLife: 0.5, maxLife: 1.0, baseOpacity: 0.85 },
  wind: { color: '200, 200, 200', minSize: 1, maxSize: 2.5, minLife: 0.2, maxLife: 0.5, baseOpacity: 0.45 },
  fog:  { color: '200, 210, 220', minSize: 12, maxSize: 30, minLife: 0.6, maxLife: 1.0, baseOpacity: 0.25 },
  storm: { color: '255, 255, 180', minSize: 1.5, maxSize: 3, minLife: 0.05, maxLife: 0.15, baseOpacity: 0.95 }
};

// ============ Particle Pool ============

export class WeatherParticleSystem {
  private pool: Particle[];
  private head: number = 0; // Ring buffer write pointer
  private activeCount: number = 0;
  private densityScale: number = 0.5;

  constructor() {
    // Pre-allocate all particles
    this.pool = new Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool[i] = this.createDeadParticle();
    }
  }

  private createDeadParticle(): Particle {
    return {
      alive: false, type: 'rain',
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0, size: 0, opacity: 0,
      wobblePhase: 0, length: 0
    };
  }

  /** Update configuration */
  setDensity(density: number): void {
    this.densityScale = clamp(density, 0, 1);
  }

  /**
   * Spawn new particles based on field state.
   * Called once per frame before update().
   */
  spawn(
    field: WeatherField,
    gridWidth: number,
    gridHeight: number,
    zoomLevel: number,
    _viewportX: number,
    _viewportY: number,
    _viewportW: number,
    _viewportH: number,
    visibleRange?: HexRange | null
  ): void {
    // LOD: No particles below zoom 0.2
    if (zoomLevel < 0.2) return;

    // Density scaling by zoom
    const zoomDensity = zoomLevel < 0.4 ? 0.4 : zoomLevel < 0.7 ? 0.65 : 1.0;
    const effectiveDensity = this.densityScale * zoomDensity;

    // Max spawns per frame to avoid burst
    const maxSpawnsPerFrame = Math.floor(20 * effectiveDensity);
    let spawned = 0;

    const qMin = visibleRange ? visibleRange.qMin : 0;
    const qMax = visibleRange ? visibleRange.qMax : gridWidth - 1;
    const rMin = visibleRange ? visibleRange.rMin : 0;
    const rMax = visibleRange ? visibleRange.rMax : gridHeight - 1;

    for (let q = qMin; q <= qMax && spawned < maxSpawnsPerFrame; q++) {
      for (let r = rMin; r <= rMax && spawned < maxSpawnsPerFrame; r++) {
        const key = `${q},${r}`;
        const cell = field[key];
        if (!cell) continue;

        const center = hexCenter({ q, r });

        // Determine particle type and spawn probability
        const spawnChance = this.getSpawnChance(cell, effectiveDensity);
        if (Math.random() > spawnChance) continue;

        const type = this.chooseParticleType(cell);
        if (!type) continue;

        this.emitParticle(type, center.x, center.y, cell);
        spawned++;
      }
    }
  }

  /** Update all alive particles (move, age, kill) */
  update(dt: number): void {
    this.activeCount = 0;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.pool[i];
      if (!p.alive) continue;

      // Age
      p.life -= dt / p.maxLife;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }

      // Move
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Type-specific behavior
      switch (p.type) {
        case 'snow':
          // Horizontal wobble
          p.wobblePhase += dt * 3;
          p.x += Math.sin(p.wobblePhase) * 0.3;
          break;
        case 'fog':
          // Slow expansion
          p.size += dt * 0.5;
          p.opacity *= 0.998;
          break;
        case 'storm':
          // Rapid fade
          p.opacity *= 0.92;
          break;
      }

      this.activeCount++;
    }
  }

  /**
   * Render all alive particles onto the canvas context.
   * ctx should already have world-space transforms applied.
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.pool[i];
      if (!p.alive) continue;

      const fadeAlpha = Math.min(1, p.life * 3); // Fade in/out at life boundaries
      const alpha = p.opacity * fadeAlpha;
      if (alpha < 0.01) continue;

      const cfg = PARTICLE_CONFIGS[p.type];

      switch (p.type) {
        case 'rain': {
          // Short diagonal streak
          ctx.strokeStyle = `rgba(${cfg.color}, ${alpha})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * p.length, p.y + p.vy * p.length);
          ctx.stroke();
          break;
        }

        case 'snow': {
          // Small dot
          ctx.fillStyle = `rgba(${cfg.color}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'wind': {
          // Long semi-transparent streak
          ctx.strokeStyle = `rgba(${cfg.color}, ${alpha})`;
          ctx.lineWidth = p.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * p.length * 2, p.y + p.vy * p.length * 2);
          ctx.stroke();
          break;
        }

        case 'fog': {
          // Large fuzzy circle
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(${cfg.color}, ${alpha})`);
          grad.addColorStop(1, `rgba(${cfg.color}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'storm': {
          // Bright flash dots
          ctx.fillStyle = `rgba(${cfg.color}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
    }
  }

  /** Get active particle count */
  getActiveCount(): number {
    return this.activeCount;
  }

  /** Kill all particles */
  clear(): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool[i].alive = false;
    }
    this.activeCount = 0;
    this.head = 0;
  }

  // ============ Internal helpers ============

  private getSpawnChance(cell: WeatherFieldCell, density: number): number {
    // Higher precip/humidity = more particles
    const precipChance = cell.precipIntensity * 0.15;
    const windChance = Math.sqrt(cell.windVector.u ** 2 + cell.windVector.v ** 2) / 15 * 0.05;
    const fogChance = (cell.humidity > 0.7 && cell.cloudCover > 0.6) ? 0.03 : 0;
    const stormChance = (cell.precipIntensity > 0.7 && cell.turbulence > 0.4) ? 0.08 : 0;

    return (precipChance + windChance + fogChance + stormChance) * density;
  }

  private chooseParticleType(cell: WeatherFieldCell): ParticleType | null {
    // Determine type based on cell conditions
    if (cell.precipIntensity > 0.7 && cell.turbulence > 0.4) {
      return Math.random() < 0.3 ? 'storm' : cell.temperature < 0 ? 'snow' : 'rain';
    }
    if (cell.precipIntensity > 0.05) {
      return cell.temperature < 0 ? 'snow' : 'rain';
    }
    if (cell.humidity > 0.7 && cell.cloudCover > 0.6) {
      return 'fog';
    }
    const windSpeed = Math.sqrt(cell.windVector.u ** 2 + cell.windVector.v ** 2);
    if (windSpeed > 4) {
      return 'wind';
    }
    return null;
  }

  private emitParticle(type: ParticleType, cx: number, cy: number, cell: WeatherFieldCell): void {
    // Find next slot in ring buffer
    const p = this.pool[this.head];
    this.head = (this.head + 1) % MAX_PARTICLES;

    const cfg = PARTICLE_CONFIGS[type];

    p.alive = true;
    p.type = type;

    // Random position within hex area
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * HEX_SIZE * 0.9;
    p.x = cx + Math.cos(angle) * radius;
    p.y = cy + Math.sin(angle) * radius;

    p.size = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
    p.maxLife = cfg.minLife + Math.random() * (cfg.maxLife - cfg.minLife);
    p.life = 1.0;
    p.opacity = cfg.baseOpacity;
    p.wobblePhase = Math.random() * Math.PI * 2;

    switch (type) {
      case 'rain':
        p.vx = cell.windVector.u * 2 + (Math.random() - 0.5) * 2;
        p.vy = 30 + cell.precipIntensity * 40 + cell.windVector.v * 2;
        p.length = 0.08 + cell.precipIntensity * 0.05;
        break;

      case 'snow':
        p.vx = cell.windVector.u * 0.5 + (Math.random() - 0.5) * 3;
        p.vy = 5 + Math.random() * 10;
        p.length = 0;
        break;

      case 'wind':
        p.vx = cell.windVector.u * 4;
        p.vy = cell.windVector.v * 4;
        p.length = 0.15 + Math.random() * 0.1;
        break;

      case 'fog':
        p.vx = cell.windVector.u * 0.3 + (Math.random() - 0.5) * 0.5;
        p.vy = cell.windVector.v * 0.3 + (Math.random() - 0.5) * 0.5;
        p.length = 0;
        break;

      case 'storm':
        p.vx = (Math.random() - 0.5) * 20;
        p.vy = (Math.random() - 0.5) * 20;
        p.length = 0;
        p.opacity = 0.8 + Math.random() * 0.2;
        break;
    }
  }
}
