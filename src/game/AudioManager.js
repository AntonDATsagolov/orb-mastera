// AudioManager.js - Управление музыкой и звуками
import { ArcadeMusic } from './ArcadeMusic.js';

/**
 * Синглтон для управления аудио в игре
 */
class AudioManagerClass {
  constructor() {
    this.music = null;
    this.currentTrack = null;
    this.volume = 0.3;
    this.isMuted = false;
    this.isPlaying = false;
    this.fadeInterval = null;
    this.arcadeMusic = new ArcadeMusic({ volume: this.volume, muted: this.isMuted });

    // Поддерживаемые форматы (порядок приоритета)
    this.supportedFormats = ['mp3', 'ogg', 'webm', 'mp4', 'm4a', 'wav'];

    // The original Web Audio score is the default. Optional licensed recordings
    // can be mapped here later without probing for missing files on every scene.
    this.tracks = {};

    // Кэш найденных файлов
    this.resolvedTracks = {};

    // Загрузка настроек из localStorage
    this.loadSettings();
    this.arcadeMusic.setVolume(this.volume);
    this.arcadeMusic.setMuted(this.isMuted);
  }

  /**
   * Загрузка настроек громкости
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('audioSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.volume = settings.volume ?? 0.3;
        this.isMuted = settings.isMuted ?? false;
      }
    } catch (e) {
      console.warn('Failed to load audio settings');
    }
  }

  /**
   * Сохранение настроек
   */
  saveSettings() {
    try {
      localStorage.setItem('audioSettings', JSON.stringify({
        volume: this.volume,
        isMuted: this.isMuted
      }));
    } catch (e) {
      console.warn('Failed to save audio settings');
    }
  }

  /**
   * Воспроизвести трек для сцены
   */
  async playTrack(sceneName) {
    const trackBase = this.tracks[sceneName];
    if (!trackBase) {
      if (this.music) {
        this.music.pause();
        this.music = null;
      }
      this.arcadeMusic.start(sceneName);
      this.currentTrack = sceneName;
      this.isPlaying = true;
      return;
    }

    this.arcadeMusic.stop();

    // Если такой же трек уже играет - не перезапускаем
    if (this.currentTrack === trackBase && this.isPlaying) {
      return;
    }

    // Находим доступный файл
    const trackPath = await this.resolveTrackPath(trackBase);
    if (!trackPath) {
      console.warn('No audio file found for:', trackBase);
      return;
    }

    // Останавливаем текущий трек с fade out
    if (this.music && this.isPlaying) {
      this.fadeOut(() => {
        this.startNewTrack(trackPath, trackBase);
      });
    } else {
      this.startNewTrack(trackPath, trackBase);
    }
  }

  /**
   * Поиск доступного аудиофайла среди поддерживаемых форматов
   */
  async resolveTrackPath(trackBase) {
    // Проверяем кэш
    if (this.resolvedTracks[trackBase]) {
      return this.resolvedTracks[trackBase];
    }

    // Пробуем каждый формат
    for (const format of this.supportedFormats) {
      const path = `${trackBase}.${format}`;
      try {
        const response = await fetch(path, { method: 'HEAD' });
        if (response.ok) {
          this.resolvedTracks[trackBase] = path;
          console.log('Found audio file:', path);
          return path;
        }
      } catch (e) {
        // Файл не найден, пробуем следующий формат
      }
    }

    return null;
  }

  /**
   * Запуск нового трека
   */
  startNewTrack(trackPath, trackBase) {
    if (!trackPath) return;

    this.currentTrack = trackBase || trackPath;

    // Создаём новый аудио элемент
    this.music = new Audio(trackPath);
    this.music.loop = true;
    this.music.volume = 0;

    // Обработка ошибок загрузки
    this.music.onerror = () => {
      console.warn('Audio file not found:', trackPath);
      this.isPlaying = false;
    };

    // Запуск с fade in
    const playPromise = this.music.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.isPlaying = true;
        if (!this.isMuted) {
          this.fadeIn();
        }
      }).catch(err => {
        // Autoplay заблокирован браузером - ждём взаимодействия
        console.log('Autoplay blocked, waiting for user interaction');
        this.setupAutoplayUnlock();
      });
    }
  }

  /**
   * Разблокировка autoplay после клика
   */
  setupAutoplayUnlock() {
    const unlock = () => {
      if (this.music && !this.isPlaying) {
        this.music.play().then(() => {
          this.isPlaying = true;
          if (!this.isMuted) {
            this.fadeIn();
          }
        }).catch(() => {});
      }
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };

    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
  }

  /**
   * Плавное увеличение громкости
   */
  fadeIn(duration = 1000) {
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    const targetVolume = this.isMuted ? 0 : this.volume;
    const step = targetVolume / (duration / 50);

    this.fadeInterval = setInterval(() => {
      if (this.music) {
        this.music.volume = Math.min(this.music.volume + step, targetVolume);
        if (this.music.volume >= targetVolume) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
      }
    }, 50);
  }

  /**
   * Плавное уменьшение громкости
   */
  fadeOut(callback, duration = 500) {
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    const step = (this.music?.volume || this.volume) / (duration / 50);

    this.fadeInterval = setInterval(() => {
      if (this.music) {
        this.music.volume = Math.max(this.music.volume - step, 0);
        if (this.music.volume <= 0) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          this.music.pause();
          this.music = null;
          this.isPlaying = false;
          if (callback) callback();
        }
      }
    }, 50);
  }

  /**
   * Остановить музыку
   */
  stop() {
    this.arcadeMusic.stop();
    if (this.music) this.fadeOut();
    this.currentTrack = null;
    this.isPlaying = false;
  }

  /**
   * Пауза
   */
  pause() {
    this.arcadeMusic.pause();
    if (this.music && this.isPlaying) {
      this.music.pause();
    }
  }

  /**
   * Продолжить
   */
  resume() {
    this.arcadeMusic.resume();
    if (this.music && !this.isMuted) {
      this.music.play().catch(() => {});
    }
  }

  /**
   * Переключить mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.arcadeMusic.setMuted(this.isMuted);
    if (this.music) {
      this.music.volume = this.isMuted ? 0 : this.volume;
    }
    this.saveSettings();
    return this.isMuted;
  }

  /**
   * Установить громкость (0-1)
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    this.arcadeMusic.setVolume(this.volume);
    if (this.music && !this.isMuted) {
      this.music.volume = this.volume;
    }
    this.saveSettings();
  }

  /**
   * Получить текущую громкость
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Проверка mute
   */
  getMuted() {
    return this.isMuted;
  }
}

// Экспортируем синглтон
export const AudioManager = new AudioManagerClass();
