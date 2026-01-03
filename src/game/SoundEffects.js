// SoundEffects.js - Генератор звуковых эффектов через Web Audio API
// Эстетичные, мягкие звуки без необходимости загрузки файлов

class SoundEffectsClass {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.volume = 0.4;
    this.isMuted = false;
    
    this.loadSettings();
  }

  /**
   * Инициализация AudioContext (нужен после пользовательского действия)
   */
  init() {
    if (this.context) return;
    
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  /**
   * Загрузка настроек
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('sfxSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.volume = settings.volume ?? 0.4;
        this.isMuted = settings.isMuted ?? false;
      }
    } catch (e) {}
  }

  /**
   * Сохранение настроек
   */
  saveSettings() {
    try {
      localStorage.setItem('sfxSettings', JSON.stringify({
        volume: this.volume,
        isMuted: this.isMuted
      }));
    } catch (e) {}
  }

  /**
   * Установить громкость (0-1)
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    }
    this.saveSettings();
  }

  getVolume() {
    return this.volume;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    }
    this.saveSettings();
    return this.isMuted;
  }

  getMuted() {
    return this.isMuted;
  }

  // ========================
  // ЗВУКОВЫЕ ЭФФЕКТЫ
  // ========================

  /**
   * Мягкий клик при запуске шара
   */
  playLaunch() {
    this.init();
    if (!this.context || this.isMuted) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.15);
  }

  /**
   * Попадание шара по блоку - мягкий "тук"
   */
  playHit() {
    this.init();
    if (!this.context || this.isMuted) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300 + Math.random() * 100, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.context.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  /**
   * Разрушение блока - приятный звон
   */
  playBreak() {
    this.init();
    if (!this.context || this.isMuted) return;

    // Основной тон
    const osc1 = this.context.createOscillator();
    const gain1 = this.context.createGain();
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, this.context.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(440, this.context.currentTime + 0.2);
    
    gain1.gain.setValueAtTime(0.2, this.context.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.25);
    
    osc1.start();
    osc1.stop(this.context.currentTime + 0.25);

    // Гармоника
    const osc2 = this.context.createOscillator();
    const gain2 = this.context.createGain();
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, this.context.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(660, this.context.currentTime + 0.15);
    
    gain2.gain.setValueAtTime(0.1, this.context.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
    
    osc2.start();
    osc2.stop(this.context.currentTime + 0.2);
  }

  /**
   * Взрыв бомбы - глубокий "бум"
   */
  playExplosion() {
    this.init();
    if (!this.context || this.isMuted) return;

    // Низкочастотный "бум"
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.context.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.4, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.5);

    // Шум
    this.playNoise(0.3, 0.15);
  }

  /**
   * Лазер - электронный "пиу"
   */
  playLaser() {
    this.init();
    if (!this.context || this.isMuted) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }

  /**
   * Бонус - восходящий аккорд
   */
  playBonus() {
    this.init();
    if (!this.context || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = this.context.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  /**
   * Отскок от стены - мягкий "пуф"
   */
  playBounce() {
    this.init();
    if (!this.context || this.isMuted) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.06);
    
    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.08);
  }

  /**
   * Конец раунда - нисходящий звук
   */
  playRoundEnd() {
    this.init();
    if (!this.context || this.isMuted) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.context.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.25, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.4);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.4);
  }

  /**
   * Победа - торжественная мелодия
   */
  playVictory() {
    this.init();
    if (!this.context || this.isMuted) return;

    const melody = [
      { freq: 523.25, time: 0, dur: 0.15 },      // C5
      { freq: 659.25, time: 0.15, dur: 0.15 },   // E5
      { freq: 783.99, time: 0.3, dur: 0.15 },    // G5
      { freq: 1046.5, time: 0.45, dur: 0.4 },    // C6
    ];

    melody.forEach(note => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.type = 'sine';
      osc.frequency.value = note.freq;
      
      const startTime = this.context.currentTime + note.time;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.dur);
      
      osc.start(startTime);
      osc.stop(startTime + note.dur + 0.1);
    });
  }

  /**
   * Поражение - грустный звук
   */
  playGameOver() {
    this.init();
    if (!this.context || this.isMuted) return;

    const melody = [
      { freq: 392, time: 0, dur: 0.3 },      // G4
      { freq: 349.23, time: 0.3, dur: 0.3 }, // F4
      { freq: 329.63, time: 0.6, dur: 0.5 }, // E4
    ];

    melody.forEach(note => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.type = 'sine';
      osc.frequency.value = note.freq;
      
      const startTime = this.context.currentTime + note.time;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.dur);
      
      osc.start(startTime);
      osc.stop(startTime + note.dur + 0.1);
    });
  }

  /**
   * Клик по кнопке UI
   */
  playClick() {
    this.init();
    if (!this.context || this.isMuted) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sine';
    osc.frequency.value = 800;
    
    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.05);
  }

  /**
   * Рандомайзер - магический звук
   */
  playRandomize() {
    this.init();
    if (!this.context || this.isMuted) return;

    for (let i = 0; i < 5; i++) {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.type = 'sine';
      osc.frequency.value = 400 + Math.random() * 800;
      
      const startTime = this.context.currentTime + i * 0.05;
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
      
      osc.start(startTime);
      osc.stop(startTime + 0.1);
    }
  }

  /**
   * Белый шум (для взрывов)
   */
  playNoise(duration = 0.2, volume = 0.1) {
    if (!this.context) return;

    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    
    const noise = this.context.createBufferSource();
    const gain = this.context.createGain();
    
    noise.buffer = buffer;
    noise.connect(gain);
    gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
    
    noise.start();
  }
}

// Экспортируем синглтон
export const SoundEffects = new SoundEffectsClass();
