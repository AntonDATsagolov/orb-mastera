// Level 4: Match-3 (Три в ряд / Кристаллики)
// Механика: обмен соседних кристаллов, собирание 3+ в ряд

import { Match3Game } from '../game/match3/Match3Game.js';
import { AudioManager } from '../game/AudioManager.js';
import { SoundEffects } from '../game/SoundEffects.js';
import { showSettingsModal } from '../game/SettingsModal.js';
import { showGameResult } from '../ui/GameResultScreen.js';
import i18n, { t } from '../i18n/LanguageManager.js';
import levelSystem, { GOAL_TYPES } from '../core/LevelSystem.js';
import onboardingManager from '../core/OnboardingManager.js';
import difficultyManager from '../core/DifficultyManager.js';

function LevelMatch3(engine, opts = {}) {
  const canvas = engine.canvas;
  let W = canvas.clientWidth;
  let H = canvas.clientHeight;

  let game = null;
  let pauseOverlay = null;
  let gameOverOverlay = null;
  let infoOverlay = null;

  // === СИСТЕМА УРОВНЕЙ ===
  const levelId = localStorage.getItem('orb-masters-current-level');
  const levelConfig = levelId ? levelSystem.getLevel('match3', levelId) : null;
  const isLevelMode = !!levelConfig;

  // Если играем уровень, используем его настройки
  let levelTimeLimit = levelConfig?.timeLimit || null;
  let levelGoal = levelConfig?.goal || null;
  let levelDifficulty = levelConfig?.difficulty || null;
  let levelTimer = levelTimeLimit ? levelTimeLimit * 1000 : 0;

  // Настройки сложности для Match3
  const adaptiveDifficulty = difficultyManager.getModifier('knockoutZuma');
  const levelMoves = Math.max(26, Math.min(40, Math.round(32 / (levelDifficulty?.speed || 1) / adaptiveDifficulty)));
  const stageColorCount = 4 + Math.floor(((levelConfig?.stage || 1) - 1) / 2);
  const levelColors = Math.max(4, Math.min(6, stageColorCount - (adaptiveDifficulty < 0.9 ? 1 : 0)));

  // === Функции системы уровней ===
  function getGoalProgress() {
    if (!levelGoal || !game) return 0;

    switch (levelGoal.type) {
      case GOAL_TYPES.SCORE:
        return game.score || 0;
      case GOAL_TYPES.COLLECT:
        return game.totalCleared || 0;
      case GOAL_TYPES.COMBO:
        return game.maxCombo || 0;
      case GOAL_TYPES.SURVIVE:
        return Math.floor((levelTimeLimit * 1000 - levelTimer) / 1000);
      default:
        return 0;
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

  function handleGameOver() {
    const playTime = Math.floor((Date.now() - gameStartTime) / 1000);
    const best = parseInt(localStorage.getItem('mbg-match3-best') || '0', 10);

    // Сохраняем рекорд
    if (game.score > best) {
      localStorage.setItem('mbg-match3-best', String(game.score));
    }

    // Записываем игру в онбординг
    onboardingManager.recordGamePlayed('match3');

    const isWin = isLevelMode ? checkLevelGoal() : false;

    if (isLevelMode && isWin) {
      // Завершение уровня с победой
      const stars = calculateStars();
      levelSystem.completeLevel('match3', levelId, stars);
      SoundEffects.playBonus();

      showGameResult({
        mode: 'zuma',
        score: game.score,
        combo: game.maxCombo || 0,
        stage: levelConfig.stage,
        duration: playTime,
        isPerfect: (game.maxCombo || 0) >= 5,
        isWin: true,
        isLevelMode: true,
        levelId: levelId,
        stars: stars,
        levelReward: levelConfig.rewards?.orbs || 10,
        engine: engine,
        onRetry: () => { restartGame(); },
        onHome: () => { engine.goTo('menu'); },
        onNextLevel: () => {
          const nextLevel = levelSystem.getNextLevel('match3');
          if (nextLevel) {
            localStorage.setItem('orb-masters-current-level', nextLevel.id);
            engine.goTo('level_match3');
          } else {
            engine.goTo('menu');
          }
        }
      });
    } else if (isLevelMode) {
      // Поражение в режиме уровня
      SoundEffects.playGameOver();
      const currentStage = parseInt(localStorage.getItem('orb-masters-current-stage')) || 1;

      showGameResult({
        mode: 'zuma',
        score: game.score,
        combo: game.maxCombo || 0,
        stage: currentStage,
        duration: playTime,
        isPerfect: false,
        isWin: false,
        isLevelMode: true,
        levelId: levelId,
        engine: engine,
        onRetry: () => { restartGame(); },
        onHome: () => { engine.goTo('menu'); }
      });
    } else {
      // Бесконечный режим
      SoundEffects.playGameOver();
      const currentStage = parseInt(localStorage.getItem('orb-masters-current-stage')) || 1;

      showGameResult({
        mode: 'zuma',
        score: game.score,
        combo: game.maxCombo || 0,
        stage: currentStage,
        duration: playTime,
        isPerfect: (game.maxCombo || 0) >= 5,
        isWin: game.score > 0,
        engine: engine,
        onRetry: () => { restartGame(); },
        onHome: () => { engine.goTo('menu'); }
      });
    }

    // Сохранение прогресса
    localStorage.setItem('mbg-lastLevel', '4');
    localStorage.setItem('mbg-lastScore', String(game.score));
  }

  // Слушатель смены языка - пересоздаём меню паузы
  function onLanguageChanged() {
    const wasVisible = pauseOverlay && pauseOverlay.style.display === 'flex';
    if (pauseOverlay) {
      pauseOverlay.remove();
      pauseOverlay = null;
    }
    createPauseOverlay();
    if (wasVisible) {
      pauseOverlay.style.display = 'flex';
    }
  }
  window.addEventListener('languageChanged', onLanguageChanged);

  // Функция создания pause overlay
  function createPauseOverlay() {
    pauseOverlay = document.createElement('div');
    pauseOverlay.id = 'match3-pause-overlay';
    pauseOverlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 200;';

    const pauseTitle = document.createElement('div');
    pauseTitle.textContent = `⏸ ${t('pause.title')}`;
    pauseTitle.style.cssText = 'color: white; font-size: 32px; margin-bottom: 30px; text-align: center;';
    pauseOverlay.appendChild(pauseTitle);

    const pauseBtnContainer = document.createElement('div');
    pauseBtnContainer.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    const resumeBtn = document.createElement('button');
    resumeBtn.textContent = `▶ ${t('pause.resume')}`;
    resumeBtn.style.cssText = 'padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); min-width: 200px;';
    resumeBtn.onclick = resumeGame;

    const infoBtn = document.createElement('button');
    infoBtn.textContent = `ℹ️ ${t('pause.info')}`;
    infoBtn.style.cssText = 'padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #9C27B0, #7B1FA2); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); min-width: 200px;';
    infoBtn.onclick = showInfo;

    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = `⚙️ ${t('settings.title')}`;
    settingsBtn.style.cssText = 'padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); min-width: 200px;';
    settingsBtn.onclick = () => { SoundEffects.playClick(); showSettingsModal(); };

    const restartBtn = document.createElement('button');
    restartBtn.textContent = `🔄 ${t('pause.restart')}`;
    restartBtn.style.cssText = 'padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #FF9800, #F57C00); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); min-width: 200px;';
    restartBtn.onclick = restartGame;

    const exitBtn = document.createElement('button');
    exitBtn.textContent = `🏠 ${t('pause.menu')}`;
    exitBtn.style.cssText = 'padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); min-width: 200px;';
    exitBtn.onclick = () => { SoundEffects.playClick(); engine.goTo('menu'); };

    pauseBtnContainer.appendChild(resumeBtn);
    pauseBtnContainer.appendChild(infoBtn);
    pauseBtnContainer.appendChild(settingsBtn);
    pauseBtnContainer.appendChild(restartBtn);
    pauseBtnContainer.appendChild(exitBtn);
    pauseOverlay.appendChild(pauseBtnContainer);
    document.body.appendChild(pauseOverlay);
  }

  // Состояние паузы
  let isPaused = false;
  let gameStartTime = Date.now();
  let gameOverShown = false;

  // Свайп
  let swipeStart = null;

  // Кнопка паузы справа вверху (стандартная позиция для всех уровней)
  const pauseBtnRect = { x: W - 56, y: 8, width: 48, height: 48 };

  function isPauseButtonClicked(x, y) {
    return x >= pauseBtnRect.x && x <= pauseBtnRect.x + pauseBtnRect.width &&
           y >= pauseBtnRect.y && y <= pauseBtnRect.y + pauseBtnRect.height;
  }

  function getEventCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function pauseGame() {
    if (isPaused || game.state === 'gameover') return;
    isPaused = true;
    AudioManager.pause();
    SoundEffects.playClick();
    if (pauseOverlay) pauseOverlay.style.display = 'flex';
  }

  function resumeGame() {
    isPaused = false;
    AudioManager.resume();
    SoundEffects.playClick();
    if (pauseOverlay) pauseOverlay.style.display = 'none';
  }

  function showInfo() {
    SoundEffects.playClick();
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    if (infoOverlay) infoOverlay.style.display = 'flex';
  }

  function hideInfo() {
    SoundEffects.playClick();
    if (infoOverlay) infoOverlay.style.display = 'none';
    if (pauseOverlay) pauseOverlay.style.display = 'flex';
  }

  function restartGame() {
    SoundEffects.playClick();
    game.reset();
    isPaused = false;
    gameStartTime = Date.now();
    gameOverShown = false;
    swipeStart = null; // Сбрасываем состояние свайпа
    levelTimer = levelTimeLimit ? levelTimeLimit * 1000 : 0;
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    if (gameOverOverlay) gameOverOverlay.style.display = 'none';
  }

  // Обработчики ввода
  function onPointerDown(e) {
    e.preventDefault();
    const coords = getEventCoords(e);

    // Проверка клика по кнопке паузы
    if (!isPaused && game.state !== 'gameover' && isPauseButtonClicked(coords.x, coords.y)) {
      pauseGame();
      return;
    }

    if (isPaused) return;

    swipeStart = coords;
    // Начинаем перетаскивание кристалла
    game.handleDragStart(coords.x, coords.y);
  }

  function onPointerMove(e) {
    e.preventDefault();
    const coords = getEventCoords(e);

    if (isPaused) return;

    if (swipeStart) {
      // Обновляем позицию перетаскиваемого кристалла
      game.handleDragMove(coords.x, coords.y);
    } else {
      // Hover-эффект когда просто двигаем мышь (без нажатия)
      game.handleHover(coords.x, coords.y);
    }
  }

  function onPointerUp(e) {
    e.preventDefault();
    if (isPaused || !swipeStart) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const endX = clientX - rect.left;
    const endY = clientY - rect.top;

    const dx = endX - swipeStart.x;
    const dy = endY - swipeStart.y;

    // Завершаем перетаскивание - это вызовет swap если нужно
    const dragHandled = game.handleDragEnd(endX, endY);

    // Если drag не обработал (не было перетаскивания) - проверяем на клик
    if (!dragHandled && Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      game.handleClick(swipeStart.x, swipeStart.y);
    }

    swipeStart = null;
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (isPaused) resumeGame();
      else pauseGame();
    }
  }

  function drawPauseButton(ctx) {
    // Фон кнопки
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(pauseBtnRect.x, pauseBtnRect.y, pauseBtnRect.width, pauseBtnRect.height, 10);
    ctx.fill();

    // Иконка паузы
    ctx.fillStyle = '#FFF';
    const barW = 8;
    const barH = 24;
    const gap = 6;
    const startX = pauseBtnRect.x + (pauseBtnRect.width - barW * 2 - gap) / 2;
    const startY = pauseBtnRect.y + (pauseBtnRect.height - barH) / 2;
    ctx.fillRect(startX, startY, barW, barH);
    ctx.fillRect(startX + barW + gap, startY, barW, barH);
  }

  return {
    async init() {
      // Запускаем музыку
      AudioManager.playTrack('level4');

      // Инициализация игры с настройками сложности
      game = new Match3Game(W, H, {
        moves: isLevelMode ? levelMoves : 30,
        gemTypes: isLevelMode ? levelColors : 6,
      });

      // Создание pause overlay
      createPauseOverlay();

      // Info overlay
      infoOverlay = document.createElement('div');
      infoOverlay.id = 'match3-info-overlay';
      infoOverlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: flex-start; align-items: center; z-index: 210; overflow-y: auto; padding: 20px; box-sizing: border-box;';

      const infoTitle = document.createElement('div');
      infoTitle.textContent = '📖 Как играть';
      infoTitle.style.cssText = 'color: white; font-size: 28px; margin-bottom: 20px; text-align: center;';
      infoOverlay.appendChild(infoTitle);

      const infoContent = document.createElement('div');
      infoContent.style.cssText = 'color: white; font-size: 14px; max-width: 350px; line-height: 1.6;';
      infoContent.innerHTML = `
        <div style="margin-bottom: 20px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px;">
          <div style="font-weight: bold; margin-bottom: 8px; color: #4FC3F7;">🎯 Цель игры</div>
          <div>Собирай 3+ одинаковых кристалла в ряд, меняя их местами. Набери максимум очков за 30 ходов!</div>
        </div>

        <div style="font-weight: bold; margin-bottom: 12px; color: #FFF;">Спецэлементы:</div>

        <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 8px; background: rgba(100,180,255,0.2); border-radius: 6px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #5AF, #38F); border-radius: 8px; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 18px; color: #FFF;">↔</div>
          <div><b style="color: #5AF;">Линейный бустер</b><br>4 в ряд → уничтожает всю линию (ряд или столбец)</div>
        </div>

        <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 8px; background: rgba(255,100,100,0.2); border-radius: 6px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #F55, #C33); border-radius: 8px; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 18px;">💥</div>
          <div><b style="color: #F55;">Радиальная бомба</b><br>L или T форма → уничтожает область 3×3</div>
        </div>

        <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 8px; background: rgba(255,215,0,0.2); border-radius: 6px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #FFF, #FFD700); border-radius: 50%; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 18px;">✦</div>
          <div><b style="color: #FFD700;">Цветная бомба</b><br>5+ в ряд → уничтожает все кристаллы одного типа</div>
        </div>

        <div style="font-weight: bold; margin: 15px 0 12px 0; color: #FF5;">⚡ Комбинации спецэлементов:</div>
        <div style="font-size: 12px; margin-bottom: 8px; color: #AAA;">Меняй местами два спецэлемента для супер-эффектов!</div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 15px;">
          <div style="padding: 6px; background: rgba(100,100,255,0.2); border-radius: 4px; text-align: center; font-size: 11px;">
            <div>↔ + ↔</div>
            <div style="color: #5AF;">✚ Крест</div>
          </div>
          <div style="padding: 6px; background: rgba(255,100,100,0.2); border-radius: 4px; text-align: center; font-size: 11px;">
            <div>💥 + 💥</div>
            <div style="color: #F55;">5×5 взрыв</div>
          </div>
          <div style="padding: 6px; background: rgba(200,100,255,0.2); border-radius: 4px; text-align: center; font-size: 11px;">
            <div>↔ + 💥</div>
            <div style="color: #A5F;">3 ряда+столбца</div>
          </div>
          <div style="padding: 6px; background: rgba(255,215,100,0.2); border-radius: 4px; text-align: center; font-size: 11px;">
            <div>✦ + ↔</div>
            <div style="color: #FD0;">Лазерный шторм</div>
          </div>
          <div style="padding: 6px; background: rgba(255,180,100,0.2); border-radius: 4px; text-align: center; font-size: 11px;">
            <div>✦ + 💥</div>
            <div style="color: #FA0;">Бомбовый дождь</div>
          </div>
          <div style="padding: 6px; background: rgba(255,255,100,0.2); border-radius: 4px; text-align: center; font-size: 11px;">
            <div>✦ + ✦</div>
            <div style="color: #FF0;">МЕГА ВЗРЫВ!</div>
          </div>
        </div>

        <div style="font-weight: bold; margin: 15px 0 12px 0; color: #FFF;">Формы кристаллов:</div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 15px;">
          <div style="text-align: center; padding: 8px; background: rgba(255,68,68,0.3); border-radius: 6px;">
            <div style="font-size: 20px;">●</div>
            <div style="font-size: 11px; color: #F44;">Красный</div>
          </div>
          <div style="text-align: center; padding: 8px; background: rgba(68,136,255,0.3); border-radius: 6px;">
            <div style="font-size: 20px;">◆</div>
            <div style="font-size: 11px; color: #48F;">Синий</div>
          </div>
          <div style="text-align: center; padding: 8px; background: rgba(68,221,68,0.3); border-radius: 6px;">
            <div style="font-size: 20px;">▲</div>
            <div style="font-size: 11px; color: #4D4;">Зелёный</div>
          </div>
          <div style="text-align: center; padding: 8px; background: rgba(255,221,68,0.3); border-radius: 6px;">
            <div style="font-size: 20px;">★</div>
            <div style="font-size: 11px; color: #FD4;">Жёлтый</div>
          </div>
          <div style="text-align: center; padding: 8px; background: rgba(170,68,255,0.3); border-radius: 6px;">
            <div style="font-size: 20px;">⬡</div>
            <div style="font-size: 11px; color: #A4F;">Фиолет.</div>
          </div>
          <div style="text-align: center; padding: 8px; background: rgba(255,136,68,0.3); border-radius: 6px;">
            <div style="font-size: 20px;">■</div>
            <div style="font-size: 11px; color: #F84;">Оранж.</div>
          </div>
        </div>

        <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px; text-align: center;">
          <div style="color: #FF5;">💡 Совет</div>
          <div style="font-size: 13px;">Старайся создавать комбо — каскадные совпадения дают больше очков!</div>
        </div>
      `;
      infoOverlay.appendChild(infoContent);

      const backBtn = document.createElement('button');
      backBtn.textContent = '← Назад';
      backBtn.style.cssText = 'padding: 12px 40px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #666, #444); color: white; border: none; border-radius: 8px; margin-top: 20px; margin-bottom: 20px;';
      backBtn.onclick = hideInfo;
      infoOverlay.appendChild(backBtn);
      document.body.appendChild(infoOverlay);

      // Game Over overlay
      gameOverOverlay = document.createElement('div');
      gameOverOverlay.id = 'match3-gameover-overlay';
      gameOverOverlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 200;';

      const gameOverTitle = document.createElement('div');
      gameOverTitle.textContent = '🏆 ИГРА ОКОНЧЕНА';
      gameOverTitle.style.cssText = 'color: #FFD700; font-size: 36px; margin-bottom: 20px; text-align: center;';
      gameOverOverlay.appendChild(gameOverTitle);

      const scoreDisplay = document.createElement('div');
      scoreDisplay.id = 'match3-final-score';
      scoreDisplay.style.cssText = 'color: white; font-size: 28px; margin-bottom: 30px;';
      gameOverOverlay.appendChild(scoreDisplay);

      const gameOverBtns = document.createElement('div');
      gameOverBtns.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

      const retryBtn = document.createElement('button');
      retryBtn.textContent = '🔄 Ещё раз';
      retryBtn.style.cssText = 'padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; border-radius: 8px; min-width: 200px;';
      retryBtn.onclick = restartGame;

      const menuBtn = document.createElement('button');
      menuBtn.textContent = '🏠 В меню';
      menuBtn.style.cssText = 'padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border: none; border-radius: 8px; min-width: 200px;';
      menuBtn.onclick = () => { SoundEffects.playClick(); engine.goTo('menu'); };

      gameOverBtns.appendChild(retryBtn);
      gameOverBtns.appendChild(menuBtn);
      gameOverOverlay.appendChild(gameOverBtns);
      document.body.appendChild(gameOverOverlay);

      // Обработчики событий
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('touchstart', onPointerDown, { passive: false });
      canvas.addEventListener('touchmove', onPointerMove, { passive: false });
      canvas.addEventListener('touchend', onPointerUp, { passive: false });
      window.addEventListener('keydown', onKeyDown);
    },

    onResize(w, h) {
      W = w;
      H = h;
      if (game) game.setCanvasSize(w, h);
    },

    update(dt) {
      if (isPaused) return;

      game.update();

      // Обновляем таймер уровня
      if (isLevelMode && levelTimeLimit && game.state !== 'gameover') {
        levelTimer -= dt;
        if (levelTimer <= 0) {
          levelTimer = 0;
          game.state = 'gameover';
        }
      }

      // Проверка цели уровня
      if (isLevelMode && game.state !== 'gameover' && checkLevelGoal()) {
        game.state = 'gameover';
      }

      // Показ game over через новую систему
      if (game.state === 'gameover' && !gameOverShown) {
        gameOverShown = true;
        handleGameOver();
      }
    },

    render(ctx) {
      // Фон
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(1, '#16213e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Игра
      game.draw(ctx);

      if (isLevelMode && game.state !== 'gameover') {
        ctx.save();
        ctx.fillStyle = '#d6def6';
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`🎯 ${getGoalProgress()} / ${levelGoal.target}`, 12, 76);
        ctx.textAlign = 'right';
        ctx.fillText(`⏱ ${Math.ceil(levelTimer / 1000)}s`, W - 68, 76);
        ctx.restore();
      }

      // Кнопка паузы
      if (game.state !== 'gameover') {
        drawPauseButton(ctx);
      }
    },

    onExit() {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('touchstart', onPointerDown);
      canvas.removeEventListener('touchmove', onPointerMove);
      canvas.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('languageChanged', onLanguageChanged);

      if (pauseOverlay) pauseOverlay.remove();
      if (gameOverOverlay) gameOverOverlay.remove();
      if (infoOverlay) infoOverlay.remove();
    }
  };
}

export default LevelMatch3;
