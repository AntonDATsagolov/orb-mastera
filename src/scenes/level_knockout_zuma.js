// Level 2: Bricks Breaker Quest style game
// Механика: прицеливание + выстрел потоком шаров, блоки опускаются каждый ход
// Улучшения: комбо-система, множители очков, визуальные эффекты

import { BallManager } from '../game/bricks_breaker/Ball.js';
import { BlockManager } from '../game/bricks_breaker/BlockManager.js';
import { Physics } from '../game/bricks_breaker/Physics.js';
import { Renderer } from '../game/bricks_breaker/Renderer.js';
import { AudioManager } from '../game/AudioManager.js';
import { SoundEffects } from '../game/SoundEffects.js';
import { showSettingsModal } from '../game/SettingsModal.js';
import { showGameResult } from '../ui/GameResultScreen.js';
import i18n, { t } from '../i18n/LanguageManager.js';

/**
 * Класс для всплывающего текста (урон, комбо, очки)
 */
class FloatingText {
  constructor(x, y, text, color = '#FFD700', size = 20) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = 1;
    this.vy = -1.5;
  }

  update() {
    this.life -= 0.025;
    this.y += this.vy;
    this.vy *= 0.98;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.font = `bold ${this.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(this.text, this.x + 1, this.y + 1);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

function LevelKnockout(engine, opts = {}) {
  const canvas = engine.canvas;
  let W = canvas.clientWidth;
  let H = canvas.clientHeight;

  // ===== GAME STATE =====
  let gameState = 'aiming'; // 'aiming', 'shooting', 'paused', 'gameOver'
  let previousState = 'aiming'; // для возврата из паузы
  let ballCount = 10;
  let launchPos = { x: W / 2, y: H - 50 };
  let nextLaunchX = W / 2;
  let firstLandedX = null;
  let landedBallsCount = 0;
  let aimAngle = -Math.PI / 2;
  let isAiming = false;
  const gameOverLine = H - 80;
  const landingLine = H - 50;
  let downBtnPressed = false;
  
  // ===== COMBO & SCORE SYSTEM =====
  let score = 0;
  let best = parseInt(localStorage.getItem('mbg-bricks-best') || '0', 10);
  let hitCombo = 0;           // Попадания за текущий выстрел
  let maxCombo = 0;           // Максимальное комбо за игру
  let blocksDestroyedThisTurn = 0;
  let totalBlocksDestroyed = 0;
  let perfectTurns = 0;       // Ходы где уничтожено 3+ блоков
  const floatingTexts = [];   // Всплывающие тексты
  
  // Кнопка паузы справа вверху (стандартная позиция для всех уровней)
  const pauseBtnRect = { x: W - 56, y: 8, width: 48, height: 48 };

  // ===== MANAGERS =====
  const ballManager = new BallManager();
  const blockManager = new BlockManager(W, H);
  const physics = new Physics(W, H);
  const renderer = new Renderer(W, H);

  let overlay = null;
  let pauseOverlay = null;

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

  // Вынесено создание pause overlay в отдельную функцию
  function createPauseOverlay() {
    pauseOverlay = document.createElement('div');
    pauseOverlay.id = 'pause-overlay';
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
    resumeBtn.onclick = function() { resumeGame(); };

    const infoBtn = document.createElement('button');
    infoBtn.textContent = `ℹ️ ${t('pause.info')}`;
    infoBtn.style.cssText = 'padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #9C27B0, #7B1FA2); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); min-width: 200px;';
    infoBtn.onclick = function() { showInfo(); };

    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = `⚙️ ${t('settings.title')}`;
    settingsBtn.style.cssText = 'padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); min-width: 200px;';
    settingsBtn.onclick = function() { SoundEffects.playClick(); showSettingsModal(); };

    const restartBtn = document.createElement('button');
    restartBtn.textContent = `🔄 ${t('pause.restart')}`;
    restartBtn.style.cssText = 'padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #FF9800, #F57C00); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); min-width: 200px;';
    restartBtn.onclick = function() { location.reload(); };

    const exitBtn = document.createElement('button');
    exitBtn.textContent = `🏠 ${t('pause.menu')}`;
    exitBtn.style.cssText = 'padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); min-width: 200px;';
    exitBtn.onclick = function() { SoundEffects.playClick(); engine.goTo('menu'); };

    pauseBtnContainer.appendChild(resumeBtn);
    pauseBtnContainer.appendChild(infoBtn);
    pauseBtnContainer.appendChild(settingsBtn);
    pauseBtnContainer.appendChild(restartBtn);
    pauseBtnContainer.appendChild(exitBtn);
    pauseOverlay.appendChild(pauseBtnContainer);
    document.body.appendChild(pauseOverlay);
  }

  // ===== HUD OVERLAY =====
  function setupHUD() {
    // Game Over overlay
    overlay = document.createElement('div');
    overlay.id = 'bricks-overlay';
    overlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 200;';

    const msg = document.createElement('div');
    msg.id = 'bricks-msg';
    msg.style.cssText = 'color: white; font-size: 28px; margin-bottom: 20px; text-align: center;';
    overlay.appendChild(msg);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; gap: 10px;';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = t('pause.restart');
    retryBtn.style.cssText = 'padding: 10px 20px; font-size: 16px; cursor: pointer; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
    retryBtn.onclick = function() { location.reload(); };

    const menuBtn = document.createElement('button');
    menuBtn.textContent = t('pause.menu');
    menuBtn.style.cssText = 'padding: 10px 20px; font-size: 16px; cursor: pointer; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
    menuBtn.onclick = function() { engine.goTo('menu'); };

    btnContainer.appendChild(retryBtn);
    btnContainer.appendChild(menuBtn);
    overlay.appendChild(btnContainer);
    document.body.appendChild(overlay);

    // Создаём pause overlay
    createPauseOverlay();

    // Info overlay
    infoOverlay = document.createElement('div');
    infoOverlay.id = 'info-overlay';
    infoOverlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: flex-start; align-items: center; z-index: 210; overflow-y: auto; padding: 20px; box-sizing: border-box;';

    const infoTitle = document.createElement('div');
    infoTitle.textContent = '📖 Как играть';
    infoTitle.style.cssText = 'color: white; font-size: 28px; margin-bottom: 20px; text-align: center;';
    infoOverlay.appendChild(infoTitle);

    const infoContent = document.createElement('div');
    infoContent.style.cssText = 'color: white; font-size: 14px; max-width: 380px; line-height: 1.6;';
    infoContent.innerHTML = `
      <div style="margin-bottom: 20px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #4FC3F7;">🎯 Цель игры</div>
        <div>Уничтожай блоки, не дав им достичь нижней линии. Целься и стреляй потоком шаров!</div>
      </div>

      <div style="font-weight: bold; margin-bottom: 12px; color: #FFF;">🧱 Элементы:</div>

      <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 8px; background: rgba(100,180,255,0.2); border-radius: 6px;">
        <div style="width: 35px; height: 35px; background: linear-gradient(135deg, #5AF, #38F); border-radius: 5px; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 12px; color: #FFF; font-weight: bold;">12</div>
        <div><b style="color: #5AF;">Блок</b> — число = HP. Каждый удар снимает 1 HP.</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 8px; background: rgba(255,100,100,0.2); border-radius: 6px;">
        <div style="width: 35px; height: 35px; background: linear-gradient(135deg, #E55, #922); border-radius: 5px; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 16px;">💣</div>
        <div><b style="color: #F55;">Бомба</b> — уничтожает 8 блоков вокруг (3×3).</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 8px; background: rgba(255,180,50,0.2); border-radius: 6px;">
        <div style="width: 35px; height: 35px; background: linear-gradient(135deg, #F90, #FC0); border-radius: 5px; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 14px;">⭐</div>
        <div><b style="color: #FC0;">Направленная бомба</b><br>H = горизонталь, V = вертикаль, X = крест</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 8px; background: rgba(0,238,238,0.2); border-radius: 6px;">
        <div style="width: 35px; height: 35px; background: radial-gradient(circle, #5FF, #088); border-radius: 50%; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 14px;">⚡</div>
        <div><b style="color: #0EE;">Лазер</b> — каждый шар наносит урон блокам на линии.</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 8px; background: rgba(165,95,255,0.2); border-radius: 6px;">
        <div style="width: 35px; height: 35px; background: radial-gradient(circle, #A5F, #73D); border-radius: 50%; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 16px; color: #FFF;">?</div>
        <div><b style="color: #A5F;">Рандомайзер</b> — отбивает шар в случайном направлении.</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 8px; background: rgba(100,255,100,0.2); border-radius: 6px;">
        <div style="width: 35px; height: 35px; background: radial-gradient(circle, #AFA, #292); border-radius: 50%; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 18px; color: #FFF;">+</div>
        <div><b style="color: #5E5;">Бонус +1</b> — добавляет ещё один шар к выстрелу.</div>
      </div>

      <div style="margin-bottom: 15px; padding: 12px; background: linear-gradient(135deg, rgba(255,87,34,0.2), rgba(255,152,0,0.2)); border-radius: 10px; border: 1px solid rgba(255,152,0,0.4);">
        <div style="font-weight: bold; margin-bottom: 8px; color: #FF5722; font-size: 16px;">🔥 Система комбо</div>
        <div style="margin-bottom: 8px;">Каждое попадание увеличивает комбо!</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 13px;">
          <div>• 10 попаданий → <b style="color: #FFD700;">×1.5</b></div>
          <div>• 20 попаданий → <b style="color: #FFD700;">×2.0</b></div>
          <div>• 30 попаданий → <b style="color: #FFD700;">×2.5</b></div>
          <div>• 50+ попаданий → <b style="color: #FFD700;">×3.0+</b></div>
        </div>
      </div>

      <div style="margin-bottom: 15px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 10px;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #4FC3F7; font-size: 16px;">💰 Система очков</div>
        <div style="font-size: 13px; line-height: 1.6;">
          • Попадание: <b>10 очков × множитель</b><br>
          • Уничтожение блока: <b>50 очков × множитель</b><br>
          • Идеальный ход (3+ блоков): <b>бонус!</b><br>
          • 50+ комбо за ход: <b>супер-бонус!</b>
        </div>
      </div>

      <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px; text-align: center;">
        <div style="color: #FF5;">💡 Советы</div>
        <div style="font-size: 13px;">
          • Целься в углы для максимальных отскоков<br>
          • Собирай бонусы +1 для увеличения армии шаров<br>
          • Используй бомбы и лазеры стратегически!
        </div>
      </div>
    `;
    infoOverlay.appendChild(infoContent);

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Назад';
    backBtn.style.cssText = 'padding: 12px 40px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #666, #444); color: white; border: none; border-radius: 8px; margin-top: 20px; margin-bottom: 20px;';
    backBtn.onclick = function() { hideInfo(); };
    infoOverlay.appendChild(backBtn);
    document.body.appendChild(infoOverlay);
  }

  let infoOverlay = null;

  function showInfo() {
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    if (infoOverlay) infoOverlay.style.display = 'flex';
  }

  function hideInfo() {
    if (infoOverlay) infoOverlay.style.display = 'none';
    if (pauseOverlay) pauseOverlay.style.display = 'flex';
  }

  function cleanupHUD() {
    if (overlay) overlay.remove();
    if (pauseOverlay) pauseOverlay.remove();
    if (infoOverlay) infoOverlay.remove();
  }

  function showGameOver() {
    SoundEffects.playGameOver();
    
    // Обновляем рекорд
    if (score > best) {
      best = score;
      localStorage.setItem('mbg-bricks-best', String(best));
    }
    
    // Получаем текущий stage
    const currentStage = parseInt(localStorage.getItem('orb-masters-current-stage')) || 1;
    
    // Показываем новый экран результатов с Orbs
    showGameResult({
      mode: 'bricks',
      score: score,
      combo: maxCombo,
      stage: currentStage,
      duration: Math.floor((Date.now() - gameStartTime) / 1000),
      isPerfect: perfectTurns > 0, // Были идеальные ходы
      isWin: totalBlocksDestroyed > 0,
      engine: engine,
      onRetry: () => {
        restartGame();
      },
      onHome: () => {
        engine.goTo('menu');
      }
    });
  }

  // Время начала игры
  let gameStartTime = Date.now();

  function restartGame() {
    // Сброс всего состояния
    ballManager.clear();
    blockManager.clear();
    blockManager.initLevel();
    gameState = 'aiming';
    ballCount = 10;
    launchPos = { x: W / 2, y: H - 50 };
    nextLaunchX = W / 2;
    firstLandedX = null;
    landedBallsCount = 0;
    downBtnPressed = false;
    
    // Сброс очков и комбо
    score = 0;
    hitCombo = 0;
    maxCombo = 0;
    blocksDestroyedThisTurn = 0;
    totalBlocksDestroyed = 0;
    perfectTurns = 0;
    floatingTexts.length = 0;
    gameStartTime = Date.now();
  }

  function pauseGame() {
    if (gameState === 'gameOver' || gameState === 'paused') return;
    SoundEffects.playClick();
    previousState = gameState;
    gameState = 'paused';
    if (pauseOverlay) pauseOverlay.style.display = 'flex';
  }

  function resumeGame() {
    if (gameState !== 'paused') return;
    gameState = previousState;
    if (pauseOverlay) pauseOverlay.style.display = 'none';
  }

  function isPauseButtonClicked(x, y) {
    return x >= pauseBtnRect.x && x <= pauseBtnRect.x + pauseBtnRect.width &&
           y >= pauseBtnRect.y && y <= pauseBtnRect.y + pauseBtnRect.height;
  }

  function drawPauseButton(ctx) {
    if (gameState === 'gameOver' || gameState === 'paused') return;
    
    ctx.save();
    const btn = pauseBtnRect;
    
    // Простой полупрозрачный фон (без градиента для производительности)
    ctx.fillStyle = 'rgba(80, 80, 100, 0.85)';
    
    // Скруглённый прямоугольник
    const r = 10;
    ctx.beginPath();
    ctx.moveTo(btn.x + r, btn.y);
    ctx.lineTo(btn.x + btn.width - r, btn.y);
    ctx.quadraticCurveTo(btn.x + btn.width, btn.y, btn.x + btn.width, btn.y + r);
    ctx.lineTo(btn.x + btn.width, btn.y + btn.height - r);
    ctx.quadraticCurveTo(btn.x + btn.width, btn.y + btn.height, btn.x + btn.width - r, btn.y + btn.height);
    ctx.lineTo(btn.x + r, btn.y + btn.height);
    ctx.quadraticCurveTo(btn.x, btn.y + btn.height, btn.x, btn.y + btn.height - r);
    ctx.lineTo(btn.x, btn.y + r);
    ctx.quadraticCurveTo(btn.x, btn.y, btn.x + r, btn.y);
    ctx.closePath();
    ctx.fill();
    
    // Рамка
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Иконка паузы (две вертикальные полоски) - увеличена
    const cx = btn.x + btn.width / 2;
    const cy = btn.y + btn.height / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 10, cy - 12, 7, 24);
    ctx.fillRect(cx + 3, cy - 12, 7, 24);
    
    ctx.restore();
  }

  // ===== INPUT HANDLERS =====
  
  // Получение координат из события (mouse или touch)
  function getEventCoords(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * (W / rect.width),
      y: (clientY - rect.top) * (H / rect.height)
    };
  }

  function onPointerDown(e) {
    e.preventDefault();
    const coords = getEventCoords(e);

    // Проверка клика по кнопке паузы
    if (gameState !== 'gameOver' && gameState !== 'paused' && isPauseButtonClicked(coords.x, coords.y)) {
      pauseGame();
      return;
    }

    // Если на паузе - игнорируем остальные нажатия
    if (gameState === 'paused') return;

    // Проверка клика по кнопке ВНИЗ
    if (gameState === 'shooting' && renderer.isDownButtonClicked(coords.x, coords.y)) {
      downBtnPressed = true;
      ballManager.dropAllDown(landingLine);
      return;
    }

    if (gameState !== 'aiming') return;
    isAiming = true;
    updateAimFromCoords(coords.x, coords.y);
  }

  function onPointerMove(e) {
    e.preventDefault();
    if (!isAiming || gameState !== 'aiming') return;
    const coords = getEventCoords(e);
    updateAimFromCoords(coords.x, coords.y);
  }

  function onPointerUp(e) {
    e.preventDefault();
    if (!isAiming || gameState !== 'aiming') return;
    isAiming = false;
    if (aimAngle > -0.1) return;
    gameState = 'shooting';
    SoundEffects.playLaunch();
    ballManager.fireStream(launchPos.x, launchPos.y, aimAngle, ballCount);
  }

  function updateAimFromCoords(mx, my) {
    const dx = mx - launchPos.x;
    const dy = my - launchPos.y;
    aimAngle = Math.atan2(dy, dx);
    if (aimAngle > -0.1) aimAngle = -0.1;
    if (aimAngle < -Math.PI + 0.1) aimAngle = -Math.PI + 0.1;
  }

  function updateAim(e) {
    const coords = getEventCoords(e);
    updateAimFromCoords(coords.x, coords.y);
  }

  function addEventListeners() {
    // Mouse events
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseup', onPointerUp);
    
    // Touch events для мобильных
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    canvas.addEventListener('touchmove', onPointerMove, { passive: false });
    canvas.addEventListener('touchend', onPointerUp, { passive: false });
    canvas.addEventListener('touchcancel', onPointerUp, { passive: false });
  }

  function removeEventListeners() {
    canvas.removeEventListener('mousedown', onPointerDown);
    canvas.removeEventListener('mousemove', onPointerMove);
    canvas.removeEventListener('mouseup', onPointerUp);
    
    canvas.removeEventListener('touchstart', onPointerDown);
    canvas.removeEventListener('touchmove', onPointerMove);
    canvas.removeEventListener('touchend', onPointerUp);
    canvas.removeEventListener('touchcancel', onPointerUp);
  }

  // ===== SCENE INTERFACE =====
  return {
    onResize(w, h) {
      W = w;
      H = h;
      physics.setCanvasSize(w, h);
      blockManager.setCanvasSize(w, h);
      renderer.setCanvasSize(w, h);
      launchPos.y = h - 50;
    },

    init() {
      // Запускаем музыку уровня 2
      AudioManager.playTrack('level2');
      
      ballManager.clear();
      blockManager.clear();
      blockManager.initLevel();
      setupHUD();
      addEventListeners();
      gameState = 'aiming';
      ballCount = 10;
      launchPos = { x: W / 2, y: H - 50 };
      nextLaunchX = W / 2;
      firstLandedX = null;
      landedBallsCount = 0;
      downBtnPressed = false;
      
      // Сброс очков и комбо
      score = 0;
      hitCombo = 0;
      maxCombo = 0;
      blocksDestroyedThisTurn = 0;
      totalBlocksDestroyed = 0;
      perfectTurns = 0;
      floatingTexts.length = 0;
      gameStartTime = Date.now();
    },

    update(dt) {
      if (gameState === 'gameOver' || gameState === 'paused') return;
      ballManager.update();
      blockManager.update(); // Обновление эффектов

      // Обновляем всплывающие тексты
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        if (!floatingTexts[i].update()) {
          floatingTexts.splice(i, 1);
        }
      }

      for (const ball of ballManager.balls) {
        if (!ball.active) continue;
        physics.checkWallCollision(ball);

        // Коллизия с блоками
        if (!ball.ignoreBlocks) {
          for (const block of blockManager.blocks) {
            if (physics.checkBlockCollision(ball, block)) {
              // Комбо за попадание
              hitCombo++;
              maxCombo = Math.max(maxCombo, hitCombo);
              
              // Множитель комбо
              const comboMult = Math.min(1 + Math.floor(hitCombo / 10) * 0.5, 5);
              const hitPoints = Math.round(10 * comboMult);
              score += hitPoints;
              
              // Звук с вариацией по комбо
              SoundEffects.playHit();
              
              // Показываем комбо каждые 10 попаданий
              if (hitCombo % 10 === 0 && hitCombo > 0) {
                floatingTexts.push(new FloatingText(
                  ball.x, ball.y - 20, 
                  `${hitCombo} HITS! ×${comboMult.toFixed(1)}`, 
                  '#FF5722', 24
                ));
              }
              
              const result = block.takeDamage();
              if (result.explode) {
                SoundEffects.playBreak();
                blocksDestroyedThisTurn++;
                totalBlocksDestroyed++;
                
                // Бонус за уничтожение блока
                const destroyPoints = Math.round(50 * comboMult);
                score += destroyPoints;
                floatingTexts.push(new FloatingText(
                  block.x + block.w/2, block.y + block.h/2, 
                  `+${destroyPoints}`, 
                  '#4CAF50', 18
                ));
                
                blockManager.processExplosion(block, result);
              }
            }
          }
        }

        // Коллизия со спецэлементами
        for (const special of blockManager.specials) {
          if (!special.active) continue;
          if (special.checkCollision(ball.x, ball.y, ball.r)) {
            if (special.type === 'laser') {
              // Лазер: каждый шар активирует урон, но только 1 раз за шар
              if (!ball.hitLasers.has(special.id)) {
                ball.hitLasers.add(special.id);
                special.triggered = true;  // Для удаления в конце раунда
                special.flash();  // Визуальная вспышка
                special.hitCount++;
                SoundEffects.playLaser();
                blockManager.fireLaser(special, 1);
              }
            } else if (special.type === 'randomizer') {
              special.triggered = true;
              SoundEffects.playRandomize();
              const angle = Math.random() * Math.PI * 2;
              const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
              ball.vx = Math.cos(angle) * speed;
              ball.vy = Math.sin(angle) * speed;
              if (ball.vy > 0 && ball.y < landingLine - 50) {
                ball.vy = -Math.abs(ball.vy);
              }
            }
          }
        }

        // Коллизия с бонусами
        for (const bonus of blockManager.bonuses) {
          if (bonus.active && bonus.checkCollision(ball.x, ball.y, ball.r)) {
            bonus.active = false;
            SoundEffects.playBonus();
            ballCount++;
          }
        }

        // Приземление
        if (ball.y >= landingLine) {
          ball.active = false;
          ball.y = landingLine;
          if (firstLandedX === null) {
            firstLandedX = ball.x;
          }
          landedBallsCount++;
        }
      }

      blockManager.blocks = blockManager.blocks.filter(b => b.active);

      // Конец хода
      if (gameState === 'shooting' && ballManager.allLanded()) {
        SoundEffects.playRoundEnd();
        
        // Бонус за идеальный ход (3+ уничтоженных блоков)
        if (blocksDestroyedThisTurn >= 3) {
          perfectTurns++;
          const perfectBonus = blocksDestroyedThisTurn * 100;
          score += perfectBonus;
          floatingTexts.push(new FloatingText(
            W / 2, H / 2 - 50, 
            `PERFECT! +${perfectBonus}`, 
            '#FFD700', 32
          ));
          SoundEffects.playBonus();
        }
        
        // Бонус за большое комбо
        if (hitCombo >= 50) {
          const comboBonus = hitCombo * 5;
          score += comboBonus;
          floatingTexts.push(new FloatingText(
            W / 2, H / 2, 
            `${hitCombo} COMBO! +${comboBonus}`, 
            '#FF5722', 28
          ));
        }
        
        // Сброс счётчиков хода
        hitCombo = 0;
        blocksDestroyedThisTurn = 0;
        
        // Обновляем рекорд
        if (score > best) {
          best = score;
          localStorage.setItem('mbg-bricks-best', String(best));
        }
        
        launchPos.x = Math.max(30, Math.min(firstLandedX || W / 2, W - 30));
        nextLaunchX = launchPos.x;
        
        firstLandedX = null;
        landedBallsCount = 0;
        downBtnPressed = false;
        
        blockManager.cleanupTriggered();
        
        ballManager.clear();
        
        // Обновляем mercy-систему перед генерацией нового ряда
        blockManager.setPlayerBallCount(ballCount);
        blockManager.descendAll();

        if (blockManager.checkGameOver(gameOverLine)) {
          gameState = 'gameOver';
          showGameOver();
          return;
        }
        gameState = 'aiming';
      }
    },

    render(ctx) {
      // Фон и рамка
      renderer.drawBackground(ctx);
      renderer.drawBorder(ctx);
      renderer.drawGameOverLine(ctx, gameOverLine);

      // Игровые объекты
      blockManager.draw(ctx);
      ballManager.draw(ctx);
      
      // Всплывающие тексты
      for (const text of floatingTexts) {
        text.draw(ctx);
      }

      // UI
      renderer.drawLaunchPosition(ctx, launchPos.x, launchPos.y, ballCount);

      if (gameState === 'aiming') {
        renderer.drawAimLine(ctx, launchPos.x, launchPos.y, aimAngle);
        renderer.drawHint(ctx);
      }

      if (gameState === 'shooting') {
        renderer.drawDownButton(ctx, downBtnPressed);
        
        // Показываем комбо во время стрельбы
        if (hitCombo >= 10) {
          ctx.save();
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#FF5722';
          ctx.fillText(`${hitCombo} HITS!`, W / 2, 70);
          ctx.restore();
        }
      }

      // Отрисовка очков и рекорда СЛЕВА (стандартная позиция)
      ctx.save();
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`${score}`, 12, 32);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#888';
      ctx.fillText(`${i18n.t('game.best')}: ${best}`, 12, 52);
      ctx.restore();

      // Ход по центру сверху
      renderer.drawHUD(ctx, blockManager.turnNumber);

      // Кнопка паузы
      drawPauseButton(ctx);
    },

    onExit() {
      removeEventListeners();
      cleanupHUD();
      window.removeEventListener('languageChanged', onLanguageChanged);
    }
  };
}

export default LevelKnockout;
