export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.effectsEnabled = true;
    this.lofiEnabled = false;
    this.hornOscA = null;
    this.hornOscB = null;
    this.hornGain = null;
    this.lofiTimer = null;
  }

  _ensureContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setEffectsEnabled(enabled) {
    this.effectsEnabled = Boolean(enabled);
    if (!this.effectsEnabled) {
      this.setHornActive(false);
    }
  }

  setLofiEnabled(enabled) {
    this.lofiEnabled = Boolean(enabled);
    if (this.lofiEnabled) {
      this._startLofiLoop();
    } else {
      this._stopLofiLoop();
    }
  }

  playPlugSnap(isStack = false) {
    if (!this.effectsEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isStack ? 360 : 260, now);
    osc.frequency.exponentialRampToValueAtTime(isStack ? 680 : 520, now + 0.045);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playErrorBuzz() {
    if (!this.effectsEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  playRelayClick(closed = true) {
    if (!this.effectsEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(closed ? 1150 : 820, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.022);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.028);
  }

  playFlasherTick(on = true) {
    if (!this.effectsEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(on ? 980 : 720, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.018);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.022);
  }

  setHornActive(active) {
    if (!this.effectsEnabled) active = false;
    if (active) {
      if (this.hornOscA) return;
      const ctx = this._ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      this.hornOscA = ctx.createOscillator();
      this.hornOscB = ctx.createOscillator();
      this.hornGain = ctx.createGain();

      // Classic automotive dual-disc horn (410 Hz + 510 Hz)
      this.hornOscA.type = 'sawtooth';
      this.hornOscB.type = 'sawtooth';
      this.hornOscA.frequency.setValueAtTime(410, now);
      this.hornOscB.frequency.setValueAtTime(510, now);

      this.hornGain.gain.setValueAtTime(0.08, now);
      this.hornOscA.connect(this.hornGain);
      this.hornOscB.connect(this.hornGain);
      this.hornGain.connect(ctx.destination);

      this.hornOscA.start(now);
      this.hornOscB.start(now);
    } else if (this.hornOscA) {
      try {
        this.hornOscA.stop();
        this.hornOscB.stop();
        this.hornOscA.disconnect();
        this.hornOscB.disconnect();
        this.hornGain.disconnect();
      } catch {
        // ignore cleanup error
      }
      this.hornOscA = null;
      this.hornOscB = null;
      this.hornGain = null;
    }
  }

  setMultimeterBeep(active) {
    if (!this.effectsEnabled) active = false;
    if (active) {
      if (this.meterBeepOsc) return;
      const ctx = this._ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      this.meterBeepOsc = ctx.createOscillator();
      this.meterBeepGain = ctx.createGain();

      this.meterBeepOsc.type = 'sine';
      this.meterBeepOsc.frequency.setValueAtTime(2650, now);

      this.meterBeepGain.gain.setValueAtTime(0.08, now);
      this.meterBeepOsc.connect(this.meterBeepGain);
      this.meterBeepGain.connect(ctx.destination);

      this.meterBeepOsc.start(now);
    } else if (this.meterBeepOsc) {
      try {
        this.meterBeepOsc.stop();
        this.meterBeepOsc.disconnect();
        this.meterBeepGain.disconnect();
      } catch {
        // ignore cleanup error
      }
      this.meterBeepOsc = null;
      this.meterBeepGain = null;
    }
  }

  setBoardBuzzerActive(active) {
    if (!this.effectsEnabled) active = false;
    if (active) {
      if (this.boardBuzzerOsc) return;
      const ctx = this._ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      this.boardBuzzerOsc = ctx.createOscillator();
      this.boardBuzzerGain = ctx.createGain();

      // 12V automotive piezo chime tone (2200 Hz with slight pulsed modulation)
      this.boardBuzzerOsc.type = 'square';
      this.boardBuzzerOsc.frequency.setValueAtTime(2200, now);

      this.boardBuzzerGain.gain.setValueAtTime(0.06, now);
      this.boardBuzzerOsc.connect(this.boardBuzzerGain);
      this.boardBuzzerGain.connect(ctx.destination);

      this.boardBuzzerOsc.start(now);
    } else if (this.boardBuzzerOsc) {
      try {
        this.boardBuzzerOsc.stop();
        this.boardBuzzerOsc.disconnect();
        this.boardBuzzerGain.disconnect();
      } catch {
        // ignore cleanup error
      }
      this.boardBuzzerOsc = null;
      this.boardBuzzerGain = null;
    }
  }

  setBlowerSpeed(level = 0) {
    if (!this.effectsEnabled) level = 0;
    this.blowerLevel = level;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (level > 0) {
      if (!this.blowerSource) {
        const bufLen = ctx.sampleRate * 2;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        this.blowerSource = ctx.createBufferSource();
        this.blowerSource.buffer = buf;
        this.blowerSource.loop = true;

        this.blowerFilter = ctx.createBiquadFilter();
        this.blowerFilter.type = 'lowpass';

        this.blowerGain = ctx.createGain();
        this.blowerGain.gain.setValueAtTime(0.001, now);

        this.blowerSource.connect(this.blowerFilter);
        this.blowerFilter.connect(this.blowerGain);
        this.blowerGain.connect(ctx.destination);

        this.blowerSource.start(now);
      }

      const settings = {
        1: { freq: 520, gain: 0.09 },
        2: { freq: 1100, gain: 0.18 },
        3: { freq: 2100, gain: 0.32 },
      };
      const s = settings[level] || settings[1];
      this.blowerFilter.frequency.setTargetAtTime(s.freq, now, 0.1);
      this.blowerGain.gain.setTargetAtTime(s.gain, now, 0.1);
    } else if (this.blowerSource && this.blowerGain) {
      this.blowerGain.gain.setTargetAtTime(0.0001, now, 0.08);
      setTimeout(() => {
        if (this.blowerLevel === 0 && this.blowerSource) {
          try {
            this.blowerSource.stop();
            this.blowerSource.disconnect();
            this.blowerFilter.disconnect();
            this.blowerGain.disconnect();
          } catch {
            // ignore cleanup error
          }
          this.blowerSource = null;
          this.blowerFilter = null;
          this.blowerGain = null;
        }
      }, 120);
    }
  }

  playMagneticClutchEngagement() {
    if (!this.effectsEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Sharp metallic contact click (transient)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(1450, now);
    clickOsc.frequency.exponentialRampToValueAtTime(750, now + 0.022);

    clickGain.gain.setValueAtTime(0.28, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.028);

    // 2. Heavy magnetic plate clamp thump (low-end mechanical impact)
    const thumpOsc = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thumpOsc.type = 'triangle';
    thumpOsc.frequency.setValueAtTime(160, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(65, now + 0.055);

    thumpGain.gain.setValueAtTime(0.35, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.065);
  }

  playMagneticClutchDisengagement() {
    if (!this.effectsEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.02);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.025);
  }

  playShortSpark() {
    if (!this.effectsEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.28;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.07));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.27);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  _startLofiLoop() {
    this._stopLofiLoop();
    const ctx = this._ensureContext();
    if (!ctx) return;

    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [174.61, 220.0, 261.63, 349.23], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];
    let stepIdx = 0;

    const playChord = () => {
      if (!this.lofiEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = chords[stepIdx % chords.length];
      stepIdx++;

      for (const freq of chord) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.015, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 2.4);
      }
    };

    playChord();
    this.lofiTimer = setInterval(playChord, 2400);
  }

  _stopLofiLoop() {
    if (this.lofiTimer) {
      clearInterval(this.lofiTimer);
      this.lofiTimer = null;
    }
  }
}
