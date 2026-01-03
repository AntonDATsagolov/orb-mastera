/**
 * Records.js
 * Экран личных рекордов по каждому режиму игры
 */

import playerProfile from '../core/PlayerProfile.js';
import { COLORS, FONTS, FONT_SIZES, UI, applyStyles, formatNumber } from '../core/GameConfig.js';
import { SoundEffects } from '../game/SoundEffects.js';
import i18n from '../i18n/LanguageManager.js';

// Режимы игры с информацией
const GAME_MODES = [
  { id: 'catch', icon: '🪙', colorPrimary: '#F59E0B', colorSecondary: '#D97706' },
  { id: 'bricks', icon: '🧱', colorPrimary: '#EF4444', colorSecondary: '#DC2626' },
  { id: 'puzzle', icon: '🧩', colorPrimary: '#8B5CF6', colorSecondary: '#7C3AED' },
  { id: 'match3', icon: '💎', colorPrimary: '#06B6D4', colorSecondary: '#0891B2' },
];

class RecordsManager {
  constructor() {
    this.storageKey = 'orb-masters-records';
    this.data = this.load();
  }

  load() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
    return this.getDefault();
  }

  getDefault() {
    const data = {
      totalGamesPlayed: 0,
      totalOrbsEarned: 0,
      modes: {}
    };

    GAME_MODES.forEach(mode => {
      data.modes[mode.id] = {
        bestScore: 0,
        gamesPlayed: 0,
        bestCombo: 0,
        totalScore: 0,
      };
    });

    return data;
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  /**
   * Обновить рекорды после игры
   */
  updateRecord(modeId, score, combo = 0, orbs = 0) {
    if (!this.data.modes[modeId]) {
      this.data.modes[modeId] = {
        bestScore: 0,
        gamesPlayed: 0,
        bestCombo: 0,
        totalScore: 0,
      };
    }

    const modeData = this.data.modes[modeId];
    
    // Обновляем статистику
    modeData.gamesPlayed += 1;
    modeData.totalScore += score;
    
    if (score > modeData.bestScore) {
      modeData.bestScore = score;
    }
    
    if (combo > modeData.bestCombo) {
      modeData.bestCombo = combo;
    }

    // Глобальная статистика
    this.data.totalGamesPlayed += 1;
    this.data.totalOrbsEarned += orbs;

    this.save();
    
    return {
      isNewBest: score >= modeData.bestScore,
      previousBest: modeData.bestScore
    };
  }

  getRecords() {
    return this.data;
  }

  getModeRecord(modeId) {
    return this.data.modes[modeId] || { bestScore: 0, gamesPlayed: 0, bestCombo: 0, totalScore: 0 };
  }
}

// Синглтон
const recordsManager = new RecordsManager();
export { recordsManager };

/**
 * Показать экран Records
 */
export function showRecords(onClose) {
  // Проверяем, не открыт ли уже
  if (document.getElementById('records-screen')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'records-screen';
  applyStyles(overlay, {
    position: 'fixed',
    inset: '0',
    background: `linear-gradient(180deg, ${COLORS.deepSpace} 0%, #1a1a3e 100%)`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: UI.spacing.lg,
    zIndex: '2000',
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    overflowY: 'auto',
  });

  // Header
  const header = document.createElement('div');
  applyStyles(header, {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: UI.spacing.lg,
  });

  const backBtn = document.createElement('button');
  backBtn.textContent = '← ' + i18n.t('common.back');
  applyStyles(backBtn, {
    background: 'none',
    border: 'none',
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    cursor: 'pointer',
    padding: UI.spacing.sm,
  });
  backBtn.onclick = () => {
    SoundEffects.playClick();
    overlay.remove();
    if (onClose) onClose();
  };

  const title = document.createElement('h1');
  title.textContent = `🏆 ${i18n.t('records.title')}`;
  applyStyles(title, {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    margin: '0',
    background: COLORS.gradientGold,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  });

  const spacer = document.createElement('div');
  spacer.style.width = '60px';

  header.appendChild(backBtn);
  header.appendChild(title);
  header.appendChild(spacer);
  overlay.appendChild(header);

  // Глобальная статистика
  const records = recordsManager.getRecords();
  
  const globalStats = document.createElement('div');
  applyStyles(globalStats, {
    width: '100%',
    maxWidth: '500px',
    background: COLORS.cardDark,
    borderRadius: UI.borderRadius.lg,
    padding: UI.spacing.lg,
    marginBottom: UI.spacing.xl,
    display: 'flex',
    justifyContent: 'space-around',
    textAlign: 'center',
  });

  // Игры сыграно
  const gamesStatDiv = document.createElement('div');
  gamesStatDiv.innerHTML = `
    <div style="font-size: 28px; font-weight: bold; color: ${COLORS.orbPurple};">
      ${formatNumber(records.totalGamesPlayed)}
    </div>
    <div style="font-size: ${FONT_SIZES.sm}; color: ${COLORS.textSecondary}; margin-top: 4px;">
      ${i18n.t('records.gamesPlayed')}
    </div>
  `;

  // Сфер заработано
  const orbsStatDiv = document.createElement('div');
  orbsStatDiv.innerHTML = `
    <div style="font-size: 28px; font-weight: bold; color: ${COLORS.orbPurple};">
      ${formatNumber(records.totalOrbsEarned)}
    </div>
    <div style="font-size: ${FONT_SIZES.sm}; color: ${COLORS.textSecondary}; margin-top: 4px;">
      ${i18n.t('records.totalOrbs')}
    </div>
  `;

  globalStats.appendChild(gamesStatDiv);
  globalStats.appendChild(orbsStatDiv);
  overlay.appendChild(globalStats);

  // Заголовок рекордов по режимам
  const modesTitle = document.createElement('h2');
  modesTitle.textContent = i18n.t('records.bestScore');
  applyStyles(modesTitle, {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    margin: '0 0 16px 0',
    width: '100%',
    maxWidth: '500px',
    textAlign: 'left',
  });
  overlay.appendChild(modesTitle);

  // Карточки рекордов по режимам
  const modesContainer = document.createElement('div');
  applyStyles(modesContainer, {
    width: '100%',
    maxWidth: '500px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: UI.spacing.md,
  });

  GAME_MODES.forEach(mode => {
    const modeRecord = records.modes[mode.id] || { bestScore: 0, gamesPlayed: 0, bestCombo: 0 };
    
    const card = document.createElement('div');
    applyStyles(card, {
      background: `linear-gradient(135deg, ${mode.colorPrimary}20 0%, ${mode.colorSecondary}20 100%)`,
      borderRadius: UI.borderRadius.lg,
      padding: UI.spacing.md,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      border: `1px solid ${mode.colorPrimary}40`,
    });

    // Иконка и название
    const modeHeader = document.createElement('div');
    applyStyles(modeHeader, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: UI.spacing.sm,
    });

    const icon = document.createElement('span');
    icon.textContent = mode.icon;
    icon.style.fontSize = '24px';

    const modeName = document.createElement('span');
    modeName.textContent = i18n.t(`modes.${mode.id}.name`);
    applyStyles(modeName, {
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
      color: mode.colorPrimary,
    });

    modeHeader.appendChild(icon);
    modeHeader.appendChild(modeName);
    card.appendChild(modeHeader);

    // Лучший счёт
    const bestScore = document.createElement('div');
    bestScore.textContent = formatNumber(modeRecord.bestScore);
    applyStyles(bestScore, {
      fontSize: '28px',
      fontWeight: '700',
      color: COLORS.textPrimary,
      marginBottom: UI.spacing.xs,
    });
    card.appendChild(bestScore);

    // Дополнительная статистика
    const stats = document.createElement('div');
    applyStyles(stats, {
      display: 'flex',
      gap: UI.spacing.md,
      fontSize: FONT_SIZES.xs,
      color: COLORS.textSecondary,
    });

    stats.innerHTML = `
      <span>🎮 ${modeRecord.gamesPlayed}</span>
      <span>🔥 ${modeRecord.bestCombo || 0}</span>
    `;
    card.appendChild(stats);

    // Если нет рекорда
    if (modeRecord.bestScore === 0) {
      bestScore.textContent = '—';
      bestScore.style.color = COLORS.textSecondary;
    }

    modesContainer.appendChild(card);
  });

  overlay.appendChild(modesContainer);

  // Обработчик изменения языка
  const onLanguageChanged = () => {
    overlay.remove();
    showRecords(onClose);
  };
  window.addEventListener('languageChanged', onLanguageChanged);

  // Cleanup при закрытии
  const cleanup = () => {
    window.removeEventListener('languageChanged', onLanguageChanged);
  };

  const originalOnClose = onClose;
  onClose = () => {
    cleanup();
    if (originalOnClose) originalOnClose();
  };

  document.body.appendChild(overlay);
}

export default { recordsManager, showRecords };
