// Hook managing weather overlay rendering on the hex grid canvas
// Provides functions to draw gradient overlay, particles, lightning,
// cloud cover, pressure labels, and wind arrows

import { useRef, useCallback, useEffect } from 'react';
import type { WeatherField, WeatherSimulationConfig } from '../types/Weather';
import { renderWeatherGradient, renderIsobars, renderFronts } from '../services/weatherGradient';
import { renderPressureLabels, renderWindArrows, renderCloudCover, renderCloudShadows } from '../services/weatherRadar';
import { WeatherParticleSystem } from '../services/weatherParticles';
import { WeatherLightningSystem } from '../services/weatherLightning';

interface LayerFlags {
  cloudShadows: boolean;
  pressureLabels: boolean;
  windArrows: boolean;
}

interface UseWeatherOverlayOptions {
  field: WeatherField;
  config: WeatherSimulationConfig | undefined;
  gridWidth: number;
  gridHeight: number;
  isDMView: boolean;
  layerFlags?: LayerFlags;
}

/**
 * Hook that provides a function to render the weather gradient overlay,
 * particles, lightning, cloud cover/shadows, pressure labels, and wind arrows.
 * Call renderOverlay() in your draw loop between region labels and markers.
 */
export function useWeatherOverlay({
  field,
  config,
  gridWidth,
  gridHeight,
  isDMView,
  layerFlags
}: UseWeatherOverlayOptions) {
  // Cache the offscreen canvas to avoid recreating every frame
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const cloudCoverRef = useRef<HTMLCanvasElement | null>(null);
  const cloudShadowRef = useRef<HTMLCanvasElement | null>(null);
  const lastFieldRef = useRef<WeatherField>({});
  const lastOffsetRef = useRef({ x: 0, y: 0 });
  const lastZoomRef = useRef(1);

  // Particle and lightning systems (persistent across renders)
  const particlesRef = useRef<WeatherParticleSystem>(new WeatherParticleSystem());
  const lightningRef = useRef<WeatherLightningSystem>(new WeatherLightningSystem());
  const lastFrameTimeRef = useRef(performance.now());

  // Update particle density when config changes
  useEffect(() => {
    if (config) {
      particlesRef.current.setDensity(config.particleDensity);
    }
  }, [config?.particleDensity]);

  // Clear particles and lightning when simulation is disabled
  useEffect(() => {
    if (!config?.enabled) {
      particlesRef.current.clear();
      lightningRef.current.clear();
    }
  }, [config?.enabled]);

  /**
   * Render the weather overlay onto the given canvas context.
   * Should be called in the draw loop after region labels and before markers.
   * ctx should be in SCREEN SPACE (no transforms applied).
   *
   * Render order:
   * 1. Cloud shadows (multiply blend to darken terrain)
   * 2. Gradient overlay (precipitation/temp/pressure/wind colors)
   * 3. Cloud cover (white/gray haze)
   * 4. Isobars (pressure contour lines)
   * 5. Fronts (cold/warm/occluded symbols)
   * 6. Pressure labels (H/L markers)
   * 7. Wind arrows (direction indicators at zoomed-out)
   * 8. Particles (rain/snow/wind/fog/storm)
   * 9. Lightning flashes
   */
  const renderOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    offsetX: number,
    offsetY: number,
    zoomLevel: number
  ) => {
    if (!config?.enabled || Object.keys(field).length === 0) return;

    // LOD: Skip overlay at very low zoom
    if (zoomLevel < 0.15) return;

    const showClouds = layerFlags?.cloudShadows !== false;
    const showPressure = layerFlags?.pressureLabels !== false;
    const showWind = layerFlags?.windArrows !== false;

    const fieldChanged = field !== lastFieldRef.current;
    const cameraChanged = offsetX !== lastOffsetRef.current.x ||
                          offsetY !== lastOffsetRef.current.y ||
                          zoomLevel !== lastZoomRef.current;

    const needsRedraw = fieldChanged || cameraChanged;

    // ── 1. Cloud shadows (multiply blend to darken terrain) ──
    if (showClouds) {
      if (needsRedraw || !cloudShadowRef.current) {
        cloudShadowRef.current = renderCloudShadows(
          field, gridWidth, gridHeight,
          canvasWidth, canvasHeight, offsetX, offsetY, zoomLevel
        );
      }
      if (cloudShadowRef.current) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(cloudShadowRef.current, 0, 0);
        ctx.restore();
      }
    }

    // ── 2. Gradient overlay ──
    if (needsRedraw || !offscreenRef.current) {
      offscreenRef.current = renderWeatherGradient(
        field, gridWidth, gridHeight, config,
        canvasWidth, canvasHeight, offsetX, offsetY, zoomLevel
      );
      lastFieldRef.current = field;
      lastOffsetRef.current = { x: offsetX, y: offsetY };
      lastZoomRef.current = zoomLevel;
    }

    if (offscreenRef.current) {
      ctx.save();
      ctx.globalAlpha = config.overlayOpacity;
      ctx.drawImage(offscreenRef.current, 0, 0);
      ctx.restore();
    }

    // ── 3. Cloud cover (white/gray haze) ──
    if (showClouds) {
      if (needsRedraw || !cloudCoverRef.current) {
        cloudCoverRef.current = renderCloudCover(
          field, gridWidth, gridHeight,
          canvasWidth, canvasHeight, offsetX, offsetY, zoomLevel
        );
      }
      if (cloudCoverRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.drawImage(cloudCoverRef.current, 0, 0);
        ctx.restore();
      }
    }

    // ── 4. Isobars (no longer DM-only) ──
    if (config.showIsobars) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(zoomLevel, zoomLevel);
      renderIsobars(ctx, field, gridWidth, gridHeight, zoomLevel);
      ctx.restore();
    }

    // ── 5. Fronts (no longer DM-only) ──
    if (config.showFronts) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(zoomLevel, zoomLevel);
      renderFronts(ctx, field, gridWidth, gridHeight, zoomLevel);
      ctx.restore();
    }

    // ── 6. Pressure labels (H/L markers) ──
    if (showPressure) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(zoomLevel, zoomLevel);
      renderPressureLabels(ctx, field, gridWidth, gridHeight, zoomLevel);
      ctx.restore();
    }

    // ── 7. Wind arrows (zoomed out only) ──
    if (showWind && zoomLevel < 0.8) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(zoomLevel, zoomLevel);
      renderWindArrows(ctx, field, gridWidth, gridHeight, zoomLevel);
      ctx.restore();
    }

    // ── 8. Particles ──
    if (config.showParticles) {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastFrameTimeRef.current) / 1000); // seconds, capped
      lastFrameTimeRef.current = now;

      // Spawn new particles
      particlesRef.current.spawn(
        field, gridWidth, gridHeight, zoomLevel,
        offsetX, offsetY, canvasWidth, canvasHeight
      );

      // Update positions and age
      particlesRef.current.update(dt);

      // Render in world space
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(zoomLevel, zoomLevel);
      particlesRef.current.render(ctx);
      ctx.restore();
    }

    // ── 9. Lightning flashes ──
    {
      const now = performance.now();
      lightningRef.current.update(field, now);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(zoomLevel, zoomLevel);
      lightningRef.current.render(ctx, now);
      ctx.restore();
    }
  }, [field, config, gridWidth, gridHeight, isDMView, layerFlags]);

  return { renderOverlay };
}
