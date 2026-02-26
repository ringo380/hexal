// Weather Audio Service - Synthesized ambient weather sounds via Web Audio API
// Generates continuous noise layers that respond to weather conditions and zoom level

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

// Clamp value between min and max
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// Linear interpolation
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const NOISE_DURATION = 2; // seconds
const RAMP_TIME = 0.1;    // seconds for parameter transitions
const THUNDER_MIN_INTERVAL = 4; // seconds between thunder cracks

class WeatherAudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = false;
  private volume = 0.5;
  private graphBuilt = false;

  // Noise source nodes (looping)
  private whiteSource: AudioBufferSourceNode | null = null;
  private pinkSource: AudioBufferSourceNode | null = null;
  private brownSource: AudioBufferSourceNode | null = null;

  // Noise buffers (generated once, reused)
  private whiteBuffer: AudioBuffer | null = null;
  private pinkBuffer: AudioBuffer | null = null;
  private brownBuffer: AudioBuffer | null = null;

  // Filter nodes
  private altitudeFilter: BiquadFilterNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Gain nodes per layer
  private altitudeGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private fogGain: GainNode | null = null;

  // Fog oscillators (persistent, detuned sine pair)
  private fogOsc1: OscillatorNode | null = null;
  private fogOsc2: OscillatorNode | null = null;
  private fogLowpass: BiquadFilterNode | null = null;

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

  // Generate noise buffers
  private generateBuffers(ctx: AudioContext): void {
    if (this.whiteBuffer) return;

    const length = ctx.sampleRate * NOISE_DURATION;

    // White noise
    this.whiteBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const white = this.whiteBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      white[i] = Math.random() * 2 - 1;
    }

    // Pink noise (Paul Kellet's refined method)
    this.pinkBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const pink = this.pinkBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      pink[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }

    // Brown noise (integration of white noise)
    this.brownBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const brown = this.brownBuffer.getChannelData(0);
    let lastBrown = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      lastBrown = (lastBrown + (0.02 * w)) / 1.02;
      brown[i] = lastBrown * 3.5; // compensate for volume loss
    }
  }

  private createLoopingSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  ensureGraph(): void {
    if (this.graphBuilt) return;

    try {
      const ctx = this.ensureContext();
      this.generateBuffers(ctx);

      // Master gain
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0; // start silent
      this.masterGain.connect(ctx.destination);

      // ── Altitude wind: white noise → highpass → gain ──
      this.altitudeFilter = ctx.createBiquadFilter();
      this.altitudeFilter.type = 'highpass';
      this.altitudeFilter.frequency.value = 2000;
      this.altitudeFilter.Q.value = 0.5;

      this.altitudeGain = ctx.createGain();
      this.altitudeGain.gain.value = 0;

      this.whiteSource = this.createLoopingSource(ctx, this.whiteBuffer!);
      this.whiteSource.connect(this.altitudeFilter);
      this.altitudeFilter.connect(this.altitudeGain);
      this.altitudeGain.connect(this.masterGain);
      this.whiteSource.start();

      // ── Rain: pink noise → bandpass → gain ──
      this.rainFilter = ctx.createBiquadFilter();
      this.rainFilter.type = 'bandpass';
      this.rainFilter.frequency.value = 3000;
      this.rainFilter.Q.value = 0.8;

      this.rainGain = ctx.createGain();
      this.rainGain.gain.value = 0;

      this.pinkSource = this.createLoopingSource(ctx, this.pinkBuffer!);
      this.pinkSource.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);
      this.pinkSource.start();

      // ── Surface wind: brown noise → lowpass → gain (with LFO for gusts) ──
      this.windFilter = ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.value = 400;
      this.windFilter.Q.value = 0.5;

      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0;

      // Gust LFO modulates wind gain
      this.gustLFO = ctx.createOscillator();
      this.gustLFO.type = 'sine';
      this.gustLFO.frequency.value = 0.3; // slow gusts
      this.gustLFOGain = ctx.createGain();
      this.gustLFOGain.gain.value = 0; // modulation depth, set by params
      this.gustLFO.connect(this.gustLFOGain);
      this.gustLFOGain.connect(this.windGain.gain);
      this.gustLFO.start();

      this.brownSource = this.createLoopingSource(ctx, this.brownBuffer!);
      this.brownSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      this.brownSource.start();

      // ── Fog drone: detuned sine pair → lowpass → gain ──
      this.fogLowpass = ctx.createBiquadFilter();
      this.fogLowpass.type = 'lowpass';
      this.fogLowpass.frequency.value = 150;

      this.fogGain = ctx.createGain();
      this.fogGain.gain.value = 0;

      this.fogOsc1 = ctx.createOscillator();
      this.fogOsc1.type = 'sine';
      this.fogOsc1.frequency.value = 60;

      this.fogOsc2 = ctx.createOscillator();
      this.fogOsc2.type = 'sine';
      this.fogOsc2.frequency.value = 90.5; // slight detuning for shimmer

      this.fogOsc1.connect(this.fogLowpass);
      this.fogOsc2.connect(this.fogLowpass);
      this.fogLowpass.connect(this.fogGain);
      this.fogGain.connect(this.masterGain);
      this.fogOsc1.start();
      this.fogOsc2.start();

      this.graphBuilt = true;
    } catch (e) {
      console.warn('Weather audio graph creation failed:', e);
    }
  }

  updateParams(params: WeatherAudioParams): void {
    if (!this.graphBuilt || !this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const ramp = now + RAMP_TIME;

    // Zoom-to-altitude factor: 0 at far zoom, 1 at close zoom
    const zoomFactor = clamp((params.zoomLevel - 0.15) / (1.5 - 0.15), 0, 1);

    // Surface proximity: 0 below zoom 0.3, ramps to 1 at zoom 0.8
    const surfaceProximity = clamp((params.zoomLevel - 0.3) / (0.8 - 0.3), 0, 1);

    // At far zoom with extreme weather, surface layers bleed through at 15% max
    const farBleed = (1 - surfaceProximity) * 0.15;
    const surfaceFactor = Math.max(surfaceProximity, farBleed);

    // ── Altitude wind ──
    const altGain = lerp(0.15, 0.0, zoomFactor);
    const altFreq = lerp(2000, 200, zoomFactor);
    this.altitudeGain!.gain.linearRampToValueAtTime(altGain, ramp);
    this.altitudeFilter!.frequency.linearRampToValueAtTime(altFreq, ramp);

    // ── Rain / Snow ──
    const isSnow = params.temperature < 0;
    const precipActive = params.precipIntensity > 0.05;
    if (precipActive) {
      const rainLevel = params.precipIntensity * surfaceFactor;
      this.rainGain!.gain.linearRampToValueAtTime(rainLevel * 0.4, ramp);
      // Snow: higher bandpass, lighter; Rain: midrange bandpass
      const rainFreq = isSnow ? 5000 : 3000;
      const rainQ = isSnow ? 1.2 : 0.8;
      this.rainFilter!.frequency.linearRampToValueAtTime(rainFreq, ramp);
      this.rainFilter!.Q.linearRampToValueAtTime(rainQ, ramp);
    } else {
      this.rainGain!.gain.linearRampToValueAtTime(0, ramp);
    }

    // ── Surface wind ──
    const windActive = params.windSpeed > 2;
    if (windActive) {
      const windLevel = clamp((params.windSpeed - 2) / 15, 0, 1) * surfaceFactor;
      this.windGain!.gain.linearRampToValueAtTime(windLevel * 0.3, ramp);
      // Distant howl at far zoom, full wind at close
      const windFreq = lerp(200, 400, surfaceProximity);
      this.windFilter!.frequency.linearRampToValueAtTime(windFreq, ramp);
      // Gust modulation depth tied to gustIntensity
      this.gustLFOGain!.gain.linearRampToValueAtTime(params.gustIntensity * 0.1 * surfaceFactor, ramp);
      this.gustLFO!.frequency.linearRampToValueAtTime(0.2 + params.gustIntensity * 0.5, ramp);
    } else {
      this.windGain!.gain.linearRampToValueAtTime(0, ramp);
      this.gustLFOGain!.gain.linearRampToValueAtTime(0, ramp);
    }

    // ── Fog drone ──
    const fogActive = params.humidity > 0.7 && params.cloudCover > 0.6;
    if (fogActive) {
      const fogLevel = ((params.humidity - 0.7) / 0.3) * ((params.cloudCover - 0.6) / 0.4);
      this.fogGain!.gain.linearRampToValueAtTime(clamp(fogLevel, 0, 1) * 0.06 * surfaceFactor, ramp);
    } else {
      this.fogGain!.gain.linearRampToValueAtTime(0, ramp);
    }

    // ── Thunder (stochastic one-shots) ──
    if (params.stormIntensity > 0.5 && !this.thunderScheduled) {
      const timeSinceLastThunder = now - this.lastThunderTime;
      if (timeSinceLastThunder > THUNDER_MIN_INTERVAL) {
        // Probability increases with storm intensity
        const prob = (params.stormIntensity - 0.5) * 0.02; // ~1% chance per update at max
        if (Math.random() < prob) {
          this.scheduleThunder(params.stormIntensity, surfaceFactor);
        }
      }
    }
  }

  private scheduleThunder(intensity: number, surfaceFactor: number): void {
    if (!this.ctx || !this.masterGain) return;

    this.thunderScheduled = true;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Random delay 0-2s
    const delay = Math.random() * 2;
    const start = now + delay;

    try {
      // Thunder: low sine burst + noise burst
      const thunderOsc = ctx.createOscillator();
      thunderOsc.type = 'sine';
      thunderOsc.frequency.setValueAtTime(60, start);
      thunderOsc.frequency.exponentialRampToValueAtTime(30, start + 0.4);

      const thunderGain = ctx.createGain();
      thunderGain.gain.setValueAtTime(0, start);
      thunderGain.gain.linearRampToValueAtTime(intensity * 0.5 * surfaceFactor, start + 0.02);
      thunderGain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

      // Noise burst for crack texture
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(intensity * 0.3 * surfaceFactor, start);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 800;

      thunderOsc.connect(thunderGain);
      thunderGain.connect(this.masterGain);

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      thunderOsc.start(start);
      noiseSrc.start(start);
      thunderOsc.stop(start + 0.7);
      noiseSrc.stop(start + 0.4);

      this.lastThunderTime = start;

      // Clean up scheduled flag after thunder plays
      setTimeout(() => {
        this.thunderScheduled = false;
      }, (delay + 0.7) * 1000);
    } catch (e) {
      this.thunderScheduled = false;
      console.warn('Thunder scheduling failed:', e);
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

  dispose(): void {
    try {
      this.whiteSource?.stop();
      this.pinkSource?.stop();
      this.brownSource?.stop();
      this.fogOsc1?.stop();
      this.fogOsc2?.stop();
      this.gustLFO?.stop();
    } catch {
      // Sources may already be stopped
    }

    this.whiteSource = null;
    this.pinkSource = null;
    this.brownSource = null;
    this.fogOsc1 = null;
    this.fogOsc2 = null;
    this.gustLFO = null;
    this.altitudeFilter = null;
    this.rainFilter = null;
    this.windFilter = null;
    this.altitudeGain = null;
    this.rainGain = null;
    this.windGain = null;
    this.fogGain = null;
    this.fogLowpass = null;
    this.gustLFOGain = null;
    this.masterGain = null;
    this.graphBuilt = false;

    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const weatherAudio = new WeatherAudioService();
export { WeatherAudioService };
