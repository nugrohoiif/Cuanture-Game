// Procedural Web Audio synthesizer for zero-404 game sound effects & pastel adventure BGM

interface MelodyNote {
  freq: number | null; // null = rest
  bass?: number;
  dur: number; // in steps
}

// Light, cheerful pastoral C-major / G-major pentatonic adventure progression
const ADVENTURE_MELODY: MelodyNote[] = [
  // Bar 1 (C Major warm sunrise)
  { freq: 523.25, bass: 261.63, dur: 1 }, // C5
  { freq: 587.33, dur: 1 },               // D5
  { freq: 659.25, bass: 329.63, dur: 1 }, // E5
  { freq: 783.99, dur: 1 },               // G5
  { freq: 659.25, bass: 261.63, dur: 2 }, // E5
  { freq: 523.25, dur: 2 },               // C5

  // Bar 2 (F Major -> G Major breeze)
  { freq: 698.46, bass: 349.23, dur: 1 }, // F5
  { freq: 659.25, dur: 1 },               // E5
  { freq: 587.33, bass: 293.66, dur: 1 }, // D5
  { freq: 523.25, dur: 1 },               // C5
  { freq: 587.33, bass: 392.00, dur: 3 }, // D5
  { freq: null, dur: 1 },

  // Bar 3 (A minor / C Major playful leap)
  { freq: 659.25, bass: 220.00, dur: 1 }, // E5
  { freq: 783.99, dur: 1 },               // G5
  { freq: 880.00, bass: 329.63, dur: 1 }, // A5
  { freq: 783.99, dur: 1 },               // G5
  { freq: 659.25, bass: 261.63, dur: 2 }, // E5
  { freq: 587.33, dur: 2 },               // D5

  // Bar 4 (F Major -> G Major -> C Major resolution)
  { freq: 523.25, bass: 349.23, dur: 1 }, // C5
  { freq: 587.33, dur: 1 },               // D5
  { freq: 659.25, bass: 392.00, dur: 1 }, // E5
  { freq: 587.33, dur: 1 },               // D5
  { freq: 523.25, bass: 261.63, dur: 3 }, // C5
  { freq: null, dur: 1 },
];

class SoundEffects {
  private ctx: AudioContext | null = null;
  public muted = false;
  public volume = 0.8;
  private bgmEnabled = false;
  private bgmTimer: number | null = null;
  private bgmNoteIndex = 0;
  private bgmStepHold = 0;

  private getVolumeScale(): number {
    return Math.max(0.01, Math.min(1, this.volume));
  }

  private isHeadlessEnv(): boolean {
    if (typeof window === 'undefined') return true;
    return Boolean(navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));
  }

  private getContext(): AudioContext | null {
    if (this.muted || this.volume <= 0.001 || this.isHeadlessEnv()) return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(nextMuted: boolean): void {
    this.muted = nextMuted;
    if (nextMuted) {
      this.clearBgmInterval();
    } else if (this.bgmEnabled) {
      this.ensureBgmLoop();
    }
  }

  public setVolume(nextVolume: number): void {
    this.volume = Math.max(0, Math.min(1, nextVolume));
    if (this.volume <= 0.001) {
      this.clearBgmInterval();
    } else if (this.bgmEnabled && !this.muted) {
      this.ensureBgmLoop();
    }
  }

  public startMusic(): void {
    this.bgmEnabled = true;
    if (!this.muted && this.volume > 0.001) {
      this.ensureBgmLoop();
    }
  }

  public stopMusic(): void {
    this.bgmEnabled = false;
    this.clearBgmInterval();
  }

  public isMusicActive(): boolean {
    return this.bgmEnabled && !this.muted && this.volume > 0.001;
  }

  private clearBgmInterval(): void {
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private ensureBgmLoop(): void {
    if (this.isHeadlessEnv() || this.muted || this.volume <= 0.001) return;
    if (this.bgmTimer !== null) return;

    // Trigger context creation/resume on user gesture if possible
    this.getContext();

    const stepMs = 270; // ~111 BPM light adventure gait
    this.bgmTimer = window.setInterval(() => {
      if (!this.bgmEnabled || this.muted || this.volume <= 0.001) return;
      const ctx = this.getContext();
      if (!ctx || ctx.state !== 'running') return;

      if (this.bgmStepHold > 0) {
        this.bgmStepHold -= 1;
        return;
      }

      const item = ADVENTURE_MELODY[this.bgmNoteIndex % ADVENTURE_MELODY.length];
      this.bgmNoteIndex = (this.bgmNoteIndex + 1) % ADVENTURE_MELODY.length;
      this.bgmStepHold = Math.max(0, item.dur - 1);

      const v = this.getVolumeScale();
      const now = ctx.currentTime;
      const noteLen = (item.dur * stepMs) / 1000;

      // Soft marimba/celesta lead note
      if (item.freq) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(item.freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.042 * v, now + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + Math.max(0.18, noteLen * 0.92));

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + Math.max(0.2, noteLen));
      }

      // Warm acoustic-like triangle bass accompaniment
      if (item.bass) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(item.bass, now);

        bassGain.gain.setValueAtTime(0.001, now);
        bassGain.gain.linearRampToValueAtTime(0.026 * v, now + 0.03);
        bassGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.48);

        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.5);
      }
    }, stepMs);
  }

  public playJump(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const v = this.getVolumeScale();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pitchVar = 0.94 + Math.random() * 0.12;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240 * pitchVar, now);
    osc.frequency.exponentialRampToValueAtTime(520 * pitchVar, now + 0.14);

    gain.gain.setValueAtTime(0.12 * v, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playLand(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const v = this.getVolumeScale();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.09);

    gain.gain.setValueAtTime(0.14 * v, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playBoost(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const v = this.getVolumeScale();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);

    gain.gain.setValueAtTime(0.16 * v, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.30);
  }

  public playShardPickup(collectedCount: number): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const v = this.getVolumeScale();
    const now = ctx.currentTime;
    const baseFreq = 440 * Math.pow(1.06, collectedCount);
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12 * v, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  public playVictory(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const v = this.getVolumeScale();
    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = now + idx * 0.09;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.14 * v, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.56);
    });
  }

  public playInteract(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const v = this.getVolumeScale();
    const now = ctx.currentTime;
    const notes = [587.33, 880]; // D5 -> A5 chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = now + idx * 0.06;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.11 * v, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.23);
    });
  }

  public playTradeSuccess(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const v = this.getVolumeScale();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 1046.5]; // C5 -> E5 -> C6 cash register chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12 * v, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.21);
    });
  }

  public playTradeError(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const v = this.getVolumeScale();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.linearRampToValueAtTime(125, now + 0.18);
    gain.gain.setValueAtTime(0.09 * v, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }
}

export const soundFX = new SoundEffects();
