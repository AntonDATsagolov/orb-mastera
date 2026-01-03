/**
 * Менеджер локализации для ORB MASTERS
 * Управляет выбором языка и получением переводов
 */

import { translations, LANGUAGES } from './translations.js';

class LanguageManager {
  constructor() {
    this.currentLang = this.loadLanguage();
    this.listeners = [];
  }

  /**
   * Загрузить сохранённый язык или определить по браузеру
   */
  loadLanguage() {
    const saved = localStorage.getItem('orb-masters-language');
    if (saved && LANGUAGES[saved]) {
      return saved;
    }
    
    // Определяем по браузеру
    const browserLang = navigator.language?.slice(0, 2).toLowerCase();
    
    // Маппинг языков
    const langMap = {
      'en': 'en',
      'zh': 'zh',
      'ko': 'ko', // Корейский
      'ja': 'ja', // Японский
      'ru': 'ru',
      'kk': 'kz', // Казахский
      'kz': 'kz'
    };
    
    return langMap[browserLang] || 'en'; // По умолчанию английский
  }

  /**
   * Установить язык
   */
  setLanguage(langCode) {
    if (!LANGUAGES[langCode]) {
      console.warn(`Unknown language: ${langCode}`);
      return;
    }
    
    this.currentLang = langCode;
    localStorage.setItem('orb-masters-language', langCode);
    
    // Уведомляем слушателей
    this.listeners.forEach(fn => fn(langCode));
    
    console.log(`Language set to: ${LANGUAGES[langCode].name}`);
  }

  /**
   * Получить текущий язык
   */
  getLanguage() {
    return this.currentLang;
  }

  /**
   * Получить информацию о языке
   */
  getLanguageInfo() {
    return LANGUAGES[this.currentLang];
  }

  /**
   * Получить список всех языков
   */
  getAvailableLanguages() {
    return Object.values(LANGUAGES);
  }

  /**
   * Получить перевод по ключу
   * @param {string} path - путь вида "menu.play" или "game.score"
   * @param {string} [lang] - язык (по умолчанию текущий)
   * @returns {string} - перевод или ключ если не найден
   */
  t(path, lang = null) {
    const targetLang = lang || this.currentLang;
    
    try {
      const keys = path.split('.');
      let result = translations;
      
      for (const key of keys) {
        result = result[key];
        if (!result) {
          console.warn(`Translation not found: ${path}`);
          return path;
        }
      }
      
      // Если это объект с переводами
      if (typeof result === 'object' && result[targetLang] !== undefined) {
        return result[targetLang];
      }
      
      // Fallback на английский
      if (typeof result === 'object' && result.en !== undefined) {
        return result.en;
      }
      
      return String(result);
    } catch (e) {
      console.warn(`Translation error for: ${path}`, e);
      return path;
    }
  }

  /**
   * Подписаться на изменение языка
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  /**
   * Переключить на следующий язык
   */
  cycleLanguage() {
    const langs = Object.keys(LANGUAGES);
    const currentIndex = langs.indexOf(this.currentLang);
    const nextIndex = (currentIndex + 1) % langs.length;
    this.setLanguage(langs[nextIndex]);
    return this.getLanguageInfo();
  }
}

// Синглтон
const i18n = new LanguageManager();

// Удобная функция для получения переводов
export const t = (path, lang) => i18n.t(path, lang);

export { LANGUAGES };
export default i18n;
