/**
 * LevelSystem.js
 * Система уровней с подуровнями, целями и звёздами
 */

import { COLORS } from './GameConfig.js';

// Типы целей для уровней
export const GOAL_TYPES = {
  SCORE: 'score',           // Набрать N очков
  COLLECT: 'collect',       // Собрать N предметов
  SURVIVE: 'survive',       // Продержаться N секунд
  COMBO: 'combo',           // Достичь комбо N
  NO_DAMAGE: 'noDamage',    // Не получить урона
  COLLECT_SPECIAL: 'collectSpecial', // Собрать N особых предметов
  PERFECT: 'perfect',       // Идеальное прохождение
};

// Конфигурация стадий (сколько подуровней в каждой)
export const STAGE_CONFIG = {
  1: { name: 'Rookie', sublevels: 5, color: '#6B7280', orbsMult: 1.0 },
  2: { name: 'Skilled', sublevels: 7, color: '#3B82F6', orbsMult: 1.5 },
  3: { name: 'Expert', sublevels: 10, color: '#8B5CF6', orbsMult: 2.5 },
  4: { name: 'Master', sublevels: 12, color: '#F59E0B', orbsMult: 4.0 },
  5: { name: 'Legend', sublevels: 15, color: '#EF4444', orbsMult: 6.0 },
};

// Генерация уровней для режима Cash Catcher
function generateCatchLevels() {
  const levels = {};

  // Stage 1: обучение механикам без завышенной страховки.
  levels['1-1'] = {
    stage: 1, sublevel: 1,
    goal: { type: GOAL_TYPES.SCORE, target: 450 },
    timeLimit: 35,
    difficulty: { speed: 0.8, bombChance: 0.04, spawnRate: 0.9 },
    stars: { one: 450, two: 575, three: 700 },
    rewards: { orbs: 5 },
  };
  levels['1-2'] = {
    stage: 1, sublevel: 2,
    goal: { type: GOAL_TYPES.COLLECT, target: 22, item: 'coin' },
    timeLimit: 40,
    difficulty: { speed: 0.85, bombChance: 0.05, spawnRate: 0.95 },
    stars: { one: 22, two: 27, three: 32 },
    rewards: { orbs: 6 },
  };
  levels['1-3'] = {
    stage: 1, sublevel: 3,
    goal: { type: GOAL_TYPES.SCORE, target: 650 },
    timeLimit: 42,
    difficulty: { speed: 0.9, bombChance: 0.06, spawnRate: 1.0 },
    stars: { one: 650, two: 800, three: 950 },
    rewards: { orbs: 7 },
  };
  levels['1-4'] = {
    stage: 1, sublevel: 4,
    goal: { type: GOAL_TYPES.COMBO, target: 10 },
    timeLimit: 45,
    difficulty: { speed: 0.9, bombChance: 0.07, spawnRate: 1.0 },
    stars: { one: 10, two: 13, three: 16 },
    rewards: { orbs: 8 },
  };
  levels['1-5'] = {
    stage: 1, sublevel: 5,
    goal: { type: GOAL_TYPES.SURVIVE, target: 60 },
    timeLimit: 60,
    difficulty: { speed: 0.95, bombChance: 0.08, spawnRate: 1.0 },
    stars: { one: 60, two: 800, three: 1200 }, // время + очки для 2-3 звёзд
    rewards: { orbs: 15, unlocks: 'stage2' },
    isBoss: true,
  };

  // Stage 2: Skilled (7 уровней) — Введение бомб
  levels['2-1'] = {
    stage: 2, sublevel: 1,
    goal: { type: GOAL_TYPES.SCORE, target: 600 },
    timeLimit: 35,
    difficulty: { speed: 0.8, bombChance: 0.05, spawnRate: 0.9 },
    stars: { one: 600, two: 800, three: 1000 },
    rewards: { orbs: 10 },
  };
  levels['2-2'] = {
    stage: 2, sublevel: 2,
    goal: { type: GOAL_TYPES.NO_DAMAGE, target: 30 },
    timeLimit: 30,
    difficulty: { speed: 0.8, bombChance: 0.08, spawnRate: 0.9 },
    stars: { one: 30, two: 400, three: 600 },
    rewards: { orbs: 12 },
  };
  levels['2-3'] = {
    stage: 2, sublevel: 3,
    goal: { type: GOAL_TYPES.COLLECT, target: 25, item: 'coin' },
    timeLimit: 40,
    difficulty: { speed: 0.85, bombChance: 0.08, spawnRate: 0.95 },
    stars: { one: 25, two: 30, three: 38 },
    rewards: { orbs: 12 },
  };
  levels['2-4'] = {
    stage: 2, sublevel: 4,
    goal: { type: GOAL_TYPES.COLLECT_SPECIAL, target: 3, item: 'gold' },
    timeLimit: 50,
    difficulty: { speed: 0.85, bombChance: 0.08, spawnRate: 1.0 },
    stars: { one: 3, two: 4, three: 5 },
    rewards: { orbs: 15 },
  };
  levels['2-5'] = {
    stage: 2, sublevel: 5,
    goal: { type: GOAL_TYPES.SCORE, target: 1000 },
    timeLimit: 45,
    difficulty: { speed: 0.9, bombChance: 0.1, spawnRate: 1.0 },
    stars: { one: 1000, two: 1300, three: 1600 },
    rewards: { orbs: 15 },
  };
  levels['2-6'] = {
    stage: 2, sublevel: 6,
    goal: { type: GOAL_TYPES.COMBO, target: 15 },
    timeLimit: 50,
    difficulty: { speed: 0.9, bombChance: 0.1, spawnRate: 1.0 },
    stars: { one: 15, two: 20, three: 25 },
    rewards: { orbs: 18 },
  };
  levels['2-7'] = {
    stage: 2, sublevel: 7,
    goal: { type: GOAL_TYPES.SURVIVE, target: 75 },
    timeLimit: 75,
    difficulty: { speed: 0.95, bombChance: 0.12, spawnRate: 1.1 },
    stars: { one: 75, two: 1200, three: 1800 },
    rewards: { orbs: 25, unlocks: 'stage3' },
    isBoss: true,
  };

  // Stage 3: Expert (10 уровней)
  for (let i = 1; i <= 10; i++) {
    const isBoss = i === 10;
    levels[`3-${i}`] = {
      stage: 3, sublevel: i,
      goal: getGoalForLevel(3, i),
      timeLimit: 40 + i * 5,
      difficulty: {
        speed: 1.0 + i * 0.05,
        bombChance: 0.1 + i * 0.01,
        spawnRate: 1.0 + i * 0.05
      },
      stars: getStarsForLevel(3, i),
      rewards: { orbs: 15 + i * 3, unlocks: isBoss ? 'stage4' : null },
      isBoss,
    };
  }

  // Stage 4: Master (12 уровней)
  for (let i = 1; i <= 12; i++) {
    const isBoss = i === 12;
    levels[`4-${i}`] = {
      stage: 4, sublevel: i,
      goal: getGoalForLevel(4, i),
      timeLimit: 45 + i * 4,
      difficulty: {
        speed: 1.3 + i * 0.05,
        bombChance: 0.12 + i * 0.01,
        spawnRate: 1.2 + i * 0.05
      },
      stars: getStarsForLevel(4, i),
      rewards: { orbs: 25 + i * 4, unlocks: isBoss ? 'stage5' : null },
      isBoss,
    };
  }

  // Stage 5: Legend (15 уровней)
  for (let i = 1; i <= 15; i++) {
    const isBoss = i === 15;
    levels[`5-${i}`] = {
      stage: 5, sublevel: i,
      goal: getGoalForLevel(5, i),
      timeLimit: 50 + i * 3,
      difficulty: {
        speed: 1.6 + i * 0.05,
        bombChance: 0.15 + i * 0.01,
        spawnRate: 1.4 + i * 0.05
      },
      stars: getStarsForLevel(5, i),
      rewards: { orbs: 40 + i * 5, unlocks: isBoss ? 'endless' : null },
      isBoss,
    };
  }

  return levels;
}

// Генерация целей для уровней
function getGoalForLevel(stage, sublevel) {
  const goals = [
    { type: GOAL_TYPES.SCORE, target: 500 * stage + sublevel * 100 },
    { type: GOAL_TYPES.COLLECT, target: 15 + stage * 5 + sublevel * 2, item: 'coin' },
    { type: GOAL_TYPES.COMBO, target: 8 + stage * 3 + sublevel },
    { type: GOAL_TYPES.SURVIVE, target: 45 + stage * 10 + sublevel * 3 },
    { type: GOAL_TYPES.NO_DAMAGE, target: 25 + stage * 5 },
    { type: GOAL_TYPES.COLLECT_SPECIAL, target: 2 + Math.floor(sublevel / 3), item: 'gold' },
  ];

  // Чередуем цели
  return goals[(sublevel - 1) % goals.length];
}

// Генерация звёзд для уровней
function getStarsForLevel(stage, sublevel) {
  const base = 500 * stage + sublevel * 100;
  return {
    one: base,
    two: Math.floor(base * 1.3),
    three: Math.floor(base * 1.7),
  };
}

// Универсальный генератор уровней для любого режима
function generateLevelsForMode(modeType) {
  const levels = {};
  const stageSublevels = [5, 7, 10, 12, 15]; // Количество подуровней для каждой стадии

  stageSublevels.forEach((sublevelCount, stageIndex) => {
    const stage = stageIndex + 1;

    for (let i = 1; i <= sublevelCount; i++) {
      const isBoss = i === sublevelCount;
      const levelId = `${stage}-${i}`;

      // Базовые значения для целей
      const baseScore = modeType === 'puzzle'
        ? 400 * stage + i * 80
        : modeType === 'match3'
          ? 400 * stage + i * 80
          : 300 * stage + i * 80;
      const baseCollect = modeType === 'puzzle'
        ? 4 + Math.floor((i - 1) / 2) + stage
        : modeType === 'bricks'
          ? 5 + stage * 2 + i
          : 12 + stage * 6 + i * 2;
      const baseCombo = modeType === 'match3'
        ? 2 + Math.floor(i / 4) + (stage - 1)
        : modeType === 'puzzle'
          ? 2 + Math.floor(i / 4) + (stage - 1)
          : 5 + stage * 2 + Math.floor(i / 2);
      const baseSurvive = 30 + stage * 10 + i * 3;

      // Чередуем типы целей
      const goalTypes = [
        { type: GOAL_TYPES.SCORE, target: baseScore },
        { type: GOAL_TYPES.COLLECT, target: baseCollect },
        { type: GOAL_TYPES.COMBO, target: baseCombo },
        { type: GOAL_TYPES.SURVIVE, target: baseSurvive },
        { type: GOAL_TYPES.SCORE, target: Math.floor(baseScore * 1.2) },
      ];

      const goal = goalTypes[(i - 1) % goalTypes.length];

      // Время зависит от типа цели
      let timeLimit = goal.type === GOAL_TYPES.SURVIVE
        ? goal.target
        : modeType === 'puzzle'
          ? 75 + stage * 10 + i * 5
          : modeType === 'match3'
            ? 52 + stage * 8 + i * 3
            : 45 + stage * 10 + i * 5;

      levels[levelId] = {
        stage,
        sublevel: i,
        goal,
        timeLimit,
        difficulty: {
          speed: 0.75 + stage * 0.2 + i * 0.03,
          intensity: 0.6 + stage * 0.15 + i * 0.02,
        },
        stars: goal.type === GOAL_TYPES.SURVIVE
          ? {
              one: Math.ceil(goal.target * 0.7),
              two: Math.ceil(goal.target * 0.85),
              three: goal.target,
            }
          : {
              one: goal.target,
              two: Math.floor(goal.target * 1.25),
              three: Math.floor(goal.target * 1.6),
            },
        rewards: {
          orbs: 5 + stage * 5 + i * 2,
          unlocks: isBoss && stage < 5 ? `stage${stage + 1}` : null,
        },
        isBoss,
      };
    }
  });

  return levels;
}

// Генерация уровней для всех режимов
const GAME_LEVELS = {
  catch: generateCatchLevels(),
  bricks: generateLevelsForMode('bricks'),
  puzzle: generateLevelsForMode('puzzle'),
  match3: generateLevelsForMode('match3'),
};

/**
 * Класс управления системой уровней
 */
class LevelSystemManager {
  constructor() {
    this.progress = this.loadProgress();
  }

  loadProgress() {
    const defaults = {
      catch: { unlockedStage: 1, completed: {}, stars: {} },
      bricks: { unlockedStage: 1, completed: {}, stars: {} },
      puzzle: { unlockedStage: 1, completed: {}, stars: {} },
      match3: { unlockedStage: 1, completed: {}, stars: {} },
    };
    try {
      const saved = localStorage.getItem('orb-masters-level-progress');
      if (!saved) return defaults;
      const parsed = JSON.parse(saved);
      const progress = {};
      for (const mode of Object.keys(defaults)) {
        const entry = parsed?.[mode] || {};
        const unlockedStage = Number(entry.unlockedStage);
        progress[mode] = {
          unlockedStage: Number.isInteger(unlockedStage) ? Math.min(5, Math.max(1, unlockedStage)) : 1,
          completed: entry.completed && typeof entry.completed === 'object' ? entry.completed : {},
          stars: entry.stars && typeof entry.stars === 'object' ? entry.stars : {},
        };
      }
      return progress;
    } catch (error) {
      console.warn('Invalid level progress; starting with a clean level map.', error);
      localStorage.setItem('orb-masters-level-progress', JSON.stringify(defaults));
      return defaults;
    }
  }

  saveProgress() {
    localStorage.setItem('orb-masters-level-progress', JSON.stringify(this.progress));
  }

  // Получить конфигурацию уровня
  getLevel(mode, levelId) {
    return GAME_LEVELS[mode]?.[levelId] || null;
  }

  // Получить все уровни для режима
  getAllLevels(mode) {
    return GAME_LEVELS[mode] || {};
  }

  // Получить уровни для стадии
  getLevelsForStage(mode, stage) {
    const levels = GAME_LEVELS[mode] || {};
    return Object.entries(levels)
      .filter(([id, level]) => level.stage === stage)
      .map(([id, level]) => ({ id, ...level }));
  }

  // Проверить разблокирован ли уровень
  isLevelUnlocked(mode, levelId) {
    const level = this.getLevel(mode, levelId);
    if (!level) return false;

    const progress = this.progress[mode];

    // Первый уровень первой стадии всегда открыт
    if (level.stage === 1 && level.sublevel === 1) return true;

    // Проверяем разблокирована ли стадия
    if (level.stage > progress.unlockedStage) return false;

    // Проверяем пройден ли предыдущий уровень
    const prevId = level.sublevel > 1
      ? `${level.stage}-${level.sublevel - 1}`
      : this.getLastLevelOfStage(mode, level.stage - 1);

    return progress.completed[prevId] === true;
  }

  // Получить последний уровень стадии
  getLastLevelOfStage(mode, stage) {
    const config = STAGE_CONFIG[stage];
    return config ? `${stage}-${config.sublevels}` : null;
  }

  // Отметить уровень как пройденный
  completeLevel(mode, levelId, starsEarned, score) {
    const progress = this.progress[mode];
    const level = this.getLevel(mode, levelId);
    if (!progress || !level) return { newStars: false, unlockedNextStage: false };

    progress.completed[levelId] = true;

    // Обновляем звёзды только если больше
    const currentStars = progress.stars[levelId] || 0;
    const earnedStars = Math.max(0, Math.min(3, Number(starsEarned) || 0));
    if (earnedStars > currentStars) {
      progress.stars[levelId] = earnedStars;
    }

    // Разблокируем следующую стадию если это босс
    if (level?.isBoss && level.rewards?.unlocks?.startsWith('stage')) {
      const nextStage = parseInt(level.rewards.unlocks.replace('stage', ''));
      if (nextStage > progress.unlockedStage) {
        progress.unlockedStage = nextStage;
      }
    }

    this.saveProgress();

    return {
      newStars: earnedStars > currentStars,
      unlockedNextStage: level?.isBoss,
    };
  }

  // Получить статистику прогресса
  getProgressStats(mode) {
    const progress = this.progress[mode];
    const levels = GAME_LEVELS[mode] || {};
    const totalLevels = Object.keys(levels).length;
    const completedLevels = Object.keys(progress.completed).length;
    const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);
    const maxStars = totalLevels * 3;

    return {
      totalLevels,
      completedLevels,
      totalStars,
      maxStars,
      unlockedStage: progress.unlockedStage,
      percentComplete: Math.round((completedLevels / totalLevels) * 100),
    };
  }

  // Получить следующий непройденный уровень
  getNextLevel(mode) {
    const levels = this.getAllLevels(mode);
    const progress = this.progress[mode];

    for (const [id, level] of Object.entries(levels)) {
      if (!progress.completed[id] && this.isLevelUnlocked(mode, id)) {
        return { id, ...level };
      }
    }

    return null; // Все пройдены
  }

  // Рассчитать звёзды по результату
  calculateStars(mode, levelId, result) {
    const level = this.getLevel(mode, levelId);
    if (!level) return 0;

    const { goal, stars } = level;
    let value;

    switch (goal.type) {
      case GOAL_TYPES.SCORE:
        value = result.score;
        break;
      case GOAL_TYPES.COLLECT:
      case GOAL_TYPES.COLLECT_SPECIAL:
        value = result.collected;
        break;
      case GOAL_TYPES.COMBO:
        value = result.maxCombo;
        break;
      case GOAL_TYPES.SURVIVE:
      case GOAL_TYPES.NO_DAMAGE:
        value = result.time;
        break;
      default:
        value = result.score;
    }

    if (value >= stars.three) return 3;
    if (value >= stars.two) return 2;
    if (value >= stars.one) return 1;
    return 0;
  }

  // Проверить выполнена ли цель
  isGoalCompleted(mode, levelId, result) {
    const level = this.getLevel(mode, levelId);
    if (!level) return false;

    const { goal } = level;

    switch (goal.type) {
      case GOAL_TYPES.SCORE:
        return result.score >= goal.target;
      case GOAL_TYPES.COLLECT:
        return result.coinsCollected >= goal.target;
      case GOAL_TYPES.COLLECT_SPECIAL:
        return result.specialCollected >= goal.target;
      case GOAL_TYPES.COMBO:
        return result.maxCombo >= goal.target;
      case GOAL_TYPES.SURVIVE:
        return result.time >= goal.target;
      case GOAL_TYPES.NO_DAMAGE:
        return result.time >= goal.target && result.damagesTaken === 0;
      default:
        return false;
    }
  }

  // Сбросить прогресс (для тестирования)
  resetProgress(mode = null) {
    if (mode) {
      // The public mode id is `zuma`, but its level definitions use `match3`.
      if (mode === 'zuma') mode = 'match3';
      this.progress[mode] = { unlockedStage: 1, completed: {}, stars: {} };
    } else {
      this.progress = {
        catch: { unlockedStage: 1, completed: {}, stars: {} },
        bricks: { unlockedStage: 1, completed: {}, stars: {} },
        puzzle: { unlockedStage: 1, completed: {}, stars: {} },
        match3: { unlockedStage: 1, completed: {}, stars: {} },
      };
    }
    this.saveProgress();
  }
}

// Синглтон
const levelSystem = new LevelSystemManager();

export { GAME_LEVELS, LevelSystemManager };
export default levelSystem;
