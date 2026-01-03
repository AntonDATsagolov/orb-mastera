/**
 * GameResultScreen.js
 * Универсальный экран результатов с Orbs, XP, Level Up
 */

import playerProfile from '../core/PlayerProfile.js';
import orbsManager from '../core/OrbsManager.js';
import difficultyManager from '../core/DifficultyManager.js';
import { COLORS, FONTS, FONT_SIZES, UI, ANIMATIONS, GAME_MODES, applyStyles, formatNumber } from '../core/GameConfig.js';
import { SoundEffects } from '../game/SoundEffects.js';
import i18n from '../i18n/LanguageManager.js';
import { recordsManager } from './Records.js';
import { dailyChallenges, CHALLENGE_TYPES } from './DailyChallenges.js';

class GameResultScreen {
  constructor(options = {}) {
    this.options = {
      mode: 'catch',
      score: 0,
      combo: 0,
      stage: 1,
      duration: 0,
      isPerfect: false,
      isWin: true,
      onRetry: null,
      onHome: null,
      onNextMode: null,
      engine: null,
      ...options,
    };
    
    this.container = null;
    this.rewards = null;
    this.appliedRewards = false;
  }

  show() {
    // Рассчитываем награды
    this.rewards = orbsManager.calculateRewards({
      mode: this.options.mode,
      score: this.options.score,
      combo: this.options.combo,
      stage: this.options.stage,
      duration: this.options.duration,
      isPerfect: this.options.isPerfect,
      isFirstWinToday: this.checkFirstWinToday(),
    });

    this.createUI();
    this.animateRewards();
  }

  checkFirstWinToday() {
    const today = new Date().toDateString();
    const lastWin = localStorage.getItem('orb-masters-last-win');
    if (lastWin !== today) {
      localStorage.setItem('orb-masters-last-win', today);
      return true;
    }
    return false;
  }

  createUI() {
    // Оверлей
    this.container = document.createElement('div');
    applyStyles(this.container, {
      position: 'fixed',
      inset: '0',
      background: COLORS.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '2000',
      fontFamily: FONTS.primary,
      color: COLORS.textPrimary,
    });

    // Модал
    const modal = document.createElement('div');
    applyStyles(modal, {
      background: COLORS.cardDark,
      borderRadius: UI.borderRadius.xl,
      padding: UI.spacing.xl,
      maxWidth: '380px',
      width: '90%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: UI.spacing.lg,
      animation: `scaleIn ${ANIMATIONS.slow} ${ANIMATIONS.easeOutBack}`,
    });

    // Заголовок
    const modeConfig = GAME_MODES[this.options.mode];
    const title = document.createElement('h2');
    title.textContent = this.options.isWin ? `🎉 ${i18n.t('results.victory')}` : `💀 ${i18n.t('results.gameOver')}`;
    applyStyles(title, {
      fontSize: FONT_SIZES.xxl,
      fontWeight: '800',
      fontFamily: FONTS.display,
      margin: '0',
      textAlign: 'center',
      background: this.options.isWin ? COLORS.gradientSuccess : COLORS.gradientFire,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    });
    modal.appendChild(title);

    // Режим
    const modeLabel = document.createElement('div');
    modeLabel.textContent = `${modeConfig?.icon || '🎮'} ${i18n.t(`modes.${this.options.mode}.name`)}`;
    applyStyles(modeLabel, {
      fontSize: FONT_SIZES.md,
      color: COLORS.textSecondary,
    });
    modal.appendChild(modeLabel);

    // Очки
    const scoreSection = document.createElement('div');
    applyStyles(scoreSection, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: UI.spacing.xs,
    });

    const scoreValue = document.createElement('div');
    scoreValue.id = 'result-score';
    scoreValue.textContent = '0';
    applyStyles(scoreValue, {
      fontSize: '56px',
      fontWeight: '800',
      fontFamily: FONTS.mono,
      background: COLORS.gradientGold,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    });

    const scoreLabel = document.createElement('div');
    scoreLabel.textContent = i18n.t('game.score').toUpperCase();
    applyStyles(scoreLabel, {
      fontSize: FONT_SIZES.sm,
      color: COLORS.textMuted,
      letterSpacing: '2px',
    });

    // Лучший результат
    const bestScore = playerProfile.stats.bestScorePerMode[this.options.mode] || 0;
    const isNewBest = this.options.score > bestScore;
    
    if (isNewBest && this.options.score > 0) {
      const newBestLabel = document.createElement('div');
      newBestLabel.textContent = `🏆 ${i18n.t('results.newRecord')}`;
      applyStyles(newBestLabel, {
        fontSize: FONT_SIZES.sm,
        color: COLORS.warningOrange,
        fontWeight: '700',
        animation: `pulse 1s infinite`,
      });
      scoreSection.appendChild(newBestLabel);
    }

    scoreSection.appendChild(scoreValue);
    scoreSection.appendChild(scoreLabel);
    modal.appendChild(scoreSection);

    // Статистика
    const statsGrid = document.createElement('div');
    applyStyles(statsGrid, {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: UI.spacing.md,
      width: '100%',
    });

    const stats = [
      { label: i18n.t('game.combo'), value: `×${this.options.combo}`, icon: '🔥' },
      { label: i18n.t('results.stage'), value: this.options.stage, icon: '⭐' },
      { label: i18n.t('results.time'), value: this.formatTime(this.options.duration), icon: '⏱️' },
    ];

    stats.forEach(stat => {
      const statBox = document.createElement('div');
      applyStyles(statBox, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: UI.spacing.xs,
        padding: UI.spacing.sm,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: UI.borderRadius.md,
      });

      const icon = document.createElement('span');
      icon.textContent = stat.icon;
      icon.style.fontSize = FONT_SIZES.lg;

      const value = document.createElement('span');
      value.textContent = stat.value;
      applyStyles(value, {
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        fontFamily: FONTS.mono,
      });

      const label = document.createElement('span');
      label.textContent = stat.label;
      applyStyles(label, {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
      });

      statBox.appendChild(icon);
      statBox.appendChild(value);
      statBox.appendChild(label);
      statsGrid.appendChild(statBox);
    });

    modal.appendChild(statsGrid);

    // Награды
    const rewardsSection = document.createElement('div');
    applyStyles(rewardsSection, {
      width: '100%',
      background: 'rgba(139, 92, 246, 0.1)',
      borderRadius: UI.borderRadius.lg,
      padding: UI.spacing.md,
      border: `1px solid ${COLORS.orbPurple}40`,
    });

    const rewardsTitle = document.createElement('div');
    rewardsTitle.textContent = '💎 Награды';
    applyStyles(rewardsTitle, {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      marginBottom: UI.spacing.sm,
    });
    rewardsSection.appendChild(rewardsTitle);

    const rewardsGrid = document.createElement('div');
    applyStyles(rewardsGrid, {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: UI.spacing.sm,
    });

    // Orbs
    const orbsBox = document.createElement('div');
    applyStyles(orbsBox, {
      display: 'flex',
      alignItems: 'center',
      gap: UI.spacing.sm,
      padding: UI.spacing.sm,
      background: 'rgba(139, 92, 246, 0.2)',
      borderRadius: UI.borderRadius.md,
    });

    const orbsIcon = document.createElement('span');
    orbsIcon.textContent = '🔮';
    orbsIcon.style.fontSize = FONT_SIZES.xl;

    const orbsValue = document.createElement('span');
    orbsValue.id = 'result-orbs';
    orbsValue.textContent = '+0';
    applyStyles(orbsValue, {
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
      fontFamily: FONTS.mono,
      color: COLORS.orbPurple,
    });

    orbsBox.appendChild(orbsIcon);
    orbsBox.appendChild(orbsValue);
    rewardsGrid.appendChild(orbsBox);

    // XP
    const xpBox = document.createElement('div');
    applyStyles(xpBox, {
      display: 'flex',
      alignItems: 'center',
      gap: UI.spacing.sm,
      padding: UI.spacing.sm,
      background: 'rgba(59, 130, 246, 0.2)',
      borderRadius: UI.borderRadius.md,
    });

    const xpIcon = document.createElement('span');
    xpIcon.textContent = '⚡';
    xpIcon.style.fontSize = FONT_SIZES.xl;

    const xpValue = document.createElement('span');
    xpValue.id = 'result-xp';
    xpValue.textContent = '+0';
    applyStyles(xpValue, {
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
      fontFamily: FONTS.mono,
      color: COLORS.energyBlue,
    });

    xpBox.appendChild(xpIcon);
    xpBox.appendChild(xpValue);
    rewardsGrid.appendChild(xpBox);

    rewardsSection.appendChild(rewardsGrid);

    // Множители
    if (this.rewards.orbsMultiplier > 1) {
      const multInfo = document.createElement('div');
      multInfo.textContent = `×${this.rewards.orbsMultiplier.toFixed(1)} ${i18n.t('results.multiplier')}`;
      applyStyles(multInfo, {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: UI.spacing.sm,
        textAlign: 'center',
      });
      rewardsSection.appendChild(multInfo);
    }

    modal.appendChild(rewardsSection);

    // Кнопка удвоить (реклама)
    const doubleBtn = document.createElement('button');
    doubleBtn.textContent = `📺 ${i18n.t('results.doubleReward')}`;
    applyStyles(doubleBtn, {
      width: '100%',
      padding: UI.spacing.md,
      borderRadius: UI.borderRadius.md,
      border: `2px solid ${COLORS.warningOrange}`,
      background: 'transparent',
      color: COLORS.warningOrange,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      cursor: 'pointer',
      transition: `all ${ANIMATIONS.fast}`,
    });

    doubleBtn.addEventListener('mouseenter', () => {
      doubleBtn.style.background = `${COLORS.warningOrange}20`;
    });

    doubleBtn.addEventListener('mouseleave', () => {
      doubleBtn.style.background = 'transparent';
    });

    doubleBtn.addEventListener('click', () => {
      SoundEffects.playBonus();
      // Симуляция просмотра рекламы
      doubleBtn.textContent = i18n.t('results.loading');
      doubleBtn.disabled = true;
      
      setTimeout(() => {
        this.applyRewardsAndClose(true);
      }, 1000);
    });

    modal.appendChild(doubleBtn);

    // Кнопки действий
    const buttonsRow = document.createElement('div');
    applyStyles(buttonsRow, {
      display: 'flex',
      gap: UI.spacing.md,
      width: '100%',
    });

    // Retry
    const retryBtn = document.createElement('button');
    retryBtn.textContent = `🔄 ${i18n.t('results.tryAgain')}`;
    applyStyles(retryBtn, {
      flex: '1',
      padding: UI.spacing.md,
      borderRadius: UI.borderRadius.md,
      border: 'none',
      background: COLORS.gradientSuccess,
      color: COLORS.textPrimary,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      cursor: 'pointer',
      transition: `transform ${ANIMATIONS.fast}`,
    });

    retryBtn.addEventListener('click', () => {
      SoundEffects.playClick();
      this.applyRewardsAndClose(false);
      if (this.options.onRetry) {
        this.options.onRetry();
      }
    });

    // Home
    const homeBtn = document.createElement('button');
    homeBtn.textContent = `🏠 ${i18n.t('results.backToMenu')}`;
    applyStyles(homeBtn, {
      flex: '1',
      padding: UI.spacing.md,
      borderRadius: UI.borderRadius.md,
      border: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      color: COLORS.textSecondary,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      cursor: 'pointer',
      transition: `all ${ANIMATIONS.fast}`,
    });

    homeBtn.addEventListener('click', () => {
      SoundEffects.playClick();
      this.applyRewardsAndClose(false);
      if (this.options.onHome) {
        this.options.onHome();
      } else if (this.options.engine) {
        this.options.engine.goTo('menu');
      }
    });

    buttonsRow.appendChild(retryBtn);
    buttonsRow.appendChild(homeBtn);
    modal.appendChild(buttonsRow);

    // Рекомендация следующего режима (только при победе)
    if (this.options.isWin) {
      const nextModeSection = this.createNextModeRecommendation();
      if (nextModeSection) {
        modal.appendChild(nextModeSection);
      }
    }

    this.container.appendChild(modal);
    document.body.appendChild(this.container);
  }

  /**
   * Создаёт рекомендацию следующего режима
   */
  createNextModeRecommendation() {
    const modes = ['catch', 'bricks', 'puzzle', 'match3'];
    const currentIndex = modes.indexOf(this.options.mode);
    
    // Получаем следующий режим (циклически)
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    const modeConfig = GAME_MODES[nextMode];
    
    if (!modeConfig) return null;

    const section = document.createElement('div');
    applyStyles(section, {
      width: '100%',
      marginTop: UI.spacing.md,
      padding: UI.spacing.md,
      background: `linear-gradient(135deg, ${modeConfig.colors.primary}20, ${modeConfig.colors.secondary}20)`,
      borderRadius: UI.borderRadius.lg,
      border: `1px solid ${modeConfig.colors.primary}40`,
      display: 'flex',
      alignItems: 'center',
      gap: UI.spacing.md,
    });

    // Иконка режима
    const icon = document.createElement('div');
    icon.textContent = modeConfig.icon;
    applyStyles(icon, {
      fontSize: '32px',
      width: '50px',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `${modeConfig.colors.primary}30`,
      borderRadius: UI.borderRadius.md,
    });

    // Текст
    const textDiv = document.createElement('div');
    applyStyles(textDiv, {
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    });

    const label = document.createElement('span');
    label.textContent = i18n.t('results.tryNextMode') || 'Попробуйте';
    applyStyles(label, {
      fontSize: FONT_SIZES.xs,
      color: COLORS.textSecondary,
    });

    const modeName = document.createElement('span');
    modeName.textContent = i18n.t(`modes.${nextMode}.name`);
    applyStyles(modeName, {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      color: modeConfig.colors.primary,
    });

    textDiv.appendChild(label);
    textDiv.appendChild(modeName);

    // Кнопка
    const playBtn = document.createElement('button');
    playBtn.textContent = '▶';
    applyStyles(playBtn, {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: 'none',
      background: modeConfig.colors.primary,
      color: '#fff',
      fontSize: FONT_SIZES.lg,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });

    playBtn.addEventListener('click', () => {
      SoundEffects.playClick();
      this.applyRewardsAndClose(false);
      
      // Переходим к следующему режиму
      if (this.options.engine) {
        // Сохраняем выбранный режим
        localStorage.setItem('orb-masters-selected-mode', nextMode);
        // Запускаем соответствующую сцену
        const sceneMap = {
          catch: 'catch',
          bricks: 'bricks',
          puzzle: 'puzzle',
          match3: 'match3',
        };
        this.options.engine.goTo(sceneMap[nextMode] || 'menu');
      }
    });

    section.appendChild(icon);
    section.appendChild(textDiv);
    section.appendChild(playBtn);

    return section;
  }

  animateRewards() {
    const scoreEl = document.getElementById('result-score');
    const orbsEl = document.getElementById('result-orbs');
    const xpEl = document.getElementById('result-xp');

    // Анимация счёта
    this.animateNumber(scoreEl, 0, this.options.score, 1000);
    
    // Анимация Orbs (с задержкой)
    setTimeout(() => {
      this.animateNumber(orbsEl, 0, this.rewards.finalOrbs, 800, '+');
      SoundEffects.playBonus();
    }, 500);

    // Анимация XP (с задержкой)
    setTimeout(() => {
      this.animateNumber(xpEl, 0, this.rewards.finalXp, 800, '+');
    }, 800);
  }

  animateNumber(element, start, end, duration, prefix = '') {
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOut);
      
      element.textContent = prefix + formatNumber(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  applyRewardsAndClose(doubled = false) {
    if (!this.appliedRewards) {
      const result = orbsManager.applyRewards(doubled);
      this.appliedRewards = true;
      
      // Обновляем записи о рекордах
      const orbsEarned = doubled ? this.rewards.finalOrbs * 2 : this.rewards.finalOrbs;
      recordsManager.updateRecord(
        this.options.mode,
        this.options.score,
        this.options.combo || 0,
        orbsEarned
      );

      // Обновляем прогресс daily challenges
      dailyChallenges.updateProgress(CHALLENGE_TYPES.PLAY_GAMES, 1);
      dailyChallenges.updateProgress(CHALLENGE_TYPES.SCORE_TOTAL, this.options.score);
      dailyChallenges.updateProgress(CHALLENGE_TYPES.COLLECT_ORBS, orbsEarned);
      
      if (this.options.isWin) {
        dailyChallenges.updateProgress(CHALLENGE_TYPES.WIN_MODE, 1, this.options.mode);
      }
      
      if (this.options.combo > 0) {
        dailyChallenges.updateProgress(CHALLENGE_TYPES.COMBO_COUNT, this.options.combo);
      }
      
      // Записываем результат в систему адаптивной сложности
      const modeMap = {
        'cashCatcher': 'cashCatcher',
        'bricksBreaker': 'bricksBreaker', 
        'blockPuzzle': 'blockPuzzle',
        'knockoutZuma': 'knockoutZuma'
      };
      const diffMode = modeMap[this.options.mode];
      if (diffMode) {
        difficultyManager.recordGameResult(
          diffMode,
          this.options.score,
          this.options.playTimeSeconds || 0
        );
      }
      
      // Показать Level Up если есть
      if (result.levelUp?.leveledUp) {
        this.showLevelUpNotification(result.levelUp);
      }
    }
    
    this.hide();
  }

  showLevelUpNotification(levelResult) {
    const notif = document.createElement('div');
    applyStyles(notif, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: COLORS.gradientCombo,
      borderRadius: UI.borderRadius.xl,
      padding: UI.spacing.xl,
      zIndex: '3000',
      textAlign: 'center',
      animation: `bounceIn ${ANIMATIONS.slow} ${ANIMATIONS.easeOutBack}`,
    });

    notif.innerHTML = `
      <div style="font-size: 64px;">🎉</div>
      <div style="font-size: ${FONT_SIZES.xxl}; font-weight: 800; margin: ${UI.spacing.sm} 0;">
        LEVEL UP!
      </div>
      <div style="font-size: ${FONT_SIZES.xxxl}; font-weight: 800;">
        ${levelResult.newLevel}
      </div>
      <div style="font-size: ${FONT_SIZES.md}; color: ${COLORS.textSecondary}; margin-top: ${UI.spacing.sm};">
        +${levelResult.orbsEarned} 🔮
      </div>
    `;

    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.animation = `scaleOut ${ANIMATIONS.normal} forwards`;
      setTimeout(() => notif.remove(), 300);
    }, 2000);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  hide() {
    if (this.container) {
      this.container.style.animation = `fadeOut ${ANIMATIONS.normal} forwards`;
      setTimeout(() => {
        this.container.remove();
        this.container = null;
      }, 300);
    }
  }
}

// Функция для быстрого показа экрана результатов
export function showGameResult(options) {
  const screen = new GameResultScreen(options);
  screen.show();
  return screen;
}

export default GameResultScreen;
