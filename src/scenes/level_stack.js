// Level 3: Block Puzzle - Улучшенная версия
// Механики: комбо-система, зоны 3×3, цветные фигуры, анимации, специальные фигуры

import { AudioManager } from '../game/AudioManager.js';
import { SoundEffects } from '../game/SoundEffects.js';
import { showSettingsModal } from '../game/SettingsModal.js';
import { showGameResult } from '../ui/GameResultScreen.js';
import difficultyManager from '../core/DifficultyManager.js';
import i18n, { t } from '../i18n/LanguageManager.js';

// Типы фигур с цветами
const SHAPES = [
  { shape: [[1,1,1,1]], color: '#00BCD4', name: 'I4' },           // I длинная
  { shape: [[1,1,1]], color: '#03A9F4', name: 'I3' },             // I короткая
  { shape: [[1,1],[1,1]], color: '#FFC107', name: 'O' },          // Квадрат
  { shape: [[1,1,1],[0,1,0]], color: '#9C27B0', name: 'T' },      // T
  { shape: [[1,1,0],[0,1,1]], color: '#4CAF50', name: 'S' },      // S
  { shape: [[0,1,1],[1,1,0]], color: '#F44336', name: 'Z' },      // Z
  { shape: [[1,0,0],[1,1,1]], color: '#FF9800', name: 'L' },      // L
  { shape: [[0,0,1],[1,1,1]], color: '#2196F3', name: 'J' },      // J
  { shape: [[1]], color: '#E91E63', name: 'dot' },                // Точка
  { shape: [[1,1]], color: '#795548', name: 'I2' },               // Линия 2
  { shape: [[1],[1],[1]], color: '#607D8B', name: 'I3v' },        // Вертикальная 3
  { shape: [[1,1,1],[1,0,0],[1,0,0]], color: '#3F51B5', name: 'bigL' }, // Большая L
  { shape: [[1,1,1],[0,0,1],[0,0,1]], color: '#009688', name: 'bigJ' }, // Большая J
];

// Специальные фигуры (редкие)
const SPECIAL_SHAPES = [
  { shape: [[2]], color: '#FFD700', name: 'bomb', icon: '💣', effect: 'clear3x3' },
  { shape: [[3]], color: '#FF5722', name: 'lineH', icon: '↔️', effect: 'clearRow' },
  { shape: [[4]], color: '#8BC34A', name: 'lineV', icon: '↕️', effect: 'clearCol' },
];

/**
 * Класс эффекта частиц при очистке линий
 */
class ClearEffect {
  constructor(cells, color) {
    this.particles = [];
    this.life = 1;
    
    for (const cell of cells) {
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        this.particles.push({
          x: cell.x,
          y: cell.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 4,
          color: color || '#7EE7C8',
          alpha: 1
        });
      }
    }
  }

  update() {
    this.life -= 0.025;
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.size *= 0.96;
      p.alpha = this.life;
    }
    return this.life > 0;
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/**
 * Класс всплывающего текста (очки, комбо)
 */
class FloatingText {
  constructor(x, y, text, color = '#FFD700', size = 24) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = 1;
    this.vy = -2;
  }

  update() {
    this.life -= 0.02;
    this.y += this.vy;
    this.vy *= 0.95;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.font = `bold ${this.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(this.text, this.x + 2, this.y + 2);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

function LevelStack(engine, opts = {}) {
  const canvas = engine.canvas;
  const ctx = engine.ctx;
  const container = document.getElementById('game-container');
  let W = canvas.clientWidth, H = canvas.clientHeight;

  // Запуск музыки
  AudioManager.playTrack('level3');

  // Настройки сетки
  const rows = 10, cols = 10;
  let grid = []; // 0 = пусто, или {color, special}
  let cellSize = 0, gridX = 0, gridY = 0, panelY = 0;

  // Фигуры для размещения
  let pieces = []; // [{shape, color, name, isSpecial, effect, icon}]
  let shapeBag = [];

  // Состояние игры
  let score = 0;
  let best = parseInt(localStorage.getItem('mbg-stack-best') || '0', 10);
  let combo = 0;
  let maxCombo = 0;
  let totalLinesCleared = 0;
  let totalSquaresCleared = 0; // Зоны 3×3
  let gameStartTime = Date.now();

  // Визуальные эффекты
  const effects = [];
  const floatingTexts = [];

  // Перетаскивание
  const drag = { active: false, idx: null, x: 0, y: 0 };
  let selected = null;

  // UI
  let paused = false;
  let gameOver = false;
  let pauseOverlay = null;
  let infoOverlay = null;
  let gameOverOverlay = null;

  const pieceSlotSize = 90;
  const pieceSlotGap = 12;

  // === Инициализация ===
  function initGrid() {
    grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  }

  function shuffleBag() {
    shapeBag = [];
    for (let i = 0; i < SHAPES.length; i++) {
      shapeBag.push({ type: 'normal', idx: i });
      shapeBag.push({ type: 'normal', idx: i }); // Каждая фигура дважды
    }
    
    // Адаптивная система специальных фигур
    const diffMod = difficultyManager.getModifier('blockPuzzle');
    // diffMod < 1 = сложно игроку, даём больше специальных
    // diffMod > 1 = легко игроку, меньше специальных
    
    const extraSpecialChance = diffMod < 0.8 ? 0.8 : diffMod < 1.0 ? 0.6 : 0.5;
    
    // Бомба - всегда минимум 2 штуки
    shapeBag.push({ type: 'special', idx: 0 }); // bomb
    shapeBag.push({ type: 'special', idx: 0 }); // bomb
    
    // Линии - всегда добавляем обе
    shapeBag.push({ type: 'special', idx: 1 }); // lineH
    shapeBag.push({ type: 'special', idx: 2 }); // lineV
    
    // Дополнительные специальные (адаптивно)
    if (Math.random() < extraSpecialChance) {
      shapeBag.push({ type: 'special', idx: Math.floor(Math.random() * 3) });
    }
    if (Math.random() < extraSpecialChance * 0.6) {
      shapeBag.push({ type: 'special', idx: Math.floor(Math.random() * 3) });
    }
    // Если очень тяжело - ещё больше помощи
    if (diffMod < 0.7 && Math.random() < 0.5) {
      shapeBag.push({ type: 'special', idx: 0 }); // Ещё бомба
    }
    
    // Fisher-Yates shuffle
    for (let i = shapeBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shapeBag[i], shapeBag[j]] = [shapeBag[j], shapeBag[i]];
    }
  }

  function getNextPiece() {
    if (shapeBag.length === 0) shuffleBag();
    const item = shapeBag.pop();
    
    if (item.type === 'special') {
      const s = SPECIAL_SHAPES[item.idx];
      return {
        shape: s.shape,
        color: s.color,
        name: s.name,
        isSpecial: true,
        effect: s.effect,
        icon: s.icon,
        w: s.shape[0].length,
        h: s.shape.length
      };
    } else {
      const s = SHAPES[item.idx];
      return {
        shape: s.shape,
        color: s.color,
        name: s.name,
        isSpecial: false,
        w: s.shape[0].length,
        h: s.shape.length
      };
    }
  }

  function refillPieces() {
    pieces = pieces.filter(Boolean);
    while (pieces.length < 3) {
      pieces.push(getNextPiece());
    }
  }

  // === Логика размещения ===
  function canPlace(piece, r0, c0) {
    for (let r = 0; r < piece.h; r++) {
      for (let c = 0; c < piece.w; c++) {
        if (!piece.shape[r][c]) continue;
        const rr = r0 + r, cc = c0 + c;
        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) return false;
        if (grid[rr][cc] !== 0) return false;
      }
    }
    return true;
  }

  function hasValidPlacement(piece) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (canPlace(piece, r, c)) return true;
      }
    }
    return false;
  }

  function hasAnyValidMove() {
    return pieces.some(p => p && hasValidPlacement(p));
  }

  function placePiece(idx, r0, c0) {
    const p = pieces[idx];
    if (!p || !canPlace(p, r0, c0)) return false;

    // Размещаем фигуру
    let filledCells = 0;
    for (let r = 0; r < p.h; r++) {
      for (let c = 0; c < p.w; c++) {
        if (p.shape[r][c]) {
          grid[r0 + r][c0 + c] = { color: p.color, special: p.shape[r][c] > 1 ? p.shape[r][c] : null };
          filledCells++;
        }
      }
    }

    // Обработка специальной фигуры
    if (p.isSpecial && p.effect) {
      handleSpecialEffect(p.effect, r0, c0);
    }

    pieces[idx] = null;
    selected = null;

    // Проверяем заполненные линии и зоны
    const cleared = checkAndClearLines();
    
    // Начисляем очки за размещение
    let earnedPoints = filledCells * 2;
    
    if (cleared.lines > 0 || cleared.squares > 0) {
      combo++;
      maxCombo = Math.max(maxCombo, combo);
      
      // Бонус за линии
      const lineBonus = 100 * cleared.lines * cleared.lines;
      // Бонус за квадраты 3×3
      const squareBonus = 150 * cleared.squares;
      // Множитель комбо
      const comboMultiplier = Math.min(combo, 10);
      
      earnedPoints += Math.round((lineBonus + squareBonus) * (1 + comboMultiplier * 0.2));
      
      totalLinesCleared += cleared.lines;
      totalSquaresCleared += cleared.squares;
      
      // Показываем текст комбо
      if (combo >= 2) {
        const centerX = gridX + (cols * cellSize) / 2;
        const centerY = gridY + (rows * cellSize) / 2;
        floatingTexts.push(new FloatingText(centerX, centerY, `COMBO ×${combo}!`, '#FF5722', 32));
        SoundEffects.playBonus();
      }
    } else {
      combo = 0;
    }

    score += earnedPoints;
    
    // Показываем заработанные очки
    const textX = gridX + (c0 + p.w / 2) * cellSize;
    const textY = gridY + (r0 + p.h / 2) * cellSize;
    floatingTexts.push(new FloatingText(textX, textY, `+${earnedPoints}`, '#FFD700', 20));

    SoundEffects.playBreak();

    // Обновляем рекорд
    if (score > best) {
      best = score;
      localStorage.setItem('mbg-stack-best', String(best));
    }

    // Заполняем новые фигуры
    refillPieces();

    // Проверяем возможность хода
    if (!hasAnyValidMove()) {
      setTimeout(() => {
        gameOver = true;
        showGameOver();
      }, 800);
    }

    return true;
  }

  function handleSpecialEffect(effect, r, c) {
    const cellsToClear = [];
    
    switch (effect) {
      case 'clear3x3':
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr, cc = c + dc;
            if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && grid[rr][cc] !== 0) {
              cellsToClear.push({ r: rr, c: cc });
            }
          }
        }
        break;
      case 'clearRow':
        for (let cc = 0; cc < cols; cc++) {
          if (grid[r][cc] !== 0) cellsToClear.push({ r, c: cc });
        }
        break;
      case 'clearCol':
        for (let rr = 0; rr < rows; rr++) {
          if (grid[rr][c] !== 0) cellsToClear.push({ r: rr, c });
        }
        break;
    }

    if (cellsToClear.length > 0) {
      const effectCells = cellsToClear.map(cell => ({
        x: gridX + cell.c * cellSize + cellSize / 2,
        y: gridY + cell.r * cellSize + cellSize / 2
      }));
      effects.push(new ClearEffect(effectCells, '#FFD700'));
      
      for (const cell of cellsToClear) {
        grid[cell.r][cell.c] = 0;
      }
      
      score += cellsToClear.length * 10;
      SoundEffects.playExplosion();
    }
  }

  function checkAndClearLines() {
    const fullRows = [];
    const fullCols = [];
    const fullSquares = [];

    // Проверяем строки
    for (let r = 0; r < rows; r++) {
      if (grid[r].every(cell => cell !== 0)) {
        fullRows.push(r);
      }
    }

    // Проверяем столбцы
    for (let c = 0; c < cols; c++) {
      let full = true;
      for (let r = 0; r < rows; r++) {
        if (grid[r][c] === 0) { full = false; break; }
      }
      if (full) fullCols.push(c);
    }

    // Проверяем зоны 3×3 (как в Blockudoku)
    for (let r = 0; r < rows; r += 3) {
      for (let c = 0; c < cols; c += 3) {
        let full = true;
        for (let dr = 0; dr < 3 && full; dr++) {
          for (let dc = 0; dc < 3 && full; dc++) {
            if (r + dr >= rows || c + dc >= cols || grid[r + dr][c + dc] === 0) {
              full = false;
            }
          }
        }
        if (full) fullSquares.push({ r, c });
      }
    }

    // Собираем все клетки для очистки
    const cellsToClear = new Set();
    
    for (const r of fullRows) {
      for (let c = 0; c < cols; c++) {
        cellsToClear.add(`${r},${c}`);
      }
    }
    
    for (const c of fullCols) {
      for (let r = 0; r < rows; r++) {
        cellsToClear.add(`${r},${c}`);
      }
    }
    
    for (const sq of fullSquares) {
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          cellsToClear.add(`${sq.r + dr},${sq.c + dc}`);
        }
      }
    }

    // Создаём эффекты и очищаем
    if (cellsToClear.size > 0) {
      const effectCells = [];
      for (const key of cellsToClear) {
        const [r, c] = key.split(',').map(Number);
        const cell = grid[r][c];
        effectCells.push({
          x: gridX + c * cellSize + cellSize / 2,
          y: gridY + r * cellSize + cellSize / 2,
          color: cell?.color || '#7EE7C8'
        });
        grid[r][c] = 0;
      }
      effects.push(new ClearEffect(effectCells, '#7EE7C8'));
    }

    return {
      lines: fullRows.length + fullCols.length,
      squares: fullSquares.length
    };
  }

  // === Layout ===
  function recalcLayout(w, h) {
    W = w;
    H = h;
    const available = Math.min(W * 0.85, H - 200);
    cellSize = Math.floor(available / Math.max(rows, cols));
    const gridW = cellSize * cols;
    const gridH = cellSize * rows;
    gridX = Math.round((W - gridW) / 2);
    gridY = Math.round((H * 0.4) - (gridH / 2));
    panelY = gridY + gridH + 20;
  }

  // === Input ===
  function onPointerDown(e) {
    if (paused || gameOver) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;

    // Проверяем клик по панели фигур
    if (y >= panelY) {
      const gridW = cellSize * cols;
      const totalWidth = 3 * pieceSlotSize + 2 * pieceSlotGap;
      const startX = gridX + Math.floor((gridW - totalWidth) / 2);

      for (let i = 0; i < pieces.length; i++) {
        const left = startX + i * (pieceSlotSize + pieceSlotGap);
        if (x >= left && x <= left + pieceSlotSize && y >= panelY && y <= panelY + pieceSlotSize) {
          if (!pieces[i]) return;
          drag.active = true;
          drag.idx = i;
          drag.x = x;
          drag.y = y;
          selected = i;
          return;
        }
      }
      return;
    }

    // Клик по сетке с выбранной фигурой
    if (selected !== null) {
      drag.active = true;
      drag.idx = selected;
      drag.x = x;
      drag.y = y;
    }
  }

  function onPointerMove(e) {
    if (paused || gameOver || !drag.active) return;
    const r = canvas.getBoundingClientRect();
    drag.x = e.clientX - r.left;
    drag.y = e.clientY - r.top;
  }

  function onPointerUp(e) {
    if (paused || gameOver || !drag.active) return;
    
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    
    const piece = pieces[drag.idx];
    if (piece) {
      // Вычисляем позицию с учётом центра фигуры
      const piecePixelW = piece.w * cellSize;
      const piecePixelH = piece.h * cellSize;
      const gx = x - gridX - piecePixelW / 2 + cellSize / 2;
      const gy = y - gridY - piecePixelH / 2 + cellSize / 2;
      const col = Math.round(gx / cellSize);
      const row = Math.round(gy / cellSize);

      if (canPlace(piece, row, col)) {
        placePiece(drag.idx, row, col);
      } else {
        SoundEffects.playClick();
      }
    }

    drag.active = false;
    drag.idx = null;
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (drag.active) {
        drag.active = false;
        drag.idx = null;
        selected = null;
      } else {
        togglePause();
      }
    }
  }

  // === Pause / GameOver ===
  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    if (pauseOverlay) {
      pauseOverlay.style.display = paused ? 'flex' : 'none';
    }
  }

  // Слушатель смены языка - пересоздаём меню паузы
  function onLanguageChanged() {
    const wasVisible = pauseOverlay && pauseOverlay.style.display === 'flex';
    if (pauseOverlay) {
      pauseOverlay.remove();
      pauseOverlay = null;
    }
    createPauseMenu();
    if (wasVisible) {
      pauseOverlay.style.display = 'flex';
    }
  }
  window.addEventListener('languageChanged', onLanguageChanged);

  function createPauseMenu() {
    pauseOverlay = document.createElement('div');
    pauseOverlay.style.cssText = 'position: absolute; inset: 0; background: rgba(0,0,0,0.85); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 200;';
    pauseOverlay.innerHTML = `
      <div style="color: #FFF; font-size: 36px; margin-bottom: 30px;">⏸ ${t('pause.title')}</div>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="stack-resume" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; border-radius: 8px; min-width: 200px;">▶ ${t('pause.resume')}</button>
        <button id="stack-info" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #9C27B0, #7B1FA2); color: white; border: none; border-radius: 8px; min-width: 200px;">ℹ️ ${t('pause.info')}</button>
        <button id="stack-settings" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; min-width: 200px;">⚙️ ${t('settings.title')}</button>
        <button id="stack-restart" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #FF9800, #F57C00); color: white; border: none; border-radius: 8px; min-width: 200px;">🔄 ${t('pause.restart')}</button>
        <button id="stack-menu" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border: none; border-radius: 8px; min-width: 200px;">🏠 ${t('pause.menu')}</button>
      </div>
    `;
    container.appendChild(pauseOverlay);

    pauseOverlay.querySelector('#stack-resume').onclick = () => { SoundEffects.playClick(); togglePause(); };
    pauseOverlay.querySelector('#stack-info').onclick = () => { SoundEffects.playClick(); showInfo(); };
    pauseOverlay.querySelector('#stack-settings').onclick = () => { SoundEffects.playClick(); showSettingsModal(); };
    pauseOverlay.querySelector('#stack-restart').onclick = () => { SoundEffects.playClick(); restartGame(); };
    pauseOverlay.querySelector('#stack-menu').onclick = () => { SoundEffects.playClick(); engine.goTo('menu'); };
  }

  function createInfoOverlay() {
    infoOverlay = document.createElement('div');
    infoOverlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: none; flex-direction: column; justify-content: flex-start; align-items: center; z-index: 210; overflow-y: auto; padding: 20px; box-sizing: border-box;';

    const content = document.createElement('div');
    content.style.cssText = 'color: white; font-size: 14px; max-width: 400px; line-height: 1.6;';
    content.innerHTML = `
      <div style="color: #7EE7C8; font-size: 26px; margin-bottom: 20px; text-align: center; text-shadow: 0 0 10px rgba(126,231,200,0.5);">📖 Как играть в Block Puzzle</div>

      <div style="margin-bottom: 20px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 10px; border: 1px solid rgba(126,231,200,0.3);">
        <div style="font-weight: bold; margin-bottom: 8px; color: #4FC3F7; font-size: 16px;">🎯 Цель игры</div>
        <div>Размещай фигуры на поле 10×10. Заполняй линии и зоны 3×3 для их очистки и получения очков!</div>
      </div>

      <div style="font-weight: bold; margin-bottom: 12px; color: #FFF; font-size: 16px;">📐 Основные правила:</div>

      <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 10px; background: rgba(126,231,200,0.15); border-radius: 8px;">
        <div style="width: 40px; text-align: center; font-size: 24px; margin-right: 12px;">📦</div>
        <div><b style="color: #7EE7C8;">3 фигуры</b> — в каждом ходе доступны 3 случайные фигуры</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 10px; background: rgba(0,188,212,0.15); border-radius: 8px;">
        <div style="width: 40px; text-align: center; font-size: 24px; margin-right: 12px;">📏</div>
        <div><b style="color: #00BCD4;">Линии</b> — заполни весь ряд или столбец для очистки</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; background: rgba(156,39,176,0.15); border-radius: 8px;">
        <div style="width: 40px; text-align: center; font-size: 24px; margin-right: 12px;">⬛</div>
        <div><b style="color: #9C27B0;">Зоны 3×3</b> — заполни квадрат 3×3 для бонусных очков!</div>
      </div>

      <div style="font-weight: bold; margin-bottom: 12px; color: #FFF; font-size: 16px;">⭐ Специальные фигуры (редкие):</div>

      <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; background: rgba(255,215,0,0.15); border-radius: 6px;">
        <div style="width: 35px; text-align: center; font-size: 20px; margin-right: 10px;">💣</div>
        <div><b style="color: #FFD700;">Бомба</b> — очищает область 3×3 вокруг</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; background: rgba(255,87,34,0.15); border-radius: 6px;">
        <div style="width: 35px; text-align: center; font-size: 20px; margin-right: 10px;">↔️</div>
        <div><b style="color: #FF5722;">Горизонталь</b> — очищает весь ряд</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 8px; background: rgba(139,195,74,0.15); border-radius: 6px;">
        <div style="width: 35px; text-align: center; font-size: 20px; margin-right: 10px;">↕️</div>
        <div><b style="color: #8BC34A;">Вертикаль</b> — очищает весь столбец</div>
      </div>

      <div style="margin-bottom: 15px; padding: 12px; background: linear-gradient(135deg, rgba(255,87,34,0.2), rgba(255,152,0,0.2)); border-radius: 10px; border: 1px solid rgba(255,152,0,0.4);">
        <div style="font-weight: bold; margin-bottom: 8px; color: #FF5722; font-size: 16px;">🔥 Система комбо</div>
        <div style="margin-bottom: 8px;">Очищай линии подряд без пропусков!</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 13px;">
          <div>• 2 комбо → <b style="color: #FFD700;">+40%</b></div>
          <div>• 3 комбо → <b style="color: #FFD700;">+60%</b></div>
          <div>• 5 комбо → <b style="color: #FFD700;">+100%</b></div>
          <div>• 10 комбо → <b style="color: #FFD700;">+200%</b></div>
        </div>
        <div style="margin-top: 8px; font-size: 13px; color: #FFA726;">⚠️ Комбо сбрасывается если разместить фигуру без очистки линий!</div>
      </div>

      <div style="margin-bottom: 15px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 10px;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #4FC3F7; font-size: 16px;">💰 Система очков</div>
        <div style="font-size: 13px; line-height: 1.6;">
          • Размещение фигуры: <b>2 очка × клетки</b><br>
          • 1 линия: <b>100 очков</b><br>
          • 2 линии: <b>400 очков</b> (×4!)<br>
          • 3 линии: <b>900 очков</b> (×9!)<br>
          • Зона 3×3: <b>+150 бонус</b>
        </div>
      </div>

      <div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 10px; text-align: center;">
        <div style="color: #FFEB3B; font-size: 15px; margin-bottom: 6px;">💡 Советы</div>
        <div style="font-size: 13px; line-height: 1.5;">
          • Планируй на несколько ходов вперёд<br>
          • Старайся заполнять углы и края<br>
          • Держи центр относительно свободным<br>
          • Комбо = ключ к высоким очкам!
        </div>
      </div>
    `;
    infoOverlay.appendChild(content);

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Назад';
    backBtn.style.cssText = 'padding: 12px 40px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #666, #444); color: white; border: none; border-radius: 8px; margin-top: 20px; margin-bottom: 20px;';
    backBtn.onclick = () => { SoundEffects.playClick(); hideInfo(); };
    infoOverlay.appendChild(backBtn);

    container.appendChild(infoOverlay);
  }

  function showInfo() {
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    if (infoOverlay) infoOverlay.style.display = 'flex';
  }

  function hideInfo() {
    if (infoOverlay) infoOverlay.style.display = 'none';
    if (pauseOverlay) pauseOverlay.style.display = 'flex';
  }

  function createGameOverScreen() {
    gameOverOverlay = document.createElement('div');
    gameOverOverlay.style.cssText = 'position: absolute; inset: 0; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 200;';
    gameOverOverlay.innerHTML = `
      <div style="color: #FFD700; font-size: 42px; margin-bottom: 20px;">🏆 ИГРА ОКОНЧЕНА</div>
      <div id="stack-final-score" style="color: #FFF; font-size: 32px; margin-bottom: 10px;">Очки: 0</div>
      <div id="stack-best-score" style="color: #4CAF50; font-size: 24px; margin-bottom: 10px;">Рекорд: 0</div>
      <div id="stack-stats" style="color: #AAA; font-size: 18px; margin-bottom: 30px; text-align: center;"></div>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="stack-retry" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; border-radius: 8px; min-width: 180px;">🔄 Ещё раз</button>
        <button id="stack-to-menu" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border: none; border-radius: 8px; min-width: 180px;">🏠 В меню</button>
      </div>
    `;
    container.appendChild(gameOverOverlay);

    gameOverOverlay.querySelector('#stack-retry').onclick = () => { SoundEffects.playClick(); restartGame(); };
    gameOverOverlay.querySelector('#stack-to-menu').onclick = () => { SoundEffects.playClick(); engine.goTo('menu'); };
  }

  function showGameOver() {
    // Используем новую универсальную систему результатов
    const playTime = Math.floor((Date.now() - gameStartTime) / 1000);
    
    showGameResult({
      mode: 'blockPuzzle',
      score: score,
      bestScore: best,
      stats: {
        linesCleared: totalLinesCleared,
        zonesCleared: totalSquaresCleared,
        maxCombo: maxCombo
      },
      playTimeSeconds: playTime,
      onRestart: () => { restartGame(); },
      onMenu: () => { engine.goTo('menu'); }
    });
    
    SoundEffects.playGameOver();
  }

  function restartGame() {
    initGrid();
    shuffleBag();
    pieces = [];
    refillPieces();
    score = 0;
    combo = 0;
    maxCombo = 0;
    totalLinesCleared = 0;
    totalSquaresCleared = 0;
    selected = null;
    gameOver = false;
    paused = false;
    effects.length = 0;
    floatingTexts.length = 0;
    gameStartTime = Date.now();
    
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    if (gameOverOverlay) gameOverOverlay.style.display = 'none';
  }

  // === Рендеринг ===
  function drawGrid(ctx) {
    // Фон сетки
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(gridX - 2, gridY - 2, cols * cellSize + 4, rows * cellSize + 4);

    // Разметка зон 3×3
    ctx.strokeStyle = 'rgba(126,231,200,0.15)';
    ctx.lineWidth = 2;
    for (let r = 0; r <= rows; r += 3) {
      ctx.beginPath();
      ctx.moveTo(gridX, gridY + r * cellSize);
      ctx.lineTo(gridX + cols * cellSize, gridY + r * cellSize);
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c += 3) {
      ctx.beginPath();
      ctx.moveTo(gridX + c * cellSize, gridY);
      ctx.lineTo(gridX + c * cellSize, gridY + rows * cellSize);
      ctx.stroke();
    }

    // Клетки
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = gridX + c * cellSize;
        const y = gridY + r * cellSize;
        const cell = grid[r][c];

        if (cell !== 0) {
          // Заполненная клетка
          const grad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
          grad.addColorStop(0, cell.color);
          grad.addColorStop(1, shadeColor(cell.color, -20));
          ctx.fillStyle = grad;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          
          // Блик
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(x + 2, y + 2, cellSize - 4, 3);
        } else {
          // Пустая клетка
          ctx.fillStyle = 'rgba(255,255,255,0.02)';
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        }

        // Сетка
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
      }
    }
  }

  function drawPieces(ctx) {
    const gridW = cellSize * cols;
    const totalWidth = 3 * pieceSlotSize + 2 * pieceSlotGap;
    const startX = gridX + Math.floor((gridW - totalWidth) / 2);

    for (let i = 0; i < 3; i++) {
      const left = startX + i * (pieceSlotSize + pieceSlotGap);
      const top = panelY;

      // Фон слота
      ctx.fillStyle = i === selected ? 'rgba(126,231,200,0.15)' : 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.roundRect(left, top, pieceSlotSize, pieceSlotSize, 8);
      ctx.fill();

      const piece = pieces[i];
      if (!piece) continue;
      if (drag.active && drag.idx === i) continue; // Рисуем отдельно при перетаскивании

      drawPieceAt(ctx, piece, left, top, pieceSlotSize);
    }
  }

  function drawPieceAt(ctx, piece, slotX, slotY, slotSize, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // Специальные фигуры рисуем по-особому - большие и заметные
    if (piece.isSpecial && piece.icon) {
      const size = slotSize * 0.6;
      const x = slotX + (slotSize - size) / 2;
      const y = slotY + (slotSize - size) / 2;
      
      // Свечение
      ctx.shadowColor = piece.color;
      ctx.shadowBlur = 15;
      
      // Фон с градиентом
      const grad = ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, size/2);
      grad.addColorStop(0, piece.color);
      grad.addColorStop(0.7, shadeColor(piece.color, -20));
      grad.addColorStop(1, shadeColor(piece.color, -40));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 12);
      ctx.fill();
      
      // Рамка
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      
      // Большая иконка
      ctx.font = `${size * 0.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(piece.icon, x + size/2, y + size/2);
      
      // Подпись эффекта
      ctx.font = 'bold 10px Arial';
      ctx.fillStyle = '#FFF';
      const label = piece.effect === 'clear3x3' ? 'БОМБА' : 
                    piece.effect === 'clearRow' ? 'РЯД' : 
                    piece.effect === 'clearCol' ? 'СТОЛБЕЦ' : '';
      ctx.fillText(label, slotX + slotSize/2, slotY + slotSize - 8);
      
      ctx.restore();
      return;
    }

    // Обычные фигуры
    const s = Math.min(16, Math.floor((slotSize - 20) / Math.max(piece.w, piece.h)));
    const gap = 2;
    const shapeW = piece.w * (s + gap) - gap;
    const shapeH = piece.h * (s + gap) - gap;
    const offsetX = slotX + Math.floor((slotSize - shapeW) / 2);
    const offsetY = slotY + Math.floor((slotSize - shapeH) / 2);

    for (let r = 0; r < piece.h; r++) {
      for (let c = 0; c < piece.w; c++) {
        if (piece.shape[r][c]) {
          const x = offsetX + c * (s + gap);
          const y = offsetY + r * (s + gap);
          
          const grad = ctx.createLinearGradient(x, y, x + s, y + s);
          grad.addColorStop(0, piece.color);
          grad.addColorStop(1, shadeColor(piece.color, -30));
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, s, s);
          
          // Блик
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(x + 1, y + 1, s - 2, 2);
        }
      }
    }

    ctx.restore();
  }

  function drawDragging(ctx) {
    if (!drag.active || drag.idx === null) return;
    const piece = pieces[drag.idx];
    if (!piece) return;

    // Предпросмотр на сетке
    const piecePixelW = piece.w * cellSize;
    const piecePixelH = piece.h * cellSize;
    const gx = drag.x - gridX - piecePixelW / 2 + cellSize / 2;
    const gy = drag.y - gridY - piecePixelH / 2 + cellSize / 2;
    const col = Math.round(gx / cellSize);
    const row = Math.round(gy / cellSize);

    const valid = canPlace(piece, row, col);

    // Рисуем тень на сетке
    ctx.globalAlpha = 0.5;
    for (let r = 0; r < piece.h; r++) {
      for (let c = 0; c < piece.w; c++) {
        if (piece.shape[r][c]) {
          const R = row + r, C = col + c;
          if (R >= 0 && C >= 0 && R < rows && C < cols) {
            const x = gridX + C * cellSize;
            const y = gridY + R * cellSize;
            ctx.fillStyle = valid ? '#7EE7C8' : '#FF6B6B';
            ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    // Рисуем фигуру у курсора
    const drawX = drag.x - piecePixelW / 2;
    const drawY = drag.y - piecePixelH / 2 - 40; // Немного выше курсора

    const s = cellSize - 4;
    for (let r = 0; r < piece.h; r++) {
      for (let c = 0; c < piece.w; c++) {
        if (piece.shape[r][c]) {
          const x = drawX + c * cellSize + 2;
          const y = drawY + r * cellSize + 2;
          
          ctx.fillStyle = piece.color;
          ctx.shadowColor = piece.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(x, y, s, s);
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  function drawHUD(ctx) {
    // Очки слева
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${score}`, 12, 32);
    
    // Рекорд под очками
    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.fillText(`${i18n.t('game.best')}: ${best}`, 12, 52);

    // Комбо по центру сверху (не перекрывает паузу)
    if (combo >= 2) {
      ctx.fillStyle = '#FF5722';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO ×${combo}`, W / 2, 28);
    }

    // Кнопка паузы справа (стандартная позиция W-56, 8)
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.roundRect(W - 56, 8, 48, 48, 10);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.fillRect(W - 44, 18, 6, 28);
    ctx.fillRect(W - 32, 18, 6, 28);
  }

  function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  // Клик по кнопке паузы (стандартная позиция W-56, 8, размер 48x48)
  function onPointerDownPause(e) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    
    if (x >= W - 56 && x <= W - 8 && y >= 8 && y <= 56 && !gameOver) {
      SoundEffects.playClick();
      togglePause();
    }
  }

  // === Scene API ===
  return {
    init() {
      initGrid();
      shuffleBag();
      refillPieces();
      recalcLayout(W, H);

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointerdown', onPointerDownPause);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      window.addEventListener('keydown', onKeyDown);

      createPauseMenu();
      createInfoOverlay();
      createGameOverScreen();
    },

    onResize(w, h) {
      recalcLayout(w, h);
    },

    update(dt) {
      if (paused || gameOver) return;

      // Обновляем эффекты
      for (let i = effects.length - 1; i >= 0; i--) {
        if (!effects[i].update()) effects.splice(i, 1);
      }
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        if (!floatingTexts[i].update()) floatingTexts.splice(i, 1);
      }
    },

    render(ctx) {
      // Фон
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a1628');
      bg.addColorStop(0.5, '#162447');
      bg.addColorStop(1, '#1f4068');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      drawGrid(ctx);
      drawPieces(ctx);
      drawDragging(ctx);
      
      // Эффекты
      for (const effect of effects) effect.draw(ctx);
      for (const text of floatingTexts) text.draw(ctx);
      
      drawHUD(ctx);
    },

    onExit() {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerdown', onPointerDownPause);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('languageChanged', onLanguageChanged);

      if (pauseOverlay) pauseOverlay.remove();
      if (infoOverlay) infoOverlay.remove();
      if (gameOverOverlay) gameOverOverlay.remove();
    }
  };
}

export default LevelStack;
