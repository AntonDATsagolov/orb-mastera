// Level 1: Cash Catcher - Улучшенная версия "Лови падающие объекты"
// Механики: комбо-система, разные типы объектов, визуальные эффекты

import { AudioManager } from '../game/AudioManager.js';
import { SoundEffects } from '../game/SoundEffects.js';
import { showSettingsModal } from '../game/SettingsModal.js';
import { showGameResult } from '../ui/GameResultScreen.js';
import difficultyManager from '../core/DifficultyManager.js';
import i18n, { t } from '../i18n/LanguageManager.js';

// Типы падающих объектов
const ITEM_TYPES = {
  COIN: 'coin',           // Монета - 1 очко
  BILL: 'bill',           // Банкнота - 3 очка
  GOLD: 'gold',           // Золотой слиток - 10 очков (редкий)
  DIAMOND: 'diamond',     // Алмаз - 25 очков (очень редкий)
  BOMB: 'bomb',           // Бомба - потеря жизни или конец
  POWER_MAGNET: 'magnet', // Магнит
  POWER_SLOW: 'slow',     // Замедление
  POWER_MULT: 'mult',     // x2 очки
  POWER_SHIELD: 'shield', // Щит от бомб
  POWER_WIDE: 'wide'      // Расширение корзины
};

// Цвета и иконки
const ITEM_VISUALS = {
  coin: { color: '#FFD700', icon: '🪙', glow: '#FFA500' },
  bill: { color: '#85BB65', icon: '💵', glow: '#228B22' },
  gold: { color: '#FFD700', icon: '🥇', glow: '#FFD700' },
  diamond: { color: '#B9F2FF', icon: '💎', glow: '#00BFFF' },
  bomb: { color: '#FF4444', icon: '💣', glow: '#8B0000' },
  magnet: { color: '#E91E63', icon: '🧲', glow: '#C2185B' },
  slow: { color: '#2196F3', icon: '🐢', glow: '#1565C0' },
  mult: { color: '#9C27B0', icon: '✕2', glow: '#7B1FA2' },
  shield: { color: '#4CAF50', icon: '🛡️', glow: '#2E7D32' },
  wide: { color: '#FF9800', icon: '↔️', glow: '#E65100' }
};

/**
 * Класс эффекта частиц
 */
class CatchEffect {
  constructor(x, y, color, text = null) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.text = text;
    this.life = 1;
    this.particles = [];
    
    // Создаём частицы
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.particles.push({
        x: 0, y: 0,
        vx: Math.cos(angle) * (2 + Math.random() * 2),
        vy: Math.sin(angle) * (2 + Math.random() * 2) - 2,
        size: 3 + Math.random() * 3
      });
    }
  }

  update() {
    this.life -= 0.03;
    this.y -= 1.5; // Текст поднимается вверх
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.size *= 0.95;
    }
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    
    // Частицы
    ctx.translate(this.x, this.y + 30);
    for (const p of this.particles) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.translate(-this.x, -(this.y + 30));
    
    // Текст
    if (this.text) {
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFF';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.strokeText(this.text, this.x, this.y);
      ctx.fillText(this.text, this.x, this.y);
    }
    
    ctx.restore();
  }
}

function LevelCatch(engine, opts = {}) {
  const canvas = engine.canvas;
  let W = canvas.clientWidth, H = canvas.clientHeight;
  let ctx = engine.ctx;
  const container = document.getElementById('game-container');

  // Запуск музыки уровня
  AudioManager.playTrack('level1');

  // === Создание HUD элементов ===
  let hudOverlay = document.createElement('div');
  hudOverlay.id = 'catch-hud';
  hudOverlay.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; pointer-events: none; z-index: 100; padding: 10px;';
  hudOverlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div id="catch-score" style="color: #FFD700; font-size: 28px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">0</div>
        <div id="catch-combo" style="color: #FF5722; font-size: 18px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); opacity: 0;">COMBO x1</div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; flex: 1; gap: 4px;">
        <div id="catch-lives" style="color: #FF4444; font-size: 24px; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">❤❤❤</div>
        <div id="catch-power" style="color: #FFF; font-size: 20px; background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 10px; opacity: 0;"></div>
      </div>
      <div style="width: 56px;"></div>
    </div>
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
      <div id="catch-message" style="color: #FFF; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.7); opacity: 0; transition: opacity 0.2s;"></div>
    </div>
  `;
  container.appendChild(hudOverlay);

  const scoreEl = hudOverlay.querySelector('#catch-score');
  const comboEl = hudOverlay.querySelector('#catch-combo');
  const livesEl = hudOverlay.querySelector('#catch-lives');
  const powerEl = hudOverlay.querySelector('#catch-power');
  const messageEl = hudOverlay.querySelector('#catch-message');

  // === Состояние игры ===
  let running = true;
  let alive = true;
  let score = 0;
  let best = parseInt(localStorage.getItem('mbg-best') || '0', 10) || 0;
  let lives = 3;
  
  // Комбо система
  let combo = 0;
  let maxCombo = 0;
  let comboTimer = 0;
  const COMBO_TIMEOUT = 2000; // 2 секунды на продолжение комбо
  
  // Сложность с учётом адаптивной системы
  const difficultyMod = difficultyManager.getModifier('cashCatcher');
  let difficulty = 1 * difficultyMod; // Начальная сложность зависит от истории
  let totalCaught = 0;
  
  // Корзина
  const basket = {
    x: W / 2,
    y: H - 60,
    w: Math.max(80, Math.min(140, W * 0.25)),
    baseW: Math.max(80, Math.min(140, W * 0.25)),
    h: 30,
    targetX: W / 2,
    ease: 0.15
  };

  // Падающие объекты
  const items = [];
  const effects = [];
  let lastSpawn = performance.now();
  const spawnBase = 800;

  // Активные бонусы
  let activePowers = {}; // { type: { expires, ... } }

  // === Функции ===
  function rand(a, b) { return a + Math.random() * (b - a); }

  function getComboMultiplier() {
    if (combo >= 50) return 5;
    if (combo >= 30) return 4;
    if (combo >= 20) return 3;
    if (combo >= 10) return 2;
    if (combo >= 5) return 1.5;
    return 1;
  }

  function showMessage(text, duration = 1000) {
    messageEl.textContent = text;
    messageEl.style.opacity = '1';
    setTimeout(() => { messageEl.style.opacity = '0'; }, duration);
  }

  function updateLivesDisplay() {
    livesEl.textContent = '❤'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, 3 - lives));
  }

  function updateComboDisplay() {
    if (combo >= 5) {
      comboEl.textContent = `COMBO x${combo} (×${getComboMultiplier()})`;
      comboEl.style.opacity = '1';
      comboEl.style.transform = `scale(${1 + Math.min(combo, 30) * 0.02})`;
    } else {
      comboEl.style.opacity = '0';
    }
  }

  function updatePowerDisplay() {
    const powers = Object.keys(activePowers);
    if (powers.length > 0) {
      const icons = powers.map(p => ITEM_VISUALS[p]?.icon || '?').join(' ');
      powerEl.textContent = icons;
      powerEl.style.opacity = '1';
    } else {
      powerEl.style.opacity = '0';
    }
  }

  function applyPower(type) {
    const now = performance.now();
    const duration = type === 'shield' ? 10000 : 6000;
    
    activePowers[type] = { expires: now + duration };
    
    if (type === 'wide') {
      basket.w = basket.baseW * 1.5;
    }
    
    updatePowerDisplay();
    SoundEffects.playBonus();
    
    const names = {
      magnet: '🧲 МАГНИТ!',
      slow: '🐢 ЗАМЕДЛЕНИЕ!',
      mult: '✕2 ДВОЙНЫЕ ОЧКИ!',
      shield: '🛡️ ЩИТ!',
      wide: '↔️ ШИРОКАЯ КОРЗИНА!'
    };
    showMessage(names[type] || type.toUpperCase());
  }

  function clearPower(type) {
    delete activePowers[type];
    if (type === 'wide') {
      basket.w = basket.baseW;
    }
    updatePowerDisplay();
  }

  function hasPower(type) {
    return !!activePowers[type];
  }

  function spawn() {
    const now = performance.now();
    const r = Math.random();
    
    // Вероятности с учётом сложности
    const bombProb = Math.min(0.15, 0.02 + difficulty * 0.015);
    const powerProb = 0.08;
    const goldProb = 0.03;
    const diamondProb = 0.008;
    const billProb = 0.25;
    
    let type;
    if (r < diamondProb) type = ITEM_TYPES.DIAMOND;
    else if (r < diamondProb + goldProb) type = ITEM_TYPES.GOLD;
    else if (r < diamondProb + goldProb + powerProb) {
      const powers = [ITEM_TYPES.POWER_MAGNET, ITEM_TYPES.POWER_SLOW, ITEM_TYPES.POWER_MULT, ITEM_TYPES.POWER_SHIELD, ITEM_TYPES.POWER_WIDE];
      type = powers[Math.floor(Math.random() * powers.length)];
    }
    else if (r < diamondProb + goldProb + powerProb + bombProb) type = ITEM_TYPES.BOMB;
    else if (r < diamondProb + goldProb + powerProb + bombProb + billProb) type = ITEM_TYPES.BILL;
    else type = ITEM_TYPES.COIN;
    
    const size = type === ITEM_TYPES.DIAMOND ? 28 : 
                 type === ITEM_TYPES.GOLD ? 26 :
                 type === ITEM_TYPES.BILL ? 22 :
                 type === ITEM_TYPES.BOMB ? 24 : 18;
    
    let vy = 1.5 + Math.random() * 0.8 + difficulty * 0.2;
    if (hasPower('slow')) vy *= 0.5;
    
    items.push({
      x: 30 + Math.random() * (W - 60),
      y: -size - 10,
      vy,
      type,
      size,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.08,
      sparkle: 0
    });
  }

  function catchItem(item, index) {
    const visual = ITEM_VISUALS[item.type];
    const now = performance.now();
    
    // Определяем очки и действие
    let points = 0;
    let isPower = false;
    let isBomb = item.type === ITEM_TYPES.BOMB;
    
    switch (item.type) {
      case ITEM_TYPES.COIN: points = 1; break;
      case ITEM_TYPES.BILL: points = 3; break;
      case ITEM_TYPES.GOLD: points = 10; break;
      case ITEM_TYPES.DIAMOND: points = 25; break;
      case ITEM_TYPES.BOMB:
        if (hasPower('shield')) {
          // Щит защищает от бомбы
          clearPower('shield');
          showMessage('🛡️ ЩИТ ЗАЩИТИЛ!');
          effects.push(new CatchEffect(item.x, item.y, '#4CAF50', '🛡️'));
          SoundEffects.playBounce();
          items.splice(index, 1);
          return;
        }
        break;
      default:
        if (item.type.startsWith && !item.type.startsWith('power')) break;
        isPower = true;
        break;
    }
    
    // Бомба
    if (isBomb) {
      lives--;
      combo = 0;
      updateComboDisplay();
      updateLivesDisplay();
      effects.push(new CatchEffect(item.x, item.y, '#FF4444', '💥'));
      SoundEffects.playExplosion();
      showMessage('💥 БОМБА!');
      
      if (lives <= 0) {
        items.splice(index, 1);
        doGameOver();
        return;
      }
      items.splice(index, 1);
      return;
    }
    
    // Бонус
    if (isPower) {
      const powerType = item.type.replace('power_', '').replace('POWER_', '');
      applyPower(item.type);
      effects.push(new CatchEffect(item.x, item.y, visual?.color || '#FFF'));
      items.splice(index, 1);
      return;
    }
    
    // Обычный предмет - начисляем очки
    combo++;
    comboTimer = now;
    totalCaught++;
    maxCombo = Math.max(maxCombo, combo);
    
    // Применяем множители
    let multiplier = getComboMultiplier();
    if (hasPower('mult')) multiplier *= 2;
    
    const earnedPoints = Math.round(points * multiplier);
    score += earnedPoints;
    
    // Эффекты
    const text = earnedPoints > points ? `+${earnedPoints}` : `+${points}`;
    effects.push(new CatchEffect(item.x, item.y, visual?.color || '#FFF', text));
    
    // Звуки
    if (item.type === ITEM_TYPES.DIAMOND) {
      SoundEffects.playBonus();
      showMessage('💎 АЛМАЗ!');
    } else if (item.type === ITEM_TYPES.GOLD) {
      SoundEffects.playBonus();
      showMessage('🥇 ЗОЛОТО!');
    } else {
      SoundEffects.playBreak();
    }
    
    // Обновляем сложность
    if (totalCaught % 10 === 0) {
      difficulty += 0.3;
    }
    
    // Обновляем UI
    scoreEl.textContent = score;
    updateComboDisplay();
    
    items.splice(index, 1);
  }

  function missItem(item, index) {
    // Пропуск ценного предмета сбрасывает комбо
    if (item.type === ITEM_TYPES.COIN || item.type === ITEM_TYPES.BILL || 
        item.type === ITEM_TYPES.GOLD || item.type === ITEM_TYPES.DIAMOND) {
      combo = 0;
      updateComboDisplay();
      
      // Потеря жизни только за пропуск золота/алмаза
      if (item.type === ITEM_TYPES.GOLD || item.type === ITEM_TYPES.DIAMOND) {
        lives--;
        updateLivesDisplay();
        showMessage('ПРОПУЩЕНО!', 500);
        if (lives <= 0) {
          doGameOver();
          return true;
        }
      }
    }
    items.splice(index, 1);
    return false;
  }

  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nx = Math.max(rx, Math.min(cx, rx + rw));
    const ny = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  }

  // === Ввод ===
  function onPointerMove(e) {
    const r = canvas.getBoundingClientRect();
    basket.targetX = e.clientX - r.left;
  }
  canvas.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('mousemove', onPointerMove, { passive: true });

  // Тач для мобильных
  function onTouchMove(e) {
    if (e.touches.length > 0) {
      const r = canvas.getBoundingClientRect();
      basket.targetX = e.touches[0].clientX - r.left;
    }
  }
  canvas.addEventListener('touchmove', onTouchMove, { passive: true });

  // === Пауза ===
  let isPaused = false;
  let pauseOverlay = null;
  let infoOverlay = null;

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
    pauseOverlay.style.cssText = 'position: absolute; inset: 0; background: rgba(0,0,0,0.8); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 200;';
    pauseOverlay.innerHTML = `
      <div style="color: #FFF; font-size: 36px; margin-bottom: 30px;">⏸ ${t('pause.title')}</div>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="catch-resume" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; border-radius: 8px; min-width: 180px;">▶ ${t('pause.resume')}</button>
        <button id="catch-info" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #9C27B0, #7B1FA2); color: white; border: none; border-radius: 8px; min-width: 180px;">ℹ️ ${t('pause.info')}</button>
        <button id="catch-settings" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; min-width: 180px;">⚙️ ${t('settings.title')}</button>
        <button id="catch-restart" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #FF9800, #F57C00); color: white; border: none; border-radius: 8px; min-width: 180px;">🔄 ${t('pause.restart')}</button>
        <button id="catch-menu" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border: none; border-radius: 8px; min-width: 180px;">🏠 ${t('pause.menu')}</button>
      </div>
    `;
    container.appendChild(pauseOverlay);

    pauseOverlay.querySelector('#catch-resume').onclick = () => { SoundEffects.playClick(); resumeGame(); };
    pauseOverlay.querySelector('#catch-info').onclick = () => { SoundEffects.playClick(); showInfo(); };
    pauseOverlay.querySelector('#catch-settings').onclick = () => { SoundEffects.playClick(); showSettingsModal(); };
    pauseOverlay.querySelector('#catch-restart').onclick = () => { SoundEffects.playClick(); restartGame(); };
    pauseOverlay.querySelector('#catch-menu').onclick = () => { SoundEffects.playClick(); engine.goTo('menu'); };
  }

  function createInfoOverlay() {
    infoOverlay = document.createElement('div');
    infoOverlay.id = 'catch-info-overlay';
    infoOverlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: none; flex-direction: column; justify-content: flex-start; align-items: center; z-index: 210; overflow-y: auto; padding: 20px; box-sizing: border-box;';

    const infoTitle = document.createElement('div');
    infoTitle.textContent = '📖 Как играть в Cash Catcher';
    infoTitle.style.cssText = 'color: #FFD700; font-size: 26px; margin-bottom: 20px; text-align: center; text-shadow: 0 0 10px rgba(255,215,0,0.5);';
    infoOverlay.appendChild(infoTitle);

    const infoContent = document.createElement('div');
    infoContent.style.cssText = 'color: white; font-size: 14px; max-width: 380px; line-height: 1.6;';
    infoContent.innerHTML = `
      <div style="margin-bottom: 20px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 10px; border: 1px solid rgba(255,215,0,0.3);">
        <div style="font-weight: bold; margin-bottom: 8px; color: #4FC3F7; font-size: 16px;">🎯 Цель игры</div>
        <div>Лови падающие ценности корзиной! Набирай очки и избегай бомб. Двигай корзину мышкой или пальцем.</div>
      </div>

      <div style="font-weight: bold; margin-bottom: 12px; color: #FFF; font-size: 16px;">💰 Падающие предметы:</div>

      <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 10px; background: rgba(255,215,0,0.15); border-radius: 8px;">
        <div style="width: 40px; height: 40px; background: radial-gradient(circle, #FFD700, #FFA500); border-radius: 50%; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 20px;">🪙</div>
        <div><b style="color: #FFD700;">Монета</b> — 1 очко. Часто падает.</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 10px; background: rgba(133,187,101,0.15); border-radius: 8px;">
        <div style="width: 40px; height: 40px; background: radial-gradient(circle, #85BB65, #228B22); border-radius: 50%; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 20px;">💵</div>
        <div><b style="color: #85BB65;">Купюра</b> — 3 очка. Падает часто.</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 10px; background: rgba(255,215,0,0.2); border-radius: 8px;">
        <div style="width: 40px; height: 40px; background: radial-gradient(circle, #FFD700, #B8860B); border-radius: 50%; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 20px;">🥇</div>
        <div><b style="color: #FFD700;">Золотой слиток</b> — 10 очков! Редкий. <span style="color: #FF6B6B;">Пропуск = -1 жизнь</span></div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 10px; background: rgba(185,242,255,0.15); border-radius: 8px;">
        <div style="width: 40px; height: 40px; background: radial-gradient(circle, #B9F2FF, #00BFFF); border-radius: 50%; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 20px;">💎</div>
        <div><b style="color: #B9F2FF;">Алмаз</b> — 25 очков!! Очень редкий. <span style="color: #FF6B6B;">Пропуск = -1 жизнь</span></div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; background: rgba(255,68,68,0.2); border-radius: 8px; border: 1px solid rgba(255,68,68,0.4);">
        <div style="width: 40px; height: 40px; background: radial-gradient(circle, #FF4444, #8B0000); border-radius: 50%; margin-right: 12px; display: flex; justify-content: center; align-items: center; font-size: 20px;">💣</div>
        <div><b style="color: #FF4444;">Бомба</b> — НЕ ЛОВИ! Потеря жизни и сброс комбо.</div>
      </div>

      <div style="font-weight: bold; margin-bottom: 12px; color: #FFF; font-size: 16px;">⚡ Бонусы (Power-ups):</div>

      <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; background: rgba(233,30,99,0.15); border-radius: 6px;">
        <div style="width: 35px; height: 35px; background: radial-gradient(circle, #E91E63, #C2185B); border-radius: 50%; margin-right: 10px; display: flex; justify-content: center; align-items: center; font-size: 16px;">🧲</div>
        <div><b style="color: #E91E63;">Магнит</b> — притягивает ценности к корзине (6 сек)</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; background: rgba(33,150,243,0.15); border-radius: 6px;">
        <div style="width: 35px; height: 35px; background: radial-gradient(circle, #2196F3, #1565C0); border-radius: 50%; margin-right: 10px; display: flex; justify-content: center; align-items: center; font-size: 16px;">🐢</div>
        <div><b style="color: #2196F3;">Замедление</b> — предметы падают в 2 раза медленнее (6 сек)</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; background: rgba(156,39,176,0.15); border-radius: 6px;">
        <div style="width: 35px; height: 35px; background: radial-gradient(circle, #9C27B0, #7B1FA2); border-radius: 50%; margin-right: 10px; display: flex; justify-content: center; align-items: center; font-size: 14px; color: #FFF; font-weight: bold;">✕2</div>
        <div><b style="color: #9C27B0;">Двойные очки</b> — ×2 к очкам за поимку (6 сек)</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; background: rgba(76,175,80,0.15); border-radius: 6px;">
        <div style="width: 35px; height: 35px; background: radial-gradient(circle, #4CAF50, #2E7D32); border-radius: 50%; margin-right: 10px; display: flex; justify-content: center; align-items: center; font-size: 16px;">🛡️</div>
        <div><b style="color: #4CAF50;">Щит</b> — защита от одной бомбы (10 сек)</div>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 8px; background: rgba(255,152,0,0.15); border-radius: 6px;">
        <div style="width: 35px; height: 35px; background: radial-gradient(circle, #FF9800, #E65100); border-radius: 50%; margin-right: 10px; display: flex; justify-content: center; align-items: center; font-size: 16px;">↔️</div>
        <div><b style="color: #FF9800;">Широкая корзина</b> — увеличивает размер на 50% (6 сек)</div>
      </div>

      <div style="margin-bottom: 15px; padding: 12px; background: linear-gradient(135deg, rgba(255,87,34,0.2), rgba(255,152,0,0.2)); border-radius: 10px; border: 1px solid rgba(255,152,0,0.4);">
        <div style="font-weight: bold; margin-bottom: 8px; color: #FF5722; font-size: 16px;">🔥 Комбо-система</div>
        <div style="margin-bottom: 8px;">Лови предметы подряд, чтобы увеличивать комбо!</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 13px;">
          <div>• 5+ комбо → <b style="color: #FFD700;">×1.5</b></div>
          <div>• 10+ комбо → <b style="color: #FFD700;">×2</b></div>
          <div>• 20+ комбо → <b style="color: #FFD700;">×3</b></div>
          <div>• 30+ комбо → <b style="color: #FFD700;">×4</b></div>
          <div>• 50+ комбо → <b style="color: #FFD700;">×5</b></div>
        </div>
        <div style="margin-top: 8px; font-size: 13px; color: #FFA726;">⚠️ Комбо сбрасывается через 2 сек без поимки или при попадании бомбы!</div>
      </div>

      <div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 10px; text-align: center;">
        <div style="color: #FFEB3B; font-size: 15px; margin-bottom: 6px;">💡 Советы</div>
        <div style="font-size: 13px; line-height: 1.5;">
          • Приоритет: 💎 → 🥇 → 💵 → 🪙<br>
          • Собирай бонусы для облегчения игры<br>
          • Держи комбо для максимальных очков!<br>
          • Сложность растёт каждые 10 поимок
        </div>
      </div>
    `;
    infoOverlay.appendChild(infoContent);

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Назад';
    backBtn.style.cssText = 'padding: 12px 40px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #666, #444); color: white; border: none; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
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

  function pauseGame() {
    if (isPaused || !alive) return;
    isPaused = true;
    running = false;
    pauseOverlay.style.display = 'flex';
  }

  function resumeGame() {
    isPaused = false;
    running = alive;
    pauseOverlay.style.display = 'none';
  }

  function restartGame() {
    score = 0;
    lives = 3;
    combo = 0;
    maxCombo = 0;
    difficulty = 1;
    totalCaught = 0;
    items.length = 0;
    effects.length = 0;
    activePowers = {};
    alive = true;
    running = true;
    isPaused = false;
    gameStartTime = Date.now(); // Сброс времени
    
    scoreEl.textContent = '0';
    updateLivesDisplay();
    updateComboDisplay();
    updatePowerDisplay();
    pauseOverlay.style.display = 'none';
    if (gameOverOverlay) gameOverOverlay.style.display = 'none';
  }

  // === Game Over ===
  let gameOverOverlay = null;

  function createGameOverScreen() {
    gameOverOverlay = document.createElement('div');
    gameOverOverlay.style.cssText = 'position: absolute; inset: 0; background: rgba(0,0,0,0.85); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 200;';
    gameOverOverlay.innerHTML = `
      <div style="color: #FFD700; font-size: 42px; margin-bottom: 20px;">🏆 ${i18n.t('results.gameOver')}</div>
      <div id="catch-final-score" style="color: #FFF; font-size: 32px; margin-bottom: 10px;">${i18n.t('game.score')}: 0</div>
      <div id="catch-best-score" style="color: #4CAF50; font-size: 24px; margin-bottom: 10px;">${i18n.t('game.best')}: 0</div>
      <div id="catch-max-combo" style="color: #FF5722; font-size: 20px; margin-bottom: 30px;">${i18n.t('game.combo')}: 0</div>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="catch-retry" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; border-radius: 8px; min-width: 180px;">🔄 ${i18n.t('results.tryAgain')}</button>
        <button id="catch-to-menu" style="padding: 12px 30px; font-size: 18px; cursor: pointer; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border: none; border-radius: 8px; min-width: 180px;">🏠 ${i18n.t('results.backToMenu')}</button>
      </div>
    `;
    container.appendChild(gameOverOverlay);

    gameOverOverlay.querySelector('#catch-retry').onclick = () => { SoundEffects.playClick(); restartGame(); };
    gameOverOverlay.querySelector('#catch-to-menu').onclick = () => { SoundEffects.playClick(); engine.goTo('menu'); };
  }

  function doGameOver() {
    alive = false;
    running = false;
    
    best = Math.max(best, score);
    localStorage.setItem('mbg-best', String(best));
    
    // Получаем текущий stage из localStorage (установлен MainMenu)
    const currentStage = parseInt(localStorage.getItem('orb-masters-current-stage')) || 1;
    
    // Показываем новый экран результатов с Orbs
    showGameResult({
      mode: 'catch',
      score: score,
      combo: maxCombo,
      stage: currentStage,
      duration: Math.floor((Date.now() - gameStartTime) / 1000),
      isPerfect: lives === 3, // Не потерял ни одной жизни
      isWin: score > 0,
      engine: engine,
      onRetry: () => {
        restartGame();
      },
      onHome: () => {
        engine.goTo('menu');
      }
    });
    
    SoundEffects.playGameOver();
  }

  // Время начала игры для расчёта duration
  let gameStartTime = Date.now();

  // Кнопка паузы на canvas
  const pauseBtnRect = { x: W - 56, y: 8, width: 48, height: 48 };

  function isPauseButtonClicked(x, y) {
    return x >= pauseBtnRect.x && x <= pauseBtnRect.x + pauseBtnRect.width &&
           y >= pauseBtnRect.y && y <= pauseBtnRect.y + pauseBtnRect.height;
  }

  function onPointerDown(e) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    
    if (isPauseButtonClicked(x, y) && alive && !isPaused) {
      SoundEffects.playClick();
      pauseGame();
    }
  }
  canvas.addEventListener('pointerdown', onPointerDown);

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (isPaused) resumeGame();
      else pauseGame();
    }
  }
  window.addEventListener('keydown', onKeyDown);

  // Инициализация UI
  createPauseMenu();
  createInfoOverlay();
  createGameOverScreen();

  // === Рендеринг ===
  function drawBasket(ctx) {
    const { x, y, w, h } = basket;
    
    // Свечение при активных бонусах
    if (Object.keys(activePowers).length > 0) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
    }
    
    // Основа корзины
    const grad = ctx.createLinearGradient(x - w/2, y - h, x + w/2, y + h);
    grad.addColorStop(0, 'rgba(255,220,150,0.9)');
    grad.addColorStop(0.5, 'rgba(200,150,80,0.85)');
    grad.addColorStop(1, 'rgba(150,100,50,0.9)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x - w/2, y - h/2, w, h, 8);
    ctx.fill();
    
    // Обводка
    ctx.strokeStyle = 'rgba(100,60,20,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Щит индикатор
    if (hasPower('shield')) {
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, w/2 + 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
  }

  function drawItem(ctx, item) {
    const visual = ITEM_VISUALS[item.type] || ITEM_VISUALS.coin;
    
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rot);
    
    // Свечение
    const glow = ctx.createRadialGradient(0, 0, item.size * 0.3, 0, 0, item.size * 1.5);
    glow.addColorStop(0, visual.glow + '40');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, item.size * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Основа
    const grad = ctx.createRadialGradient(-item.size * 0.3, -item.size * 0.3, 0, 0, 0, item.size);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, visual.color);
    grad.addColorStop(1, visual.glow);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, item.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Иконка
    ctx.rotate(-item.rot); // Выравниваем иконку
    ctx.fillStyle = '#FFF';
    ctx.font = `${item.size * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(visual.icon, 0, 2);
    
    ctx.restore();
  }

  function drawPauseButton(ctx) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.roundRect(pauseBtnRect.x, pauseBtnRect.y, pauseBtnRect.width, pauseBtnRect.height, 10);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    const barW = 6, barH = 20, gap = 5;
    const startX = pauseBtnRect.x + (pauseBtnRect.width - barW * 2 - gap) / 2;
    const startY = pauseBtnRect.y + (pauseBtnRect.height - barH) / 2;
    ctx.fillRect(startX, startY, barW, barH);
    ctx.fillRect(startX + barW + gap, startY, barW, barH);
  }

  // === Главный цикл ===
  return {
    onResize(w, h) {
      W = w;
      H = h;
      basket.y = H - 60;
      basket.baseW = Math.max(80, Math.min(140, W * 0.25));
      if (!hasPower('wide')) basket.w = basket.baseW;
      pauseBtnRect.x = W - 56;
    },

    init() {
      score = 0;
      lives = 3;
      combo = 0;
      maxCombo = 0;
      difficulty = 1;
      totalCaught = 0;
      items.length = 0;
      effects.length = 0;
      activePowers = {};
      lastSpawn = performance.now();
      running = true;
      alive = true;
      
      scoreEl.textContent = '0';
      updateLivesDisplay();
      updateComboDisplay();
      updatePowerDisplay();
    },

    update(dt) {
      if (!running || !alive) return;
      
      const now = performance.now();
      
      // Спавн
      const spawnInterval = Math.max(300, spawnBase - difficulty * 50);
      if (now - lastSpawn > spawnInterval) {
        spawn();
        lastSpawn = now;
      }
      
      // Проверка таймаута комбо
      if (combo > 0 && now - comboTimer > COMBO_TIMEOUT) {
        combo = 0;
        updateComboDisplay();
      }
      
      // Проверка истечения бонусов
      for (const [type, power] of Object.entries(activePowers)) {
        if (now > power.expires) {
          clearPower(type);
        }
      }
      
      // Обновление предметов
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        
        // Эффект магнита
        if (hasPower('magnet') && item.type !== ITEM_TYPES.BOMB) {
          const dx = basket.x - item.x;
          item.x += dx * 0.05;
        }
        
        // Замедление
        const slowFactor = hasPower('slow') ? 0.5 : 1;
        item.vy += 0.06 * slowFactor;
        item.y += item.vy * slowFactor;
        item.rot += item.spin;
        
        // Блеск для редких предметов
        if (item.type === ITEM_TYPES.GOLD || item.type === ITEM_TYPES.DIAMOND) {
          item.sparkle = (item.sparkle + 0.1) % (Math.PI * 2);
        }
        
        // Проверка поимки
        if (circleRect(item.x, item.y, item.size, basket.x - basket.w/2, basket.y - basket.h/2, basket.w, basket.h)) {
          catchItem(item, i);
          continue;
        }
        
        // Проверка пропуска
        if (item.y - item.size > H + 20) {
          if (missItem(item, i)) return;
        }
      }
      
      // Движение корзины
      basket.x += (basket.targetX - basket.x) * basket.ease;
      basket.x = Math.max(basket.w/2, Math.min(W - basket.w/2, basket.x));
      
      // Обновление эффектов
      for (let i = effects.length - 1; i >= 0; i--) {
        if (!effects[i].update()) {
          effects.splice(i, 1);
        }
      }
    },

    render(ctx) {
      // Фон
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1a237e');
      bg.addColorStop(0.5, '#283593');
      bg.addColorStop(1, '#3949ab');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      
      // Звёзды на фоне
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137) % W;
        const sy = (i * 89) % (H * 0.6);
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Предметы
      for (const item of items) {
        drawItem(ctx, item);
      }
      
      // Корзина
      drawBasket(ctx);
      
      // Эффекты
      for (const effect of effects) {
        effect.draw(ctx);
      }
      
      // Кнопка паузы
      if (alive) {
        drawPauseButton(ctx);
      }
    },

    onExit() {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('languageChanged', onLanguageChanged);
      
      if (hudOverlay) hudOverlay.remove();
      if (pauseOverlay) pauseOverlay.remove();
      if (infoOverlay) infoOverlay.remove();
      if (gameOverOverlay) gameOverOverlay.remove();
    }
  };
}

export default LevelCatch;
