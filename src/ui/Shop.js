/**
 * Shop.js
 * Экран магазина с 4 вкладками: Orbs, Boosters, Upgrades, Cosmetic
 */

import playerProfile from '../core/PlayerProfile.js';
import orbsManager from '../core/OrbsManager.js';
import { COLORS, FONTS, FONT_SIZES, UI, applyStyles, formatNumber } from '../core/GameConfig.js';
import { SoundEffects } from '../game/SoundEffects.js';
import i18n from '../i18n/LanguageManager.js';

// Пакеты сфер для покупки за реальные деньги
const ORB_PACKAGES = [
  { id: 'orbs_100', amount: 100, price: 0.99, icon: '🔮', bonus: 0 },
  { id: 'orbs_500', amount: 500, price: 3.99, icon: '💎', bonus: 50, badge: 'popular' },
  { id: 'orbs_1200', amount: 1200, price: 7.99, icon: '💎', bonus: 200 },
  { id: 'orbs_2500', amount: 2500, price: 14.99, icon: '👑', bonus: 500, badge: 'bestValue' },
  { id: 'orbs_6000', amount: 6000, price: 29.99, icon: '👑', bonus: 1500 },
];

// Определение товаров
const SHOP_ITEMS = {
  boosters: [
    { 
      id: 'extra_life', 
      nameKey: 'shop.items.extraLife.name',
      descKey: 'shop.items.extraLife.desc',
      icon: '❤️', 
      price: 100, 
      type: 'consumable',
      maxStack: 5
    },
    { 
      id: 'score_boost', 
      nameKey: 'shop.items.scoreBoost.name',
      descKey: 'shop.items.scoreBoost.desc',
      icon: '⭐', 
      price: 150, 
      type: 'consumable',
      maxStack: 3
    },
    { 
      id: 'slow_time', 
      nameKey: 'shop.items.slowTime.name',
      descKey: 'shop.items.slowTime.desc',
      icon: '⏱️', 
      price: 120, 
      type: 'consumable',
      maxStack: 3
    },
  ],
  upgrades: [
    { 
      id: 'orb_magnet', 
      nameKey: 'shop.items.orbMagnet.name',
      descKey: 'shop.items.orbMagnet.desc',
      icon: '🧲', 
      price: 500, 
      type: 'permanent'
    },
    { 
      id: 'bigger_basket', 
      nameKey: 'shop.items.biggerBasket.name',
      descKey: 'shop.items.biggerBasket.desc',
      icon: '🧺', 
      price: 400, 
      type: 'permanent'
    },
    { 
      id: 'starting_points', 
      nameKey: 'shop.items.startingPoints.name',
      descKey: 'shop.items.startingPoints.desc',
      icon: '🚀', 
      price: 300, 
      type: 'permanent'
    },
  ],
  cosmetic: [
    { 
      id: 'theme_purple', 
      nameKey: 'shop.items.purpleTheme.name',
      descKey: 'shop.items.purpleTheme.desc',
      icon: '💜', 
      price: 200, 
      type: 'theme',
      color: '#8B5CF6'
    },
    { 
      id: 'theme_gold', 
      nameKey: 'shop.items.goldTheme.name',
      descKey: 'shop.items.goldTheme.desc',
      icon: '💛', 
      price: 300, 
      type: 'theme',
      color: '#F59E0B'
    },
    { 
      id: 'theme_neon', 
      nameKey: 'shop.items.neonTheme.name',
      descKey: 'shop.items.neonTheme.desc',
      icon: '💚', 
      price: 400, 
      type: 'theme',
      color: '#10B981'
    },
  ]
};

class ShopManager {
  constructor() {
    this.storageKey = 'orb-masters-shop';
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
    return {
      purchases: {},      // { item_id: count } для consumables
      ownedPermanent: [], // ['orb_magnet', ...]
      ownedThemes: [],    // ['theme_purple', ...]
      equippedTheme: null
    };
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  /**
   * Проверить, куплен ли постоянный предмет
   */
  isPermanentOwned(itemId) {
    return this.data.ownedPermanent.includes(itemId);
  }

  /**
   * Проверить, куплена ли тема
   */
  isThemeOwned(themeId) {
    return this.data.ownedThemes.includes(themeId);
  }

  /**
   * Получить количество расходуемых
   */
  getConsumableCount(itemId) {
    return this.data.purchases[itemId] || 0;
  }

  /**
   * Использовать расходуемый
   */
  useConsumable(itemId) {
    if (this.data.purchases[itemId] > 0) {
      this.data.purchases[itemId]--;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Получить экипированную тему
   */
  getEquippedTheme() {
    return this.data.equippedTheme;
  }

  /**
   * Экипировать тему
   */
  equipTheme(themeId) {
    if (this.isThemeOwned(themeId)) {
      this.data.equippedTheme = themeId;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Купить предмет
   */
  purchase(item) {
    const orbs = orbsManager.getBalance();
    
    // Проверяем достаточно ли сфер
    if (orbs < item.price) {
      return { success: false, reason: 'not_enough' };
    }

    // Проверяем тип предмета
    if (item.type === 'permanent') {
      if (this.isPermanentOwned(item.id)) {
        return { success: false, reason: 'already_owned' };
      }
      this.data.ownedPermanent.push(item.id);
    } 
    else if (item.type === 'theme') {
      if (this.isThemeOwned(item.id)) {
        return { success: false, reason: 'already_owned' };
      }
      this.data.ownedThemes.push(item.id);
    }
    else if (item.type === 'consumable') {
      const current = this.data.purchases[item.id] || 0;
      if (item.maxStack && current >= item.maxStack) {
        return { success: false, reason: 'max_stack' };
      }
      this.data.purchases[item.id] = current + 1;
    }

    // Списываем сферы
    orbsManager.spend(item.price, `Shop: ${item.id}`);
    this.save();
    
    return { success: true };
  }
}

// Синглтон
const shopManager = new ShopManager();
export { shopManager, SHOP_ITEMS };

/**
 * Показать экран Shop
 */
export function showShop(onClose) {
  // Проверяем, не открыт ли уже
  if (document.getElementById('shop-screen')) {
    return;
  }

  let currentTab = 'orbs';

  const overlay = document.createElement('div');
  overlay.id = 'shop-screen';
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

  // Header с балансом
  const header = document.createElement('div');
  applyStyles(header, {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: UI.spacing.md,
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
    cleanup();
    overlay.remove();
    if (onClose) onClose();
  };

  const title = document.createElement('h1');
  title.textContent = `🛒 ${i18n.t('shop.title')}`;
  applyStyles(title, {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    margin: '0',
    background: COLORS.gradientGold,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  });

  // Баланс
  const balanceDiv = document.createElement('div');
  applyStyles(balanceDiv, {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(139, 92, 246, 0.2)',
    padding: '8px 12px',
    borderRadius: UI.borderRadius.md,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.orbPurple,
  });
  
  function updateBalance() {
    balanceDiv.innerHTML = `🔮 ${formatNumber(orbsManager.getBalance())}`;
  }
  updateBalance();

  header.appendChild(backBtn);
  header.appendChild(title);
  header.appendChild(balanceDiv);
  overlay.appendChild(header);

  // Tabs
  const tabs = document.createElement('div');
  applyStyles(tabs, {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    gap: UI.spacing.xs,
    marginBottom: UI.spacing.lg,
    background: COLORS.cardDark,
    padding: UI.spacing.xs,
    borderRadius: UI.borderRadius.lg,
  });

  const tabNames = ['orbs', 'boosters', 'upgrades', 'cosmetic'];
  const tabButtons = {};

  tabNames.forEach(tabName => {
    const btn = document.createElement('button');
    btn.textContent = i18n.t(`shop.tabs.${tabName}`);
    applyStyles(btn, {
      flex: '1',
      padding: '12px',
      border: 'none',
      borderRadius: UI.borderRadius.md,
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      background: tabName === currentTab ? COLORS.orbPurple : 'transparent',
      color: tabName === currentTab ? '#fff' : COLORS.textSecondary,
    });
    
    btn.onclick = () => {
      SoundEffects.playClick();
      currentTab = tabName;
      updateTabs();
      renderItems();
    };

    tabButtons[tabName] = btn;
    tabs.appendChild(btn);
  });

  function updateTabs() {
    tabNames.forEach(name => {
      const btn = tabButtons[name];
      btn.style.background = name === currentTab ? COLORS.orbPurple : 'transparent';
      btn.style.color = name === currentTab ? '#fff' : COLORS.textSecondary;
    });
  }

  overlay.appendChild(tabs);

  // Items container
  const itemsContainer = document.createElement('div');
  applyStyles(itemsContainer, {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: UI.spacing.md,
  });
  overlay.appendChild(itemsContainer);

  // Toast для уведомлений
  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.textContent = message;
    applyStyles(toast, {
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: isError ? '#EF4444' : '#10B981',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: UI.borderRadius.lg,
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
      zIndex: '3000',
      animation: 'fadeIn 0.3s ease',
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // Рендер пакетов орбов (IAP)
  function renderOrbPackages() {
    // Заголовок секции
    const sectionHeader = document.createElement('div');
    sectionHeader.textContent = i18n.t('shop.realMoney');
    applyStyles(sectionHeader, {
      fontSize: FONT_SIZES.xs,
      color: COLORS.textSecondary,
      textAlign: 'center',
      marginBottom: UI.spacing.sm,
    });
    itemsContainer.appendChild(sectionHeader);

    ORB_PACKAGES.forEach(pkg => {
      const card = document.createElement('div');
      applyStyles(card, {
        background: pkg.badge === 'bestValue' 
          ? `linear-gradient(135deg, ${COLORS.orbPurple}40, ${COLORS.cardDark})`
          : COLORS.cardDark,
        borderRadius: UI.borderRadius.lg,
        padding: UI.spacing.md,
        display: 'flex',
        alignItems: 'center',
        gap: UI.spacing.md,
        border: pkg.badge === 'bestValue' 
          ? `2px solid ${COLORS.orbPurple}` 
          : '2px solid transparent',
        position: 'relative',
        overflow: 'hidden',
      });

      // Бейдж "Best Value" или "Popular"
      if (pkg.badge) {
        const badge = document.createElement('div');
        badge.textContent = i18n.t(`shop.${pkg.badge}`);
        applyStyles(badge, {
          position: 'absolute',
          top: '8px',
          right: '-25px',
          background: pkg.badge === 'bestValue' ? '#FFD700' : COLORS.orbPurple,
          color: pkg.badge === 'bestValue' ? '#000' : '#fff',
          padding: '2px 30px',
          fontSize: '10px',
          fontWeight: '700',
          transform: 'rotate(45deg)',
          textTransform: 'uppercase',
        });
        card.appendChild(badge);
      }

      // Иконка пакета
      const icon = document.createElement('div');
      icon.textContent = pkg.icon;
      applyStyles(icon, {
        fontSize: '40px',
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${COLORS.orbPurple}30`,
        borderRadius: UI.borderRadius.md,
      });

      // Контент
      const content = document.createElement('div');
      applyStyles(content, {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      });

      const amount = document.createElement('div');
      amount.innerHTML = `🔮 <strong>${pkg.amount.toLocaleString()}</strong>`;
      if (pkg.bonus > 0) {
        amount.innerHTML += ` <span style="color: #10B981; font-size: 12px;">+${pkg.bonus} ${i18n.t('common.bonus')}</span>`;
      }
      applyStyles(amount, {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
      });

      const perOrb = document.createElement('div');
      const pricePerOrb = (pkg.price / (pkg.amount + pkg.bonus)).toFixed(3);
      perOrb.textContent = `$${pricePerOrb}/${i18n.t('shop.perOrb')}`;
      applyStyles(perOrb, {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
      });

      content.appendChild(amount);
      content.appendChild(perOrb);

      // Кнопка покупки
      const btn = document.createElement('button');
      btn.textContent = `$${pkg.price.toFixed(2)}`;
      applyStyles(btn, {
        background: COLORS.gradientPurple,
        color: '#fff',
        border: 'none',
        padding: '12px 20px',
        borderRadius: UI.borderRadius.md,
        fontSize: FONT_SIZES.md,
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
      });

      btn.onmouseenter = () => btn.style.transform = 'scale(1.05)';
      btn.onmouseleave = () => btn.style.transform = 'scale(1)';

      btn.onclick = () => {
        SoundEffects.playClick();
        handleOrbPurchase(pkg);
      };

      card.appendChild(icon);
      card.appendChild(content);
      card.appendChild(btn);
      itemsContainer.appendChild(card);
    });

    // Дисклеймер
    const disclaimer = document.createElement('div');
    disclaimer.textContent = i18n.t('shop.iapDisclaimer');
    applyStyles(disclaimer, {
      fontSize: '10px',
      color: COLORS.textSecondary,
      textAlign: 'center',
      marginTop: UI.spacing.md,
      opacity: '0.7',
    });
    itemsContainer.appendChild(disclaimer);
  }

  // Обработка покупки орбов (mock для тестирования)
  function handleOrbPurchase(pkg) {
    // В продакшене здесь будет интеграция с платежной системой
    // Пока что делаем mock подтверждение
    
    const confirmOverlay = document.createElement('div');
    applyStyles(confirmOverlay, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10001',
    });

    const modal = document.createElement('div');
    applyStyles(modal, {
      background: COLORS.cardDark,
      borderRadius: UI.borderRadius.xl,
      padding: UI.spacing.xl,
      maxWidth: '300px',
      textAlign: 'center',
    });

    const title = document.createElement('div');
    title.textContent = i18n.t('shop.confirmPurchase');
    applyStyles(title, {
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
      color: COLORS.textPrimary,
      marginBottom: UI.spacing.md,
    });

    const details = document.createElement('div');
    details.innerHTML = `${pkg.icon} <strong>${pkg.amount + pkg.bonus}</strong> ${i18n.t('shop.orbs')}<br>
      <span style="font-size: 24px; color: ${COLORS.orbPurple};">$${pkg.price.toFixed(2)}</span>`;
    applyStyles(details, {
      fontSize: FONT_SIZES.md,
      color: COLORS.textSecondary,
      marginBottom: UI.spacing.lg,
    });

    const buttonRow = document.createElement('div');
    applyStyles(buttonRow, {
      display: 'flex',
      gap: UI.spacing.sm,
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = i18n.t('common.cancel');
    applyStyles(cancelBtn, {
      flex: '1',
      padding: '12px',
      border: 'none',
      borderRadius: UI.borderRadius.md,
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
      cursor: 'pointer',
      background: 'rgba(255,255,255,0.1)',
      color: COLORS.textSecondary,
    });
    cancelBtn.onclick = () => {
      SoundEffects.playClick();
      confirmOverlay.remove();
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = i18n.t('shop.buy');
    applyStyles(confirmBtn, {
      flex: '1',
      padding: '12px',
      border: 'none',
      borderRadius: UI.borderRadius.md,
      fontSize: FONT_SIZES.sm,
      fontWeight: '700',
      cursor: 'pointer',
      background: COLORS.gradientPurple,
      color: '#fff',
    });
    confirmBtn.onclick = () => {
      SoundEffects.playClick();
      
      // Mock успешная покупка
      const totalOrbs = pkg.amount + pkg.bonus;
      orbsManager.addOrbs(totalOrbs);
      
      SoundEffects.playReward();
      showToast(`+${totalOrbs} 🔮`);
      updateBalance();
      
      confirmOverlay.remove();
    };

    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(confirmBtn);
    modal.appendChild(title);
    modal.appendChild(details);
    modal.appendChild(buttonRow);
    confirmOverlay.appendChild(modal);
    document.body.appendChild(confirmOverlay);
  }

  function renderItems() {
    itemsContainer.innerHTML = '';
    
    // Отдельная обработка для вкладки Orbs (IAP)
    if (currentTab === 'orbs') {
      renderOrbPackages();
      return;
    }
    
    const items = SHOP_ITEMS[currentTab];

    items.forEach(item => {
      const card = document.createElement('div');
      
      // Определяем состояние
      let isOwned = false;
      let isEquipped = false;
      let count = 0;
      let canBuy = true;

      if (item.type === 'permanent') {
        isOwned = shopManager.isPermanentOwned(item.id);
        canBuy = !isOwned;
      } else if (item.type === 'theme') {
        isOwned = shopManager.isThemeOwned(item.id);
        isEquipped = shopManager.getEquippedTheme() === item.id;
        canBuy = !isOwned;
      } else if (item.type === 'consumable') {
        count = shopManager.getConsumableCount(item.id);
        canBuy = !item.maxStack || count < item.maxStack;
      }

      const hasEnoughOrbs = orbsManager.getBalance() >= item.price;

      applyStyles(card, {
        background: COLORS.cardDark,
        borderRadius: UI.borderRadius.lg,
        padding: UI.spacing.md,
        display: 'flex',
        alignItems: 'center',
        gap: UI.spacing.md,
        border: isEquipped ? `2px solid ${COLORS.orbPurple}` : '2px solid transparent',
        opacity: isOwned && item.type !== 'theme' ? '0.6' : '1',
      });

      // Иконка
      const icon = document.createElement('div');
      icon.textContent = item.icon;
      applyStyles(icon, {
        fontSize: '36px',
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: item.color ? `${item.color}30` : 'rgba(255,255,255,0.1)',
        borderRadius: UI.borderRadius.md,
      });

      // Контент
      const content = document.createElement('div');
      applyStyles(content, {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      });

      const name = document.createElement('div');
      name.textContent = i18n.t(item.nameKey);
      applyStyles(name, {
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
        color: COLORS.textPrimary,
      });

      const desc = document.createElement('div');
      desc.textContent = i18n.t(item.descKey);
      applyStyles(desc, {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
      });

      // Количество для consumables
      if (item.type === 'consumable' && count > 0) {
        const countBadge = document.createElement('span');
        countBadge.textContent = ` (${count}/${item.maxStack})`;
        countBadge.style.color = COLORS.orbPurple;
        name.appendChild(countBadge);
      }

      content.appendChild(name);
      content.appendChild(desc);

      // Кнопка
      const btn = document.createElement('button');
      
      if (isOwned && item.type !== 'consumable') {
        if (item.type === 'theme') {
          btn.textContent = isEquipped ? i18n.t('shop.equipped') : i18n.t('shop.owned');
          btn.disabled = isEquipped;
          
          if (!isEquipped) {
            btn.onclick = () => {
              SoundEffects.playClick();
              shopManager.equipTheme(item.id);
              renderItems();
            };
          }
        } else {
          btn.textContent = i18n.t('shop.owned');
          btn.disabled = true;
        }
        
        applyStyles(btn, {
          background: isEquipped ? COLORS.orbPurple : 'rgba(255,255,255,0.2)',
          color: '#fff',
          border: 'none',
          padding: '10px 16px',
          borderRadius: UI.borderRadius.md,
          fontSize: FONT_SIZES.sm,
          fontWeight: '600',
          cursor: isEquipped ? 'default' : 'pointer',
          opacity: isEquipped ? '1' : '0.7',
        });
      } else {
        btn.innerHTML = `🔮 ${item.price}`;
        btn.disabled = !hasEnoughOrbs || !canBuy;
        
        applyStyles(btn, {
          background: hasEnoughOrbs && canBuy ? COLORS.gradientPurple : 'rgba(255,255,255,0.1)',
          color: hasEnoughOrbs && canBuy ? '#fff' : COLORS.textSecondary,
          border: 'none',
          padding: '10px 16px',
          borderRadius: UI.borderRadius.md,
          fontSize: FONT_SIZES.sm,
          fontWeight: '600',
          cursor: hasEnoughOrbs && canBuy ? 'pointer' : 'not-allowed',
        });

        btn.onclick = () => {
          if (!hasEnoughOrbs || !canBuy) return;
          
          SoundEffects.playClick();
          const result = shopManager.purchase(item);
          
          if (result.success) {
            SoundEffects.playReward();
            showToast(i18n.t('shop.purchased'));
            updateBalance();
            renderItems();
          } else if (result.reason === 'not_enough') {
            showToast(i18n.t('shop.notEnough'), true);
          }
        };
      }

      card.appendChild(icon);
      card.appendChild(content);
      card.appendChild(btn);
      itemsContainer.appendChild(card);
    });
  }

  renderItems();

  // Обработчик изменения языка
  const onLanguageChanged = () => {
    cleanup();
    overlay.remove();
    showShop(onClose);
  };
  window.addEventListener('languageChanged', onLanguageChanged);

  function cleanup() {
    window.removeEventListener('languageChanged', onLanguageChanged);
  }

  document.body.appendChild(overlay);
}

export default { shopManager, showShop, SHOP_ITEMS };
