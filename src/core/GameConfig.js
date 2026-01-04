/**
 * GameConfig.js
 * Централизованная конфигурация игры: цвета, стили, константы
 */

// === ЦВЕТОВАЯ ПАЛИТРА ===
export const COLORS = {
  // Primary
  orbPurple: '#8B5CF6',
  energyBlue: '#3B82F6',
  successGreen: '#10B981',
  warningOrange: '#F59E0B',
  dangerRed: '#EF4444',
  
  // Backgrounds
  deepSpace: '#0F0F1A',
  cardDark: '#1A1A2E',
  cardLight: '#2D2D44',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  
  // Gradients (CSS)
  gradientCombo: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  gradientGold: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
  gradientIce: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
  gradientFire: 'linear-gradient(135deg, #EF4444, #F59E0B)',
  gradientSuccess: 'linear-gradient(135deg, #10B981, #34D399)',
  gradientPremium: 'linear-gradient(135deg, #667EEA, #764BA2)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  
  // Mode colors
  modeCatch: '#3B82F6',
  modeBricks: '#F59E0B',
  modePuzzle: '#10B981',
  modeZuma: '#EC4899',
};

// === ТИПОГРАФИКА ===
export const FONTS = {
  primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  display: "'Poppins', 'Inter', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
};

export const FONT_SIZES = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
};

// === АНИМАЦИИ ===
export const ANIMATIONS = {
  // Timing functions
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Durations
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  dramatic: '800ms',
};

// === UI ===
export const UI = {
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 12px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.2)',
    glow: '0 0 20px rgba(139, 92, 246, 0.4)',
    glowSuccess: '0 0 20px rgba(16, 185, 129, 0.4)',
    glowWarning: '0 0 20px rgba(245, 158, 11, 0.4)',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
};

// === GAME MODES ===
export const GAME_MODES = {
  catch: {
    id: 'catch',
    name: 'Cash Catcher',
    shortName: 'Ловец',
    icon: '🎰',
    color: COLORS.modeCatch,
    colors: { primary: COLORS.modeCatch, secondary: '#06B6D4' },
    gradient: COLORS.gradientIce,
    sceneKey: 'level_catch',
    description: 'Ловите падающие предметы',
    unlockLevel: 1,
  },
  bricks: {
    id: 'bricks',
    name: 'Bricks Breaker',
    shortName: 'Блоки',
    icon: '🎯',
    color: COLORS.modeBricks,
    colors: { primary: COLORS.modeBricks, secondary: '#FBBF24' },
    gradient: COLORS.gradientGold,
    sceneKey: 'level_knockout',
    description: 'Разбивайте блоки шарами',
    unlockLevel: 1,
  },
  puzzle: {
    id: 'puzzle',
    name: 'Block Puzzle',
    shortName: 'Паззл',
    icon: '🧩',
    color: COLORS.modePuzzle,
    colors: { primary: COLORS.modePuzzle, secondary: '#34D399' },
    gradient: COLORS.gradientSuccess,
    sceneKey: 'level_stack',
    description: 'Заполняйте линии фигурами',
    unlockLevel: 3,
  },
  zuma: {
    id: 'zuma',
    name: 'Knockout Zuma',
    shortName: 'Зума',
    icon: '⚔️',
    color: COLORS.modeZuma,
    colors: { primary: COLORS.modeZuma, secondary: '#F59E0B' },
    gradient: COLORS.gradientFire,
    sceneKey: 'level_match3',
    description: 'Экстремальный режим',
    unlockLevel: 10,
  },
};

// === STAGES ===
export const STAGES = {
  1: { name: 'Rookie', stars: 1, orbsMult: 1.0, color: '#6B7280' },
  2: { name: 'Skilled', stars: 2, orbsMult: 1.5, color: '#3B82F6' },
  3: { name: 'Expert', stars: 3, orbsMult: 2.5, color: '#8B5CF6' },
  4: { name: 'Master', stars: 4, orbsMult: 4.0, color: '#F59E0B' },
  5: { name: 'Legend', stars: 5, orbsMult: 6.0, color: '#EF4444' },
};

// === MASTERY ===
export const MASTERY_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
  3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450,
  // ... до 50
];

// === ACHIEVEMENTS ===
export const ACHIEVEMENT_CATEGORIES = {
  progress: { name: 'Прогресс', icon: '📈' },
  mastery: { name: 'Мастерство', icon: '⭐' },
  combo: { name: 'Комбо', icon: '🔥' },
  collector: { name: 'Коллекция', icon: '💎' },
  social: { name: 'Социальное', icon: '👥' },
};

// === SHOP ITEMS ===
export const SHOP_CATEGORIES = {
  upgrades: { name: 'Улучшения', icon: '⚡' },
  boosters: { name: 'Бустеры', icon: '🚀' },
  skins: { name: 'Скины', icon: '🎨' },
  themes: { name: 'Темы', icon: '🖼️' },
};

// === CSS HELPERS ===
export function createButtonStyle(variant = 'primary') {
  const base = {
    padding: '12px 24px',
    borderRadius: UI.borderRadius.md,
    border: 'none',
    cursor: 'pointer',
    fontFamily: FONTS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    transition: `all ${ANIMATIONS.normal} ${ANIMATIONS.easeInOut}`,
    outline: 'none',
  };
  
  switch (variant) {
    case 'primary':
      return {
        ...base,
        background: COLORS.gradientCombo,
        color: COLORS.textPrimary,
        boxShadow: UI.shadows.glow,
      };
    case 'secondary':
      return {
        ...base,
        background: 'transparent',
        color: COLORS.textPrimary,
        border: `2px solid ${COLORS.orbPurple}`,
      };
    case 'success':
      return {
        ...base,
        background: COLORS.gradientSuccess,
        color: COLORS.textPrimary,
        boxShadow: UI.shadows.glowSuccess,
      };
    case 'warning':
      return {
        ...base,
        background: COLORS.gradientGold,
        color: COLORS.deepSpace,
        boxShadow: UI.shadows.glowWarning,
      };
    case 'ghost':
      return {
        ...base,
        background: 'rgba(255, 255, 255, 0.1)',
        color: COLORS.textSecondary,
      };
    default:
      return base;
  }
}

export function createCardStyle(elevated = false) {
  return {
    background: COLORS.cardDark,
    borderRadius: UI.borderRadius.lg,
    padding: UI.spacing.lg,
    boxShadow: elevated ? UI.shadows.lg : UI.shadows.sm,
    border: `1px solid rgba(255, 255, 255, 0.1)`,
  };
}

// === UTILITY FUNCTIONS ===
export function applyStyles(element, styles) {
  Object.assign(element.style, styles);
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
