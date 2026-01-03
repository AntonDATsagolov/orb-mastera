// SettingsModal.js - Модальное окно настроек звука и языка

import { AudioManager } from './AudioManager.js';
import { SoundEffects } from './SoundEffects.js';
import i18n, { LANGUAGES, t } from '../i18n/LanguageManager.js';

/**
 * Создаёт и показывает модальное окно настроек
 */
export function showSettingsModal(onClose) {
  // Проверяем, не открыто ли уже
  if (document.getElementById('settings-modal')) {
    return;
  }

  // Overlay
  const overlay = document.createElement('div');
  overlay.id = 'settings-modal';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  `;

  // Modal container
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 16px;
    padding: 24px 32px;
    min-width: 300px;
    max-width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  `;

  // Title
  const title = document.createElement('h2');
  title.textContent = `⚙️ ${t('settings.title')}`;
  title.style.cssText = `
    margin: 0 0 24px 0;
    color: #fff;
    font-size: 24px;
    text-align: center;
    font-weight: 500;
  `;
  modal.appendChild(title);

  // Music volume slider
  const musicSection = createSliderSection(
    `🎵 ${t('settings.music')}`,
    AudioManager.getVolume(),
    AudioManager.getMuted(),
    (value) => AudioManager.setVolume(value),
    (muted) => {
      AudioManager.toggleMute();
      SoundEffects.playClick();
    }
  );
  modal.appendChild(musicSection);

  // SFX volume slider
  const sfxSection = createSliderSection(
    `🔊 ${t('settings.sound')}`,
    SoundEffects.getVolume(),
    SoundEffects.getMuted(),
    (value) => {
      SoundEffects.setVolume(value);
      // Играем тестовый звук
      SoundEffects.playHit();
    },
    (muted) => {
      SoundEffects.toggleMute();
      if (!SoundEffects.getMuted()) {
        SoundEffects.playClick();
      }
    }
  );
  modal.appendChild(sfxSection);

  // Language selector
  const langSection = createLanguageSection(overlay, onClose);
  modal.appendChild(langSection);

  // Spacer
  const spacer = document.createElement('div');
  spacer.style.height = '16px';
  modal.appendChild(spacer);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = t('settings.close');
  closeBtn.style.cssText = `
    width: 100%;
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
  `;
  closeBtn.onmouseenter = () => {
    closeBtn.style.transform = 'scale(1.02)';
    closeBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.transform = 'scale(1)';
    closeBtn.style.boxShadow = 'none';
  };
  closeBtn.onclick = () => {
    SoundEffects.playClick();
    overlay.remove();
    if (onClose) onClose();
  };
  modal.appendChild(closeBtn);

  overlay.appendChild(modal);

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      SoundEffects.playClick();
      overlay.remove();
      if (onClose) onClose();
    }
  };

  // Close on Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      if (onClose) onClose();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  document.body.appendChild(overlay);
}

/**
 * Создаёт секцию с ползунком громкости
 */
function createSliderSection(label, initialValue, isMuted, onChange, onMuteToggle) {
  const section = document.createElement('div');
  section.style.cssText = `
    margin-bottom: 20px;
  `;

  // Label row
  const labelRow = document.createElement('div');
  labelRow.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  `;

  const labelText = document.createElement('span');
  labelText.textContent = label;
  labelText.style.cssText = `
    color: #fff;
    font-size: 16px;
  `;
  labelRow.appendChild(labelText);

  // Mute button
  const muteBtn = document.createElement('button');
  muteBtn.textContent = isMuted ? '🔇' : '🔊';
  muteBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s;
  `;
  muteBtn.onmouseenter = () => muteBtn.style.background = 'rgba(255,255,255,0.1)';
  muteBtn.onmouseleave = () => muteBtn.style.background = 'none';
  muteBtn.onclick = () => {
    onMuteToggle();
    // Обновляем иконку после toggle
    const newMuted = label.includes('Музыка') ? AudioManager.getMuted() : SoundEffects.getMuted();
    muteBtn.textContent = newMuted ? '🔇' : '🔊';
    slider.style.opacity = newMuted ? '0.5' : '1';
  };
  labelRow.appendChild(muteBtn);

  section.appendChild(labelRow);

  // Slider container
  const sliderContainer = document.createElement('div');
  sliderContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  // Volume icon (low)
  const iconLow = document.createElement('span');
  iconLow.textContent = '🔈';
  iconLow.style.fontSize = '14px';
  sliderContainer.appendChild(iconLow);

  // Slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '100';
  slider.value = Math.round(initialValue * 100);
  slider.style.cssText = `
    flex: 1;
    height: 6px;
    border-radius: 3px;
    appearance: none;
    background: linear-gradient(90deg, #667eea ${slider.value}%, #333 ${slider.value}%);
    cursor: pointer;
    opacity: ${isMuted ? '0.5' : '1'};
  `;
  
  // Стили для ползунка
  const sliderStyles = document.createElement('style');
  sliderStyles.textContent = `
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    input[type="range"]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
  `;
  if (!document.getElementById('slider-styles')) {
    sliderStyles.id = 'slider-styles';
    document.head.appendChild(sliderStyles);
  }

  slider.oninput = () => {
    const value = slider.value / 100;
    slider.style.background = `linear-gradient(90deg, #667eea ${slider.value}%, #333 ${slider.value}%)`;
    onChange(value);
  };
  sliderContainer.appendChild(slider);

  // Volume icon (high)
  const iconHigh = document.createElement('span');
  iconHigh.textContent = '🔊';
  iconHigh.style.fontSize = '14px';
  sliderContainer.appendChild(iconHigh);

  section.appendChild(sliderContainer);

  return section;
}

/**
 * Закрыть модальное окно настроек (если открыто)
 */
export function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Создаёт секцию выбора языка
 */
function createLanguageSection(overlay, onClose) {
  const section = document.createElement('div');
  section.style.cssText = `
    margin-bottom: 20px;
  `;

  // Label
  const labelRow = document.createElement('div');
  labelRow.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  `;

  const labelText = document.createElement('span');
  labelText.textContent = `🌐 ${t('settings.language')}`;
  labelText.style.cssText = `
    color: #fff;
    font-size: 16px;
  `;
  labelRow.appendChild(labelText);
  section.appendChild(labelRow);

  // Language buttons container
  const langContainer = document.createElement('div');
  langContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  `;

  const languages = i18n.getAvailableLanguages();
  const currentLang = i18n.getLanguage();

  languages.forEach(lang => {
    const btn = document.createElement('button');
    btn.textContent = `${lang.flag} ${lang.name}`;
    
    const isActive = lang.code === currentLang;
    btn.style.cssText = `
      padding: 10px 12px;
      border: 2px solid ${isActive ? '#667eea' : 'rgba(255,255,255,0.2)'};
      border-radius: 8px;
      background: ${isActive ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255,255,255,0.05)'};
      color: white;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    `;

    btn.onmouseenter = () => {
      if (lang.code !== i18n.getLanguage()) {
        btn.style.background = 'rgba(255,255,255,0.1)';
        btn.style.borderColor = 'rgba(255,255,255,0.4)';
      }
    };
    btn.onmouseleave = () => {
      if (lang.code !== i18n.getLanguage()) {
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
      }
    };

    btn.onclick = () => {
      if (lang.code !== i18n.getLanguage()) {
        SoundEffects.playClick();
        i18n.setLanguage(lang.code);
        
        // Отправляем событие смены языка
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang.code } }));
        
        // Закрываем и открываем заново для обновления текстов
        overlay.remove();
        if (onClose) onClose();
        
        // Небольшая задержка перед повторным открытием
        setTimeout(() => {
          showSettingsModal(onClose);
        }, 50);
      }
    };

    langContainer.appendChild(btn);
  });

  section.appendChild(langContainer);
  return section;
}
