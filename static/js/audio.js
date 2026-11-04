/**
 * RACING ZONE - Web Audio Synthesizer
 * Dynamic Procedural Sound Engine for real-life sports cars
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = (typeof localStorage !== 'undefined' && localStorage.getItem('racing_zone_audio_muted') === 'true');
    this.isEngineRunning = false;

    // Engine Nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineSubOsc = null;
    this.engineGain = null;
    this.engineFilter = null;

    // Tire Screech Nodes
    this.screechNode = null;
    this.screechGain = null;

    // Music Nodes
    this.musicGain = null;
    this.musicInterval = null;
    this.isMusicPlaying = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
      this.masterGain.gain.value = this.isMuted ? 0 : 0.85;
      this.masterGain.connect(this.ctx.destination);
      if (this.isMuted && this.ctx.suspend) {
        this.ctx.suspend();
      }
    } catch (e) {
      console.warn("Web Audio not supported", e);
    }
  }

  ensureContext() {
    if (this.isMuted) return;
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('racing_zone_audio_muted', this.isMuted ? 'true' : 'false');
    }

    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
      this.masterGain.gain.value = this.isMuted ? 0 : 0.85;
    }

    if (this.isMuted) {
      this.stopRadioBeat();
      this.stopEngine();
      this.stopTireScreech();
      this.stopPoliceSiren();
      if (this.ctx && this.ctx.suspend) {
        this.ctx.suspend();
      }
    } else {
      this.ensureContext();
      if (this.ctx && this.ctx.resume) {
        this.ctx.resume();
      }
    }
    return this.isMuted;
  }

  /* ----------------------------------------------------
     Dynamic Engine Sound
     ---------------------------------------------------- */
  startEngine(basePitch = 1.0) {
    if (this.isMuted) return;
    this.ensureContext();
    if (this.isEngineRunning || !this.ctx) return;

    try {
      this.enginePitchMultiplier = basePitch;

      // Dual sawtooth oscillators for aggressive exhaust rumble
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(55 * basePitch, this.ctx.currentTime);

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(110 * basePitch, this.ctx.currentTime);

      this.engineSubOsc = this.ctx.createOscillator();
      this.engineSubOsc.type = 'sine';
      this.engineSubOsc.frequency.setValueAtTime(27.5 * basePitch, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);

      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.engineSubOsc.start();
      this.isEngineRunning = true;
    } catch (e) {
      console.warn("Error starting engine sound", e);
    }
  }

  updateEngine(rpmRatio, throttle, speedRatio) {
    if (this.isMuted || !this.isEngineRunning || !this.ctx) return;
    try {
      const mult = this.enginePitchMultiplier || 1.0;
      // RPM range from idle (60Hz) to redline (420Hz)
      const targetFreq = (55 + rpmRatio * 320) * mult;
      const targetFilter = 400 + rpmRatio * 1800 + (throttle ? 600 : 0);
      const targetVol = 0.08 + (throttle ? 0.14 : 0.04) + speedRatio * 0.06;

      const t = this.ctx.currentTime;
      this.engineOsc1.frequency.setTargetAtTime(targetFreq, t, 0.06);
      this.engineOsc2.frequency.setTargetAtTime(targetFreq * 1.5, t, 0.06);
      this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, t, 0.06);
      this.engineFilter.frequency.setTargetAtTime(targetFilter, t, 0.08);
      this.engineGain.gain.setTargetAtTime(Math.min(0.3, targetVol), t, 0.08);
    } catch (e) {}
  }

  stopEngine() {
    if (!this.isEngineRunning || !this.ctx) return;
    try {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.engineSubOsc?.stop();
      this.isEngineRunning = false;
    } catch (e) {}
  }

  /* ----------------------------------------------------
     Tire Screech on Drift
     ---------------------------------------------------- */
  playTireScreech(intensity = 0.5) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    if (!this.screechNode) {
      // White noise buffer
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.screechNode = this.ctx.createBufferSource();
      this.screechNode.buffer = buffer;
      this.screechNode.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.screechGain = this.ctx.createGain();
      this.screechGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.screechNode.connect(bandpass);
      bandpass.connect(this.screechGain);
      this.screechGain.connect(this.masterGain);

      this.screechNode.start();
    }

    const t = this.ctx.currentTime;
    const gain = Math.min(0.2, intensity * 0.2);
    this.screechGain.gain.setTargetAtTime(gain, t, 0.04);
  }

  stopTireScreech() {
    if (this.screechGain && this.ctx) {
      this.screechGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    }
  }

  /* ----------------------------------------------------
     Nitro Boost Rush & Blow-Off Valve
     ---------------------------------------------------- */
  playNitroSound() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.value = 3.0;

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  playBlowOffValve() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    // Fast filtered hiss
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2400;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.12;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  /* ----------------------------------------------------
     Crash & Impact Sound
     ---------------------------------------------------- */
  playCrashSound(strength = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.25);

    const vol = Math.min(0.35, strength * 0.35);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  /* ----------------------------------------------------
     Countdown Beeps (3, 2, 1, GO!)
     ---------------------------------------------------- */
  playCountdownBeep(isGo = false) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = isGo ? 880 : 440;
    const dur = isGo ? 0.6 : 0.25;

    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  /* ----------------------------------------------------
     Victory Chequered Flag Fanfare
     ---------------------------------------------------- */
  playVictoryFanfare() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
      }, idx * 120);
    });
  }
  /* ----------------------------------------------------
     Police Pursuit Dual-Tone Siren
     ---------------------------------------------------- */
  startPoliceSiren() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isSirenRunning) return;

    this.sirenOsc = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc.type = 'sawtooth';
    this.sirenGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    // Filter to give high-pitch wail
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.sirenOsc.connect(filter);
    filter.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);

    this.sirenOsc.start();
    this.isSirenRunning = true;

    // Siren wail LFO modulation
    this.sirenInterval = setInterval(() => {
      if (!this.ctx || !this.isSirenRunning) return;
      const t = this.ctx.currentTime;
      this.sirenOsc.frequency.setValueAtTime(650, t);
      this.sirenOsc.frequency.exponentialRampToValueAtTime(950, t + 0.35);
      this.sirenOsc.frequency.exponentialRampToValueAtTime(650, t + 0.7);
    }, 700);
  }

  stopPoliceSiren() {
    if (!this.isSirenRunning) return;
    clearInterval(this.sirenInterval);
    try {
      this.sirenOsc?.stop();
    } catch (e) {}
    this.isSirenRunning = false;
  }

  /* ----------------------------------------------------
     GTA In-Car Radio Player (Procedural Web Audio Synthesis)
     ---------------------------------------------------- */
  initRadio() {
    this.radioStations = [
      { id: 'off', name: '🔇 Radio Off', bpm: 0 },
      { id: 'rock', name: '📻 Los Santos Rock Radio', bpm: 125, bassNotes: [110, 110, 146.8, 130.8, 110, 98, 110, 164.8], synthType: 'sawtooth' },
      { id: 'flash', name: '📻 Flash FM (Vice City)', bpm: 128, bassNotes: [130.8, 164.8, 196.0, 246.9, 196.0, 164.8, 146.8, 174.6], synthType: 'sine' },
      { id: 'rap', name: '📻 Radio Los Santos', bpm: 95, bassNotes: [65.4, 65.4, 77.8, 87.3, 65.4, 58.3, 65.4, 98.0], synthType: 'triangle' },
      { id: 'pop', name: '📻 Non-Stop-Pop FM', bpm: 124, bassNotes: [174.6, 196.0, 220.0, 261.6, 220.0, 196.0, 174.6, 130.8], synthType: 'square' },
      { id: 'kdst', name: '📻 K-DST (The Dust)', bpm: 110, bassNotes: [98.0, 123.5, 146.8, 130.8, 98.0, 87.3, 98.0, 110.0], synthType: 'sawtooth' }
    ];
    this.currentStationIdx = 1; // Default to Los Santos Rock Radio
    this.radioBeatIdx = 0;
    this.radioTimer = null;
    this.radioGain = null;
  }

  setRadioStation(idx) {
    this.ensureContext();
    if (!this.radioStations) this.initRadio();
    this.currentStationIdx = (idx + this.radioStations.length) % this.radioStations.length;
    this.stopRadioBeat();

    const station = this.radioStations[this.currentStationIdx];
    if (station.id === 'off' || this.isMuted) return station.name;

    this.startRadioBeat(station);
    return station.name;
  }

  nextRadioStation() {
    if (!this.radioStations) this.initRadio();
    return this.setRadioStation(this.currentStationIdx + 1);
  }

  startRadioBeat(station) {
    if (!this.ctx || this.isMuted) return;
    const intervalMs = (60 / station.bpm) * 500; // 8th notes

    this.radioTimer = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const noteFreq = station.bassNotes[this.radioBeatIdx % station.bassNotes.length];

      // Bass note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = station.synthType;
      osc.frequency.setValueAtTime(noteFreq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(150, t + 0.22);

      gain.gain.setValueAtTime(0.065, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.25);

      // Procedural hi-hat every offbeat
      if (this.radioBeatIdx % 2 === 1) {
        this.playRadioHat(t);
      }

      this.radioBeatIdx++;
    }, intervalMs);
  }

  playRadioHat(t) {
    if (!this.ctx || this.isMuted) return;
    const hat = this.ctx.createOscillator();
    const hGain = this.ctx.createGain();
    const hFilter = this.ctx.createBiquadFilter();

    hat.type = 'sawtooth';
    hat.frequency.setValueAtTime(8000, t);

    hFilter.type = 'highpass';
    hFilter.frequency.setValueAtTime(6000, t);

    hGain.gain.setValueAtTime(0.015, t);
    hGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    hat.connect(hFilter);
    hFilter.connect(hGain);
    hGain.connect(this.masterGain);

    hat.start(t);
    hat.stop(t + 0.06);
  }

  stopRadioBeat() {
    if (this.radioTimer) {
      clearInterval(this.radioTimer);
      this.radioTimer = null;
    }
  }

  stopRadio() {
    this.stopRadioBeat();
    if (this.radioStations) {
      this.currentStationIdx = 0;
    }
  }

  /* ----------------------------------------------------
     High-Speed Near Miss Doppler Whoosh
     ---------------------------------------------------- */
  playWhooshNearMiss() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    // Filtered white noise with pitch sweep
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const t = this.ctx.currentTime;
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(1900, t + 0.15);
    filter.frequency.exponentialRampToValueAtTime(450, t + 0.35);
    filter.Q.value = 3.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(t);
  }

  /* ----------------------------------------------------
     Exhaust Pop / Backfire Crackle
     ---------------------------------------------------- */
  playExhaustPop() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(180 + Math.random() * 80, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.1);
      }, i * 65);
    }
  }

  /* ----------------------------------------------------
     Traffic Car Horn Honk
     ---------------------------------------------------- */
  playTrafficHorn() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    const t = this.ctx.currentTime;

    osc1.frequency.setValueAtTime(420, t); // F#
    osc2.frequency.setValueAtTime(495, t); // B

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, t);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.setValueAtTime(0.14, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.45);
    osc2.stop(t + 0.45);
  }

  /* ----------------------------------------------------
     Slipstream / Drafting Wind Whistle
     ---------------------------------------------------- */
  playDraftingSound() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const t = this.ctx.currentTime;
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }
}

// Global Sound Instance
window.racingAudio = new SoundEngine();

