/**
 * OnboardingManager.js
 * Система онбординга для новых игроков
 * 
 * Функции:
 * 1. Показывает подсказки прямо во время игры
 * 2. Упрощает первые несколько игр
 * 3. Поэтапно вводит механики
 */

import { COLORS, FONTS, FONT_SIZES, UI, ANIMATIONS, applyStyles } from '../core/GameConfig.js';
import { t } from '../i18n/LanguageManager.js';

class OnboardingManager {
  constructor() {
    this.overlay = null;
    this.handAnimation = null;
    
    // Состояние онбординга для каждого режима
    this.state = this.loadState();
  }

  loadState() {
    const saved = localStorage.getItem('orb-masters-onboarding');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      isNewPlayer: true,
      gamesPlayed: 0,
      modesIntroduced: [],
      hintsShown: {},
      tutorialComplete: false,
    };
  }

  saveState() {
    localStorage.setItem('orb-masters-onboarding', JSON.stringify(this.state));
  }

  isNewPlayer() {
    return this.state.gamesPlayed < 5;
  }

  getNewPlayerModifier() {
    // Модификаторы для упрощения игры новым игрокам
    const games = this.state.gamesPlayed;
    
    if (games === 0) {
      // Первая игра — очень легко
      return {
        speedMultiplier: 0.5,      // Половина скорости
        spawnRateMultiplier: 0.6, // Меньше объектов
        bombChance: 0,             // Без бомб
        showHints: true,
        hintDelay: 0,
      };
    } else if (games < 3) {
      // 2-3 игра — легко
      return {
        speedMultiplier: 0.7,
        spawnRateMultiplier: 0.8,
        bombChance: 0.05,
        showHints: true,
        hintDelay: 3000,
      };
    } else if (games < 5) {
      // 4-5 игра — почти нормально
      return {
        speedMultiplier: 0.85,
        spawnRateMultiplier: 0.9,
        bombChance: 0.1,
        showHints: true,
        hintDelay: 5000,
      };
    }
    
    // После 5 игр — нормальная сложность
    return {
      speedMultiplier: 1.0,
      spawnRateMultiplier: 1.0,
      bombChance: 0.15,
      showHints: false,
      hintDelay: 0,
    };
  }

  recordGamePlayed(mode) {
    this.state.gamesPlayed++;
    if (!this.state.modesIntroduced.includes(mode)) {
      this.state.modesIntroduced.push(mode);
    }
    this.saveState();
  }

  shouldShowModeIntro(mode) {
    return !this.state.modesIntroduced.includes(mode);
  }

  markHintShown(hintId) {
    this.state.hintsShown[hintId] = true;
    this.saveState();
  }

  wasHintShown(hintId) {
    return this.state.hintsShown[hintId] === true;
  }

  /**
   * Показать интро к режиму (перед началом игры)
   */
  showModeIntro(mode, onContinue) {
    const intros = {
      catch: {
        icon: '🎰',
        title: t('onboarding.catch.title'),
        steps: [
          { icon: '👆', text: t('onboarding.catch.step1') },
          { icon: '💰', text: t('onboarding.catch.step2') },
          { icon: '💣', text: t('onboarding.catch.step3') },
        ],
        tip: t('onboarding.catch.tip'),
      },
      bricks: {
        icon: '🎯',
        title: t('onboarding.bricks.title'),
        steps: [
          { icon: '👆', text: t('onboarding.bricks.step1') },
          { icon: '🎱', text: t('onboarding.bricks.step2') },
          { icon: '⬇️', text: t('onboarding.bricks.step3') },
        ],
        tip: t('onboarding.bricks.tip'),
      },
      puzzle: {
        icon: '🧩',
        title: t('onboarding.puzzle.title'),
        steps: [
          { icon: '👆', text: t('onboarding.puzzle.step1') },
          { icon: '📏', text: t('onboarding.puzzle.step2') },
          { icon: '✨', text: t('onboarding.puzzle.step3') },
        ],
        tip: t('onboarding.puzzle.tip'),
      },
      zuma: {
        icon: '💠',
        title: t('onboarding.zuma.title'),
        steps: [
          { icon: '👆', text: t('onboarding.zuma.step1') },
          { icon: '🎯', text: t('onboarding.zuma.step2') },
          { icon: '💥', text: t('onboarding.zuma.step3') },
        ],
        tip: t('onboarding.zuma.tip'),
      },
    };

    const intro = intros[mode];
    if (!intro) {
      onContinue();
      return;
    }

    // Создаём overlay
    this.overlay = document.createElement('div');
    applyStyles(this.overlay, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '3000',
      fontFamily: FONTS.primary,
      color: COLORS.textPrimary,
      padding: UI.spacing.lg,
    });

    const modal = document.createElement('div');
    applyStyles(modal, {
      background: COLORS.cardDark,
      borderRadius: UI.borderRadius.xl,
      padding: UI.spacing.xl,
      maxWidth: '360px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: UI.spacing.lg,
      animation: `scaleIn ${ANIMATIONS.slow} ${ANIMATIONS.easeOutBack}`,
    });

    // Иконка режима
    const iconDiv = document.createElement('div');
    iconDiv.textContent = intro.icon;
    applyStyles(iconDiv, {
      fontSize: '64px',
      animation: 'pulse 2s infinite',
    });

    // Заголовок
    const title = document.createElement('h2');
    title.textContent = intro.title;
    applyStyles(title, {
      fontSize: FONT_SIZES.xl,
      fontWeight: '700',
      fontFamily: FONTS.display,
      margin: '0',
      textAlign: 'center',
    });

    // Шаги
    const stepsDiv = document.createElement('div');
    applyStyles(stepsDiv, {
      display: 'flex',
      flexDirection: 'column',
      gap: UI.spacing.md,
      width: '100%',
    });

    intro.steps.forEach((step, index) => {
      const stepEl = document.createElement('div');
      applyStyles(stepEl, {
        display: 'flex',
        alignItems: 'center',
        gap: UI.spacing.md,
        padding: UI.spacing.sm,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: UI.borderRadius.md,
        animation: `slideIn ${ANIMATIONS.normal} ${index * 150}ms backwards`,
      });

      const stepIcon = document.createElement('span');
      stepIcon.textContent = step.icon;
      stepIcon.style.fontSize = '28px';
      stepIcon.style.width = '40px';
      stepIcon.style.textAlign = 'center';

      const stepText = document.createElement('span');
      stepText.textContent = step.text;
      applyStyles(stepText, {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        lineHeight: '1.4',
      });

      stepEl.appendChild(stepIcon);
      stepEl.appendChild(stepText);
      stepsDiv.appendChild(stepEl);
    });

    // Подсказка
    const tipDiv = document.createElement('div');
    applyStyles(tipDiv, {
      display: 'flex',
      alignItems: 'center',
      gap: UI.spacing.sm,
      padding: UI.spacing.md,
      background: 'rgba(139, 92, 246, 0.2)',
      border: `1px solid ${COLORS.orbPurple}50`,
      borderRadius: UI.borderRadius.md,
      width: '100%',
      boxSizing: 'border-box',
    });

    const tipIcon = document.createElement('span');
    tipIcon.textContent = '💡';
    tipIcon.style.fontSize = '20px';

    const tipText = document.createElement('span');
    tipText.textContent = intro.tip;
    applyStyles(tipText, {
      fontSize: FONT_SIZES.sm,
      color: COLORS.textPrimary,
      lineHeight: '1.4',
    });

    tipDiv.appendChild(tipIcon);
    tipDiv.appendChild(tipText);

    // Кнопка "Понятно!"
    const button = document.createElement('button');
    button.textContent = `▶ ${t('onboarding.gotIt')}`;
    applyStyles(button, {
      padding: `${UI.spacing.md} ${UI.spacing.xl}`,
      borderRadius: UI.borderRadius.md,
      border: 'none',
      background: COLORS.gradientCombo,
      color: COLORS.textPrimary,
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
      cursor: 'pointer',
      width: '100%',
      marginTop: UI.spacing.sm,
    });

    button.addEventListener('click', () => {
      this.state.modesIntroduced.push(mode);
      this.saveState();
      this.hideOverlay();
      onContinue();
    });

    modal.appendChild(iconDiv);
    modal.appendChild(title);
    modal.appendChild(stepsDiv);
    modal.appendChild(tipDiv);
    modal.appendChild(button);
    this.overlay.appendChild(modal);
    document.body.appendChild(this.overlay);

    // Добавляем анимации
    this.addAnimationStyles();
  }

  /**
   * Показать подсказку во время игры
   */
  showGameHint(hintKey, position = 'center', duration = 3000) {
    if (this.wasHintShown(hintKey)) return;

    const hints = {
      'catch-move': {
        icon: '👆',
        text: t('hints.catch.move'),
        animation: 'hand-swipe',
      },
      'catch-combo': {
        icon: '🔥',
        text: t('hints.catch.combo'),
      },
      'catch-bomb': {
        icon: '💣',
        text: t('hints.catch.bomb'),
      },
      'bricks-aim': {
        icon: '👆',
        text: t('hints.bricks.aim'),
        animation: 'hand-drag',
      },
      'bricks-balls': {
        icon: '➕',
        text: t('hints.bricks.balls'),
      },
      'puzzle-drag': {
        icon: '👆',
        text: t('hints.puzzle.drag'),
        animation: 'hand-drag',
      },
      'puzzle-line': {
        icon: '✨',
        text: t('hints.puzzle.line'),
      },
    };

    const hint = hints[hintKey];
    if (!hint) return;

    this.markHintShown(hintKey);

    // Создаём элемент подсказки
    const hintEl = document.createElement('div');
    applyStyles(hintEl, {
      position: 'fixed',
      left: '50%',
      transform: 'translateX(-50%)',
      top: position === 'top' ? '100px' : position === 'bottom' ? 'auto' : '40%',
      bottom: position === 'bottom' ? '150px' : 'auto',
      background: 'rgba(0, 0, 0, 0.9)',
      borderRadius: UI.borderRadius.lg,
      padding: UI.spacing.md,
      display: 'flex',
      alignItems: 'center',
      gap: UI.spacing.sm,
      zIndex: '2500',
      animation: `fadeInUp ${ANIMATIONS.normal} ${ANIMATIONS.easeOutBack}`,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      border: `1px solid ${COLORS.orbPurple}50`,
      maxWidth: '300px',
    });

    const iconEl = document.createElement('span');
    iconEl.textContent = hint.icon;
    iconEl.style.fontSize = '32px';

    const textEl = document.createElement('span');
    textEl.textContent = hint.text;
    applyStyles(textEl, {
      fontSize: FONT_SIZES.md,
      color: COLORS.textPrimary,
      fontFamily: FONTS.primary,
    });

    hintEl.appendChild(iconEl);
    hintEl.appendChild(textEl);
    document.body.appendChild(hintEl);

    // Показываем анимированную руку если нужно
    if (hint.animation) {
      this.showHandAnimation(hint.animation);
    }

    // Убираем через duration
    setTimeout(() => {
      hintEl.style.animation = `fadeOut ${ANIMATIONS.fast}`;
      setTimeout(() => {
        hintEl.remove();
        this.hideHandAnimation();
      }, 150);
    }, duration);
  }

  /**
   * Показать анимированную руку-указатель
   */
  showHandAnimation(type) {
    this.handAnimation = document.createElement('div');
    this.handAnimation.textContent = '👆';
    
    const baseStyles = {
      position: 'fixed',
      fontSize: '48px',
      zIndex: '2400',
      pointerEvents: 'none',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
    };

    if (type === 'hand-swipe') {
      applyStyles(this.handAnimation, {
        ...baseStyles,
        bottom: '200px',
        left: '30%',
        animation: 'handSwipe 1.5s infinite',
      });
    } else if (type === 'hand-drag') {
      applyStyles(this.handAnimation, {
        ...baseStyles,
        top: '50%',
        left: '40%',
        animation: 'handDrag 2s infinite',
      });
    }

    document.body.appendChild(this.handAnimation);
  }

  hideHandAnimation() {
    if (this.handAnimation) {
      this.handAnimation.remove();
      this.handAnimation = null;
    }
  }

  hideOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  addAnimationStyles() {
    if (document.getElementById('onboarding-animations')) return;

    const style = document.createElement('style');
    style.id = 'onboarding-animations';
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translate(-50%, 20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
      
      @keyframes fadeOut {
        to {
          opacity: 0;
        }
      }
      
      @keyframes handSwipe {
        0%, 100% {
          left: 30%;
          opacity: 1;
        }
        50% {
          left: 60%;
          opacity: 1;
        }
      }
      
      @keyframes handDrag {
        0% {
          transform: translate(0, 0) rotate(-20deg);
          opacity: 0;
        }
        20% {
          opacity: 1;
        }
        50% {
          transform: translate(60px, 80px) rotate(0deg);
          opacity: 1;
        }
        70% {
          opacity: 0;
        }
        100% {
          transform: translate(0, 0) rotate(-20deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Сбросить онбординг (для тестирования)
   */
  reset() {
    this.state = {
      isNewPlayer: true,
      gamesPlayed: 0,
      modesIntroduced: [],
      hintsShown: {},
      tutorialComplete: false,
    };
    this.saveState();
  }
}

// Синглтон
const onboardingManager = new OnboardingManager();

export default onboardingManager;
export { OnboardingManager };
