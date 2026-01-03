// Простые DOM‑утилиты для level_stack (создаются в контейнере #game-container)
import { SoundEffects } from '../../game/SoundEffects.js';
import { showSettingsModal } from '../../game/SettingsModal.js';

function createToast(container){
    // фиксированное уведомление в верхнем левом углу (относительно viewport),
    // чтобы не зависеть от позиционирования #game-container
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = '14px';
    el.style.top = '14px';
    el.style.padding = '8px 12px';
    el.style.background = 'rgba(4,20,34,0.85)'; // тёмный стиль
    el.style.color = '#e6fff6';
    el.style.borderRadius = '10px';
    el.style.fontWeight = '700';
    el.style.display = 'none';
    el.style.zIndex = '3000';
    document.body.appendChild(el);
    let timer = null;
    return {
      show(msg, ms = 1400){
        clearTimeout(timer);
        el.textContent = msg;
        el.style.display = msg ? 'block' : 'none';
        if(msg) timer = setTimeout(()=> el.style.display = 'none', ms);
      },
      remove(){ clearTimeout(timer); el.remove(); }
    };
  }

  function createPauseUI(container, onResume, onMenu){
    const pauseOverlay = document.createElement('div');
    pauseOverlay.style.position = 'absolute';
    pauseOverlay.style.inset = '0';
    pauseOverlay.style.display = 'none';
    pauseOverlay.style.alignItems = 'center';
    pauseOverlay.style.justifyContent = 'center';
    pauseOverlay.style.background = 'rgba(2,6,23,0.55)';
    pauseOverlay.style.zIndex = '1001';
    pauseOverlay.innerHTML = `<div style="background:linear-gradient(180deg,#fff,#e6fff6);padding:16px;border-radius:12px;text-align:center;color:#042">
      <div style="font-weight:800;margin-bottom:8px">Пауза</div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:center">
        <button id="resume-p" style="padding:8px 12px;border-radius:8px;border:0;cursor:pointer;min-width:140px">Продолжить</button>
        <button id="settings-p" style="padding:8px 12px;border-radius:8px;border:0;cursor:pointer;min-width:140px;background:linear-gradient(90deg,#667eea,#764ba2);color:white">⚙️ Настройки</button>
        <button id="menu-p" style="padding:8px 12px;border-radius:8px;border:0;cursor:pointer;min-width:140px">В меню</button>
      </div>
    </div>`;
    container.appendChild(pauseOverlay);
    pauseOverlay.querySelector('#resume-p').addEventListener('click', () => { SoundEffects.playClick(); onResume(); });
    pauseOverlay.querySelector('#settings-p').addEventListener('click', () => { SoundEffects.playClick(); showSettingsModal(); });
    pauseOverlay.querySelector('#menu-p').addEventListener('click', () => { SoundEffects.playClick(); onMenu(); });

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'Pause';
    pauseBtn.style.position = 'absolute';
    pauseBtn.style.right = '12px';
    pauseBtn.style.top = '12px';
    pauseBtn.style.zIndex = '1200';
    pauseBtn.style.padding = '8px 10px';
    pauseBtn.style.borderRadius = '10px';
    pauseBtn.style.border = '0';
    pauseBtn.style.cursor = 'pointer';
    pauseBtn.style.background = 'linear-gradient(90deg,#7EE7C8,#4ad9b3)';
    container.appendChild(pauseBtn);

    return {
      setPaused(v){
        pauseOverlay.style.display = v ? 'flex' : 'none';
        pauseBtn.style.display = v ? 'none' : 'block';
      },
      onToggle(cb){
        pauseBtn.addEventListener('click', cb);
      },
      remove(){ pauseOverlay.remove(); pauseBtn.remove(); }
    };
  }

  function createGameOverUI(container, onRestart, onMenu){
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.display = 'none';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(2,6,23,0.65)';
    overlay.style.zIndex = '2000';
    overlay.innerHTML = `<div style="background:linear-gradient(180deg,#fff,#e6fff6);padding:18px;border-radius:12px;text-align:center;color:#042;min-width:220px">
      <div id="gs-title" style="font-weight:900;margin-bottom:8px">Игра окончена</div>
      <div id="gs-score" style="margin-bottom:12px">Очки: 0</div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button id="gs-restart" style="padding:8px 12px;border-radius:8px;border:0;cursor:pointer">Restart</button>
        <button id="gs-menu2" style="padding:8px 12px;border-radius:8px;border:0;cursor:pointer">В меню</button>
      </div>
    </div>`;
    container.appendChild(overlay);
    overlay.querySelector('#gs-restart').addEventListener('click', onRestart);
    overlay.querySelector('#gs-menu2').addEventListener('click', onMenu);

    return {
      show(score){
        const scoreNode = overlay.querySelector('#gs-score');
        if(scoreNode) scoreNode.textContent = `Очки: ${score}`;
        overlay.style.display = 'flex';
      },
      hide(){ overlay.style.display = 'none'; },
      remove(){ overlay.remove(); }
    };
  }

export default {
  createToast,
  createPauseUI,
  createGameOverUI
};