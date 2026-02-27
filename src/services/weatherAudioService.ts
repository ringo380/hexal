// Weather Audio Service - Sample-based ambient weather sounds via Web Audio API
// Loads real audio files and crossfades layers based on weather conditions and zoom level

export interface WeatherAudioParams {
  zoomLevel: number;         // 0.15–5.0
  precipIntensity: number;   // 0–1 blended
  temperature: number;       // °C blended
  windSpeed: number;         // m/s blended
  gustIntensity: number;     // 0–1 blended
  humidity: number;          // 0–1 blended
  cloudCover: number;        // 0–1 blended
  stormIntensity: number;    // 0–1 derived
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const RAMP_TIME = 0.15;    // seconds for parameter transitions
const THUNDER_MIN_INTERVAL = 4; // seconds between thunder cracks

const AUDIO_BASE_PATH = '/audio/weather/';
const SAMPLE_NAMES = [
  'rain-loop', 'wind-loop', 'snow-loop', 'fog-drone',
  'thunder-1', 'thunder-2', 'thunder-3'
] as const;

type SampleName = typeof SAMPLE_NAMES[number];

class WeatherAudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = false;
  private volume = 0.5;
  private graphBuilt = false;
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  // Decoded audio buffers
  private buffers: Map<SampleName, AudioBuffer> = new Map();

  // Looping source nodes
  private rainSource: AudioBufferSourceNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private snowSource: AudioBufferSourceNode | null = null;
  private fogSource: AudioBufferSourceNode | null = null;

  // Per-layer gain nodes
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private snowGain: GainNode | null = null;
  private fogGain: GainNode | null = null;

  // Altitude filter (highpass at far zoom for "altitude" feel)
  private altitudeFilter: BiquadFilterNode | null = null;
  private surfaceBus: GainNode | null = null;

  // Wind gust LFO
  private gustLFO: OscillatorNode | null = null;
  private gustLFOGain: GainNode | null = null;

  // Thunder scheduling
  private lastThunderTime = 0;
  private thunderScheduled = false;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private async loadSamples(ctx: AudioContext): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const loadOne = async (name: SampleName) => {
        const url = `${AUDIO_BASE_PATH}${name}.mp3`;
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.buffers.set(name, audioBuffer);
      };

      await Promise.all(SAMPLE_NAMES.map(loadOne));
      this.isLoaded = true;
    })();

    return this.loadingPromise;
  }

  private createLoop(ctx: AudioContext, name: SampleName): AudioBufferSourceNode | null {
    const buffer = this.buffers.get(name);
    if (!buffer) return null;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  async ensureGraph(): Promise<void> {
    if (this.graphBuilt) return;

    try {
      const ctx = this.ensureContext();
      await this.loadSamples(ctx);

      // Master gain
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(ctx.destination);

      // Surface bus: all surface sounds → altitudeFilter → masterGain
      this.surfaceBus = ctx.createGain();
      this.surfaceBus.gain.value = 1;

      this.altitudeFilter = ctx.createBiquadFilter();
      this.altitudeFilter.type = 'highpass';
      this.altitudeFilter.frequency.value = 20; // starts transparent
      this.altitudeFilter.Q.value = 0.5;

      this.surfaceBus.connect(this.altitudeFilter);
      this.altitudeFilter.connect(this.masterGain);

      // ── Rain layer ──
      this.rainGain = ctx.createGain();
      this.rainGain.gain.value = 0;
      this.rainGain.connect(this.surfaceBus);

      this.rainSource = this.createLoop(ctx, 'rain-loop');
      if (this.rainSource) {
        this.rainSource.connect(this.rainGain);
        this.rainSource.start();
      }

      // ── Wind layer (with gust LFO) ──
      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0;
      this.windGain.connect(this.surfaceBus);

      this.gustLFO = ctx.createOscillator();
      this.gustLFO.type = 'sine';
      this.gustLFO.frequency.value = 0.3;
      this.gustLFOGain = ctx.createGain();
      this.gustLFOGain.gain.value = 0;
      this.gustLFO.connect(this.gustLFOGain);
      this.gustLFOGain.connect(this.windGain.gain);
      this.gustLFO.start();

      this.windSource = this.createLoop(ctx, 'wind-loop');
      if (this.windSource) {
        this.windSource.connect(this.windGain);
        this.windSource.start();
      }

      // ── Snow layer ──
      this.snowGain = ctx.createGain();
      this.snowGain.gain.value = 0;
      this.snowGain.connect(this.surfaceBus);

      this.snowSource = this.createLoop(ctx, 'snow-loop');
      if (this.snowSource) {
        this.snowSource.connect(this.snowGain);
        this.snowSource.start();
      }

      // ── Fog layer ──
      this.fogGain = ctx.createGain();
      this.fogGain.gain.value = 0;
      this.fogGain.connect(this.surfaceBus);

      this.fogSource = this.createLoop(ctx, 'fog-drone');
      if (this.fogSource) {
        this.fogSource.connect(this.fogGain);
        this.fogSource.start();
      }

      this.graphBuilt = true;
    } catch (e) {
      console.warn('Weather audio graph creation failed:', e);
    }
  }

  updateParams(params: WeatherAudioParams): void {
    if (!this.graphBuilt || !this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const ramp = now + RAMP_TIME;

    // Surface gain: ramps up as you zoom IN, quiet when zoomed OUT
    const surfaceGain = clamp((params.zoomLevel - 0.3) / (1.2 - 0.3), 0, 1);

    // Altitude filter: at far zoom, highpass cuts low frequencies for "altitude" feel
    const altFreq = lerp(1500, 20, surfaceGain); // 1500 Hz at far zoom → 20 Hz (transparent) close
    this.altitudeFilter!.frequency.linearRampToValueAtTime(altFreq, ramp);

    // Surface bus overall gain tracks zoom
    this.surfaceBus!.gain.linearRampToValueAtTime(Math.max(surfaceGain, 0.05), ramp);

    // ── Rain / Snow ──
    const isSnow = params.temperature < 0;
    const precipActive = params.precipIntensity > 0.05;
    if (precipActive && !isSnow) {
      this.rainGain!.gain.linearRampToValueAtTime(params.precipIntensity * 0.6, ramp);
      this.snowGain!.gain.linearRampToValueAtTime(0, ramp);
    } else if (precipActive && isSnow) {
      this.snowGain!.gain.linearRampToValueAtTime(params.precipIntensity * 0.4, ramp);
      this.rainGain!.gain.linearRampToValueAtTime(0, ramp);
    } else {
      this.rainGain!.gain.linearRampToValueAtTime(0, ramp);
      this.snowGain!.gain.linearRampToValueAtTime(0, ramp);
    }

    // ── Wind ──
    const windActive = params.windSpeed > 2;
    if (windActive) {
      const windLevel = clamp((params.windSpeed - 2) / 15, 0, 1);
      this.windGain!.gain.linearRampToValueAtTime(windLevel * 0.5, ramp);
      this.gustLFOGain!.gain.linearRampToValueAtTime(params.gustIntensity * 0.15, ramp);
      this.gustLFO!.frequency.linearRampToValueAtTime(0.2 + params.gustIntensity * 0.5, ramp);
    } else {
      this.windGain!.gain.linearRampToValueAtTime(0, ramp);
      this.gustLFOGain!.gain.linearRampToValueAtTime(0, ramp);
    }

    // ── Fog drone ──
    const fogActive = params.humidity > 0.7 && params.cloudCover > 0.6;
    if (fogActive) {
      const fogLevel = ((params.humidity - 0.7) / 0.3) * ((params.cloudCover - 0.6) / 0.4);
      this.fogGain!.gain.linearRampToValueAtTime(clamp(fogLevel, 0, 1) * 0.08, ramp);
    } else {
      this.fogGain!.gain.linearRampToValueAtTime(0, ramp);
    }

    // ── Thunder (stochastic one-shots from samples) ──
    if (params.stormIntensity > 0.5 && !this.thunderScheduled) {
      const timeSinceLastThunder = now - this.lastThunderTime;
      if (timeSinceLastThunder > THUNDER_MIN_INTERVAL) {
        const prob = (params.stormIntensity - 0.5) * 0.02;
        if (Math.random() < prob) {
          this.playThunder(params.stormIntensity, surfaceGain);
        }
      }
    }
  }

  private playThunder(intensity: number, surfaceGain: number): void {
    if (!this.ctx || !this.masterGain || !this.isLoaded) return;

    this.thunderScheduled = true;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const delay = Math.random() * 2;
    const start = now + delay;

    // Pick random thunder sample
    const thunderNames: SampleName[] = ['thunder-1', 'thunder-2', 'thunder-3'];
    const name = thunderNames[Math.floor(Math.random() * thunderNames.length)];
    const buffer = this.buffers.get(name);
    if (!buffer) {
      this.thunderScheduled = false;
      return;
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(
        intensity * 0.7 * Math.max(surfaceGain, 0.1),
        start + 0.02
      );
      gain.gain.linearRampToValueAtTime(0.001, start + buffer.duration);

      source.connect(gain);
      gain.connect(this.masterGain);
      source.start(start);
      source.stop(start + buffer.duration);

      this.lastThunderTime = start;

      setTimeout(() => {
        this.thunderScheduled = false;
      }, (delay + buffer.duration) * 1000);
    } catch {
      this.thunderScheduled = false;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.ensureGraph();
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.linearRampToValueAtTime(
          this.volume,
          this.ctx.currentTime + 0.3
        );
      }
    } else {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.linearRampToValueAtTime(
          0,
          this.ctx.currentTime + 0.3
        );
      }
    }
  }

  setVolume(v: number): void {
    this.volume = clamp(v, 0, 1);
    if (this.enabled && this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.volume,
        this.ctx.currentTime + RAMP_TIME
      );
    }
  }

  getIsLoaded(): boolean {
    return this.isLoaded;
  }

  dispose(): void {
    try {
      this.rainSource?.stop();
      this.windSource?.stop();
      this.snowSource?.stop();
      this.fogSource?.stop();
      this.gustLFO?.stop();
    } catch {
      // Sources may already be stopped
    }

    this.rainSource = null;
    this.windSource = null;
    this.snowSource = null;
    this.fogSource = null;
    this.gustLFO = null;
    this.gustLFOGain = null;
    this.rainGain = null;
    this.windGain = null;
    this.snowGain = null;
    this.fogGain = null;
    this.altitudeFilter = null;
    this.surfaceBus = null;
    this.masterGain = null;
    this.graphBuilt = false;
    this.isLoaded = false;
    this.loadingPromise = null;
    this.buffers.clear();

    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const weatherAudio = new WeatherAudioService();
export { WeatherAudioService };
