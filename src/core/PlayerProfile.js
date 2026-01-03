/**
 * PlayerProfile.js
 * Управление профилем игрока, уровнем, XP, валютой Orbs
 */

const STORAGE_KEY = 'orb-masters-profile';

// Таблица XP для каждого уровня
const XP_TABLE = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  800,    // Level 5
  1200,   // Level 6
  1700,   // Level 7
  2300,   // Level 8
  3000,   // Level 9
  3800,   // Level 10
  4700,   // Level 11
  5700,   // Level 12
  6800,   // Level 13
  8000,   // Level 14
  9300,   // Level 15
  10700,  // Level 16
  12200,  // Level 17
  13800,  // Level 18
  15500,  // Level 19
  17300,  // Level 20
  19200,  // Level 21
  21200,  // Level 22
  23300,  // Level 23
  25500,  // Level 24
  27800,  // Level 25
  30200,  // Level 26
  32700,  // Level 27
  35300,  // Level 28
  38000,  // Level 29
  40800,  // Level 30
  43700,  // Level 31
  46700,  // Level 32
  49800,  // Level 33
  53000,  // Level 34
  56300,  // Level 35
  59700,  // Level 36
  63200,  // Level 37
  66800,  // Level 38
  70500,  // Level 39
  74300,  // Level 40
  78200,  // Level 41
  82200,  // Level 42
  86300,  // Level 43
  90500,  // Level 44
  94800,  // Level 45
  99200,  // Level 46
  103700, // Level 47
  108300, // Level 48
  113000, // Level 49
  117800, // Level 50
];

// Разблокировки по уровням
const UNLOCKS = {
  1: ['mode_catch', 'mode_bricks_stage1'],
  3: ['mode_puzzle'],
  5: ['mode_bricks_stage2'],
  7: ['daily_challenges'],
  10: ['mode_zuma', 'challenge_arena'],
  15: ['custom_skins'],
  20: ['leaderboards'],
  25: ['weekly_challenges'],
  30: ['season_pass'],
  40: ['prestige_mode'],
  50: ['master_league'],
};

// Награды Orbs за Level Up
const LEVEL_UP_REWARDS = {
  default: 20,
  5: 50,
  10: 100,
  15: 75,
  20: 150,
  25: 100,
  30: 200,
  40: 250,
  50: 500,
};

class PlayerProfile {
  constructor() {
    this.data = this.load();
  }

  // Создать пустой профиль
  createDefault() {
    return {
      // Базовая информация
      id: this.generateId(),
      name: 'Player',
      createdAt: new Date().toISOString(),
      
      // Прогрессия
      level: 1,
      xp: 0,
      totalXp: 0,
      
      // Валюта
      orbs: 100, // Стартовый бонус
      totalOrbsEarned: 100,
      
      // Mastery по режимам
      mastery: {
        catch: { level: 1, points: 0 },
        bricks: { level: 1, points: 0 },
        puzzle: { level: 1, points: 0 },
        zuma: { level: 1, points: 0 },
      },
      
      // Разблокировки
      unlocks: ['mode_catch', 'mode_bricks_stage1'],
      
      // Статистика
      stats: {
        totalGames: 0,
        totalScore: 0,
        bestCombo: 0,
        playTime: 0, // секунды
        gamesPerMode: {
          catch: 0,
          bricks: 0,
          puzzle: 0,
          zuma: 0,
        },
        bestScorePerMode: {
          catch: 0,
          bricks: 0,
          puzzle: 0,
          zuma: 0,
        },
      },
      
      // Daily
      daily: {
        lastLogin: null,
        streak: 0,
        todayGames: 0,
        lastGameDate: null,
      },
      
      // Настройки
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        vibration: true,
        language: 'ru',
      },
      
      // Версия данных (для миграций)
      version: 1,
    };
  }

  generateId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Загрузить профиль
  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Проверяем дейлик
        this.checkDailyLogin(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
    return this.createDefault();
  }

  // Сохранить профиль
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  }

  // Проверить ежедневный вход
  checkDailyLogin(data) {
    const today = new Date().toDateString();
    const lastLogin = data.daily.lastLogin;
    
    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastLogin === yesterday.toDateString()) {
        // Продолжаем streak
        data.daily.streak++;
      } else if (lastLogin !== null) {
        // Streak сброшен
        data.daily.streak = 1;
      } else {
        data.daily.streak = 1;
      }
      
      data.daily.lastLogin = today;
      data.daily.todayGames = 0;
    }
  }

  // === GETTERS ===
  
  get level() { return this.data.level; }
  get xp() { return this.data.xp; }
  get orbs() { return this.data.orbs; }
  get name() { return this.data.name; }
  get streak() { return this.data.daily.streak; }
  get stats() { return this.data.stats; }
  get mastery() { return this.data.mastery; }
  get unlocks() { return this.data.unlocks; }

  // XP до следующего уровня
  get xpToNextLevel() {
    if (this.data.level >= XP_TABLE.length) {
      return Infinity; // Максимальный уровень
    }
    return XP_TABLE[this.data.level] - this.data.xp;
  }

  // XP нужно для текущего уровня (прогресс-бар)
  get xpProgress() {
    const currentLevelXp = XP_TABLE[this.data.level - 1] || 0;
    const nextLevelXp = XP_TABLE[this.data.level] || XP_TABLE[XP_TABLE.length - 1];
    const xpInLevel = this.data.xp - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;
    return {
      current: xpInLevel,
      needed: xpNeeded,
      percent: Math.min(100, (xpInLevel / xpNeeded) * 100),
    };
  }

  // === ACTIONS ===

  // Добавить XP
  addXp(amount) {
    if (amount <= 0) return { leveledUp: false, newLevel: this.data.level };
    
    this.data.xp += amount;
    this.data.totalXp += amount;
    
    let leveledUp = false;
    let orbsEarned = 0;
    const startLevel = this.data.level;
    
    // Проверяем Level Up
    while (this.data.level < XP_TABLE.length && this.data.xp >= XP_TABLE[this.data.level]) {
      this.data.level++;
      leveledUp = true;
      
      // Награда за Level Up
      const reward = LEVEL_UP_REWARDS[this.data.level] || LEVEL_UP_REWARDS.default;
      orbsEarned += reward;
      this.data.orbs += reward;
      this.data.totalOrbsEarned += reward;
      
      // Разблокировки
      if (UNLOCKS[this.data.level]) {
        this.data.unlocks.push(...UNLOCKS[this.data.level]);
      }
    }
    
    this.save();
    
    return {
      leveledUp,
      oldLevel: startLevel,
      newLevel: this.data.level,
      orbsEarned,
      newUnlocks: leveledUp ? (UNLOCKS[this.data.level] || []) : [],
    };
  }

  // Добавить Orbs
  addOrbs(amount) {
    if (amount <= 0) return;
    this.data.orbs += amount;
    this.data.totalOrbsEarned += amount;
    this.save();
  }

  // Потратить Orbs
  spendOrbs(amount) {
    if (amount <= 0 || this.data.orbs < amount) return false;
    this.data.orbs -= amount;
    this.save();
    return true;
  }

  // Проверить можно ли потратить
  canAfford(amount) {
    return this.data.orbs >= amount;
  }

  // Добавить Mastery Points для режима
  addMasteryPoints(mode, points) {
    if (!this.data.mastery[mode]) return null;
    
    this.data.mastery[mode].points += points;
    
    // Проверяем Level Up Mastery (каждые 100 очков)
    const masteryLevelThreshold = this.data.mastery[mode].level * 100;
    let leveledUp = false;
    
    while (this.data.mastery[mode].points >= masteryLevelThreshold + (this.data.mastery[mode].level - 1) * 50) {
      this.data.mastery[mode].level++;
      leveledUp = true;
    }
    
    this.save();
    return { leveledUp, newLevel: this.data.mastery[mode].level };
  }

  // Записать результат игры
  recordGame(mode, score, combo = 0, duration = 0) {
    this.data.stats.totalGames++;
    this.data.stats.totalScore += score;
    this.data.stats.playTime += duration;
    
    if (combo > this.data.stats.bestCombo) {
      this.data.stats.bestCombo = combo;
    }
    
    if (this.data.stats.gamesPerMode[mode] !== undefined) {
      this.data.stats.gamesPerMode[mode]++;
    }
    
    if (this.data.stats.bestScorePerMode[mode] !== undefined) {
      if (score > this.data.stats.bestScorePerMode[mode]) {
        this.data.stats.bestScorePerMode[mode] = score;
      }
    }
    
    this.data.daily.todayGames++;
    this.data.daily.lastGameDate = new Date().toISOString();
    
    this.save();
  }

  // Проверить разблокировку
  hasUnlock(unlockId) {
    return this.data.unlocks.includes(unlockId);
  }

  // Получить уровень Mastery для режима
  getMasteryLevel(mode) {
    return this.data.mastery[mode]?.level || 1;
  }

  // Получить бонусы Mastery для режима
  getMasteryBonuses(mode) {
    const level = this.getMasteryLevel(mode);
    const bonuses = {};
    
    // Разные бонусы для разных режимов
    switch (mode) {
      case 'catch':
        if (level >= 5) bonuses.extraLives = 1;
        if (level >= 10) bonuses.rareItemChance = 0.1;
        if (level >= 15) bonuses.powerupDuration = 1;
        if (level >= 20) bonuses.startShield = true;
        if (level >= 25) bonuses.comboBonus = 0.5;
        if (level >= 30) bonuses.extraLives = 2;
        if (level >= 50) bonuses.doubleOrbs = true;
        break;
        
      case 'bricks':
        if (level >= 5) bonuses.extraBalls = 1;
        if (level >= 10) bonuses.damageBonus = 0.05;
        if (level >= 15) bonuses.showWeakBlocks = true;
        if (level >= 20) bonuses.extraBalls = 2;
        if (level >= 25) bonuses.comboPersist = true;
        if (level >= 30) bonuses.extraBalls = 3;
        if (level >= 50) bonuses.fireBalls = true;
        break;
        
      case 'puzzle':
        if (level >= 5) bonuses.previewNext = true;
        if (level >= 10) bonuses.specialChance = 0.05;
        if (level >= 15) bonuses.undoCount = 1;
        if (level >= 20) bonuses.specialChance = 0.1;
        if (level >= 25) bonuses.undoCount = 2;
        if (level >= 30) bonuses.showOptimal = true;
        if (level >= 50) bonuses.rarePieces = true;
        break;
        
      case 'zuma':
        if (level >= 10) bonuses.slowStart = 3;
        if (level >= 20) bonuses.extraBalls = 2;
        if (level >= 30) bonuses.chainBonus = 0.2;
        if (level >= 40) bonuses.aimTime = 1;
        if (level >= 50) bonuses.plasmaBalls = true;
        break;
    }
    
    return bonuses;
  }

  // Сбросить профиль (для тестирования)
  reset() {
    this.data = this.createDefault();
    this.save();
  }
}

// Синглтон
const playerProfile = new PlayerProfile();

export default playerProfile;
export { PlayerProfile, XP_TABLE, UNLOCKS };
