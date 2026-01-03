// Menu scene — создаёт DOM-меню поверх canvas и запускает уровни
import { AudioManager } from '../game/AudioManager.js';
import { SoundEffects } from '../game/SoundEffects.js';
import { showSettingsModal } from '../game/SettingsModal.js';

function MenuScene(engine) {
  let menuEl = null;
  return {
    async init() {
      // Запускаем музыку меню
      AudioManager.playTrack('menu');
      
      menuEl = document.createElement('div');
      menuEl.style.position = 'absolute';
      menuEl.style.inset = '0';
      menuEl.style.display = 'flex';
      menuEl.style.alignItems = 'center';
      menuEl.style.justifyContent = 'center';
      menuEl.style.background = 'rgba(2,6,23,0.4)';
      menuEl.style.zIndex = '999';

      const inner = document.createElement('div');
      inner.style.display = 'flex';
      inner.style.flexDirection = 'column';
      inner.style.gap = '10px';
      inner.style.alignItems = 'center';

      // переключатель показа подсказок (toast) для уровня 3
      const toastRow = document.createElement('div');
      toastRow.style.display = 'flex';
      toastRow.style.alignItems = 'center';
      toastRow.style.gap = '8px';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'toggle-toast';
      const saved = localStorage.getItem('mbg-showToast');
      // по умолчанию true
      cb.checked = saved === null ? true : saved === 'true';
      const lbl = document.createElement('label');
      lbl.htmlFor = 'toggle-toast';
      lbl.textContent = 'Показывать подсказки';
      toastRow.appendChild(cb);
      toastRow.appendChild(lbl);
      cb.addEventListener('change', () => {
        localStorage.setItem('mbg-showToast', String(cb.checked));
      });
      inner.appendChild(toastRow);

      menuEl.appendChild(inner);
      document.body.appendChild(menuEl);

      const lastLevel = localStorage.getItem('mbg-lastLevel');
      const lastScore = localStorage.getItem('mbg-lastScore');
      const savedInfo = document.createElement('div');
      savedInfo.style.fontSize = '13px';
      savedInfo.style.color = 'rgba(255,255,255,0.9)';
      savedInfo.textContent = lastLevel ? `Последнее: уровень ${lastLevel}` + (lastScore ? `, очки ${lastScore}` : '') : 'Нет сохранений';
      inner.appendChild(savedInfo);

      const btnContinue = document.createElement('button');
      btnContinue.textContent = lastLevel ? `Продолжить: уровень ${lastLevel}` : 'Продолжить';
      btnContinue.style.padding = '10px 16px';
      btnContinue.style.borderRadius = '10px';
      btnContinue.style.border = '0';
      btnContinue.style.cursor = 'pointer';
      btnContinue.style.background = lastLevel ? 'linear-gradient(90deg,#7EE7C8,#4ad9b3)' : 'linear-gradient(90deg,#ccc,#aaa)';
      btnContinue.style.color = lastLevel ? '#fff' : '#666';
      inner.appendChild(btnContinue);

      const btnLevel1 = document.createElement('button');
      btnLevel1.textContent = 'Уровень 1';
      btnLevel1.style.padding = '10px 16px';
      btnLevel1.style.borderRadius = '10px';
      btnLevel1.style.border = '0';
      btnLevel1.style.cursor = 'pointer';
      btnLevel1.style.background = 'linear-gradient(90deg,#8fb4ff,#5d9eff)';
      btnLevel1.style.color = '#fff';
      inner.appendChild(btnLevel1);

      const btnLevel2 = document.createElement('button');
      btnLevel2.textContent = 'Уровень 2';
      btnLevel2.style.padding = '10px 16px';
      btnLevel2.style.borderRadius = '10px';
      btnLevel2.style.border = '0';
      btnLevel2.style.cursor = 'pointer';
      btnLevel2.style.background = 'linear-gradient(90deg,#ffd27a,#ffb34d)';
      btnLevel2.style.color = '#042';
      inner.appendChild(btnLevel2);

      const btnLevel3 = document.createElement('button');
      btnLevel3.textContent = 'Уровень 3';
      btnLevel3.style.padding = '10px 16px';
      btnLevel3.style.borderRadius = '10px';
      btnLevel3.style.border = '0';
      btnLevel3.style.cursor = 'pointer';
      btnLevel3.style.background = 'linear-gradient(90deg,#7EE7C8,#4ad9b3)';
      btnLevel3.style.color = '#042';
      inner.appendChild(btnLevel3);

      const btnLevel4 = document.createElement('button');
      btnLevel4.textContent = 'Уровень 4';
      btnLevel4.style.padding = '10px 16px';
      btnLevel4.style.borderRadius = '10px';
      btnLevel4.style.border = '0';
      btnLevel4.style.cursor = 'pointer';
      btnLevel4.style.background = 'linear-gradient(90deg,#FF6B9D,#C44569)';
      btnLevel4.style.color = '#fff';
      inner.appendChild(btnLevel4);

      // Кнопка настроек
      const btnSettings = document.createElement('button');
      btnSettings.textContent = '⚙️ Настройки';
      btnSettings.style.padding = '10px 16px';
      btnSettings.style.borderRadius = '10px';
      btnSettings.style.border = '0';
      btnSettings.style.cursor = 'pointer';
      btnSettings.style.background = 'linear-gradient(90deg,#667eea,#764ba2)';
      btnSettings.style.color = '#fff';
      btnSettings.style.marginTop = '10px';
      inner.appendChild(btnSettings);

      btnSettings.addEventListener('click', () => {
        SoundEffects.playClick();
        showSettingsModal();
      });

      btnContinue.addEventListener('click', () => {
        SoundEffects.playClick();
        menuEl.remove();
        const lvl = parseInt(lastLevel) || 1;
        if(lvl === 1) engine.goTo('level_catch');
        else if(lvl === 2) engine.goTo('level_knockout');
        else if(lvl === 3) engine.goTo('level_stack');
        else if(lvl === 4) engine.goTo('level_match3');
        else engine.goTo('level_catch');
      });

      btnLevel1.addEventListener('click', () => { SoundEffects.playClick(); menuEl.remove(); engine.goTo('level_catch'); });
      btnLevel2.addEventListener('click', () => { SoundEffects.playClick(); menuEl.remove(); engine.goTo('level_knockout'); });
      btnLevel3.addEventListener('click', () => { SoundEffects.playClick(); menuEl.remove(); engine.goTo('level_stack'); });
      btnLevel4.addEventListener('click', () => { SoundEffects.playClick(); menuEl.remove(); engine.goTo('level_match3'); });
    },
    onResize() {},
    update() {},
    render() {},
    onExit() { if(menuEl) { menuEl.remove(); menuEl = null; } }
  };
}

export default MenuScene;