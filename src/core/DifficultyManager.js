// DifficultyManager.js - Глобальная система адаптивной сложности
// Отслеживает результаты игр и адаптирует сложность для каждого режима

const STORAGE_KEY = 'orb-masters-difficulty';

class DifficultyManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('DifficultyManager: Failed to load', e);
    }
    
    return {
      // Для каждого режима храним историю последних 5 игр
      cashCatcher: { history: [], modifier: 1.0 },
      bricksBreaker: { history: [], modifier: 1.0 },
      blockPuzzle: { history: [], modifier: 1.0 },
      knockoutZuma: { history: [], modifier: 1.0 }
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('DifficultyManager: Failed to save', e);
    }
  }

  /**
   * Записать результат игры
   * @param {string} mode - Режим игры
   * @param {number} score - Набранные очки
   * @param {number} playTimeSeconds - Время игры в секундах
   * @param {boolean} isQuickLoss - Быстрый проигрыш (< 30 сек или низкий счёт)
   */
  recordGameResult(mode, score, playTimeSeconds, isQuickLoss = null) {
    const modeData = this.data[mode];
    if (!modeData) return;
    
    // Автоопределение быстрого проигрыша
    if (isQuickLoss === null) {
      isQuickLoss = this.detectQuickLoss(mode, score, playTimeSeconds);
    }
    
    // Добавляем в историю
    modeData.history.push({
      score,
      time: playTimeSeconds,
      quickLoss: isQuickLoss,
      timestamp: Date.now()
    });
    
    // Храним только последние 5 игр
    if (modeData.history.length > 5) {
      modeData.history.shift();
    }
    
    // Пересчитываем модификатор сложности
    this.recalculateModifier(mode);
    this.save();
  }

  /**
   * Определить быстрый проигрыш
   */
  detectQuickLoss(mode, score, playTimeSeconds) {
    // Пороги для каждого режима
    const thresholds = {
      cashCatcher: { minTime: 30, minScore: 50 },
      bricksBreaker: { minTime: 45, minScore: 100 },
      blockPuzzle: { minTime: 60, minScore: 200 },
      knockoutZuma: { minTime: 40, minScore: 80 }
    };
    
    const t = thresholds[mode] || { minTime: 30, minScore: 50 };
    return playTimeSeconds < t.minTime || score < t.minScore;
  }

  /**
   * Пересчитать модификатор сложности на основе истории
   */
  recalculateModifier(mode) {
    const modeData = this.data[mode];
    if (!modeData || modeData.history.length === 0) {
      modeData.modifier = 1.0;
      return;
    }
    
    const recentGames = modeData.history.slice(-5);
    const quickLosses = recentGames.filter(g => g.quickLoss).length;
    const totalGames = recentGames.length;
    
    // Соотношение быстрых проигрышей
    const lossRatio = quickLosses / totalGames;
    
    // Модификатор:
    // 0% проигрышей = 1.1 (чуть сложнее)
    // 20% = 1.0 (нормально)
    // 40% = 0.9 (легче)
    // 60%+ = 0.75 (намного легче)
    // 80%+ = 0.6 (очень легко)
    
    if (lossRatio >= 0.8) {
      modeData.modifier = 0.6;
    } else if (lossRatio >= 0.6) {
      modeData.modifier = 0.75;
    } else if (lossRatio >= 0.4) {
      modeData.modifier = 0.9;
    } else if (lossRatio >= 0.2) {
      modeData.modifier = 1.0;
    } else {
      modeData.modifier = 1.1;
    }
  }

  /**
   * Получить модификатор сложности для режима
   * @returns {number} - Множитель (< 1 = легче, > 1 = сложнее)
   */
  getModifier(mode) {
    return this.data[mode]?.modifier || 1.0;
  }

  /**
   * Получить статистику режима
   */
  getStats(mode) {
    const modeData = this.data[mode];
    if (!modeData) return null;
    
    const history = modeData.history;
    if (history.length === 0) {
      return {
        gamesPlayed: 0,
        avgScore: 0,
        avgTime: 0,
        quickLossRate: 0,
        modifier: 1.0
      };
    }
    
    const avgScore = history.reduce((sum, g) => sum + g.score, 0) / history.length;
    const avgTime = history.reduce((sum, g) => sum + g.time, 0) / history.length;
    const quickLossRate = history.filter(g => g.quickLoss).length / history.length;
    
    return {
      gamesPlayed: history.length,
      avgScore: Math.round(avgScore),
      avgTime: Math.round(avgTime),
      quickLossRate: Math.round(quickLossRate * 100),
      modifier: modeData.modifier
    };
  }

  /**
   * Сбросить данные для режима
   */
  reset(mode) {
    if (this.data[mode]) {
      this.data[mode] = { history: [], modifier: 1.0 };
      this.save();
    }
  }

  /**
   * Сбросить все данные
   */
  resetAll() {
    this.data = {
      cashCatcher: { history: [], modifier: 1.0 },
      bricksBreaker: { history: [], modifier: 1.0 },
      blockPuzzle: { history: [], modifier: 1.0 },
      knockoutZuma: { history: [], modifier: 1.0 }
    };
    this.save();
  }
}

// Singleton
const difficultyManager = new DifficultyManager();
export default difficultyManager;
