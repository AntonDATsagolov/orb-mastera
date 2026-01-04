/**
 * MainMenu.js
 * Новое главное меню с хабом режимов, отображением прогресса и Orbs
 */

import playerProfile from '../core/PlayerProfile.js';
import orbsManager from '../core/OrbsManager.js';
import { COLORS, FONTS, FONT_SIZES, UI, ANIMATIONS, GAME_MODES, STAGES, applyStyles, formatNumber } from '../core/GameConfig.js';
import { AudioManager } from '../game/AudioManager.js';
import { SoundEffects } from '../game/SoundEffects.js';
import i18n, { t } from '../i18n/LanguageManager.js';
import { showTutorial, shouldShowTutorial } from './Tutorial.js';
import { showLevelSelect } from './LevelSelectScreen.js';

class MainMenu {
  constructor(engine) {
    this.engine = engine;
    this.container = null;
    this.selectedMode = null;
    this.selectedStage = 1;
    this.languageChangeHandler = null;
  }

  create() {
    // Запускаем музыку меню
    AudioManager.playTrack('menu');

    // Слушатель смены языка
    this.languageChangeHandler = () => this.refresh();
    window.addEventListener('languageChanged', this.languageChangeHandler);

    // Контейнер
    this.container = document.createElement('div');
    applyStyles(this.container, {
      position: 'absolute',
      inset: '0',
      background: `linear-gradient(180deg, ${COLORS.deepSpace} 0%, #1a1a3e 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: UI.spacing.lg,
      zIndex: '1000',
      fontFamily: FONTS.primary,
      color: COLORS.textPrimary,
      overflow: 'auto',
    });

    // Header с профилем
    this.createHeader();

    // Карточка Daily Bonus (если есть)
    this.createDailyBonus();

    // Режимы игры
    this.createModeCards();

    // Нижняя панель
    this.createBottomBar();

    document.body.appendChild(this.container);

    // Показываем туториал для новых игроков
    if (shouldShowTutorial()) {
      setTimeout(() => showTutorial(), 500);
    }
  }

  createHeader() {
    const header = document.createElement('div');
    applyStyles(header, {
      width: '100%',
      maxWidth: '500px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: UI.spacing.lg,
    });

    // Левая часть - уровень
    const levelSection = document.createElement('div');
    applyStyles(levelSection, {
      display: 'flex',
      flexDirection: 'column',
      gap: UI.spacing.xs,
    });

    const levelBadge = document.createElement('div');
    applyStyles(levelBadge, {
      display: 'flex',
      alignItems: 'center',
      gap: UI.spacing.sm,
    });

    const levelIcon = document.createElement('span');
    levelIcon.textContent = '⚡';
    levelIcon.style.fontSize = FONT_SIZES.xl;

    const levelText = document.createElement('span');
    levelText.textContent = `Level ${playerProfile.level}`;
    applyStyles(levelText, {
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
    });

    levelBadge.appendChild(levelIcon);
    levelBadge.appendChild(levelText);

    // Прогресс-бар XP
    const xpProgress = playerProfile.xpProgress;
    const progressContainer = document.createElement('div');
    applyStyles(progressContainer, {
      width: '120px',
      height: '6px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: UI.borderRadius.full,
      overflow: 'hidden',
    });

    const progressBar = document.createElement('div');
    applyStyles(progressBar, {
      width: `${xpProgress.percent}%`,
      height: '100%',
      background: COLORS.gradientCombo,
      borderRadius: UI.borderRadius.full,
      transition: `width ${ANIMATIONS.slow} ${ANIMATIONS.easeOutBack}`,
    });

    progressContainer.appendChild(progressBar);

    const xpText = document.createElement('span');
    xpText.textContent = `${formatNumber(xpProgress.current)} / ${formatNumber(xpProgress.needed)} XP`;
    applyStyles(xpText, {
      fontSize: FONT_SIZES.xs,
      color: COLORS.textMuted,
    });

    levelSection.appendChild(levelBadge);
    levelSection.appendChild(progressContainer);
    levelSection.appendChild(xpText);

    // Правая часть - Orbs
    const orbsSection = document.createElement('div');
    applyStyles(orbsSection, {
      display: 'flex',
      alignItems: 'center',
      gap: UI.spacing.sm,
      background: 'rgba(139, 92, 246, 0.2)',
      padding: `${UI.spacing.sm} ${UI.spacing.md}`,
      borderRadius: UI.borderRadius.lg,
      border: `1px solid ${COLORS.orbPurple}`,
    });

    const orbsIcon = document.createElement('span');
    orbsIcon.textContent = '🔮';
    orbsIcon.style.fontSize = FONT_SIZES.xl;

    const orbsAmount = document.createElement('span');
    orbsAmount.textContent = formatNumber(playerProfile.orbs);
    applyStyles(orbsAmount, {
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
      fontFamily: FONTS.mono,
    });

    const addButton = document.createElement('button');
    addButton.textContent = '+';
    applyStyles(addButton, {
      width: '24px',
      height: '24px',
      borderRadius: UI.borderRadius.full,
      border: 'none',
      background: COLORS.orbPurple,
      color: COLORS.textPrimary,
      fontSize: FONT_SIZES.md,
      fontWeight: '700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });

    addButton.addEventListener('click', () => {
      SoundEffects.playClick();
      this.showShop();
    });

    orbsSection.appendChild(orbsIcon);
    orbsSection.appendChild(orbsAmount);
    orbsSection.appendChild(addButton);

    header.appendChild(levelSection);
    header.appendChild(orbsSection);
    this.container.appendChild(header);

    // Название игры
    const title = document.createElement('h1');
    title.textContent = 'ORB MASTERS';
    applyStyles(title, {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: '800',
      fontFamily: FONTS.display,
      background: COLORS.gradientCombo,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: '0 0 8px 0',
      textAlign: 'center',
      letterSpacing: '2px',
    });

    this.container.appendChild(title);

    // Подзаголовок
    const subtitle = document.createElement('p');
    subtitle.textContent = t('mainMenu.selectMode');
    applyStyles(subtitle, {
      fontSize: FONT_SIZES.md,
      color: COLORS.textSecondary,
      margin: `0 0 ${UI.spacing.lg} 0`,
    });

    this.container.appendChild(subtitle);
  }

  createDailyBonus() {
    const dailyBonus = orbsManager.getDailyBonus();
    
    // Проверяем, получен ли уже бонус сегодня
    const today = new Date().toDateString();
    const lastClaimed = localStorage.getItem('orb-masters-daily-claimed');
    if (lastClaimed === today) return;

    const card = document.createElement('div');
    applyStyles(card, {
      width: '100%',
      maxWidth: '500px',
      background: COLORS.gradientGold,
      borderRadius: UI.borderRadius.lg,
      padding: UI.spacing.md,
      marginBottom: UI.spacing.lg,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      transition: `transform ${ANIMATIONS.normal} ${ANIMATIONS.easeOutBack}`,
    });

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
    });

    const leftPart = document.createElement('div');
    
    const bonusTitle = document.createElement('div');
    bonusTitle.textContent = t('mainMenu.dailyBonus');
    applyStyles(bonusTitle, {
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
      color: COLORS.deepSpace,
    });

    const streakText = document.createElement('div');
    streakText.textContent = t('mainMenu.dayStreak').replace('{0}', dailyBonus.currentStreak);
    applyStyles(streakText, {
      fontSize: FONT_SIZES.sm,
      color: 'rgba(0, 0, 0, 0.6)',
    });

    leftPart.appendChild(bonusTitle);
    leftPart.appendChild(streakText);

    const rightPart = document.createElement('div');
    applyStyles(rightPart, {
      display: 'flex',
      alignItems: 'center',
      gap: UI.spacing.sm,
    });

    const amount = document.createElement('span');
    amount.textContent = `+${dailyBonus.total}`;
    applyStyles(amount, {
      fontSize: FONT_SIZES.xxl,
      fontWeight: '800',
      color: COLORS.deepSpace,
    });

    const orbIcon = document.createElement('span');
    orbIcon.textContent = '🔮';
    orbIcon.style.fontSize = FONT_SIZES.xl;

    rightPart.appendChild(amount);
    rightPart.appendChild(orbIcon);

    card.appendChild(leftPart);
    card.appendChild(rightPart);

    card.addEventListener('click', () => {
      SoundEffects.playBonus();
      orbsManager.addBonus(dailyBonus.total, 'Daily bonus');
      localStorage.setItem('orb-masters-daily-claimed', today);
      
      // Анимация
      card.style.transform = 'scale(1.1)';
      card.style.opacity = '0';
      setTimeout(() => card.remove(), 300);
      
      // Обновить отображение Orbs
      this.refresh();
    });

    this.container.appendChild(card);
  }

  createModeCards() {
    const modesGrid = document.createElement('div');
    applyStyles(modesGrid, {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: UI.spacing.md,
      width: '100%',
      maxWidth: '500px',
      marginBottom: UI.spacing.lg,
    });

    const modes = Object.values(GAME_MODES);

    modes.forEach(mode => {
      const card = this.createModeCard(mode);
      modesGrid.appendChild(card);
    });

    this.container.appendChild(modesGrid);
  }

  createModeCard(mode) {
    // Проверяем разблокирован ли режим по уровню игрока
    const isUnlocked = playerProfile.level >= mode.unlockLevel;
    const masteryLevel = playerProfile.getMasteryLevel(mode.id);

    const card = document.createElement('div');
    applyStyles(card, {
      background: isUnlocked ? COLORS.cardDark : 'rgba(255, 255, 255, 0.05)',
      borderRadius: UI.borderRadius.lg,
      padding: UI.spacing.md,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: UI.spacing.sm,
      cursor: isUnlocked ? 'pointer' : 'not-allowed',
      opacity: isUnlocked ? '1' : '0.5',
      border: isUnlocked ? `2px solid transparent` : `2px solid rgba(255, 255, 255, 0.1)`,
      transition: `all ${ANIMATIONS.normal} ${ANIMATIONS.easeInOut}`,
      position: 'relative',
      overflow: 'hidden',
    });

    if (isUnlocked) {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.borderColor = mode.color;
        card.style.boxShadow = `0 8px 24px ${mode.color}40`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.borderColor = 'transparent';
        card.style.boxShadow = 'none';
      });

      card.addEventListener('click', () => {
        SoundEffects.playClick();
        this.selectMode(mode);
      });
    }

    // Иконка режима
    const icon = document.createElement('div');
    icon.textContent = mode.icon;
    applyStyles(icon, {
      fontSize: '48px',
      filter: isUnlocked ? 'none' : 'grayscale(100%)',
    });

    // Название
    const name = document.createElement('div');
    name.textContent = t(`modes.${mode.id}.shortName`);
    applyStyles(name, {
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
      color: isUnlocked ? COLORS.textPrimary : COLORS.textMuted,
    });

    // Mastery
    if (isUnlocked) {
      const mastery = document.createElement('div');
      mastery.textContent = `⭐ ${t('mainMenu.mastery')} ${masteryLevel}`;
      applyStyles(mastery, {
        fontSize: FONT_SIZES.sm,
        color: mode.color,
        fontWeight: '600',
      });
      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(mastery);
    } else {
      // Лок
      const lockIcon = document.createElement('div');
      lockIcon.textContent = '🔒';
      applyStyles(lockIcon, {
        position: 'absolute',
        top: UI.spacing.sm,
        right: UI.spacing.sm,
        fontSize: FONT_SIZES.lg,
      });

      const unlockText = document.createElement('div');
      unlockText.textContent = `${t('levels.locked')} ${mode.unlockLevel}`;
      applyStyles(unlockText, {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textMuted,
      });

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(unlockText);
      card.appendChild(lockIcon);
    }

    return card;
  }

  selectMode(mode) {
    this.selectedMode = mode;
    // Показываем экран выбора уровней для этого режима
    this.destroy();
    showLevelSelect(mode.id, this.engine, () => {
      // Callback при возврате — показываем меню снова
      this.create();
    });
  }

  showQuickPlay(mode) {
    // Быстрый старт без выбора уровня (бесконечный режим)
    // Оверлей
    const overlay = document.createElement('div');
    applyStyles(overlay, {
      position: 'fixed',
      inset: '0',
      background: COLORS.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1100',
      animation: `fadeIn ${ANIMATIONS.normal} ${ANIMATIONS.easeOutBack}`,
    });

    const modal = document.createElement('div');
    applyStyles(modal, {
      background: COLORS.cardDark,
      borderRadius: UI.borderRadius.xl,
      padding: UI.spacing.xl,
      maxWidth: '400px',
      width: '90%',
      display: 'flex',
      flexDirection: 'column',
      gap: UI.spacing.lg,
      animation: `slideUp ${ANIMATIONS.normal} ${ANIMATIONS.easeOutBack}`,
    });

    // Заголовок
    const header = document.createElement('div');
    applyStyles(header, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    });

    const title = document.createElement('div');
    title.innerHTML = `${mode.icon} ${t(`modes.${mode.id}.name`)}`;
    applyStyles(title, {
      fontSize: FONT_SIZES.xl,
      fontWeight: '700',
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    applyStyles(closeBtn, {
      background: 'none',
      border: 'none',
      color: COLORS.textSecondary,
      fontSize: FONT_SIZES.xl,
      cursor: 'pointer',
    });

    closeBtn.addEventListener('click', () => overlay.remove());

    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Выбор сложности
    const stagesTitle = document.createElement('div');
    stagesTitle.textContent = t('mainMenu.selectDifficulty');
    applyStyles(stagesTitle, {
      fontSize: FONT_SIZES.md,
      color: COLORS.textSecondary,
    });
    modal.appendChild(stagesTitle);

    const stagesGrid = document.createElement('div');
    applyStyles(stagesGrid, {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: UI.spacing.sm,
    });

    Object.entries(STAGES).forEach(([stageNum, stage]) => {
      const stageBtn = document.createElement('button');
      const isSelected = parseInt(stageNum) === this.selectedStage;
      // Стадия разблокирована если уровень игрока достаточен
      const isUnlocked = playerProfile.level >= (parseInt(stageNum) - 1) * 10 + 1;

      applyStyles(stageBtn, {
        padding: UI.spacing.md,
        borderRadius: UI.borderRadius.md,
        border: isSelected ? `2px solid ${stage.color}` : '2px solid transparent',
        background: isUnlocked ? 
          (isSelected ? `${stage.color}30` : 'rgba(255, 255, 255, 0.05)') : 
          'rgba(255, 255, 255, 0.02)',
        cursor: isUnlocked ? 'pointer' : 'not-allowed',
        opacity: isUnlocked ? '1' : '0.4',
        transition: `all ${ANIMATIONS.fast}`,
      });

      const stars = document.createElement('div');
      stars.textContent = '⭐'.repeat(stage.stars);
      stars.style.marginBottom = UI.spacing.xs;

      // Название сложности с переводом
      const stageKey = stage.name.toLowerCase(); // rookie, skilled, expert, master, legend
      const name = document.createElement('div');
      name.textContent = t(`stages.${stageKey}`);
      applyStyles(name, {
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        color: isUnlocked ? stage.color : COLORS.textMuted,
      });

      const mult = document.createElement('div');
      mult.textContent = `×${stage.orbsMult} Orbs`;
      applyStyles(mult, {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
      });

      stageBtn.appendChild(stars);
      stageBtn.appendChild(name);
      stageBtn.appendChild(mult);

      if (isUnlocked) {
        stageBtn.addEventListener('click', () => {
          this.selectedStage = parseInt(stageNum);
          // Обновить UI
          stagesGrid.querySelectorAll('button').forEach(btn => {
            btn.style.borderColor = 'transparent';
            btn.style.background = 'rgba(255, 255, 255, 0.05)';
          });
          stageBtn.style.borderColor = stage.color;
          stageBtn.style.background = `${stage.color}30`;
        });
      }

      stagesGrid.appendChild(stageBtn);
    });

    modal.appendChild(stagesGrid);

    // Кнопка играть
    const playBtn = document.createElement('button');
    playBtn.textContent = `▶ ${t('menu.play')}`;
    applyStyles(playBtn, {
      padding: UI.spacing.md,
      borderRadius: UI.borderRadius.md,
      border: 'none',
      background: mode.gradient,
      color: COLORS.textPrimary,
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
      cursor: 'pointer',
      transition: `transform ${ANIMATIONS.fast}`,
    });

    playBtn.addEventListener('mouseenter', () => {
      playBtn.style.transform = 'scale(1.02)';
    });

    playBtn.addEventListener('mouseleave', () => {
      playBtn.style.transform = 'scale(1)';
    });

    playBtn.addEventListener('click', () => {
      SoundEffects.playClick();
      overlay.remove();
      this.startGame(mode);
    });

    modal.appendChild(playBtn);

    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
  }

  startGame(mode) {
    // Сохраняем выбранный stage для использования в игре
    localStorage.setItem('orb-masters-current-mode', mode.id);
    localStorage.setItem('orb-masters-current-stage', this.selectedStage.toString());
    
    // Удаляем меню
    this.destroy();
    
    // Переходим к игре
    this.engine.goTo(mode.sceneKey);
  }

  createBottomBar() {
    const bar = document.createElement('div');
    applyStyles(bar, {
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      background: COLORS.cardDark,
      borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
      padding: UI.spacing.md,
      display: 'flex',
      justifyContent: 'space-around',
      zIndex: '1001',
    });

    const buttons = [
      { icon: '❓', labelKey: 'bottomBar.howToPlay', action: () => this.showTutorial() },
      { icon: '📅', labelKey: 'bottomBar.daily', action: () => this.showDailyChallenges() },
      { icon: '🏆', labelKey: 'bottomBar.leaderboard', action: () => this.showLeaderboard() },
      { icon: '🎁', labelKey: 'bottomBar.shop', action: () => this.showShop() },
      { icon: '⚙️', labelKey: 'bottomBar.settings', action: () => this.showSettings() },
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      applyStyles(button, {
        background: 'none',
        border: 'none',
        color: COLORS.textSecondary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: UI.spacing.xs,
        cursor: 'pointer',
        padding: UI.spacing.sm,
        transition: `color ${ANIMATIONS.fast}`,
      });

      button.addEventListener('mouseenter', () => {
        button.style.color = COLORS.textPrimary;
      });

      button.addEventListener('mouseleave', () => {
        button.style.color = COLORS.textSecondary;
      });

      const icon = document.createElement('span');
      icon.textContent = btn.icon;
      icon.style.fontSize = FONT_SIZES.xl;

      const label = document.createElement('span');
      label.textContent = t(btn.labelKey);
      label.style.fontSize = FONT_SIZES.xs;

      button.appendChild(icon);
      button.appendChild(label);

      button.addEventListener('click', () => {
        SoundEffects.playClick();
        btn.action();
      });

      bar.appendChild(button);
    });

    this.container.appendChild(bar);

    // Добавляем отступ снизу чтобы контент не перекрывался
    const spacer = document.createElement('div');
    spacer.style.height = '80px';
    this.container.appendChild(spacer);
  }

  showDailyChallenges() {
    import('./DailyChallenges.js').then(module => {
      module.showDailyChallenges();
    });
  }

  showLeaderboard() {
    // Используем Records вместо Leaderboard (личные рекорды)
    import('./Records.js').then(module => {
      module.showRecords();
    });
  }

  showShop() {
    import('./Shop.js').then(module => {
      module.showShop();
    });
  }

  showSettings() {
    // Используем существующий модал настроек
    import('../game/SettingsModal.js').then(module => {
      module.showSettingsModal();
    });
  }

  showTutorial() {
    showTutorial();
  }

  refresh() {
    this.destroy();
    this.create();
  }

  destroy() {
    // Удаляем слушатель смены языка
    if (this.languageChangeHandler) {
      window.removeEventListener('languageChanged', this.languageChangeHandler);
      this.languageChangeHandler = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// Функция-обёртка для использования как сцена
function MainMenuScene(engine) {
  let menu = null;
  
  return {
    async init() {
      menu = new MainMenu(engine);
      menu.create();
    },
    onResize() {},
    update() {},
    render() {},
    onExit() {
      if (menu) {
        menu.destroy();
        menu = null;
      }
    }
  };
}

export default MainMenuScene;
export { MainMenu };
