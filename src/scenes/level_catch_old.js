import { AudioManager } from '../game/AudioManager.js';
import { SoundEffects } from '../game/SoundEffects.js';
import { showSettingsModal } from '../game/SettingsModal.js';

function LevelCatch(engine, opts = {}) {
  const canvas = engine.canvas;
  let W = canvas.clientWidth, H = canvas.clientHeight;
  let ctx = engine.ctx;
  const container = document.getElementById('game-container');

  // Запуск музыки уровня
  AudioManager.playTrack('level1');

  // HUD DOM refs (если элементов нет — создаём)
  const scoreEl = document.getElementById('score') || createHudEl('score','Score: 0');
  const bestEl = document.getElementById('best') || createHudEl('best','Best: 0');
  // overlay и итоговые поля могут отсутствовать в DOM — создаём при необходимости
  let overlay = document.getElementById('overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.style.display = 'none';
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '2000';
    container.appendChild(overlay);
  }
  // finalScore / bestScore: если нет — создаём как HUD элементы
  const finalScore = document.getElementById('finalScore') || createHudEl('finalScore', '');
  const bestScore = document.getElementById('bestScore') || createHudEl('bestScore', '');

  // добавим lives и powerSlot если нет
  let livesEl = document.getElementById('lives');
  if (!livesEl) {
    livesEl = document.createElement('div'); livesEl.id = 'lives'; livesEl.textContent = '❤ 3';
    const hud = document.getElementById('hud') || container;
    hud.appendChild(livesEl);
  }
  let powerSlotEl = document.getElementById('powerSlot');
  if (!powerSlotEl) {
    powerSlotEl = document.createElement('div'); powerSlotEl.id = 'powerSlot'; powerSlotEl.textContent = '';
    const hud = document.getElementById('hud') || container;
    hud.appendChild(powerSlotEl);
  }

  function createHudEl(id, text){
    const el = document.createElement('div'); el.id = id; el.textContent = text;
    const hud = document.getElementById('hud') || container;
    hud.appendChild(el); return el;
  }

  // state
  let running = true;
  let alive = true;
  let score = 0;
  let best = parseInt(localStorage.getItem('mbg-best')||'0',10) || 0;
  bestEl.textContent = `Best: ${best}`;

  let lives = 3;
  livesEl.textContent = `❤ ${lives}`;

  // basket
  const basket = { x: W/2, y: H-54, w: Math.max(80, Math.min(160, W*0.28)), h: 26, targetX: W/2, ease: 0.18 };

  // items array: {x,y,vy,size,type,rot,spin,subtype}
  const items = [];
  const spawnBase = 720;
  let lastSpawn = performance.now();
  let difficulty = 1;

  // power state
  let activePower = null; // {type,expires}
  function applyPower(type){
    const now = performance.now();
    if (type === 'mult') {
      activePower = { type:'mult', expires: now + 7000 };
      powerSlotEl.textContent = 'x2';
      window.showRuntimeMessage && window.showRuntimeMessage('Двойные очки!');
    } else if (type === 'magnet') {
      activePower = { type:'magnet', expires: now + 6000 };
      powerSlotEl.textContent = '🧲';
      window.showRuntimeMessage && window.showRuntimeMessage('Магнит!');
    } else if (type === 'slow') {
      activePower = { type:'slow', expires: now + 6000 };
      powerSlotEl.textContent = '🐢';
      window.showRuntimeMessage && window.showRuntimeMessage('Замедление!');
    } else if (type === 'haste') {
      activePower = { type:'haste', expires: now + 6000 };
      powerSlotEl.textContent = '⚡';
      // make basket more responsive while active
      basket.ease = 0.35;
      window.showRuntimeMessage && window.showRuntimeMessage('Ускорение управления!');
    }
  }
  function clearPower(){
    activePower = null; powerSlotEl.textContent = ''; basket.ease = 0.18;
  }

  // helpers
  function rand(a,b){ return a + Math.random()*(b-a); }

  function spawn() {
    const r = Math.random();
    const bombProb = Math.min(0.18, 0.03 + difficulty * 0.02); // bombs are bad (catching -> game over)
    const powerProb = 0.06;
    let type = 'good';
    if (r < powerProb) type = 'power';
    else if (r < powerProb + bombProb) type = 'bomb';
    else type = 'good';

    const subtype = type === 'power' ? ['slow','haste','magnet','mult'][Math.floor(Math.random()*4)] : null;
    const size = (type==='good') ? (14 + Math.random()*14) : (type==='bomb'? 20 + Math.random()*10 : 20);
    const x = 24 + Math.random() * (W - 48);
    let vy = 1.2 + Math.random()*0.9 + difficulty*0.25;
    // if slow power active, objects fall slower
    if (activePower && activePower.type === 'slow') vy *= 0.6;
    const rot = Math.random() * Math.PI*2;
    const spin = (Math.random()-0.5)*0.06;
    items.push({ x, y: -size - 6, vy, type, size, rot, spin, subtype });
  }

  function circleRect(cx,cy,r,rx,ry,rw,rh){
    const nx = Math.max(rx, Math.min(cx, rx+rw));
    const ny = Math.max(ry, Math.min(cy, ry+rh));
    const dx = cx-nx, dy = cy-ny;
    return dx*dx+dy*dy <= r*r;
  }

  // input
  function onPointerMove(e){
    const r = canvas.getBoundingClientRect();
    basket.targetX = e.clientX - r.left;
  }
  canvas.addEventListener('pointermove', onPointerMove, { passive:true });
  window.addEventListener('mousemove', onPointerMove, { passive:true });

  // pause UI (reuse pattern used earlier)
  let isPaused = false;
  let pauseCleanup = null;
  function installPause(){
    const pauseEl = document.createElement('div'); pauseEl.style.position='absolute'; pauseEl.style.right='12px'; pauseEl.style.top='12px'; pauseEl.style.zIndex='999';
    pauseEl.innerHTML = `<button id="pause-btn" style="padding:6px 10px;border-radius:8px;border:0;cursor:pointer">Pause</button>`;
    container.appendChild(pauseEl);
    const pauseMenu = document.createElement('div');
    pauseMenu.style.position='absolute'; pauseMenu.style.inset='0'; pauseMenu.style.display='none'; pauseMenu.style.alignItems='center'; pauseMenu.style.justifyContent='center'; pauseMenu.style.background='rgba(2,6,23,0.5)'; pauseMenu.style.zIndex='1000';
    pauseMenu.innerHTML = `<div style="background:#fff;padding:18px;border-radius:12px;text-align:center;color:#042">
      <div style="font-weight:800;margin-bottom:10px">Пауза</div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:center">
        <button id="resume-btn" style="padding:8px 12px;border-radius:8px;border:0;cursor:pointer;min-width:140px">Продолжить</button>
        <button id="settings-btn" style="padding:8px 12px;border-radius:8px;border:0;cursor:pointer;min-width:140px;background:linear-gradient(90deg,#667eea,#764ba2);color:white">⚙️ Настройки</button>
        <button id="menu-btn" style="padding:8px 12px;border-radius:8px;border:0;cursor:pointer;min-width:140px">В меню</button>
      </div>
    </div>`;
    container.appendChild(pauseMenu);
    function setPaused(v){
      isPaused = v; running = !v && alive;
      pauseMenu.style.display = v ? 'flex' : 'none';
      if (v) window.showRuntimeMessage && window.showRuntimeMessage('Игра приостановлена — Esc или Продолжить'); else window.showRuntimeMessage && window.showRuntimeMessage('');
    }
    pauseEl.querySelector('#pause-btn').addEventListener('click', ()=> { SoundEffects.playClick(); setPaused(true); });
    pauseMenu.querySelector('#resume-btn').addEventListener('click', ()=> { SoundEffects.playClick(); setPaused(false); });
    pauseMenu.querySelector('#settings-btn').addEventListener('click', ()=> { SoundEffects.playClick(); showSettingsModal(); });
    pauseMenu.querySelector('#menu-btn').addEventListener('click', ()=> { SoundEffects.playClick(); engine.goTo('menu'); });
    function onKey(e){ if (e.key === 'Escape') setPaused(!isPaused); }
    window.addEventListener('keydown', onKey);
    pauseCleanup = () => { pauseEl.remove(); pauseMenu.remove(); window.removeEventListener('keydown', onKey); };
  }
  installPause();

  function saveProgress() {
    localStorage.setItem('mbg-lastScore', String(score));
    localStorage.setItem('mbg-lastLevel', '1');
  }

  function doGameOver() {
    alive = false; running = false;
    finalScore.textContent = `Очки: ${score}`;
    overlay.style.display = 'flex';
    best = Math.max(best, score); localStorage.setItem('mbg-best', String(best));
    bestScore.textContent = `Рекорд: ${best}`;
    saveProgress();
  }

  // helper: безопасно записывает текст в элемент по id, если он есть
  function setTextIfExists(id, text){
    const el = document.getElementById(id);
    if(el) el.textContent = text;
  }

  // main loop update/render functions used by Engine
  return {
    onResize(w,h){ W=w; H=h; basket.y = H-54; basket.w = Math.max(80, Math.min(160, W*0.28)); },
    init(){ score = 0; items.length = 0; lastSpawn = performance.now(); running = true; alive = true; scoreEl.textContent = '0'; powerSlotEl.textContent=''; lives = 3; livesEl.textContent = `❤ ${lives}`; },
    update(dt){
      if(!(running && alive)) return;
      const ts = performance.now();
      const spawnInterval = Math.max(260, spawnBase - difficulty*40);
      if(ts - lastSpawn > spawnInterval){ spawn(); lastSpawn = ts; }
      // update active power expiration
      if (activePower && ts > activePower.expires) clearPower();

      for(let i = items.length - 1; i >= 0; i--){
        const it = items[i];
        // magnet effect
        if (activePower && activePower.type === 'magnet' && it.type !== 'bomb' && it.type !== 'power') {
          const dx = basket.x - it.x; it.x += dx * 0.06;
        }
        // gravity or slow effect
        const slowFactor = activePower && activePower.type === 'slow' ? 0.55 : 1;
        it.vy += 0.08 * slowFactor;
        it.y += it.vy; it.rot += it.spin;

        // caught?
        if (circleRect(it.x, it.y, it.size, basket.x - basket.w/2, basket.y - basket.h/2, basket.w, basket.h)) {
          if (it.type === 'good') {
            const pts = (activePower && activePower.type === 'mult') ? 2 : 1;
            score += pts; scoreEl.textContent = String(score);
            // reward difficulty/streak logic
            if (score % 5 === 0) difficulty += 0.4;
            window.showRuntimeMessage && window.showRuntimeMessage('+1');
          } else if (it.type === 'bomb') {
            // bomb caught -> explosion + game over
            // small visual: draw explosion marker (one frame)
            items.splice(i,1);
            // show immediate explosion message and end
            window.showRuntimeMessage && window.showRuntimeMessage('Бомба! Конец игры');
            doGameOver();
            return;
          } else if (it.type === 'power') {
            applyPower(it.subtype);
          }
          items.splice(i,1);
          continue;
        }

        // missed: if a good ball goes below screen -> lose life
        if (it.y - it.size > H + 40) {
          if (it.type === 'good') {
            lives--; livesEl.textContent = `❤ ${lives}`;
            window.showRuntimeMessage && window.showRuntimeMessage(`Пропущено! —${lives>0?` жизни: ${lives}`:'0'}`);
            if (lives <= 0) { doGameOver(); return; }
          }
          items.splice(i,1);
        }
      }

      // basket follow
      basket.x += (basket.targetX - basket.x) * basket.ease;
      basket.x = Math.max(basket.w/2, Math.min(W - basket.w/2, basket.x));

      // occasional autosave
      if (ts % 5000 < 40) saveProgress();
    },
    render(ctx){
      ctx.clearRect(0,0,W,H);
      const bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0b1538'); bg.addColorStop(1,'#3a1e62');
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

      // items
      for(const it of items){
        ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot);
        if (it.type === 'good') {
          const s = it.size;
          ctx.fillStyle = 'rgba(126,231,200,0.12)'; ctx.beginPath(); ctx.ellipse(0,0,s*1.5,s*1.5,0,0,Math.PI*2); ctx.fill();
          const g = ctx.createLinearGradient(-s,-s,s,s); g.addColorStop(0,'#9ff0df'); g.addColorStop(1,'#48d0b2');
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0,0,s,s,0,0,Math.PI*2); ctx.fill();
        } else if (it.type === 'bomb') {
          // bomb visual: dark core + little fuse
          const s = it.size;
          ctx.fillStyle = 'rgba(200,60,60,0.14)'; ctx.beginPath(); ctx.ellipse(0,0,s*1.6,s*1.6,0,0,Math.PI*2); ctx.fill();
          const g2 = ctx.createLinearGradient(-s,-s,s,s); g2.addColorStop(0,'#ff9b9b'); g2.addColorStop(1,'#ff5252');
          ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(0,0,s,s,0,0,Math.PI*2); ctx.fill();
          // fuse
          ctx.strokeStyle = '#FFEB3B'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(s*0.6, -s*0.8); ctx.lineTo(s*1.1, -s*1.4); ctx.stroke();
          ctx.fillStyle = 'rgba(30,10,10,0.9)'; ctx.beginPath(); ctx.arc(-s*0.18, -s*0.05, s*0.14, 0, Math.PI*2); ctx.fill();
        } else if (it.type === 'power') {
          const s = it.size;
          ctx.fillStyle = 'rgba(160,160,255,0.09)'; ctx.beginPath(); ctx.ellipse(0,0,s*1.4,s*1.4,0,0,Math.PI*2); ctx.fill();
          ctx.fillStyle = '#8fb4ff'; ctx.beginPath(); ctx.ellipse(0,0,s*0.9,s*0.9,0,0,Math.PI*2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.font = `${Math.max(10, s*0.5)}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
          const icon = it.subtype === 'magnet' ? '🧲' : (it.subtype === 'mult' ? '2x' : (it.subtype === 'slow' ? '🐢' : '⚡'));
          ctx.fillText(icon, 0, 0);
        }
        ctx.restore();
      }

      // basket
      ctx.save();
      const bx = basket.x, by = basket.y, bw = basket.w, bh = basket.h;
      const g = ctx.createLinearGradient(bx - bw/2, by - bh, bx + bw/2, by + bh);
      g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0.03)');
      ctx.fillStyle = g; roundRect(ctx, bx - bw/2, by - bh/2, bw, bh, bh*0.5); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke();
      ctx.restore();
    },
    onExit(){
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onPointerMove);
      if (pauseCleanup) pauseCleanup();
      clearPower();
    }
  };
}

export default LevelCatch;