// Lightning flash + bolt rendering for storm cells
// Identifies storm cells, renders radial glow and forked bolts

import type { WeatherField } from '../types/Weather';
import { hexCenter, HEX_SIZE } from './hexGeometry';

// ============ Lightning State ============

interface LightningFlash {
  hexKey: string;
  x: number;
  y: number;
  startTime: number;
  type: 'glow' | 'bolt';
  intensity: number;
  // Bolt-specific
  boltPoints?: { x: number; y: number }[];
}

const FLASH_DURATION = 250;     // ms total (50ms bright + 200ms decay)
const BRIGHT_PHASE = 50;        // ms at full brightness
const MIN_INTERVAL = 2000;      // ms minimum between flashes per cell
const MAX_INTERVAL = 8000;      // ms maximum between flashes per cell
const BOLT_CHANCE = 0.2;        // 20% chance of forked bolt vs glow

export class WeatherLightningSystem {
  private flashes: LightningFlash[] = [];
  private cellTimers: Map<string, number> = new Map(); // next flash time per storm cell

  /**
   * Update lightning state: spawn new flashes in storm cells, remove expired.
   * Call once per frame.
   */
  update(field: WeatherField, now: number): void {
    // Remove expired flashes
    this.flashes = this.flashes.filter(f => (now - f.startTime) < FLASH_DURATION);

    // Find storm cells and potentially spawn flashes
    for (const [key, cell] of Object.entries(field)) {
      // Storm cell: high precipitation + high cloud cover
      if (cell.precipIntensity < 0.7 || cell.cloudCover < 0.6) continue;

      const nextFlashTime = this.cellTimers.get(key);
      if (nextFlashTime && now < nextFlashTime) continue;

      // Schedule next flash
      const interval = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
      // More intense storms flash more frequently
      const adjustedInterval = interval * (1 - cell.precipIntensity * 0.5);
      this.cellTimers.set(key, now + adjustedInterval);

      // Spawn flash
      const parts = key.split(',');
      const q = parseInt(parts[0], 10);
      const r = parseInt(parts[1], 10);
      const center = hexCenter({ q, r });

      const isBolt = Math.random() < BOLT_CHANCE;
      const flash: LightningFlash = {
        hexKey: key,
        x: center.x + (Math.random() - 0.5) * HEX_SIZE,
        y: center.y + (Math.random() - 0.5) * HEX_SIZE,
        startTime: now,
        type: isBolt ? 'bolt' : 'glow',
        intensity: 0.6 + Math.random() * 0.4
      };

      if (isBolt) {
        flash.boltPoints = this.generateBoltPath(flash.x, flash.y);
      }

      this.flashes.push(flash);
    }
  }

  /**
   * Render lightning flashes onto the canvas.
   * ctx should be in world space (translate + scale already applied).
   */
  render(ctx: CanvasRenderingContext2D, now: number): void {
    if (this.flashes.length === 0) return;

    ctx.save();
    // Additive blending for bright flashes
    ctx.globalCompositeOperation = 'lighter';

    for (const flash of this.flashes) {
      const elapsed = now - flash.startTime;
      if (elapsed >= FLASH_DURATION) continue;

      // Calculate brightness: full during bright phase, then decay
      let brightness: number;
      if (elapsed < BRIGHT_PHASE) {
        brightness = flash.intensity;
      } else {
        const decayProgress = (elapsed - BRIGHT_PHASE) / (FLASH_DURATION - BRIGHT_PHASE);
        brightness = flash.intensity * (1 - decayProgress);
      }

      if (brightness < 0.01) continue;

      if (flash.type === 'glow') {
        this.renderGlow(ctx, flash, brightness);
      } else {
        this.renderBolt(ctx, flash, brightness);
      }
    }

    ctx.restore();
  }

  /** Clear all state */
  clear(): void {
    this.flashes = [];
    this.cellTimers.clear();
  }

  /** Check if there are any active flashes */
  hasActiveFlashes(): boolean {
    return this.flashes.length > 0;
  }

  // ============ Internal rendering ============

  private renderGlow(ctx: CanvasRenderingContext2D, flash: LightningFlash, brightness: number): void {
    const radius = HEX_SIZE * 1.5;
    const gradient = ctx.createRadialGradient(
      flash.x, flash.y, 0,
      flash.x, flash.y, radius
    );
    gradient.addColorStop(0, `rgba(255, 255, 240, ${brightness * 0.8})`);
    gradient.addColorStop(0.3, `rgba(200, 200, 255, ${brightness * 0.4})`);
    gradient.addColorStop(1, `rgba(150, 150, 255, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderBolt(ctx: CanvasRenderingContext2D, flash: LightningFlash, brightness: number): void {
    if (!flash.boltPoints || flash.boltPoints.length < 2) return;

    // Draw bolt glow (wider, dimmer)
    ctx.strokeStyle = `rgba(200, 200, 255, ${brightness * 0.3})`;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(flash.boltPoints[0].x, flash.boltPoints[0].y);
    for (let i = 1; i < flash.boltPoints.length; i++) {
      ctx.lineTo(flash.boltPoints[i].x, flash.boltPoints[i].y);
    }
    ctx.stroke();

    // Draw bolt core (narrow, bright)
    ctx.strokeStyle = `rgba(255, 255, 240, ${brightness * 0.9})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(flash.boltPoints[0].x, flash.boltPoints[0].y);
    for (let i = 1; i < flash.boltPoints.length; i++) {
      ctx.lineTo(flash.boltPoints[i].x, flash.boltPoints[i].y);
    }
    ctx.stroke();

    // Flash glow at origin point
    this.renderGlow(ctx, flash, brightness * 0.5);
  }

  /**
   * Generate a random-walk bolt path from origin downward.
   */
  private generateBoltPath(startX: number, startY: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
    const segments = 5 + Math.floor(Math.random() * 4);
    const segmentLength = HEX_SIZE * 0.4;

    let x = startX;
    let y = startY;
    let angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Roughly downward

    for (let i = 0; i < segments; i++) {
      // Random walk with downward bias
      angle += (Math.random() - 0.5) * 1.2;
      x += Math.cos(angle) * segmentLength;
      y += Math.sin(angle) * segmentLength;
      points.push({ x, y });

      // Occasional fork (branch)
      if (Math.random() < 0.25 && i < segments - 1) {
        const forkAngle = angle + (Math.random() > 0.5 ? 0.8 : -0.8);
        const forkLen = segmentLength * 0.6;
        points.push({
          x: x + Math.cos(forkAngle) * forkLen,
          y: y + Math.sin(forkAngle) * forkLen
        });
        // Return to main path
        points.push({ x, y });
      }
    }

    return points;
  }
}
