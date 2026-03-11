// Hook managing weather overlay rendering on the hex grid canvas
// Provides functions to draw gradient overlay, particles, lightning,
// cloud cover, pressure labels, and wind arrows

import { useRef, useCallback, useEffect } from 'react';
import type { WeatherField, WeatherSimulationConfig } from '../types/Weather';
import { renderWeatherGradient, renderIsobars, renderFronts, type GradientCanvasRefs, ensureGradientCanvases } from '../services/weatherGradient';
import { renderPressureLabels, renderWindArrows, renderCloudCover, renderCloudShadows, type CloudCanvasRefs, ensureCloudCanvases } from '../services/weatherRadar';
import { getVisibleHexRange } from '../services/hexGeometry';
import { WeatherParticleSystem } from '../services/weatherParticles';
import { WeatherLightningSystem } from '../services/weatherLightning';

interface LayerFlags {
  cloudShadows: boolean;
  pressureLabels: boolean;
  windArrows: boolean;
}

interface UseWeatherOverlayOptions {
  field: WeatherField;
  fieldVersion: number;
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
  fieldVersion,
  config,
  gridWidth,
  gridHeight,
  isDMView,
  layerFlags
}: UseWeatherOverlayOptions) {
  // Pre-allocated offscreen canvas pairs (reused across frames)
  const gradientCanvasRefs = useRef<GradientCanvasRefs | null>(null);
  const cloudCoverCanvasRefs = useRef<CloudCanvasRefs | null>(null);
  const cloudShadowCanvasRefs = useRef<CloudCanvasRefs | null>(null);

  // Cache the rendered result canvas for blitting when nothing changed
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const cloudCoverRef = useRef<HTMLCanvasElement | null>(null);
  const cloudShadowRef = useRef<HTMLCanvasElement | null>(null);
  // Offscreen canvases for direct-draw passes (isobars, fronts, pressure labels, wind arrows)
  const isobarsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frontsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pressureLabelsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const windArrowsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFieldVersionRef = useRef(-1);
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

    // Compute visible hex range with extra margin for blur edge artifacts
    const visibleRange = getVisibleHexRange(
      offsetX, offsetY, zoomLevel, canvasWidth, canvasHeight,
      gridWidth, gridHeight, 3
    );

    const fieldChanged = fieldVersion !== lastFieldVersionRef.current;
    const cameraChanged = offsetX !== lastOffsetRef.current.x ||
                          offsetY !== lastOffsetRef.current.y ||
                          zoomLevel !== lastZoomRef.current;

    const needsRedraw = fieldChanged || cameraChanged;

    // ── 1. Cloud shadows (multiply blend to darken terrain) ──
    if (showClouds) {
      if (needsRedraw || !cloudShadowRef.current) {
        cloudShadowCanvasRefs.current = ensureCloudCanvases(cloudShadowCanvasRefs.current, canvasWidth, canvasHeight);
        cloudShadowRef.current = renderCloudShadows(
          field, gridWidth, gridHeight,
          canvasWidth, canvasHeight, offsetX, offsetY, zoomLevel,
          cloudShadowCanvasRefs.current, visibleRange
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
      gradientCanvasRefs.current = ensureGradientCanvases(gradientCanvasRefs.current, canvasWidth, canvasHeight);
      offscreenRef.current = renderWeatherGradient(
        field, gridWidth, gridHeight, config,
        canvasWidth, canvasHeight, offsetX, offsetY, zoomLevel,
        gradientCanvasRefs.current, visibleRange
      );
      lastFieldVersionRef.current = fieldVersion;
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
        cloudCoverCanvasRefs.current = ensureCloudCanvases(cloudCoverCanvasRefs.current, canvasWidth, canvasHeight);
        cloudCoverRef.current = renderCloudCover(
          field, gridWidth, gridHeight,
          canvasWidth, canvasHeight, offsetX, offsetY, zoomLevel,
          cloudCoverCanvasRefs.current, visibleRange
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
      if (needsRedraw || !isobarsCanvasRef.current) {
        const oc = isobarsCanvasRef.current || document.createElement('canvas');
        if (oc.width !== canvasWidth || oc.height !== canvasHeight) {
          oc.width = canvasWidth; oc.height = canvasHeight;
        }
        const octx = oc.getContext('2d');
        if (octx) {
          octx.clearRect(0, 0, canvasWidth, canvasHeight);
          octx.save();
          octx.translate(offsetX, offsetY);
          octx.scale(zoomLevel, zoomLevel);
          renderIsobars(octx, field, gridWidth, gridHeight, zoomLevel, visibleRange);
          octx.restore();
        }
        isobarsCanvasRef.current = oc;
      }
      if (isobarsCanvasRef.current) ctx.drawImage(isobarsCanvasRef.current, 0, 0);
    }

    // ── 5. Fronts (no longer DM-only) ──
    if (config.showFronts) {
      if (needsRedraw || !frontsCanvasRef.current) {
        const oc = frontsCanvasRef.current || document.createElement('canvas');
        if (oc.width !== canvasWidth || oc.height !== canvasHeight) {
          oc.width = canvasWidth; oc.height = canvasHeight;
        }
        const octx = oc.getContext('2d');
        if (octx) {
          octx.clearRect(0, 0, canvasWidth, canvasHeight);
          octx.save();
          octx.translate(offsetX, offsetY);
          octx.scale(zoomLevel, zoomLevel);
          renderFronts(octx, field, gridWidth, gridHeight, zoomLevel, visibleRange);
          octx.restore();
        }
        frontsCanvasRef.current = oc;
      }
      if (frontsCanvasRef.current) ctx.drawImage(frontsCanvasRef.current, 0, 0);
    }

    // ── 6. Pressure labels (H/L markers) ──
    if (showPressure) {
      if (needsRedraw || !pressureLabelsCanvasRef.current) {
        const oc = pressureLabelsCanvasRef.current || document.createElement('canvas');
        if (oc.width !== canvasWidth || oc.height !== canvasHeight) {
          oc.width = canvasWidth; oc.height = canvasHeight;
        }
        const octx = oc.getContext('2d');
        if (octx) {
          octx.clearRect(0, 0, canvasWidth, canvasHeight);
          octx.save();
          octx.translate(offsetX, offsetY);
          octx.scale(zoomLevel, zoomLevel);
          renderPressureLabels(octx, field, gridWidth, gridHeight, zoomLevel, visibleRange);
          octx.restore();
        }
        pressureLabelsCanvasRef.current = oc;
      }
      if (pressureLabelsCanvasRef.current) ctx.drawImage(pressureLabelsCanvasRef.current, 0, 0);
    }

    // ── 7. Wind arrows ──
    if (showWind && zoomLevel < 1.5) {
      if (needsRedraw || !windArrowsCanvasRef.current) {
        const oc = windArrowsCanvasRef.current || document.createElement('canvas');
        if (oc.width !== canvasWidth || oc.height !== canvasHeight) {
          oc.width = canvasWidth; oc.height = canvasHeight;
        }
        const octx = oc.getContext('2d');
        if (octx) {
          octx.clearRect(0, 0, canvasWidth, canvasHeight);
          octx.save();
          octx.translate(offsetX, offsetY);
          octx.scale(zoomLevel, zoomLevel);
          renderWindArrows(octx, field, gridWidth, gridHeight, zoomLevel, visibleRange);
          octx.restore();
        }
        windArrowsCanvasRef.current = oc;
      }
      if (windArrowsCanvasRef.current) ctx.drawImage(windArrowsCanvasRef.current, 0, 0);
    }

    // ── 8. Particles ──
    if (config.showParticles) {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastFrameTimeRef.current) / 1000); // seconds, capped
      lastFrameTimeRef.current = now;

      // Spawn new particles (pass visible range for culling)
      particlesRef.current.spawn(
        field, gridWidth, gridHeight, zoomLevel,
        offsetX, offsetY, canvasWidth, canvasHeight,
        visibleRange
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
  }, [field, fieldVersion, config, gridWidth, gridHeight, isDMView, layerFlags]);

  return { renderOverlay };
}
