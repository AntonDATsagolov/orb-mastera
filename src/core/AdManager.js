/**
 * AdManager.js
 * Менеджер рекламы с заглушкой для rewarded ads
 * В продакшене заменить на реальный SDK (AdMob, Unity Ads, Yandex Ads и т.д.)
 */

import { COLORS, FONTS, FONT_SIZES, UI, applyStyles } from '../core/GameConfig.js';
import orbsManager from '../core/OrbsManager.js';
import i18n from '../i18n/LanguageManager.js';

class AdManager {
  constructor() {
    this.isAdLoading = false;
    this.adCooldown = 0;
    this.lastAdTime = 0;
    this.minCooldown = 30000; // 30 секунд между рекламами
  }

  /**
   * Проверить, готова ли реклама
   */
  isAdReady() {
    const now = Date.now();
    return !this.isAdLoading && (now - this.lastAdTime) > this.minCooldown;
  }

  /**
   * Показать rewarded video с заглушкой
   * @param {Object} options
   * @param {number} options.reward - количество сфер за просмотр
   * @param {string} options.reason - причина награды
   * @param {Function} options.onComplete - callback после просмотра
   * @param {Function} options.onError - callback при ошибке
   */
  showRewardedVideo({ reward = 50, reason = 'Rewarded Ad', onComplete, onError }) {
    if (!this.isAdReady()) {
      if (onError) onError('Ad not ready');
      return;
    }

    this.isAdLoading = true;

    // Создаём мок-рекламу
    const overlay = document.createElement('div');
    overlay.id = 'ad-overlay';
    applyStyles(overlay, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10000',
      fontFamily: FONTS.primary,
      color: COLORS.textPrimary,
    });

    // Контент рекламы (заглушка)
    const content = document.createElement('div');
    applyStyles(content, {
      background: COLORS.cardDark,
      borderRadius: UI.borderRadius.xl,
      padding: UI.spacing.xl,
      textAlign: 'center',
      maxWidth: '320px',
    });

    // Иконка
    const icon = document.createElement('div');
    icon.textContent = '🎬';
    icon.style.fontSize = '64px';
    icon.style.marginBottom = UI.spacing.md;

    // Заголовок
    const title = document.createElement('div');
    title.textContent = 'Смотрите рекламу';
    applyStyles(title, {
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
      marginBottom: UI.spacing.sm,
    });

    // Описание
    const desc = document.createElement('div');
    desc.textContent = `Получите +${reward} 🔮 после просмотра`;
    applyStyles(desc, {
      fontSize: FONT_SIZES.sm,
      color: COLORS.textSecondary,
      marginBottom: UI.spacing.lg,
    });

    // Прогресс бар
    const progressContainer = document.createElement('div');
    applyStyles(progressContainer, {
      width: '100%',
      height: '8px',
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: UI.spacing.md,
    });

    const progressBar = document.createElement('div');
    applyStyles(progressBar, {
      width: '0%',
      height: '100%',
      background: COLORS.gradientPurple,
      borderRadius: '4px',
      transition: 'width 0.1s linear',
    });
    progressContainer.appendChild(progressBar);

    // Таймер
    const timer = document.createElement('div');
    timer.textContent = '5';
    applyStyles(timer, {
      fontSize: FONT_SIZES.md,
      color: COLORS.textSecondary,
    });

    // Кнопка пропуска (появится после просмотра)
    const skipBtn = document.createElement('button');
    skipBtn.textContent = '✓ Получить награду';
    skipBtn.style.display = 'none';
    applyStyles(skipBtn, {
      background: COLORS.gradientPurple,
      border: 'none',
      color: '#fff',
      padding: '14px 32px',
      borderRadius: UI.borderRadius.lg,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: UI.spacing.md,
    });

    content.appendChild(icon);
    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(progressContainer);
    content.appendChild(timer);
    content.appendChild(skipBtn);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Симулируем просмотр рекламы (5 секунд)
    let timeLeft = 5;
    const interval = setInterval(() => {
      timeLeft--;
      timer.textContent = timeLeft.toString();
      progressBar.style.width = `${((5 - timeLeft) / 5) * 100}%`;

      if (timeLeft <= 0) {
        clearInterval(interval);
        timer.textContent = '✓';
        timer.style.color = '#10B981';
        skipBtn.style.display = 'block';
      }
    }, 1000);

    skipBtn.onclick = () => {
      // Выдаём награду
      orbsManager.addBonus(reward, reason);
      
      this.isAdLoading = false;
      this.lastAdTime = Date.now();
      
      overlay.remove();
      
      if (onComplete) {
        onComplete({ reward });
      }
    };
  }

  /**
   * Показать interstitial (полноэкранная реклама без награды)
   * Для использования между уровнями
   */
  showInterstitial(onComplete) {
    if (!this.isAdReady()) {
      if (onComplete) onComplete();
      return;
    }

    // Заглушка - просто показываем на 2 секунды
    const overlay = document.createElement('div');
    overlay.id = 'interstitial-overlay';
    applyStyles(overlay, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10000',
    });

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="text-align: center; color: white; font-family: ${FONTS.primary};">
        <div style="font-size: 48px; margin-bottom: 16px;">📢</div>
        <div style="font-size: 18px; opacity: 0.7;">Рекламная пауза...</div>
      </div>
    `;
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    this.lastAdTime = Date.now();

    setTimeout(() => {
      overlay.remove();
      if (onComplete) onComplete();
    }, 2000);
  }

  /**
   * Показать баннер (нижняя полоса)
   * @returns {HTMLElement} Элемент баннера для управления
   */
  showBanner() {
    const existing = document.getElementById('ad-banner');
    if (existing) return existing;

    const banner = document.createElement('div');
    banner.id = 'ad-banner';
    applyStyles(banner, {
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      height: '50px',
      background: `linear-gradient(90deg, ${COLORS.orbPurple}40, ${COLORS.orbPurple}20)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '999',
      fontFamily: FONTS.primary,
      color: COLORS.textSecondary,
      fontSize: FONT_SIZES.sm,
    });

    banner.innerHTML = `
      <span>🎮 ORB MASTERS - Рекламный баннер</span>
    `;

    document.body.appendChild(banner);
    return banner;
  }

  /**
   * Скрыть баннер
   */
  hideBanner() {
    const banner = document.getElementById('ad-banner');
    if (banner) banner.remove();
  }
}

// Синглтон
const adManager = new AdManager();
export { adManager };
export default adManager;
