/**
 * LevelSelectScreen.js
 * Экран выбора уровней с прогрессом и звёздами
 */

import { COLORS, FONTS, FONT_SIZES, UI, ANIMATIONS, applyStyles } from '../core/GameConfig.js';
import { SoundEffects } from '../game/SoundEffects.js';
import { t } from '../i18n/LanguageManager.js';
import levelSystem, { STAGE_CONFIG, GOAL_TYPES } from '../core/LevelSystem.js';

class LevelSelectScreen {
  constructor(mode, engine, onBack) {
    this.mode = mode;
    this.engine = engine;
    this.onBack = onBack;
    this.container = null;
    this.currentStage = 1;
  }

  show() {
    this.createUI();
  }

  createUI() {
    // Overlay
    this.container = document.createElement('div');
    applyStyles(this.container, {
      position: 'fixed',
      inset: '0',
      background: `linear-gradient(180deg, ${COLORS.deepSpace} 0%, #1a1a3e 100%)`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: '2000',
      fontFamily: FONTS.primary,
      color: COLORS.textPrimary,
      overflow: 'hidden',
    });

    // Header
    this.createHeader();

    // Stage tabs
    this.createStageTabs();

    // Level grid
    this.levelGrid = document.createElement('div');
    applyStyles(this.levelGrid, {
      flex: '1',
      overflow: 'auto',
      padding: UI.spacing.md,
    });
    this.container.appendChild(this.levelGrid);

    this.renderLevelGrid();

    document.body.appendChild(this.container);
  }

  createHeader() {
    const header = document.createElement('div');
    applyStyles(header, {
      display: 'flex',
      alignItems: 'center',
      padding: UI.spacing.md,
      background: COLORS.cardDark,
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    });

    // Back button
    const backBtn = document.createElement('button');
    backBtn.textContent = '←';
    applyStyles(backBtn, {
      background: 'none',
      border: 'none',
      color: COLORS.textPrimary,
      fontSize: FONT_SIZES.xl,
      cursor: 'pointer',
      padding: UI.spacing.sm,
      marginRight: UI.spacing.md,
    });
    backBtn.addEventListener('click', () => {
      SoundEffects.playClick();
      this.close();
      if (this.onBack) this.onBack();
    });

    // Title
    const title = document.createElement('h1');
    title.textContent = t(`modes.${this.mode}.name`);
    applyStyles(title, {
      fontSize: FONT_SIZES.xl,
      fontWeight: '700',
      fontFamily: FONTS.display,
      margin: '0',
      flex: '1',
    });

    // Progress stats
    const stats = levelSystem.getProgressStats(this.mode);
    const statsDiv = document.createElement('div');
    applyStyles(statsDiv, {
      display: 'flex',
      alignItems: 'center',
      gap: UI.spacing.md,
    });

    const starsText = document.createElement('span');
    starsText.textContent = `⭐ ${stats.totalStars}/${stats.maxStars}`;
    applyStyles(starsText, {
      fontSize: FONT_SIZES.sm,
      color: '#F59E0B',
    });

    const progressText = document.createElement('span');
    progressText.textContent = `${stats.completedLevels}/${stats.totalLevels}`;
    applyStyles(progressText, {
      fontSize: FONT_SIZES.sm,
      color: COLORS.textSecondary,
    });

    statsDiv.appendChild(starsText);
    statsDiv.appendChild(progressText);

    header.appendChild(backBtn);
    header.appendChild(title);
    header.appendChild(statsDiv);
    this.container.appendChild(header);
  }

  createStageTabs() {
    const tabsContainer = document.createElement('div');
    applyStyles(tabsContainer, {
      display: 'flex',
      padding: `${UI.spacing.sm} ${UI.spacing.md}`,
      gap: UI.spacing.xs,
      overflowX: 'auto',
      background: 'rgba(0,0,0,0.2)',
    });

    const progress = levelSystem.progress[this.mode];

    Object.entries(STAGE_CONFIG).forEach(([stageNum, config]) => {
      const stage = parseInt(stageNum);
      const isUnlocked = stage <= progress.unlockedStage;
      const isActive = stage === this.currentStage;

      const tab = document.createElement('button');
      tab.innerHTML = isUnlocked 
        ? `${'⭐'.repeat(stage)} ${config.name}`
        : `🔒 ${config.name}`;
      
      applyStyles(tab, {
        padding: `${UI.spacing.sm} ${UI.spacing.md}`,
        borderRadius: UI.borderRadius.md,
        border: 'none',
        background: isActive ? config.color : (isUnlocked ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)'),
        color: isActive ? '#fff' : (isUnlocked ? COLORS.textSecondary : COLORS.textMuted),
        fontSize: FONT_SIZES.sm,
        fontWeight: isActive ? '600' : '400',
        cursor: isUnlocked ? 'pointer' : 'default',
        opacity: isUnlocked ? 1 : 0.5,
        whiteSpace: 'nowrap',
        transition: `all ${ANIMATIONS.fast}`,
      });

      if (isUnlocked) {
        tab.addEventListener('click', () => {
          SoundEffects.playClick();
          this.currentStage = stage;
          this.updateTabs(tabsContainer);
          this.renderLevelGrid();
        });
      }

      tabsContainer.appendChild(tab);
    });

    this.tabsContainer = tabsContainer;
    this.container.appendChild(tabsContainer);
  }

  updateTabs(container) {
    const tabs = container.querySelectorAll('button');
    const progress = levelSystem.progress[this.mode];

    tabs.forEach((tab, index) => {
      const stage = index + 1;
      const config = STAGE_CONFIG[stage];
      const isUnlocked = stage <= progress.unlockedStage;
      const isActive = stage === this.currentStage;

      tab.style.background = isActive ? config.color : (isUnlocked ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)');
      tab.style.color = isActive ? '#fff' : (isUnlocked ? COLORS.textSecondary : COLORS.textMuted);
      tab.style.fontWeight = isActive ? '600' : '400';
    });
  }

  renderLevelGrid() {
    this.levelGrid.innerHTML = '';

    const levels = levelSystem.getLevelsForStage(this.mode, this.currentStage);
    const stageConfig = STAGE_CONFIG[this.currentStage];
    const progress = levelSystem.progress[this.mode];

    // Stage header
    const stageHeader = document.createElement('div');
    applyStyles(stageHeader, {
      textAlign: 'center',
      marginBottom: UI.spacing.lg,
    });

    const stageName = document.createElement('h2');
    stageName.textContent = `${'⭐'.repeat(this.currentStage)} ${stageConfig.name}`;
    applyStyles(stageName, {
      fontSize: FONT_SIZES.xl,
      color: stageConfig.color,
      margin: '0 0 4px 0',
    });

    const stageInfo = document.createElement('p');
    stageInfo.textContent = `${levels.length} ${t('levels.levels')} • ${stageConfig.orbsMult}x Orbs`;
    applyStyles(stageInfo, {
      fontSize: FONT_SIZES.sm,
      color: COLORS.textSecondary,
      margin: '0',
    });

    stageHeader.appendChild(stageName);
    stageHeader.appendChild(stageInfo);
    this.levelGrid.appendChild(stageHeader);

    // Grid
    const grid = document.createElement('div');
    applyStyles(grid, {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
      gap: UI.spacing.md,
      maxWidth: '500px',
      margin: '0 auto',
    });

    levels.forEach(level => {
      const isUnlocked = levelSystem.isLevelUnlocked(this.mode, level.id);
      const isCompleted = progress.completed[level.id];
      const stars = progress.stars[level.id] || 0;

      const card = document.createElement('div');
      applyStyles(card, {
        background: isUnlocked ? COLORS.cardLight : 'rgba(0,0,0,0.3)',
        borderRadius: UI.borderRadius.lg,
        padding: UI.spacing.md,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: UI.spacing.xs,
        cursor: isUnlocked ? 'pointer' : 'default',
        opacity: isUnlocked ? 1 : 0.5,
        border: level.isBoss ? `2px solid ${stageConfig.color}` : '1px solid rgba(255,255,255,0.1)',
        transition: `transform ${ANIMATIONS.fast}`,
        position: 'relative',
      });

      if (isUnlocked) {
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'scale(1.05)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'scale(1)';
        });
        card.addEventListener('click', () => {
          SoundEffects.playClick();
          this.startLevel(level.id);
        });
      }

      // Boss badge
      if (level.isBoss) {
        const bossBadge = document.createElement('div');
        bossBadge.textContent = '👑';
        applyStyles(bossBadge, {
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          fontSize: '20px',
        });
        card.appendChild(bossBadge);
      }

      // Level number
      const levelNum = document.createElement('div');
      levelNum.textContent = isUnlocked ? level.sublevel : '🔒';
      applyStyles(levelNum, {
        fontSize: isUnlocked ? FONT_SIZES.xl : FONT_SIZES.lg,
        fontWeight: '700',
        color: isCompleted ? stageConfig.color : COLORS.textPrimary,
      });

      // Stars
      const starsDiv = document.createElement('div');
      starsDiv.innerHTML = isCompleted 
        ? this.renderStars(stars)
        : '<span style="color: rgba(255,255,255,0.2)">☆☆☆</span>';
      starsDiv.style.fontSize = '12px';

      // Goal hint
      const goalHint = document.createElement('div');
      goalHint.textContent = this.getGoalIcon(level.goal.type);
      applyStyles(goalHint, {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textMuted,
      });

      card.appendChild(levelNum);
      card.appendChild(starsDiv);
      card.appendChild(goalHint);
      grid.appendChild(card);
    });

    this.levelGrid.appendChild(grid);

    // Next level button
    const nextLevel = levelSystem.getNextLevel(this.mode);
    if (nextLevel && nextLevel.stage === this.currentStage) {
      const playBtn = document.createElement('button');
      playBtn.textContent = `▶ ${t('levels.playLevel')} ${nextLevel.sublevel}`;
      applyStyles(playBtn, {
        display: 'block',
        width: '100%',
        maxWidth: '300px',
        margin: `${UI.spacing.xl} auto 0`,
        padding: UI.spacing.md,
        borderRadius: UI.borderRadius.md,
        border: 'none',
        background: stageConfig.color,
        color: '#fff',
        fontSize: FONT_SIZES.lg,
        fontWeight: '700',
        cursor: 'pointer',
      });
      playBtn.addEventListener('click', () => {
        SoundEffects.playClick();
        this.startLevel(nextLevel.id);
      });
      this.levelGrid.appendChild(playBtn);
    }
  }

  renderStars(count) {
    let html = '';
    for (let i = 1; i <= 3; i++) {
      html += i <= count 
        ? '<span style="color: #F59E0B">★</span>'
        : '<span style="color: rgba(255,255,255,0.2)">☆</span>';
    }
    return html;
  }

  getGoalIcon(type) {
    const icons = {
      [GOAL_TYPES.SCORE]: '🎯',
      [GOAL_TYPES.COLLECT]: '🪙',
      [GOAL_TYPES.SURVIVE]: '⏱️',
      [GOAL_TYPES.COMBO]: '🔥',
      [GOAL_TYPES.NO_DAMAGE]: '🛡️',
      [GOAL_TYPES.COLLECT_SPECIAL]: '💎',
      [GOAL_TYPES.PERFECT]: '✨',
    };
    return icons[type] || '🎯';
  }

  startLevel(levelId) {
    // Сохраняем выбранный уровень
    localStorage.setItem('orb-masters-current-level', levelId);
    localStorage.setItem('orb-masters-current-mode', this.mode);
    
    this.close();
    
    // Запускаем игру
    const level = levelSystem.getLevel(this.mode, levelId);
    this.engine.goTo(`level_${this.mode}`, { levelId, levelConfig: level });
  }

  close() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// Функция для показа экрана выбора уровней
export function showLevelSelect(mode, engine, onBack) {
  const screen = new LevelSelectScreen(mode, engine, onBack);
  screen.show();
  return screen;
}

export default LevelSelectScreen;
