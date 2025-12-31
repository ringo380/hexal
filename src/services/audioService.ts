// audioService - Web Audio API wrapper for marker sounds
// Generates wood block-style sounds programmatically

class MarkerAudioService {
  private ctx: AudioContext | null = null;
  private volume: number = 0.5;
  private enabled: boolean = true;

  // Lazily initialize AudioContext (required for user gesture policies)
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Generate a wood block "pickup" sound
  // Short, bright click with resonance
  playPickup(): void {
    if (!this.enabled) return;

    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      // Create oscillators for wood block harmonics
      const fundamental = ctx.createOscillator();
      const harmonic = ctx.createOscillator();

      // Gain nodes for envelope
      const fundGain = ctx.createGain();
      const harmGain = ctx.createGain();
      const masterGain = ctx.createGain();

      // Wood block pickup - higher pitch, short
      fundamental.type = 'sine';
      fundamental.frequency.setValueAtTime(800, now);
      fundamental.frequency.exponentialRampToValueAtTime(400, now + 0.08);

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(1600, now);
      harmonic.frequency.exponentialRampToValueAtTime(800, now + 0.06);

      // Envelope - quick attack, short decay
      fundGain.gain.setValueAtTime(0, now);
      fundGain.gain.linearRampToValueAtTime(0.8, now + 0.005);
      fundGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      harmGain.gain.setValueAtTime(0, now);
      harmGain.gain.linearRampToValueAtTime(0.3, now + 0.003);
      harmGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      masterGain.gain.value = this.volume;

      // Connect
      fundamental.connect(fundGain);
      harmonic.connect(harmGain);
      fundGain.connect(masterGain);
      harmGain.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Play
      fundamental.start(now);
      harmonic.start(now);
      fundamental.stop(now + 0.15);
      harmonic.stop(now + 0.1);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  // Generate a wood block "drop" sound
  // Deeper, more resonant thunk
  playDrop(): void {
    if (!this.enabled) return;

    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      // Create oscillators
      const fundamental = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const noise = ctx.createBufferSource();

      // Gain nodes
      const fundGain = ctx.createGain();
      const harmGain = ctx.createGain();
      const noiseGain = ctx.createGain();
      const masterGain = ctx.createGain();

      // Wood block drop - lower pitch, longer decay
      fundamental.type = 'sine';
      fundamental.frequency.setValueAtTime(500, now);
      fundamental.frequency.exponentialRampToValueAtTime(200, now + 0.15);

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(1000, now);
      harmonic.frequency.exponentialRampToValueAtTime(400, now + 0.1);

      // Create short noise burst for impact
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.01));
      }
      noise.buffer = noiseBuffer;

      // Filter noise to make it more "woody"
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 800;
      noiseFilter.Q.value = 2;

      // Envelope
      fundGain.gain.setValueAtTime(0, now);
      fundGain.gain.linearRampToValueAtTime(1, now + 0.005);
      fundGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      harmGain.gain.setValueAtTime(0, now);
      harmGain.gain.linearRampToValueAtTime(0.4, now + 0.003);
      harmGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      masterGain.gain.value = this.volume;

      // Connect
      fundamental.connect(fundGain);
      harmonic.connect(harmGain);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      fundGain.connect(masterGain);
      harmGain.connect(masterGain);
      noiseGain.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Play
      fundamental.start(now);
      harmonic.start(now);
      noise.start(now);
      fundamental.stop(now + 0.25);
      harmonic.stop(now + 0.15);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  // Set volume (0-1)
  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }

  getVolume(): number {
    return this.volume;
  }

  // Enable/disable sounds
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Clean up
  dispose(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Singleton instance
export const markerAudio = new MarkerAudioService();

// Export the class for testing
export { MarkerAudioService };
