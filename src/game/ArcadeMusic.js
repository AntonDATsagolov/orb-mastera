// Lightweight original arcade / quiz-show loop synthesized with Web Audio.
// No external recordings or licensed melodies are used.
export class ArcadeMusic {
  constructor({ volume = 0.18, muted = false } = {}) {
    this.volume = volume;
    this.muted = muted;
    this.context = null;
    this.master = null;
    this.track = null;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
    this.unlockPending = false;
    this.unlock = this.unlock.bind(this);
    this.menuNotes = [72, null, 76, 79, null, 76, 74, null, 67, null, 71, 74, null, 71, 69, null];
    this.gameNotes = [76, null, 79, 83, 84, null, 83, 79, 76, null, 79, 86, 84, null, 83, 79];
    this.bassNotes = [36, null, 36, null, 43, null, 43, null, 40, null, 40, null, 43, null, 43, null];
  }

  start(trackName) {
    this.track = trackName || 'menu';
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.context.destination);
    }
    this.requestStart();
  }

  requestStart() {
    if (!this.context || !this.track || this.muted) return;
    if (this.context.state === 'running') {
      this.beginScheduler();
      return;
    }
    this.context.resume().then(() => this.beginScheduler()).catch(() => this.waitForGesture());
    this.waitForGesture();
  }

  waitForGesture() {
    if (this.unlockPending || !this.track) return;
    this.unlockPending = true;
    document.addEventListener('pointerdown', this.unlock);
    document.addEventListener('keydown', this.unlock);
  }

  unlock() {
    this.unlockPending = false;
    document.removeEventListener('pointerdown', this.unlock);
    document.removeEventListener('keydown', this.unlock);
    if (!this.context || !this.track || this.muted) return;
    this.context.resume().then(() => this.beginScheduler()).catch(() => {});
  }

  beginScheduler() {
    if (!this.context || this.context.state !== 'running' || this.muted || this.timer) return;
    this.nextTime = this.context.currentTime + 0.04;
    this.timer = setInterval(() => this.scheduleAhead(), 25);
  }

  scheduleAhead() {
    if (!this.context || !this.track || this.context.state !== 'running') return;
    const gameTrack = this.track !== 'menu';
    const stepSeconds = 60 / (gameTrack ? 124 : 112) / 2;
    while (this.nextTime < this.context.currentTime + 0.12) {
      if (!this.muted) this.scheduleStep(this.step, this.nextTime, gameTrack);
      this.nextTime += stepSeconds;
      this.step = (this.step + 1) % 16;
    }
  }

  scheduleStep(step, at, gameTrack) {
    const melody = gameTrack ? this.gameNotes : this.menuNotes;
    const note = melody[step];
    if (note) this.tone(this.frequency(note), at, 0.16, 'triangle', 0.11);

    const bass = this.bassNotes[step];
    if (bass) this.tone(this.frequency(bass), at, 0.2, 'sawtooth', 0.065);

    // Original punchy downbeat and a short hand-clap-like tone on beats 2 and 4.
    if (step === 0 || step === 8) this.tone(92, at, 0.11, 'sine', 0.2);
    if (step === 4 || step === 12) {
      this.tone(190, at, 0.07, 'triangle', 0.07);
      this.tone(1250, at, 0.035, 'square', 0.018);
    }
    if (step === 2 || step === 6 || step === 10 || step === 14) this.tone(1050, at, 0.018, 'sine', 0.012);
  }

  tone(frequency, at, duration, type, peak) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(peak, at + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.01);
  }

  frequency(midiNote) {
    return 440 * (2 ** ((midiNote - 69) / 12));
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.context.currentTime, 0.025);
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.context.currentTime, 0.025);
    if (this.muted && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    } else if (!this.muted) {
      this.requestStart();
    }
  }

  pause() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.context?.state === 'running') this.context.suspend().catch(() => {});
  }

  resume() {
    this.requestStart();
  }

  stop() {
    this.track = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.step = 0;
    if (this.unlockPending) {
      document.removeEventListener('pointerdown', this.unlock);
      document.removeEventListener('keydown', this.unlock);
      this.unlockPending = false;
    }
    if (this.context?.state === 'running') this.context.suspend().catch(() => {});
  }
}
