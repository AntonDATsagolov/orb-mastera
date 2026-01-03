/**
 * DailyChallenges.js
 * Экран ежедневных челленджей с наградами
 */

import playerProfile from '../core/PlayerProfile.js';
import orbsManager from '../core/OrbsManager.js';
import { COLORS, FONTS, FONT_SIZES, UI, ANIMATIONS, applyStyles, formatNumber } from '../core/GameConfig.js';
import { SoundEffects } from '../game/SoundEffects.js';
import i18n from '../i18n/LanguageManager.js';

// Типы челленджей
const CHALLENGE_TYPES = {
  PLAY_GAMES: 'play_games',
  SCORE_TOTAL: 'score_total',
  WIN_MODE: 'win_mode',
  COMBO_COUNT: 'combo_count',
  COLLECT_ORBS: 'collect_orbs',
};

// Функция для получения текста челленджа
function getChallengeText(challenge) {
  const { type, target, mode } = challenge;
  
  switch (type) {
    case CHALLENGE_TYPES.PLAY_GAMES:
      return i18n.t('daily.playGames').replace('{0}', target);
    case CHALLENGE_TYPES.SCORE_TOTAL:
      return i18n.t('daily.scoreTotal').replace('{0}', target);
    case CHALLENGE_TYPES.COLLECT_ORBS:
      return i18n.t('daily.collectOrbs').replace('{0}', target);
    case CHALLENGE_TYPES.COMBO_COUNT:
      return i18n.t('daily.comboCount').replace('{0}', target);
    case CHALLENGE_TYPES.WIN_MODE:
      if (mode === 'catch') return i18n.t('daily.winCatch');
      if (mode === 'bricks') return i18n.t('daily.winBricks');
      if (mode === 'puzzle') return i18n.t('daily.winPuzzle');
      if (mode === 'zuma' || mode === 'match3') return i18n.t('daily.winMatch3');
      return 'Win a game';
    default:
      return 'Complete challenge';
  }
}

// Шаблоны челленджей (без getText, т.к. функции не сериализуются)
const CHALLENGE_TEMPLATES = [
  { type: CHALLENGE_TYPES.PLAY_GAMES, target: 3, reward: 50, icon: '🎮' },
  { type: CHALLENGE_TYPES.PLAY_GAMES, target: 5, reward: 80, icon: '🎮' },
  { type: CHALLENGE_TYPES.SCORE_TOTAL, target: 5000, reward: 100, icon: '⭐' },
  { type: CHALLENGE_TYPES.SCORE_TOTAL, target: 10000, reward: 150, icon: '⭐' },
  { type: CHALLENGE_TYPES.WIN_MODE, target: 1, mode: 'catch', reward: 60, icon: '🏆' },
  { type: CHALLENGE_TYPES.WIN_MODE, target: 1, mode: 'bricks', reward: 60, icon: '🏆' },
  { type: CHALLENGE_TYPES.WIN_MODE, target: 1, mode: 'puzzle', reward: 60, icon: '🏆' },
  { type: CHALLENGE_TYPES.WIN_MODE, target: 1, mode: 'match3', reward: 60, icon: '🏆' },
  { type: CHALLENGE_TYPES.COMBO_COUNT, target: 10, reward: 70, icon: '🔥' },
  { type: CHALLENGE_TYPES.COMBO_COUNT, target: 20, reward: 120, icon: '🔥' },
  { type: CHALLENGE_TYPES.COLLECT_ORBS, target: 100, reward: 50, icon: '🔮' },
  { type: CHALLENGE_TYPES.COLLECT_ORBS, target: 200, reward: 80, icon: '🔮' },
];

class DailyChallengesManager {
  constructor() {
    this.storageKey = 'orb-masters-daily-challenges';
    this.data = this.load();
  }

  load() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      // Проверяем, не новый ли день
      if (this.isNewDay(data.date)) {
        return this.generateNew();
      }
      return data;
    }
    return this.generateNew();
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  isNewDay(savedDate) {
    const today = new Date().toDateString();
    return savedDate !== today;
  }

  generateNew() {
    // Выбираем 3 случайных челленджа
    const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    const challenges = selected.map((template, index) => ({
      id: index,
      type: template.type,
      target: template.target,
      mode: template.mode,
      reward: template.reward,
      icon: template.icon,
      progress: 0,
      claimed: false,
    }));

    const data = {
      date: new Date().toDateString(),
      challenges,
      adWatched: false,
    };

    this.data = data;
    this.save();
    return data;
  }

  getChallenges() {
    // Проверяем на новый день при каждом вызове
    if (this.isNewDay(this.data.date)) {
      this.data = this.generateNew();
    }
    return this.data.challenges;
  }

  updateProgress(type, value, mode = null) {
    this.data.challenges.forEach(ch => {
      if (ch.claimed) return;
      
      if (ch.type === type) {
        if (type === CHALLENGE_TYPES.WIN_MODE && ch.mode !== mode) return;
        
        if (type === CHALLENGE_TYPES.PLAY_GAMES || type === CHALLENGE_TYPES.WIN_MODE) {
          ch.progress += value;
        } else {
          ch.progress += value;
        }
        
        ch.progress = Math.min(ch.progress, ch.target);
      }
    });
    this.save();
  }

  claimReward(challengeId) {
    const challenge = this.data.challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.claimed || challenge.progress < challenge.target) {
      return false;
    }

    challenge.claimed = true;
    orbsManager.addBonus(challenge.reward, 'Daily Challenge');
    this.save();
    return true;
  }

  canWatchAd() {
    return !this.data.adWatched;
  }

  watchAd() {
    if (this.data.adWatched) return false;
    this.data.adWatched = true;
    orbsManager.addBonus(50, 'Daily Ad Reward');
    this.save();
    return true;
  }

  getTimeUntilReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow - now;
  }
}

// Синглтон
const dailyChallenges = new DailyChallengesManager();
export { dailyChallenges, CHALLENGE_TYPES };

/**
 * Показать экран Daily Challenges
 */
export function showDailyChallenges(onClose) {
  // Проверяем, не открыт ли уже
  if (document.getElementById('daily-challenges-screen')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'daily-challenges-screen';
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
  title.textContent = `📅 ${i18n.t('daily.title')}`;
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

  // Timer until reset
  const timerDiv = document.createElement('div');
  applyStyles(timerDiv, {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: UI.spacing.lg,
    textAlign: 'center',
  });
  
  function updateTimer() {
    const ms = dailyChallenges.getTimeUntilReset();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    timerDiv.textContent = `${i18n.t('daily.resetIn')}: ${hours}h ${minutes}m`;
  }
  updateTimer();
  const timerInterval = setInterval(updateTimer, 60000);

  overlay.appendChild(timerDiv);

  // Challenges list
  const challengesContainer = document.createElement('div');
  applyStyles(challengesContainer, {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: UI.spacing.md,
    marginBottom: UI.spacing.xl,
  });

  function renderChallenges() {
    challengesContainer.innerHTML = '';
    const challenges = dailyChallenges.getChallenges();

    challenges.forEach(ch => {
      const card = document.createElement('div');
      const isComplete = ch.progress >= ch.target;
      
      applyStyles(card, {
        background: ch.claimed ? 'rgba(76, 175, 80, 0.2)' : COLORS.cardDark,
        borderRadius: UI.borderRadius.lg,
        padding: UI.spacing.md,
        display: 'flex',
        alignItems: 'center',
        gap: UI.spacing.md,
        border: isComplete && !ch.claimed ? `2px solid ${COLORS.successGreen}` : '2px solid transparent',
        opacity: ch.claimed ? '0.7' : '1',
      });

      // Icon
      const icon = document.createElement('div');
      icon.textContent = ch.icon;
      applyStyles(icon, {
        fontSize: '32px',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: UI.borderRadius.md,
      });

      // Content
      const content = document.createElement('div');
      applyStyles(content, {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        gap: UI.spacing.xs,
      });

      const text = document.createElement('div');
      text.textContent = getChallengeText(ch);
      applyStyles(text, {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
      });

      // Progress bar
      const progressBar = document.createElement('div');
      applyStyles(progressBar, {
        width: '100%',
        height: '8px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: UI.borderRadius.full,
        overflow: 'hidden',
      });

      const progressFill = document.createElement('div');
      const percent = Math.min((ch.progress / ch.target) * 100, 100);
      applyStyles(progressFill, {
        width: `${percent}%`,
        height: '100%',
        background: ch.claimed ? COLORS.successGreen : COLORS.gradientGold,
        borderRadius: UI.borderRadius.full,
        transition: 'width 0.3s ease',
      });
      progressBar.appendChild(progressFill);

      const progressText = document.createElement('div');
      progressText.textContent = `${ch.progress}/${ch.target}`;
      applyStyles(progressText, {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
      });

      content.appendChild(text);
      content.appendChild(progressBar);
      content.appendChild(progressText);

      // Reward / Claim button
      const rewardSection = document.createElement('div');
      applyStyles(rewardSection, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: UI.spacing.xs,
      });

      if (ch.claimed) {
        const checkmark = document.createElement('div');
        checkmark.textContent = '✓';
        applyStyles(checkmark, {
          fontSize: FONT_SIZES.xl,
          color: COLORS.successGreen,
        });
        rewardSection.appendChild(checkmark);
      } else if (isComplete) {
        const claimBtn = document.createElement('button');
        claimBtn.textContent = i18n.t('daily.claim');
        applyStyles(claimBtn, {
          padding: `${UI.spacing.sm} ${UI.spacing.md}`,
          background: COLORS.gradientSuccess,
          border: 'none',
          borderRadius: UI.borderRadius.md,
          color: COLORS.textPrimary,
          fontSize: FONT_SIZES.sm,
          fontWeight: '600',
          cursor: 'pointer',
          animation: 'pulse 1s infinite',
        });
        claimBtn.onclick = () => {
          SoundEffects.playBonus();
          dailyChallenges.claimReward(ch.id);
          renderChallenges();
        };
        rewardSection.appendChild(claimBtn);
      } else {
        const rewardText = document.createElement('div');
        rewardText.textContent = `+${ch.reward} 🔮`;
        applyStyles(rewardText, {
          fontSize: FONT_SIZES.md,
          color: COLORS.orbPurple,
          fontWeight: '600',
        });
        rewardSection.appendChild(rewardText);
      }

      card.appendChild(icon);
      card.appendChild(content);
      card.appendChild(rewardSection);
      challengesContainer.appendChild(card);
    });
  }

  renderChallenges();
  overlay.appendChild(challengesContainer);

  // Watch Ad button
  const adSection = document.createElement('div');
  applyStyles(adSection, {
    width: '100%',
    maxWidth: '500px',
    padding: UI.spacing.lg,
    background: 'rgba(139, 92, 246, 0.15)',
    borderRadius: UI.borderRadius.lg,
    border: `1px solid ${COLORS.orbPurple}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: UI.spacing.md,
  });

  const adTitle = document.createElement('div');
  adTitle.textContent = i18n.t('daily.bonusOrbs');
  applyStyles(adTitle, {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    textAlign: 'center',
  });

  const adBtn = document.createElement('button');
  const canWatch = dailyChallenges.canWatchAd();
  adBtn.textContent = canWatch ? `📺 ${i18n.t('daily.watchAd')} → +50 🔮` : `✓ ${i18n.t('daily.adWatched')}`;
  applyStyles(adBtn, {
    padding: `${UI.spacing.md} ${UI.spacing.xl}`,
    background: canWatch ? COLORS.gradientGold : 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: UI.borderRadius.md,
    color: canWatch ? COLORS.deepSpace : COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    cursor: canWatch ? 'pointer' : 'not-allowed',
    opacity: canWatch ? '1' : '0.6',
  });

  if (canWatch) {
    adBtn.onclick = () => {
      SoundEffects.playClick();
      // Имитация просмотра рекламы
      showAdModal(() => {
        dailyChallenges.watchAd();
        adBtn.textContent = `✓ ${i18n.t('daily.adWatched')}`;
        adBtn.style.background = 'rgba(255,255,255,0.1)';
        adBtn.style.color = COLORS.textMuted;
        adBtn.style.cursor = 'not-allowed';
        adBtn.onclick = null;
      });
    };
  }

  adSection.appendChild(adTitle);
  adSection.appendChild(adBtn);
  overlay.appendChild(adSection);

  // Cleanup on close
  overlay.addEventListener('remove', () => {
    clearInterval(timerInterval);
  });

  document.body.appendChild(overlay);
}

/**
 * Показать имитацию рекламы
 */
function showAdModal(onComplete) {
  const modal = document.createElement('div');
  applyStyles(modal, {
    position: 'fixed',
    inset: '0',
    background: COLORS.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '3000',
  });

  const content = document.createElement('div');
  applyStyles(content, {
    background: COLORS.cardDark,
    borderRadius: UI.borderRadius.xl,
    padding: UI.spacing.xl,
    maxWidth: '350px',
    width: '90%',
    textAlign: 'center',
  });

  const icon = document.createElement('div');
  icon.textContent = '📺';
  icon.style.fontSize = '64px';
  icon.style.marginBottom = UI.spacing.md;

  const text = document.createElement('div');
  text.innerHTML = `
    <div style="font-size: 20px; margin-bottom: 12px; color: #FFD700;">[ТЕСТ]</div>
    <div style="margin-bottom: 20px;">Orbs удвоены!</div>
    <div style="font-size: 12px; color: #888;">В релизе — реклама от AdMob.</div>
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = i18n.t('common.ok');
  applyStyles(closeBtn, {
    marginTop: UI.spacing.lg,
    padding: `${UI.spacing.md} ${UI.spacing.xl}`,
    background: COLORS.gradientSuccess,
    border: 'none',
    borderRadius: UI.borderRadius.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    cursor: 'pointer',
  });
  closeBtn.onclick = () => {
    SoundEffects.playBonus();
    modal.remove();
    if (onComplete) onComplete();
  };

  content.appendChild(icon);
  content.appendChild(text);
  content.appendChild(closeBtn);
  modal.appendChild(content);
  document.body.appendChild(modal);
}

export default showDailyChallenges;
