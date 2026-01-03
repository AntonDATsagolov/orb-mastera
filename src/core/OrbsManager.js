/**
 * OrbsManager.js
 * Управление валютой Orbs, расчёт заработка, множители
 */

import playerProfile from './PlayerProfile.js';

// Множители Mode для XP
const MODE_XP_MULTIPLIERS = {
  catch: 0.8,   // Легко набрать очки
  bricks: 1.0,  // Базовый
  puzzle: 1.2,  // Требует времени
  zuma: 1.5,    // Сложно
};

// Множители Mode для Orbs
const MODE_ORBS_MULTIPLIERS = {
  catch: 1.0,
  bricks: 1.0,
  puzzle: 1.0,
  zuma: 1.2,
};

// Множители Stage для Orbs
const STAGE_MULTIPLIERS = {
  1: 1.0,
  2: 1.5,
  3: 2.5,
  4: 4.0,
  5: 6.0,
};

// Комбо бонусы
const COMBO_THRESHOLDS = [
  { min: 0, bonus: 1.0 },
  { min: 5, bonus: 1.1 },
  { min: 10, bonus: 1.2 },
  { min: 15, bonus: 1.3 },
  { min: 20, bonus: 1.5 },
  { min: 30, bonus: 1.8 },
  { min: 50, bonus: 2.0 },
];

class OrbsManager {
  constructor() {
    this.pendingOrbs = 0;
    this.pendingXp = 0;
    this.lastGameResults = null;
  }

  /**
   * Рассчитать награды за игру
   * @param {Object} params - Параметры игры
   * @param {string} params.mode - Режим игры (catch, bricks, puzzle, zuma)
   * @param {number} params.score - Набранные очки
   * @param {number} params.combo - Максимальное комбо
   * @param {number} params.stage - Стадия сложности (1-5)
   * @param {number} params.duration - Длительность игры в секундах
   * @param {boolean} params.isPerfect - Идеальное прохождение
   * @param {boolean} params.isFirstWinToday - Первая победа за день
   * @returns {Object} Результаты расчёта
   */
  calculateRewards(params) {
    const {
      mode = 'catch',
      score = 0,
      combo = 0,
      stage = 1,
      duration = 0,
      isPerfect = false,
      isFirstWinToday = false,
    } = params;

    // Базовые расчёты
    const baseOrbs = Math.floor(score / 200);
    const baseXp = Math.floor(score / 100);

    // Множители
    const modeOrbsMult = MODE_ORBS_MULTIPLIERS[mode] || 1.0;
    const modeXpMult = MODE_XP_MULTIPLIERS[mode] || 1.0;
    const stageMult = STAGE_MULTIPLIERS[stage] || 1.0;
    
    // Комбо бонус
    let comboMult = 1.0;
    for (const threshold of COMBO_THRESHOLDS) {
      if (combo >= threshold.min) {
        comboMult = threshold.bonus;
      }
    }

    // Специальные бонусы
    const perfectMult = isPerfect ? 2.0 : 1.0;
    const firstWinMult = isFirstWinToday ? 1.5 : 1.0;

    // Mastery бонусы
    const masteryBonuses = playerProfile.getMasteryBonuses(mode);
    const masteryOrbsMult = masteryBonuses.doubleOrbs ? 2.0 : 1.0;

    // Итоговые расчёты
    const totalOrbsMult = modeOrbsMult * stageMult * comboMult * perfectMult * firstWinMult * masteryOrbsMult;
    const totalXpMult = modeXpMult * stageMult * comboMult;

    const finalOrbs = Math.floor(baseOrbs * totalOrbsMult);
    const finalXp = Math.floor(baseXp * totalXpMult);

    // Mastery Points (всегда начисляются)
    const masteryPoints = Math.floor(score / 500) + (isPerfect ? 10 : 0) + Math.floor(combo / 5);

    this.lastGameResults = {
      mode,
      score,
      combo,
      stage,
      duration,
      
      // Orbs
      baseOrbs,
      orbsMultiplier: totalOrbsMult,
      finalOrbs,
      
      // XP
      baseXp,
      xpMultiplier: totalXpMult,
      finalXp,
      
      // Mastery
      masteryPoints,
      
      // Бонусы (для отображения)
      bonuses: {
        mode: modeOrbsMult,
        stage: stageMult,
        combo: comboMult,
        perfect: perfectMult,
        firstWin: firstWinMult,
        mastery: masteryOrbsMult,
      },
      
      isPerfect,
      isFirstWinToday,
    };

    this.pendingOrbs = finalOrbs;
    this.pendingXp = finalXp;

    return this.lastGameResults;
  }

  /**
   * Применить награды (вызывать после экрана результатов)
   * @param {boolean} doubleOrbs - Удвоить Orbs (за рекламу)
   * @returns {Object} Результат применения
   */
  applyRewards(doubleOrbs = false) {
    if (!this.lastGameResults) {
      return { success: false, error: 'No pending rewards' };
    }

    const orbs = doubleOrbs ? this.pendingOrbs * 2 : this.pendingOrbs;
    const xp = this.pendingXp;
    const masteryPoints = this.lastGameResults.masteryPoints;
    const mode = this.lastGameResults.mode;

    // Добавляем Orbs
    playerProfile.addOrbs(orbs);

    // Добавляем XP и проверяем Level Up
    const levelResult = playerProfile.addXp(xp);

    // Добавляем Mastery Points
    const masteryResult = playerProfile.addMasteryPoints(mode, masteryPoints);

    // Записываем игру в статистику
    playerProfile.recordGame(
      mode,
      this.lastGameResults.score,
      this.lastGameResults.combo,
      this.lastGameResults.duration
    );

    const result = {
      success: true,
      orbs,
      xp,
      masteryPoints,
      doubled: doubleOrbs,
      levelUp: levelResult,
      masteryUp: masteryResult,
      newPlayerLevel: playerProfile.level,
      newMasteryLevel: playerProfile.getMasteryLevel(mode),
      totalOrbs: playerProfile.orbs,
    };

    // Очищаем pending
    this.pendingOrbs = 0;
    this.pendingXp = 0;
    this.lastGameResults = null;

    return result;
  }

  /**
   * Получить текущий баланс Orbs
   */
  getBalance() {
    return playerProfile.orbs;
  }

  /**
   * Потратить Orbs
   */
  spend(amount, reason = '') {
    if (playerProfile.spendOrbs(amount)) {
      console.log(`Spent ${amount} Orbs: ${reason}`);
      return true;
    }
    return false;
  }

  /**
   * Проверить возможность покупки
   */
  canAfford(amount) {
    return playerProfile.canAfford(amount);
  }

  /**
   * Добавить Orbs напрямую (для бонусов, рекламы и т.д.)
   */
  addBonus(amount, reason = '') {
    playerProfile.addOrbs(amount);
    console.log(`Bonus ${amount} Orbs: ${reason}`);
    return playerProfile.orbs;
  }

  /**
   * Рассчитать Daily Login бонус
   */
  getDailyBonus() {
    const streak = playerProfile.streak;
    const baseBonus = 20;
    
    // Бонус растёт со streak
    const streakBonus = Math.min(streak * 5, 50); // Макс +50
    const totalBonus = baseBonus + streakBonus;
    
    // Особые дни
    const specialDays = {
      7: 100,  // Неделя
      14: 150,
      21: 200,
      30: 300, // Месяц
    };
    
    const specialBonus = specialDays[streak] || 0;
    
    return {
      base: baseBonus,
      streak: streakBonus,
      special: specialBonus,
      total: totalBonus + specialBonus,
      currentStreak: streak,
    };
  }

  /**
   * Форматирование числа Orbs для отображения
   */
  formatOrbs(amount) {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M';
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'K';
    }
    return amount.toString();
  }
}

// Синглтон
const orbsManager = new OrbsManager();

export default orbsManager;
export { OrbsManager, MODE_XP_MULTIPLIERS, STAGE_MULTIPLIERS, COMBO_THRESHOLDS };
