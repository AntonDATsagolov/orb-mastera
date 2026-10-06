// level_knockout.js — Level 2: Bricks Breaker (Zuma-style shooter game)
// Шарик запускается в направлении, спускаются ряды блоков, разбивай их!
import { ZumaGame } from '../game/zuma/ZumaGame.js';
import levelSystem from '../core/LevelSystem.js';
import { showGameResult } from '../ui/GameResultScreen.js';
import { SoundEffects } from '../game/SoundEffects.js';
import onboardingManager from '../core/OnboardingManager.js';

let W, H;
let zumaGame = null;

function LevelKnockout(engine, opts = {}) {
  const canvas = engine.canvas;
  W = canvas.clientWidth;
  H = canvas.clientHeight;

  // === СИСТЕМА УРОВНЕЙ ===
  const levelId = localStorage.getItem('orb-masters-current-level');
  const levelConfig = levelId ? levelSystem.getLevel('bricks', levelId) : null;
  const isLevelMode = !!levelConfig;

  // Если играем уровень, используем его настройки
  let levelTimeLimit = levelConfig?.timeLimit || null;
  let levelGoal = levelConfig?.goal || null;
  let levelDifficulty = levelConfig?.difficulty || null;
  let levelTimer = levelTimeLimit ? levelTimeLimit * 1000 : 0;
  let blocksDestroyed = 0;
  let shotsUsed = 0;
  let gameStartTime = Date.now();

  // создаём игру Zuma с настройками сложности
  zumaGame = new ZumaGame(canvas, engine, {
    difficulty: levelDifficulty
  });

  // Перехватываем события игры для системы уровней
  const originalCheckGameState = zumaGame.checkGameState?.bind(zumaGame);

  // === Функции системы уровней ===
  function getGoalProgress() {
    if (!levelGoal) return 0;

    switch (levelGoal.type) {
      case 'SCORE':
        return zumaGame.totalScore || 0;
      case 'COLLECT':
        return blocksDestroyed;
      case 'SURVIVE':
        return Math.floor((Date.now() - gameStartTime) / 1000);
      default:
        return zumaGame.totalScore || 0;
    }
  }

  function checkLevelGoal() {
    if (!levelGoal) return false;
    const progress = getGoalProgress();
    return progress >= levelGoal.target;
  }

  function calculateStars() {
    if (!levelConfig || !levelConfig.stars) return 1;

    const progress = getGoalProgress();
    const { one, two, three } = levelConfig.stars;

    if (progress >= three) return 3;
    if (progress >= two) return 2;
    if (progress >= one) return 1;
    return 0;
  }

  function doLevelComplete() {
    const stars = calculateStars();
    const duration = Math.floor((Date.now() - gameStartTime) / 1000);

    // Сохраняем прогресс уровня
    levelSystem.completeLevel('bricks', levelId, stars);

    // Записываем игру в онбординг
    onboardingManager.recordGamePlayed('bricks');

    SoundEffects.playBonus();

    // Показываем экран результатов с информацией об уровне
    showGameResult({
      mode: 'bricks',
      score: zumaGame.totalScore || 0,
      combo: blocksDestroyed,
      stage: levelConfig.stage,
      duration: duration,
      isPerfect: shotsUsed <= 10,
      isWin: true,
      isLevelMode: true,
      levelId: levelId,
      stars: stars,
      levelReward: levelConfig.rewards?.orbs || 10,
      engine: engine,
      onRetry: () => {
        restartLevel();
      },
      onHome: () => {
        engine.goTo('menu');
      },
      onNextLevel: () => {
        const nextLevel = levelSystem.getNextLevel('bricks');
        if (nextLevel) {
          localStorage.setItem('orb-masters-current-level', nextLevel.id);
          restartLevel();
        } else {
          engine.goTo('menu');
        }
      }
    });
  }

  function doGameOver() {
    const currentStage = parseInt(localStorage.getItem('orb-masters-current-stage')) || 1;

    onboardingManager.recordGamePlayed('bricks');

    showGameResult({
      mode: 'bricks',
      score: zumaGame.totalScore || 0,
      combo: blocksDestroyed,
      stage: currentStage,
      duration: Math.floor((Date.now() - gameStartTime) / 1000),
      isPerfect: false,
      isWin: false,
      isLevelMode: isLevelMode,
      levelId: levelId,
      engine: engine,
      onRetry: () => {
        restartLevel();
      },
      onHome: () => {
        engine.goTo('menu');
      }
    });
  }

  function restartLevel() {
    blocksDestroyed = 0;
    shotsUsed = 0;
    gameStartTime = Date.now();
    levelTimer = levelTimeLimit ? levelTimeLimit * 1000 : 0;
    zumaGame.init();
  }

  // Интегрируем с ZumaGame
  if (zumaGame) {
    // Перехватываем завершение игры
    zumaGame.onBlockDestroyed = () => {
      blocksDestroyed++;
      if (isLevelMode && checkLevelGoal()) {
        doLevelComplete();
      }
    };

    zumaGame.onShot = () => {
      shotsUsed++;
    };

    zumaGame.onGameOver = () => {
      doGameOver();
    };

    zumaGame.onLevelComplete = () => {
      if (isLevelMode) {
        doLevelComplete();
      } else {
        doGameOver(); // В бесконечном режиме просто показываем результат
      }
    };
  }

  return {
    onResize(w, h) {
      W = w;
      H = h;
      if (zumaGame) zumaGame.onResize(w, h);
    },

    init() {
      gameStartTime = Date.now();
      return zumaGame.init();
    },

    update(dt) {
      if (zumaGame) {
        zumaGame.update(dt);

        // Обновляем таймер уровня
        if (isLevelMode && levelTimeLimit && zumaGame.gameState === 'playing') {
          levelTimer -= dt;
          if (levelTimer <= 0) {
            levelTimer = 0;
            if (checkLevelGoal()) {
              doLevelComplete();
            } else {
              doGameOver();
            }
          }
        }
      }
    },

    render(ctx) {
      if (zumaGame) zumaGame.render(ctx);

      // Рисуем информацию об уровне
      if (isLevelMode && levelGoal) {
        ctx.save();
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#4CAF50';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const progress = getGoalProgress();
        const goalText = `🎯 ${progress} / ${levelGoal.target}`;
        ctx.fillText(goalText, 10, 60);

        if (levelTimeLimit) {
          const timeLeft = Math.ceil(levelTimer / 1000);
          ctx.fillStyle = timeLeft <= 10 ? '#F44336' : '#FFF';
          ctx.fillText(`⏱️ ${timeLeft}s`, 10, 80);
        }

        ctx.restore();
      }
    },

    onExit() {
      if (zumaGame) zumaGame.onExit();
    }
  };
}

export default LevelKnockout;
