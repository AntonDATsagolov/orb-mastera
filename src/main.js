// bootstrap: создаёт движок и регистрирует сцены
// ORB MASTERS - Main Entry Point

import MainMenuScene from './ui/MainMenu.js';
import MenuScene from './scenes/menuScene.js';  // Старое меню (backup)
import LevelCatch from './scenes/level_catch.js';
import LevelKnockout from './scenes/level_knockout_zuma.js';
import LevelStack from './scenes/level_stack.js';
import LevelMatch3 from './scenes/level_match3.js';

// Инициализация профиля игрока
import playerProfile from './core/PlayerProfile.js';
import orbsManager from './core/OrbsManager.js';

// Debug режим (включается через ?debug=1 в URL)
const urlParams = new URLSearchParams(window.location.search);
const isDebugMode = urlParams.get('debug') === '1';

const debugEl = document.getElementById('debug');
if (debugEl && isDebugMode) {
  debugEl.style.display = 'block';
}

function debugLog(msg) {
  console.log(msg);
  if (debugEl && isDebugMode) debugEl.textContent += msg + '\n';
}

debugLog('ORB MASTERS: Modules imported successfully');
debugLog(`Player Level: ${playerProfile.level}, Orbs: ${playerProfile.orbs}`);

(() => {
  try {
    debugLog('Creating engine...');
    const engine = new Engine('game');
    debugLog('Engine created: ' + engine);
    
    // Новое главное меню
    engine.register('menu', () => MainMenuScene(engine));
    
    // Старое меню (для отладки)
    engine.register('menu_old', () => MenuScene(engine));
    
    // Игровые режимы
    engine.register('level_catch', () => LevelCatch(engine));
    engine.register('level_knockout', () => LevelKnockout(engine));
    engine.register('level_stack', () => LevelStack(engine));
    engine.register('level_match3', () => LevelMatch3(engine));
    
    debugLog('Scenes registered. Going to menu...');
    
    // Проверяем URL параметр для старого меню
    const urlParams = new URLSearchParams(window.location.search);
    const useOldMenu = urlParams.get('oldmenu') === '1';
    
    // start at menu
    engine.goTo(useOldMenu ? 'menu_old' : 'menu').catch(err => {
      debugLog('Error going to menu: ' + err.message);
    });
    
    debugLog('Menu started');
    
    // Экспортируем в window для отладки
    window.orbMasters = {
      engine,
      playerProfile,
      orbsManager,
      resetProfile: () => {
        playerProfile.reset();
        location.reload();
      },
      addOrbs: (amount) => {
        orbsManager.addBonus(amount, 'Debug');
        console.log(`Added ${amount} orbs. Total: ${playerProfile.orbs}`);
      },
      addXp: (amount) => {
        const result = playerProfile.addXp(amount);
        console.log('XP result:', result);
      },
    };
    
  } catch (err) {
    debugLog('Setup error: ' + err.message);
    if (debugEl) debugEl.textContent += err.stack + '\n';
  }
})();