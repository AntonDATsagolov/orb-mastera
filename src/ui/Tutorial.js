/**
 * Tutorial.js
 * Интерактивный туториал и инструкции для игроков
 */

import { COLORS, FONTS, FONT_SIZES, UI, ANIMATIONS, GAME_MODES, applyStyles } from '../core/GameConfig.js';
import { SoundEffects } from '../game/SoundEffects.js';
import { t } from '../i18n/LanguageManager.js';

class Tutorial {
  constructor() {
    this.overlay = null;
    this.currentPage = 0;
    this.pages = [];
  }

  show() {
    this.currentPage = 0;
    this.buildPages();
    this.createUI();
    this.renderPage();
    
    // Отмечаем что туториал показан
    localStorage.setItem('orb-masters-tutorial-seen', 'true');
  }

  buildPages() {
    this.pages = [
      // Страница 1: Добро пожаловать
      {
        title: t('tutorial.welcome.title'),
        icon: '🎮',
        content: [
          { type: 'text', value: t('tutorial.welcome.desc1') },
          { type: 'text', value: t('tutorial.welcome.desc2') },
          { type: 'highlight', value: t('tutorial.welcome.tip') },
        ],
      },
      // Страница 2: Режимы игры (обзор)
      {
        title: t('tutorial.modes.title'),
        icon: '🎯',
        content: [
          { type: 'text', value: t('tutorial.modes.desc') },
          { type: 'modeList', value: Object.values(GAME_MODES) },
        ],
      },
      // Страница 3: Cash Catcher
      {
        title: t('modes.catch.name'),
        icon: '🎰',
        color: GAME_MODES.catch.color,
        content: [
          { type: 'text', value: t('tutorial.catch.desc') },
          { type: 'steps', value: [
            t('tutorial.catch.step1'),
            t('tutorial.catch.step2'),
            t('tutorial.catch.step3'),
          ]},
          { type: 'highlight', value: t('tutorial.catch.tip') },
        ],
      },
      // Страница 4: Bricks Breaker
      {
        title: t('modes.bricks.name'),
        icon: '🎯',
        color: GAME_MODES.bricks.color,
        content: [
          { type: 'text', value: t('tutorial.bricks.desc') },
          { type: 'steps', value: [
            t('tutorial.bricks.step1'),
            t('tutorial.bricks.step2'),
            t('tutorial.bricks.step3'),
          ]},
          { type: 'highlight', value: t('tutorial.bricks.tip') },
        ],
      },
      // Страница 5: Block Puzzle
      {
        title: t('modes.puzzle.name'),
        icon: '🧩',
        color: GAME_MODES.puzzle.color,
        content: [
          { type: 'text', value: t('tutorial.puzzle.desc') },
          { type: 'steps', value: [
            t('tutorial.puzzle.step1'),
            t('tutorial.puzzle.step2'),
            t('tutorial.puzzle.step3'),
          ]},
          { type: 'highlight', value: t('tutorial.puzzle.tip') },
        ],
      },
      // Страница 6: Knockout Zuma
      {
        title: t('modes.zuma.name'),
        icon: '⚔️',
        color: GAME_MODES.zuma.color,
        content: [
          { type: 'text', value: t('tutorial.zuma.desc') },
          { type: 'steps', value: [
            t('tutorial.zuma.step1'),
            t('tutorial.zuma.step2'),
            t('tutorial.zuma.step3'),
          ]},
          { type: 'highlight', value: t('tutorial.zuma.tip') },
        ],
      },
      // Страница 7: Orbs и прогресс
      {
        title: t('tutorial.orbs.title'),
        icon: '🔮',
        content: [
          { type: 'text', value: t('tutorial.orbs.desc') },
          { type: 'rewards', value: [
            { icon: '🎮', text: t('tutorial.orbs.source1') },
            { icon: '📅', text: t('tutorial.orbs.source2') },
            { icon: '🏆', text: t('tutorial.orbs.source3') },
            { icon: '⭐', text: t('tutorial.orbs.source4') },
          ]},
          { type: 'highlight', value: t('tutorial.orbs.tip') },
        ],
      },
      // Страница 8: Уровни сложности
      {
        title: t('tutorial.stages.title'),
        icon: '⭐',
        content: [
          { type: 'text', value: t('tutorial.stages.desc') },
          { type: 'stageList', value: [
            { stars: 1, name: 'Rookie', mult: '1x', color: '#6B7280' },
            { stars: 2, name: 'Skilled', mult: '1.5x', color: '#3B82F6' },
            { stars: 3, name: 'Expert', mult: '2.5x', color: '#8B5CF6' },
            { stars: 4, name: 'Master', mult: '4x', color: '#F59E0B' },
            { stars: 5, name: 'Legend', mult: '6x', color: '#EF4444' },
          ]},
          { type: 'highlight', value: t('tutorial.stages.tip') },
        ],
      },
      // Страница 9: Удачи!
      {
        title: t('tutorial.final.title'),
        icon: '🚀',
        content: [
          { type: 'text', value: t('tutorial.final.desc1') },
          { type: 'text', value: t('tutorial.final.desc2') },
          { type: 'bigButton', value: t('tutorial.final.start') },
        ],
      },
    ];
  }

  createUI() {
    // Overlay
    this.overlay = document.createElement('div');
    applyStyles(this.overlay, {
      position: 'fixed',
      inset: '0',
      background: COLORS.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '3000',
      fontFamily: FONTS.primary,
      color: COLORS.textPrimary,
    });

    // Modal
    this.modal = document.createElement('div');
    applyStyles(this.modal, {
      background: COLORS.cardDark,
      borderRadius: UI.borderRadius.xl,
      padding: UI.spacing.lg,
      maxWidth: '400px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: UI.spacing.md,
      animation: `scaleIn ${ANIMATIONS.slow} ${ANIMATIONS.easeOutBack}`,
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    applyStyles(closeBtn, {
      position: 'absolute',
      top: UI.spacing.md,
      right: UI.spacing.md,
      background: 'none',
      border: 'none',
      color: COLORS.textMuted,
      fontSize: FONT_SIZES.xl,
      cursor: 'pointer',
      padding: UI.spacing.xs,
    });
    closeBtn.addEventListener('click', () => this.close());

    // Content container
    this.contentContainer = document.createElement('div');
    applyStyles(this.contentContainer, {
      display: 'flex',
      flexDirection: 'column',
      gap: UI.spacing.md,
      minHeight: '300px',
    });

    // Navigation
    this.navContainer = document.createElement('div');
    applyStyles(this.navContainer, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: UI.spacing.md,
      paddingTop: UI.spacing.md,
      borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
    });

    this.modal.appendChild(closeBtn);
    this.modal.appendChild(this.contentContainer);
    this.modal.appendChild(this.navContainer);
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);
  }

  renderPage() {
    const page = this.pages[this.currentPage];
    this.contentContainer.innerHTML = '';
    this.navContainer.innerHTML = '';

    // Header with icon and title
    const header = document.createElement('div');
    applyStyles(header, {
      display: 'flex',
      alignItems: 'center',
      gap: UI.spacing.md,
    });

    const icon = document.createElement('div');
    icon.textContent = page.icon;
    applyStyles(icon, {
      fontSize: '48px',
      width: '64px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: page.color ? `${page.color}30` : 'rgba(139, 92, 246, 0.2)',
      borderRadius: UI.borderRadius.lg,
    });

    const title = document.createElement('h2');
    title.textContent = page.title;
    applyStyles(title, {
      fontSize: FONT_SIZES.xl,
      fontWeight: '700',
      fontFamily: FONTS.display,
      margin: '0',
      color: page.color || COLORS.orbPurple,
    });

    header.appendChild(icon);
    header.appendChild(title);
    this.contentContainer.appendChild(header);

    // Render content items
    page.content.forEach(item => {
      const el = this.renderContentItem(item, page);
      if (el) this.contentContainer.appendChild(el);
    });

    // Progress dots
    const dots = document.createElement('div');
    applyStyles(dots, {
      display: 'flex',
      gap: '6px',
      justifyContent: 'center',
    });

    this.pages.forEach((_, i) => {
      const dot = document.createElement('div');
      applyStyles(dot, {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: i === this.currentPage ? COLORS.orbPurple : 'rgba(255, 255, 255, 0.2)',
        cursor: 'pointer',
        transition: `background ${ANIMATIONS.fast}`,
      });
      dot.addEventListener('click', () => {
        SoundEffects.playClick();
        this.currentPage = i;
        this.renderPage();
      });
      dots.appendChild(dot);
    });

    this.navContainer.appendChild(this.createNavButton('←', this.currentPage > 0, () => {
      this.currentPage--;
      this.renderPage();
    }));
    this.navContainer.appendChild(dots);
    this.navContainer.appendChild(this.createNavButton('→', this.currentPage < this.pages.length - 1, () => {
      this.currentPage++;
      this.renderPage();
    }));
  }

  renderContentItem(item, page) {
    switch (item.type) {
      case 'text': {
        const p = document.createElement('p');
        p.textContent = item.value;
        applyStyles(p, {
          margin: '0',
          color: COLORS.textSecondary,
          lineHeight: '1.5',
        });
        return p;
      }

      case 'highlight': {
        const div = document.createElement('div');
        applyStyles(div, {
          background: 'rgba(139, 92, 246, 0.15)',
          border: `1px solid ${COLORS.orbPurple}50`,
          borderRadius: UI.borderRadius.md,
          padding: UI.spacing.md,
          display: 'flex',
          gap: UI.spacing.sm,
          alignItems: 'flex-start',
        });
        const tipIcon = document.createElement('span');
        tipIcon.textContent = '💡';
        const tipText = document.createElement('span');
        tipText.textContent = item.value;
        applyStyles(tipText, { color: COLORS.textPrimary, fontSize: FONT_SIZES.sm });
        div.appendChild(tipIcon);
        div.appendChild(tipText);
        return div;
      }

      case 'steps': {
        const ol = document.createElement('ol');
        applyStyles(ol, {
          margin: '0',
          paddingLeft: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: UI.spacing.sm,
        });
        item.value.forEach(step => {
          const li = document.createElement('li');
          li.textContent = step;
          applyStyles(li, {
            color: COLORS.textSecondary,
            lineHeight: '1.4',
          });
          ol.appendChild(li);
        });
        return ol;
      }

      case 'modeList': {
        const grid = document.createElement('div');
        applyStyles(grid, {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: UI.spacing.sm,
        });
        item.value.forEach(mode => {
          const card = document.createElement('div');
          applyStyles(card, {
            background: `${mode.color}20`,
            border: `1px solid ${mode.color}40`,
            borderRadius: UI.borderRadius.md,
            padding: UI.spacing.sm,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          });
          const modeIcon = document.createElement('span');
          modeIcon.textContent = mode.icon;
          modeIcon.style.fontSize = '24px';
          const modeName = document.createElement('span');
          modeName.textContent = t(`modes.${mode.id}.name`);
          applyStyles(modeName, {
            fontSize: FONT_SIZES.xs,
            fontWeight: '600',
            color: mode.color,
            textAlign: 'center',
          });
          card.appendChild(modeIcon);
          card.appendChild(modeName);
          grid.appendChild(card);
        });
        return grid;
      }

      case 'rewards': {
        const list = document.createElement('div');
        applyStyles(list, {
          display: 'flex',
          flexDirection: 'column',
          gap: UI.spacing.xs,
        });
        item.value.forEach(reward => {
          const row = document.createElement('div');
          applyStyles(row, {
            display: 'flex',
            alignItems: 'center',
            gap: UI.spacing.sm,
            padding: UI.spacing.xs,
          });
          const rIcon = document.createElement('span');
          rIcon.textContent = reward.icon;
          rIcon.style.fontSize = '20px';
          const rText = document.createElement('span');
          rText.textContent = reward.text;
          applyStyles(rText, { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm });
          row.appendChild(rIcon);
          row.appendChild(rText);
          list.appendChild(row);
        });
        return list;
      }

      case 'stageList': {
        const list = document.createElement('div');
        applyStyles(list, {
          display: 'flex',
          flexDirection: 'column',
          gap: UI.spacing.xs,
        });
        item.value.forEach(stage => {
          const row = document.createElement('div');
          applyStyles(row, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${UI.spacing.xs} ${UI.spacing.sm}`,
            background: `${stage.color}15`,
            borderRadius: UI.borderRadius.sm,
          });
          const left = document.createElement('div');
          applyStyles(left, { display: 'flex', alignItems: 'center', gap: UI.spacing.sm });
          const stars = document.createElement('span');
          stars.textContent = '⭐'.repeat(stage.stars);
          stars.style.fontSize = '12px';
          const name = document.createElement('span');
          name.textContent = stage.name;
          applyStyles(name, { color: stage.color, fontWeight: '600' });
          left.appendChild(stars);
          left.appendChild(name);
          const mult = document.createElement('span');
          mult.textContent = `Orbs ${stage.mult}`;
          applyStyles(mult, { color: COLORS.textMuted, fontSize: FONT_SIZES.xs });
          row.appendChild(left);
          row.appendChild(mult);
          list.appendChild(row);
        });
        return list;
      }

      case 'bigButton': {
        const btn = document.createElement('button');
        btn.textContent = `🚀 ${item.value}`;
        applyStyles(btn, {
          padding: UI.spacing.md,
          borderRadius: UI.borderRadius.md,
          border: 'none',
          background: COLORS.gradientCombo,
          color: COLORS.textPrimary,
          fontSize: FONT_SIZES.lg,
          fontWeight: '700',
          cursor: 'pointer',
          marginTop: UI.spacing.md,
        });
        btn.addEventListener('click', () => {
          SoundEffects.playClick();
          this.close();
        });
        return btn;
      }

      default:
        return null;
    }
  }

  createNavButton(text, enabled, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    applyStyles(btn, {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: 'none',
      background: enabled ? COLORS.cardLight : 'rgba(255, 255, 255, 0.05)',
      color: enabled ? COLORS.textPrimary : COLORS.textMuted,
      fontSize: FONT_SIZES.lg,
      cursor: enabled ? 'pointer' : 'default',
      opacity: enabled ? '1' : '0.5',
    });
    if (enabled) {
      btn.addEventListener('click', () => {
        SoundEffects.playClick();
        onClick();
      });
    }
    return btn;
  }

  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}

// Синглтон
const tutorial = new Tutorial();

// Показать туториал
export function showTutorial() {
  tutorial.show();
}

// Проверить нужен ли авто-показ туториала (для новых игроков)
export function shouldShowTutorial() {
  return !localStorage.getItem('orb-masters-tutorial-seen');
}

// Сбросить флаг просмотра
export function resetTutorial() {
  localStorage.removeItem('orb-masters-tutorial-seen');
}

export default tutorial;
