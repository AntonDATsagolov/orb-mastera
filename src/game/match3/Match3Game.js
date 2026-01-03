// Match3Game.js - Логика игры "Три в ряд" с спецэлементами

import { SoundEffects } from '../SoundEffects.js';
import i18n from '../../i18n/LanguageManager.js';

// Типы кристаллов
const GEM_TYPES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

// Цвета кристаллов (контрастные для дальтоников)
const GEM_COLORS = {
  red: { main: '#FF4444', light: '#FF8888', dark: '#CC2222' },
  blue: { main: '#4488FF', light: '#88BBFF', dark: '#2266CC' },
  green: { main: '#44DD44', light: '#88FF88', dark: '#22AA22' },
  yellow: { main: '#FFDD44', light: '#FFEE88', dark: '#CCAA22' },
  purple: { main: '#AA44FF', light: '#CC88FF', dark: '#7722CC' },
  orange: { main: '#FF8844', light: '#FFAA88', dark: '#CC6622' },
  rainbow: { main: '#FFFFFF', light: '#FFFFFF', dark: '#DDDDDD' }
};

// Формы для каждого типа (для дальтоников)
const GEM_SHAPES = {
  red: 'circle',      // ●  Круг
  blue: 'diamond',    // ◆  Ромб  
  green: 'triangle',  // ▲  Треугольник
  yellow: 'star',     // ★  Звезда
  purple: 'hexagon',  // ⬡  Шестиугольник
  orange: 'square'    // ■  Квадрат
};

// Типы спецэлементов
const SPECIAL_TYPES = {
  NONE: null,
  LINE_H: 'line_h',    // Горизонтальный бустер (4 в ряд горизонтально) - уничтожает ряд
  LINE_V: 'line_v',    // Вертикальный бустер (4 в ряд вертикально) - уничтожает столбец
  BOMB: 'bomb',        // Радиальная бомба (L или T форма) - уничтожает 3x3
  RAINBOW: 'rainbow'   // Цветная бомба (5 в ряд) - уничтожает все одного цвета
};

/**
 * Класс эффекта (взрыв, частицы)
 */
class Effect {
  constructor(x, y, type, color) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = color;
    this.life = 1;
    this.particles = [];
    
    const count = type === 'explosion' ? 16 : type === 'super_explosion' ? 24 : 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = type === 'super_explosion' ? 4 + Math.random() * 5 : 2 + Math.random() * 3;
      this.particles.push({
        x: 0, y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: type === 'super_explosion' ? 5 + Math.random() * 6 : 3 + Math.random() * 4
      });
    }
  }

  update() {
    this.life -= 0.025; // Замедлено
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.size *= 0.97;
    }
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.life;
    
    for (const p of this.particles) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

/**
 * Класс эффекта линии (для линейных бустеров)
 */
class LineEffect {
  constructor(x, y, direction, color, width) {
    this.x = x;
    this.y = y;
    this.direction = direction; // 'horizontal' или 'vertical'
    this.color = color;
    this.width = width;
    this.life = 1;
    this.length = 0;
    this.maxLength = width * 10;
  }

  update() {
    this.life -= 0.03;
    this.length += (this.maxLength - this.length) * 0.2;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    
    const gradient = ctx.createLinearGradient(
      this.direction === 'horizontal' ? this.x - this.length / 2 : this.x,
      this.direction === 'vertical' ? this.y - this.length / 2 : this.y,
      this.direction === 'horizontal' ? this.x + this.length / 2 : this.x,
      this.direction === 'vertical' ? this.y + this.length / 2 : this.y
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.3, this.color);
    gradient.addColorStop(0.5, '#FFFFFF');
    gradient.addColorStop(0.7, this.color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8 * this.life;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    if (this.direction === 'horizontal') {
      ctx.moveTo(this.x - this.length / 2, this.y);
      ctx.lineTo(this.x + this.length / 2, this.y);
    } else {
      ctx.moveTo(this.x, this.y - this.length / 2);
      ctx.lineTo(this.x, this.y + this.length / 2);
    }
    ctx.stroke();
    
    ctx.restore();
  }
}

/**
 * Эффект рассыпания кристалла на осколки
 */
class ShatterEffect {
  constructor(x, y, color, shape) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.shape = shape;
    this.life = 1;
    this.shards = [];
    
    // Создаём осколки разной формы
    const count = 8 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      const rotSpeed = (Math.random() - 0.5) * 0.3;
      this.shards.push({
        x: 0, y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Немного вверх
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: rotSpeed,
        size: 4 + Math.random() * 8,
        type: Math.floor(Math.random() * 3) // 0=triangle, 1=square, 2=diamond
      });
    }
  }

  update() {
    this.life -= 0.02;
    for (const s of this.shards) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.15; // Гравитация
      s.vx *= 0.98; // Трение
      s.rotation += s.rotSpeed;
      s.size *= 0.98;
    }
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.life;
    
    for (const s of this.shards) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.fillStyle = this.color;
      
      ctx.beginPath();
      if (s.type === 0) {
        // Треугольник
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.8, s.size * 0.5);
        ctx.lineTo(-s.size * 0.8, s.size * 0.5);
      } else if (s.type === 1) {
        // Квадрат
        ctx.rect(-s.size / 2, -s.size / 2, s.size, s.size);
      } else {
        // Ромб
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.6, 0);
        ctx.lineTo(0, s.size);
        ctx.lineTo(-s.size * 0.6, 0);
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    
    ctx.restore();
  }
}

/**
 * Эффект вспышки при активации спецэлемента
 */
class FlashEffect {
  constructor(x, y, color, type = 'radial') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.type = type; // 'radial', 'horizontal', 'vertical'
    this.life = 1;
    this.radius = 10;
    this.maxRadius = type === 'radial' ? 150 : 500;
  }

  update() {
    this.life -= 0.04;
    this.radius += (this.maxRadius - this.radius) * 0.15;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life * 0.6;
    
    if (this.type === 'radial') {
      // Расширяющееся кольцо
      const gradient = ctx.createRadialGradient(
        this.x, this.y, this.radius * 0.7,
        this.x, this.y, this.radius
      );
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, this.color);
      gradient.addColorStop(0.7, '#FFFFFF');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Центральная вспышка
      if (this.life > 0.7) {
        ctx.globalAlpha = (this.life - 0.7) * 3;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30 * this.life, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Луч (горизонтальный или вертикальный)
      const length = this.radius * 2;
      const width = 20 * this.life;
      
      ctx.strokeStyle = this.color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;
      
      ctx.beginPath();
      if (this.type === 'horizontal') {
        ctx.moveTo(this.x - length, this.y);
        ctx.lineTo(this.x + length, this.y);
      } else {
        ctx.moveTo(this.x, this.y - length);
        ctx.lineTo(this.x, this.y + length);
      }
      ctx.stroke();
      
      // Центральное свечение
      ctx.globalAlpha = this.life;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 15 * this.life, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

/**
 * Эффект молнии от радужной бомбы к целевому кристаллу
 */
class LightningEffect {
  constructor(startX, startY, endX, endY, color, delay = 0) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.color = color;
    this.delay = delay;
    this.life = 1;
    this.active = delay <= 0;
    this.segments = [];
    this.impactTriggered = false;
    
    // Генерируем ломаную линию молнии
    this.generateLightning();
  }
  
  generateLightning() {
    const dx = this.endX - this.startX;
    const dy = this.endY - this.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const segmentCount = Math.max(4, Math.floor(distance / 25));
    
    this.segments = [];
    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      let x = this.startX + dx * t;
      let y = this.startY + dy * t;
      
      // Добавляем случайное смещение (кроме начала и конца)
      if (i > 0 && i < segmentCount) {
        const perpX = -dy / distance;
        const perpY = dx / distance;
        const offset = (Math.random() - 0.5) * 30;
        x += perpX * offset;
        y += perpY * offset;
      }
      
      this.segments.push({ x, y });
    }
  }

  update() {
    if (this.delay > 0) {
      this.delay -= 16; // ~1 frame
      if (this.delay <= 0) {
        this.active = true;
        this.generateLightning(); // Перегенерируем для свежести
      }
      return true;
    }
    
    this.life -= 0.06;
    
    // Немного "дрожим" молнией
    if (this.life > 0.5 && Math.random() < 0.3) {
      this.generateLightning();
    }
    
    return this.life > 0;
  }

  draw(ctx) {
    if (!this.active || this.segments.length < 2) return;
    
    ctx.save();
    ctx.globalAlpha = this.life;
    
    // Основная молния (широкая, размытая)
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 6 * this.life;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.moveTo(this.segments[0].x, this.segments[0].y);
    for (let i = 1; i < this.segments.length; i++) {
      ctx.lineTo(this.segments[i].x, this.segments[i].y);
    }
    ctx.stroke();
    
    // Яркое ядро молнии (белое)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 * this.life;
    ctx.shadowBlur = 5;
    
    ctx.beginPath();
    ctx.moveTo(this.segments[0].x, this.segments[0].y);
    for (let i = 1; i < this.segments.length; i++) {
      ctx.lineTo(this.segments[i].x, this.segments[i].y);
    }
    ctx.stroke();
    
    // Вспышка в точке удара
    if (this.life > 0.7) {
      const impactAlpha = (this.life - 0.7) * 3;
      ctx.globalAlpha = impactAlpha;
      
      // Кольцо удара
      const impactRadius = 20 * (1 - impactAlpha);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.endX, this.endY, impactRadius + 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Белая вспышка
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(this.endX, this.endY, 10 * impactAlpha, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

/**
 * Класс кристалла
 */
class Gem {
  constructor(type, row, col) {
    this.type = type;
    this.row = row;
    this.col = col;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.scale = 1;
    this.alpha = 1;
    this.specialType = SPECIAL_TYPES.NONE;
    this.isMatched = false;
    this.isNew = true;
    this.isRemoving = false;
    
    // Новые свойства для анимаций
    this.isSelected = false;
    this.isSwapping = false;
    this.pulsePhase = Math.random() * Math.PI * 2; // Случайная фаза для мерцания
    this.bounceY = 0; // Для bounce-эффекта при приземлении
    this.rotation = 0; // Вращение при обмене
    
    // Реакция на соседние кристаллы и живое поле
    this.pushX = 0; // Отталкивание по X (от соседа)
    this.pushY = 0; // Отталкивание по Y
    this.hoverScale = 0; // Увеличение при наведении
    this.wobble = 0; // Покачивание (волновой эффект)
    this.glowIntensity = 0; // Интенсивность свечения
    this.idleFloatPhase = Math.random() * Math.PI * 2; // Фаза для плавания
  }

  update(cellSize, gridX, gridY) {
    this.targetX = gridX + this.col * cellSize + cellSize / 2;
    this.targetY = gridY + this.row * cellSize + cellSize / 2;
    
    // Улучшенное плавное движение с bounce-эффектом
    const speed = this.isSwapping ? 0.25 : 0.18; // Быстрее при обмене
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    
    this.x += dx * speed;
    this.y += dy * speed;
    
    // Bounce-эффект при падении
    if (Math.abs(dy) > 2) {
      this.bounceY = dy * 0.1;
    } else {
      this.bounceY *= 0.8;
    }
    
    // Вращение при обмене
    if (this.isSwapping) {
      this.rotation += 0.15;
    } else {
      this.rotation *= 0.85;
    }
    
    // Пульсация фазы для idle-анимации
    this.pulsePhase += 0.05;
    this.idleFloatPhase += 0.03;
    
    // Плавное затухание отталкивания
    this.pushX *= 0.85;
    this.pushY *= 0.85;
    
    // Затухание hover эффекта
    this.hoverScale *= 0.9;
    
    // Затухание wobble
    this.wobble *= 0.92;
    
    // Затухание свечения
    this.glowIntensity *= 0.95;
    
    // Анимация появления (более выраженная)
    if (this.isNew) {
      this.scale += (1.1 - this.scale) * 0.15;
      if (Math.abs(1 - this.scale) < 0.02) {
        this.scale = 1;
        this.isNew = false;
      }
    }
    
    // Анимация удаления
    if (this.isRemoving) {
      this.scale *= 0.85;
      this.alpha *= 0.85;
      this.rotation += 0.2;
    }
  }

  // Применить отталкивание от соседа
  applyPush(dx, dy) {
    this.pushX += dx;
    this.pushY += dy;
  }
  
  // Применить волновой эффект
  applyWave(intensity) {
    this.wobble += intensity;
    this.glowIntensity += intensity * 0.5;
  }

  isSettled() {
    const dx = Math.abs(this.x - this.targetX);
    const dy = Math.abs(this.y - this.targetY);
    return dx < 0.5 && dy < 0.5 && !this.isNew && !this.isSwapping;
  }

  draw(ctx, cellSize) {
    if (this.alpha <= 0.01) return;
    
    // Для радужной бомбы используем специальный цвет
    const colors = this.specialType === SPECIAL_TYPES.RAINBOW 
      ? GEM_COLORS.rainbow 
      : GEM_COLORS[this.type];
    const shape = GEM_SHAPES[this.type];
    if (!colors) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    
    // Базовая позиция + отталкивание + лёгкое плавание в idle
    const idleFloat = Math.sin(this.idleFloatPhase) * 1.5; // Лёгкое вертикальное покачивание
    const wobbleOffset = Math.sin(this.pulsePhase * 2) * this.wobble * 3;
    ctx.translate(
      this.x + this.pushX + wobbleOffset, 
      this.y + this.bounceY + this.pushY + idleFloat
    );
    
    // Вращение (при удалении или wobble)
    const wobbleRotation = Math.sin(this.pulsePhase * 3) * this.wobble * 0.1;
    if ((this.isRemoving && Math.abs(this.rotation) > 0.01) || Math.abs(wobbleRotation) > 0.001) {
      ctx.rotate(this.rotation + wobbleRotation);
    }
    
    // Масштаб: базовый + выделение + hover + пульсация спецэлемента + легкое дыхание
    let finalScale = this.scale;
    
    // Лёгкое "дыхание" для всех кристаллов
    const breathe = 1 + Math.sin(this.idleFloatPhase * 0.7) * 0.015;
    finalScale *= breathe;
    
    // Hover эффект
    finalScale *= (1 + this.hoverScale * 0.15);
    
    // Пульсация для спецэлементов
    if (this.specialType) {
      const specialPulse = 1 + Math.sin(this.pulsePhase * 2) * 0.06;
      finalScale *= specialPulse;
    }
    
    // Выбранный кристалл
    if (this.isSelected) {
      finalScale *= 1.12 + Math.sin(this.pulsePhase * 4) * 0.04;
    }
    
    ctx.scale(finalScale, finalScale);
    
    const r = cellSize * 0.38;
    
    // Тень под кристаллом (динамическая)
    const shadowScale = 1 + this.hoverScale * 0.3;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.25 + this.hoverScale * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(2 + this.pushX * 0.3, 4 + this.hoverScale * 5, r * 0.65 * shadowScale, r * 0.3 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Свечение: выбранный, спецэлемент, или волновой эффект
    const hasGlow = this.isSelected || this.specialType || this.glowIntensity > 0.05;
    if (hasGlow) {
      const baseAlpha = this.isSelected ? 0.35 : (this.specialType ? 0.25 : 0);
      const waveAlpha = this.glowIntensity * 0.4;
      const totalAlpha = Math.min(0.5, baseAlpha + waveAlpha);
      
      const glowColor = this.specialType === SPECIAL_TYPES.RAINBOW ? '#FFFFFF' : colors.light;
      
      // Пульсирующее свечение для спецэлементов
      let glowSize = r * 1.3;
      if (this.specialType) {
        glowSize *= 1 + Math.sin(this.pulsePhase * 2.5) * 0.1;
      }
      glowSize += this.glowIntensity * r * 0.3;
      
      const glowGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, glowSize);
      glowGrad.addColorStop(0, `rgba(255, 255, 255, ${totalAlpha})`);
      glowGrad.addColorStop(0.5, glowColor + Math.floor(totalAlpha * 180).toString(16).padStart(2, '0'));
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Чёткий градиент без размытия
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    grad.addColorStop(0, colors.light);
    grad.addColorStop(0.5, colors.main);
    grad.addColorStop(1, colors.dark);
    ctx.fillStyle = grad;
    
    // Рисуем форму
    if (this.specialType === SPECIAL_TYPES.RAINBOW) {
      this.drawRainbowGem(ctx, r);
    } else {
      this.drawShape(ctx, r, shape);
      // Индикатор спецэлемента
      if (this.specialType) {
        this.drawSpecialIndicator(ctx, r);
      }
    }
    
    ctx.restore();
  }

  drawShape(ctx, r, shape) {
    ctx.beginPath();
    switch (shape) {
      case 'circle':
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        break;
        
      case 'diamond':
        ctx.moveTo(0, -r);
        ctx.lineTo(r, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r, 0);
        break;
        
      case 'triangle':
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.866, r * 0.5);
        ctx.lineTo(-r * 0.866, r * 0.5);
        break;
        
      case 'star':
        for (let i = 0; i < 5; i++) {
          const outerAngle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const innerAngle = outerAngle + Math.PI / 5;
          const outerX = Math.cos(outerAngle) * r;
          const outerY = Math.sin(outerAngle) * r;
          const innerX = Math.cos(innerAngle) * r * 0.5;
          const innerY = Math.sin(innerAngle) * r * 0.5;
          if (i === 0) ctx.moveTo(outerX, outerY);
          else ctx.lineTo(outerX, outerY);
          ctx.lineTo(innerX, innerY);
        }
        break;
        
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        break;
        
      case 'square':
        const s = r * 0.85;
        ctx.rect(-s, -s, s * 2, s * 2);
        break;
    }
    ctx.closePath();
    ctx.fill();
    
    // Улучшенный контур с глубиной
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Внутренний контур (светлый)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Главный блик (верхний)
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, -r * 0.3, r * 0.3, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Дополнительный маленький блик
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.15, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Нижний отблеск (отражённый свет)
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.ellipse(r * 0.15, r * 0.35, r * 0.25, r * 0.1, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Вспомогательный метод для затемнения цвета
  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  drawRainbowGem(ctx, r) {
    // Радужный шар с переливами
    const colors = ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0088FF', '#8800FF'];
    const time = performance.now() / 500;
    
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r * 0.25, Math.sin(angle) * r * 0.25, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Белый центр
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Звезда
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${r * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', 0, 2);
  }

  drawSpecialIndicator(ctx, r) {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    
    if (this.specialType === SPECIAL_TYPES.LINE_H) {
      // Горизонтальные стрелки
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.lineTo(r * 0.6, 0);
      ctx.stroke();
      // Стрелки
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.lineTo(-r * 0.3, -r * 0.2);
      ctx.moveTo(-r * 0.6, 0);
      ctx.lineTo(-r * 0.3, r * 0.2);
      ctx.moveTo(r * 0.6, 0);
      ctx.lineTo(r * 0.3, -r * 0.2);
      ctx.moveTo(r * 0.6, 0);
      ctx.lineTo(r * 0.3, r * 0.2);
      ctx.stroke();
    } else if (this.specialType === SPECIAL_TYPES.LINE_V) {
      // Вертикальные стрелки
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(0, r * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(-r * 0.2, -r * 0.3);
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(r * 0.2, -r * 0.3);
      ctx.moveTo(0, r * 0.6);
      ctx.lineTo(-r * 0.2, r * 0.3);
      ctx.moveTo(0, r * 0.6);
      ctx.lineTo(r * 0.2, r * 0.3);
      ctx.stroke();
    } else if (this.specialType === SPECIAL_TYPES.BOMB) {
      // Взрыв - 8 лучей
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * r * 0.2, Math.sin(angle) * r * 0.2);
        ctx.lineTo(Math.cos(angle) * r * 0.5, Math.sin(angle) * r * 0.5);
        ctx.stroke();
      }
    }
  }
}

/**
 * Основной класс игры Match-3
 */
export class Match3Game {
  constructor(canvasWidth, canvasHeight) {
    this.W = canvasWidth;
    this.H = canvasHeight;
    
    // Размеры сетки
    this.rows = 8;
    this.cols = 8;
    this.grid = [];
    
    // Расчёт размеров
    this.recalcLayout();
    
    // Состояние
    this.score = 0;
    this.moves = 30;
    this.combo = 0;
    this.state = 'idle'; // 'idle', 'swapping', 'matching', 'falling', 'gameover', 'dragging'
    
    // Выбор и свайп
    this.selected = null;
    this.swapTarget = null;
    this.swapProgress = 0;
    
    // Перетаскивание кристалла
    this.dragging = null; // { gem, startX, startY, originX, originY, row, col }
    this.dragOffset = { x: 0, y: 0 };
    this.hoveredGem = null; // Текущий кристалл под курсором
    
    // Анимации и эффекты
    this.matchedGems = [];
    this.fallingGems = [];
    this.effects = [];
    this.comboText = null;
    
    // Инициализация
    this.initGrid();
  }

  recalcLayout() {
    const maxGridSize = Math.min(this.W * 0.9, this.H * 0.7);
    this.cellSize = Math.floor(maxGridSize / this.cols);
    const gridWidth = this.cellSize * this.cols;
    const gridHeight = this.cellSize * this.rows;
    this.gridX = Math.floor((this.W - gridWidth) / 2);
    this.gridY = Math.floor((this.H - gridHeight) / 2) + 30;
  }

  setCanvasSize(w, h) {
    this.W = w;
    this.H = h;
    this.recalcLayout();
  }

  initGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        let type;
        do {
          type = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
        } while (this.wouldMatch(r, c, type));
        
        const gem = new Gem(type, r, c);
        gem.x = this.gridX + c * this.cellSize + this.cellSize / 2;
        gem.y = this.gridY + r * this.cellSize + this.cellSize / 2;
        gem.isNew = false;
        row.push(gem);
      }
      this.grid.push(row);
    }
  }

  // Проверка, создаст ли размещение матч (для начальной генерации)
  wouldMatch(row, col, type) {
    // Проверка по горизонтали
    if (col >= 2) {
      if (this.grid[row]?.[col - 1]?.type === type &&
          this.grid[row]?.[col - 2]?.type === type) {
        return true;
      }
    }
    // Проверка по вертикали
    if (row >= 2) {
      if (this.grid[row - 1]?.[col]?.type === type &&
          this.grid[row - 2]?.[col]?.type === type) {
        return true;
      }
    }
    return false;
  }

  // Получение кристалла по координатам
  getGemAt(x, y) {
    const col = Math.floor((x - this.gridX) / this.cellSize);
    const row = Math.floor((y - this.gridY) / this.cellSize);
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      return { row, col, gem: this.grid[row][col] };
    }
    return null;
  }

  // Волновой эффект от точки (ряд, колонка)
  triggerWaveEffect(centerRow, centerCol, intensity = 1, type = 'radial') {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const gem = this.grid[r][c];
        if (!gem) continue;
        
        let distance;
        if (type === 'radial') {
          // Радиальная волна (от бомбы)
          distance = Math.sqrt((r - centerRow) ** 2 + (c - centerCol) ** 2);
        } else if (type === 'horizontal') {
          // Горизонтальная волна (от линии)
          distance = Math.abs(r - centerRow);
        } else if (type === 'vertical') {
          // Вертикальная волна
          distance = Math.abs(c - centerCol);
        }
        
        // Сила волны уменьшается с расстоянием
        const waveStrength = Math.max(0, intensity * (1 - distance / 6));
        
        if (waveStrength > 0.05) {
          // Задержка волны в зависимости от расстояния
          const delay = distance * 30; // мс
          setTimeout(() => {
            if (gem && !gem.isRemoving) {
              gem.applyWave(waveStrength);
            }
          }, delay);
        }
      }
    }
  }

  // Клик по ячейке
  handleClick(x, y) {
    if (this.state !== 'idle' || this.moves <= 0) return;
    
    const cell = this.getGemAt(x, y);
    if (!cell || !cell.gem) return;
    
    SoundEffects.playClick();
    
    // Убираем выделение с предыдущего
    if (this.selected && this.selected.gem) {
      this.selected.gem.isSelected = false;
    }
    
    if (!this.selected) {
      this.selected = cell;
      cell.gem.isSelected = true;
    } else {
      // Проверяем соседство
      const dr = Math.abs(cell.row - this.selected.row);
      const dc = Math.abs(cell.col - this.selected.col);
      
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        this.swapTarget = cell;
        this.startSwap();
      } else {
        this.selected = cell;
        cell.gem.isSelected = true;
      }
    }
  }

  // Hover-эффект при движении мыши (для десктопа)
  handleHover(x, y) {
    if (this.state !== 'idle') return;
    
    const cell = this.getGemAt(x, y);
    
    // Сбрасываем предыдущий hover
    if (this.hoveredGem && this.hoveredGem !== cell?.gem) {
      this.hoveredGem.hoverScale = 0;
    }
    
    if (cell && cell.gem) {
      cell.gem.hoverScale = Math.max(cell.gem.hoverScale, 0.5);
      this.hoveredGem = cell.gem;
      
      // Лёгкое свечение у соседей
      const neighbors = [
        this.grid[cell.row - 1]?.[cell.col],
        this.grid[cell.row + 1]?.[cell.col],
        this.grid[cell.row]?.[cell.col - 1],
        this.grid[cell.row]?.[cell.col + 1]
      ];
      for (const n of neighbors) {
        if (n) {
          n.hoverScale = Math.max(n.hoverScale, 0.15);
        }
      }
    } else {
      this.hoveredGem = null;
    }
  }

  // Свайп
  handleSwipe(startX, startY, endX, endY) {
    if (this.state !== 'idle' || this.moves <= 0) return;
    
    const cell = this.getGemAt(startX, startY);
    if (!cell || !cell.gem) return;
    
    const dx = endX - startX;
    const dy = endY - startY;
    
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    
    let targetRow = cell.row;
    let targetCol = cell.col;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      targetCol += dx > 0 ? 1 : -1;
    } else {
      targetRow += dy > 0 ? 1 : -1;
    }
    
    if (targetRow >= 0 && targetRow < this.rows && 
        targetCol >= 0 && targetCol < this.cols) {
      this.selected = cell;
      this.swapTarget = { 
        row: targetRow, 
        col: targetCol, 
        gem: this.grid[targetRow][targetCol] 
      };
      this.startSwap();
    }
  }

  // Начало перетаскивания (touch/mouse down)
  handleDragStart(x, y) {
    if (this.state !== 'idle' || this.moves <= 0) return;
    
    const cell = this.getGemAt(x, y);
    if (!cell || !cell.gem) return;
    
    // Сохраняем информацию о перетаскиваемом кристалле
    this.dragging = {
      gem: cell.gem,
      row: cell.row,
      col: cell.col,
      startX: x,
      startY: y,
      originX: cell.gem.x,
      originY: cell.gem.y,
      // Для сглаживания движения
      smoothX: cell.gem.x,
      smoothY: cell.gem.y,
      lastMoveX: 0,
      lastMoveY: 0
    };
    
    cell.gem.isSelected = true;
    this.state = 'dragging';
    SoundEffects.playClick();
  }

  // Перетаскивание (touch/mouse move)
  handleDragMove(x, y) {
    if (this.state !== 'dragging' || !this.dragging) return;
    
    const gem = this.dragging.gem;
    const dx = x - this.dragging.startX;
    const dy = y - this.dragging.startY;
    
    // Ограничиваем перетаскивание одной ячейкой
    const maxDrag = this.cellSize * 0.9;
    
    // Определяем направление (только одно - либо горизонталь, либо вертикаль)
    let targetMoveX = 0, targetMoveY = 0;
    if (Math.abs(dx) > Math.abs(dy)) {
      targetMoveX = Math.max(-maxDrag, Math.min(maxDrag, dx));
    } else {
      targetMoveY = Math.max(-maxDrag, Math.min(maxDrag, dy));
    }
    
    // === Сглаживание движения (убирает дёрганье) ===
    const smoothFactor = 0.3; // Чем меньше, тем плавнее (но медленнее отклик)
    this.dragging.lastMoveX += (targetMoveX - this.dragging.lastMoveX) * smoothFactor;
    this.dragging.lastMoveY += (targetMoveY - this.dragging.lastMoveY) * smoothFactor;
    
    const smoothMoveX = this.dragging.lastMoveX;
    const smoothMoveY = this.dragging.lastMoveY;
    
    // Применяем сглаженное движение к кристаллу
    gem.x = this.dragging.originX + smoothMoveX;
    gem.y = this.dragging.originY + smoothMoveY;
    
    // === Целевой сосед ОБТЕКАЕТ схваченный кристалл по дуге ===
    const dragProgress = Math.max(Math.abs(smoothMoveX), Math.abs(smoothMoveY)) / maxDrag;
    const threshold = 0.15; // Порог для начала реакции соседа (раньше начинаем)
    
    // Определяем направление к целевому соседу
    let targetRow = this.dragging.row;
    let targetCol = this.dragging.col;
    const isHorizontal = Math.abs(smoothMoveX) > Math.abs(smoothMoveY);
    
    if (isHorizontal && Math.abs(smoothMoveX) > 5) {
      targetCol += smoothMoveX > 0 ? 1 : -1;
    } else if (Math.abs(smoothMoveY) > 5) {
      targetRow += smoothMoveY > 0 ? 1 : -1;
    }
    
    // Сбрасываем предыдущего соседа если изменился
    if (this.swapTarget?.gem && 
        (this.swapTarget.row !== targetRow || this.swapTarget.col !== targetCol)) {
      this.swapTarget.gem.isSelected = false;
      this.swapTarget.gem.pushX = 0;
      this.swapTarget.gem.pushY = 0;
      this.swapTarget = null;
    }
    
    // Проверяем валидность целевого соседа
    if (targetRow >= 0 && targetRow < this.rows && 
        targetCol >= 0 && targetCol < this.cols &&
        (targetRow !== this.dragging.row || targetCol !== this.dragging.col)) {
      
      const targetGem = this.grid[targetRow][targetCol];
      if (targetGem) {
        // Устанавливаем как цель
        if (!this.swapTarget || this.swapTarget.gem !== targetGem) {
          this.swapTarget = { row: targetRow, col: targetCol, gem: targetGem };
          targetGem.isSelected = true;
        }
        
        // === ОБТЕКАНИЕ ПО ДУГЕ ===
        if (dragProgress > threshold) {
          const moveProgress = (dragProgress - threshold) / (1 - threshold); // 0 to 1
          
          // Позиция места схваченного кристалла (куда должен прийти сосед)
          const originX = this.dragging.originX;
          const originY = this.dragging.originY;
          
          // Текущая "домашняя" позиция соседа
          const neighborHomeX = this.gridX + targetCol * this.cellSize + this.cellSize / 2;
          const neighborHomeY = this.gridY + targetRow * this.cellSize + this.cellSize / 2;
          
          // Вектор от дома соседа к месту схваченного
          const toOriginX = originX - neighborHomeX;
          const toOriginY = originY - neighborHomeY;
          
          // Дуга: сосед сначала отклоняется в сторону (перпендикулярно), потом идёт к цели
          // Используем синус для плавной дуги
          const arcPhase = moveProgress * Math.PI; // 0 → π
          const arcProgress = Math.sin(arcPhase); // 0 → 1 → 0 (выпуклость дуги)
          const linearProgress = (1 - Math.cos(arcPhase)) / 2; // 0 → 1 (прогресс к цели)
          
          // Перпендикулярное смещение для дуги
          const arcOffset = this.cellSize * 0.3 * arcProgress;
          let perpX = 0, perpY = 0;
          
          if (isHorizontal) {
            // Горизонтальный свап - дуга идёт вверх или вниз
            perpY = -arcOffset; // Всегда вверх (можно сделать случайным)
          } else {
            // Вертикальный свап - дуга идёт влево или вправо
            perpX = -arcOffset; // Всегда влево
          }
          
          // Итоговое смещение: линейное движение к цели + перпендикулярная дуга
          targetGem.pushX = toOriginX * linearProgress * 0.85 + perpX;
          targetGem.pushY = toOriginY * linearProgress * 0.85 + perpY;
        }
        
        targetGem.hoverScale = Math.max(targetGem.hoverScale, dragProgress * 0.4);
      }
    } else {
      // Нет валидного соседа
      if (this.swapTarget?.gem) {
        this.swapTarget.gem.isSelected = false;
        this.swapTarget.gem.pushX = 0;
        this.swapTarget.gem.pushY = 0;
        this.swapTarget = null;
      }
    }
  }

  // Конец перетаскивания (touch/mouse up)
  // Возвращает true если был drag, false если нет
  handleDragEnd(x, y) {
    if (this.state !== 'dragging' || !this.dragging) {
      this.state = 'idle';
      return false; // Не было перетаскивания
    }
    
    const gem = this.dragging.gem;
    gem.isSelected = false;
    
    // Возвращаем кристалл на место (анимация сделает это плавно)
    gem.x = this.dragging.originX;
    gem.y = this.dragging.originY;
    
    // Сбрасываем push у соседа (он вернётся на место плавно через затухание)
    if (this.swapTarget?.gem) {
      this.swapTarget.gem.pushX = 0;
      this.swapTarget.gem.pushY = 0;
    }
    
    const dx = x - this.dragging.startX;
    const dy = y - this.dragging.startY;
    const threshold = this.cellSize * 0.35;
    
    // Если достаточно протянули — делаем свап
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      let targetRow = this.dragging.row;
      let targetCol = this.dragging.col;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        targetCol += dx > 0 ? 1 : -1;
      } else {
        targetRow += dy > 0 ? 1 : -1;
      }
      
      if (targetRow >= 0 && targetRow < this.rows && 
          targetCol >= 0 && targetCol < this.cols) {
        this.selected = { row: this.dragging.row, col: this.dragging.col, gem };
        const targetGem = this.grid[targetRow][targetCol];
        // Сбрасываем push перед свапом
        if (targetGem) {
          targetGem.pushX = 0;
          targetGem.pushY = 0;
          targetGem.isSelected = false;
        }
        this.swapTarget = { 
          row: targetRow, 
          col: targetCol, 
          gem: targetGem 
        };
        this.dragging = null;
        this.startSwap();
        return true; // Был перетаскивание со свапом
      }
    }
    
    // Сбрасываем
    if (this.swapTarget?.gem) {
      this.swapTarget.gem.isSelected = false;
      this.swapTarget.gem.pushX = 0;
      this.swapTarget.gem.pushY = 0;
    }
    this.dragging = null;
    this.swapTarget = null;
    this.state = 'idle';
    return true; // Был перетаскивание (без свапа, но drag был)
  }

  startSwap() {
    if (!this.selected || !this.swapTarget) return;
    this.state = 'swapping';
    this.swapProgress = 0;
    
    // Устанавливаем флаги анимации
    if (this.selected.gem) {
      this.selected.gem.isSwapping = true;
      this.selected.gem.isSelected = false;
    }
    if (this.swapTarget.gem) {
      this.swapTarget.gem.isSwapping = true;
    }
    
    SoundEffects.playLaunch();
  }

  // Обмен кристаллов
  doSwap() {
    const gem1 = this.grid[this.selected.row][this.selected.col];
    const gem2 = this.grid[this.swapTarget.row][this.swapTarget.col];
    
    // Сбрасываем флаги анимации
    if (gem1) gem1.isSwapping = false;
    if (gem2) gem2.isSwapping = false;
    
    // Меняем в сетке
    this.grid[this.selected.row][this.selected.col] = gem2;
    this.grid[this.swapTarget.row][this.swapTarget.col] = gem1;
    
    // Обновляем координаты
    gem1.row = this.swapTarget.row;
    gem1.col = this.swapTarget.col;
    gem2.row = this.selected.row;
    gem2.col = this.selected.col;
  }

  // Поиск всех матчей с определением спецэлементов
  findMatches() {
    const horizontalMatches = [];
    const verticalMatches = [];
    
    // Горизонтальные совпадения
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        const gem = this.grid[r][c];
        if (!gem) { c++; continue; }
        
        let count = 1;
        while (c + count < this.cols && this.grid[r][c + count]?.type === gem.type) {
          count++;
        }
        
        if (count >= 3) {
          const match = {
            cells: [],
            type: gem.type,
            direction: 'horizontal',
            length: count,
            row: r,
            startCol: c
          };
          for (let i = 0; i < count; i++) {
            match.cells.push({ row: r, col: c + i });
          }
          horizontalMatches.push(match);
        }
        c += Math.max(1, count);
      }
    }
    
    // Вертикальные совпадения
    for (let c = 0; c < this.cols; c++) {
      let r = 0;
      while (r < this.rows) {
        const gem = this.grid[r][c];
        if (!gem) { r++; continue; }
        
        let count = 1;
        while (r + count < this.rows && this.grid[r + count]?.[c]?.type === gem.type) {
          count++;
        }
        
        if (count >= 3) {
          const match = {
            cells: [],
            type: gem.type,
            direction: 'vertical',
            length: count,
            col: c,
            startRow: r
          };
          for (let i = 0; i < count; i++) {
            match.cells.push({ row: r + i, col: c });
          }
          verticalMatches.push(match);
        }
        r += Math.max(1, count);
      }
    }
    
    // Собираем все уникальные ячейки
    const matchedSet = new Set();
    const allMatches = [...horizontalMatches, ...verticalMatches];
    
    for (const match of allMatches) {
      for (const cell of match.cells) {
        matchedSet.add(`${cell.row},${cell.col}`);
      }
    }
    
    const matches = [];
    for (const key of matchedSet) {
      const [row, col] = key.split(',').map(Number);
      matches.push({ row, col });
    }
    
    // Определяем спецэлементы для создания
    const specialsToCreate = this.determineSpecials(horizontalMatches, verticalMatches);
    
    return { matches, specialsToCreate, allMatches };
  }

  // Определение спецэлементов для создания
  determineSpecials(horizontalMatches, verticalMatches) {
    const specials = [];
    const processedCells = new Set();
    
    // Проверяем пересечения (L/T формы) - создают бомбы
    for (const hMatch of horizontalMatches) {
      for (const vMatch of verticalMatches) {
        if (hMatch.type !== vMatch.type) continue;
        
        // Ищем пересечение
        for (const hCell of hMatch.cells) {
          for (const vCell of vMatch.cells) {
            if (hCell.row === vCell.row && hCell.col === vCell.col) {
              const key = `${hCell.row},${hCell.col}`;
              if (!processedCells.has(key)) {
                specials.push({
                  row: hCell.row,
                  col: hCell.col,
                  specialType: SPECIAL_TYPES.BOMB,
                  gemType: hMatch.type
                });
                processedCells.add(key);
              }
            }
          }
        }
      }
    }
    
    // Проверяем длинные матчи
    const allMatches = [...horizontalMatches, ...verticalMatches];
    for (const match of allMatches) {
      if (match.length >= 5) {
        // 5+ в ряд = радужная бомба
        const midIndex = Math.floor(match.length / 2);
        const cell = match.cells[midIndex];
        const key = `${cell.row},${cell.col}`;
        if (!processedCells.has(key)) {
          specials.push({
            row: cell.row,
            col: cell.col,
            specialType: SPECIAL_TYPES.RAINBOW,
            gemType: match.type
          });
          processedCells.add(key);
        }
      } else if (match.length === 4) {
        // 4 в ряд = линейный бустер (перпендикулярный направлению)
        const midIndex = 1;
        const cell = match.cells[midIndex];
        const key = `${cell.row},${cell.col}`;
        if (!processedCells.has(key)) {
          specials.push({
            row: cell.row,
            col: cell.col,
            specialType: match.direction === 'horizontal' ? SPECIAL_TYPES.LINE_V : SPECIAL_TYPES.LINE_H,
            gemType: match.type
          });
          processedCells.add(key);
        }
      }
    }
    
    return specials;
  }

  // Удаление совпавших с созданием спецэлементов
  removeMatches(matches, specialsToCreate = []) {
    this.combo++;
    const points = matches.length * 10 * this.combo;
    this.score += points;
    
    SoundEffects.playBreak();
    
    // Создаём спецэлементы
    const specialPositions = new Set();
    for (const special of specialsToCreate) {
      const key = `${special.row},${special.col}`;
      specialPositions.add(key);
      
      const gem = this.grid[special.row]?.[special.col];
      if (gem) {
        // Создаём новый гем с спецтипом вместо удаления
        const newGem = new Gem(special.gemType, special.row, special.col);
        newGem.x = gem.x;
        newGem.y = gem.y;
        newGem.specialType = special.specialType;
        newGem.isNew = false;
        this.grid[special.row][special.col] = newGem;
        
        // Эффект создания
        this.effects.push(new Effect(gem.x, gem.y, 'burst', '#FFFFFF'));
        SoundEffects.playBonus();
      }
    }
    
    // Удаляем остальные совпавшие элементы
    for (const m of matches) {
      const key = `${m.row},${m.col}`;
      // Пропускаем, если здесь создаётся спецэлемент
      if (specialPositions.has(key)) continue;
      
      const gem = this.grid[m.row]?.[m.col];
      if (gem) {
        // Если это спецэлемент - активируем его
        if (gem.specialType) {
          this.activateSpecial(gem);
        }
        
        // Эффект рассыпания
        const color = GEM_COLORS[gem.type]?.main || '#FFFFFF';
        const shape = GEM_SHAPES[gem.type];
        this.effects.push(new ShatterEffect(gem.x, gem.y, color, shape));
        
        this.grid[m.row][m.col] = null;
      }
    }
    
    // Показываем комбо
    if (this.combo > 1) {
      this.comboText = {
        text: `COMBO x${this.combo}!`,
        life: 1,
        y: this.H / 2
      };
    }
  }

  // Активация спецэлемента
  activateSpecial(gem) {
    const { row, col, specialType, type } = gem;
    const cellsToDestroy = [];
    const gemX = gem.x;
    const gemY = gem.y;
    const gemColor = GEM_COLORS[type]?.main || '#FFFFFF';
    
    if (specialType === SPECIAL_TYPES.LINE_H) {
      // Уничтожаем всю строку
      for (let c = 0; c < this.cols; c++) {
        if (c !== col) {
          cellsToDestroy.push({ row, col: c });
        }
      }
      // Вспышка горизонтальной линии
      this.effects.push(new FlashEffect(gemX, gemY, gemColor, 'horizontal'));
      // Волновой эффект от горизонтальной линии
      this.triggerWaveEffect(row, col, 1.2, 'horizontal');
      SoundEffects.playLaser();
    } else if (specialType === SPECIAL_TYPES.LINE_V) {
      // Уничтожаем весь столбец
      for (let r = 0; r < this.rows; r++) {
        if (r !== row) {
          cellsToDestroy.push({ row: r, col });
        }
      }
      // Вспышка вертикальной линии
      this.effects.push(new FlashEffect(gemX, gemY, gemColor, 'vertical'));
      // Волновой эффект от вертикальной линии
      this.triggerWaveEffect(row, col, 1.2, 'vertical');
      SoundEffects.playLaser();
    } else if (specialType === SPECIAL_TYPES.BOMB) {
      // Уничтожаем область 3x3
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr, c = col + dc;
          if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            if (!(dr === 0 && dc === 0)) {
              cellsToDestroy.push({ row: r, col: c });
            }
          }
        }
      }
      // Вспышка взрыва бомбы
      this.effects.push(new FlashEffect(gemX, gemY, gemColor, 'radial'));
      // Мощный радиальный волновой эффект от бомбы
      this.triggerWaveEffect(row, col, 1.5, 'radial');
      SoundEffects.playExplosion();
    } else if (specialType === SPECIAL_TYPES.RAINBOW) {
      // Уничтожаем все элементы случайного типа с эффектом молний!
      const targetType = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
      const targetColor = GEM_COLORS[targetType]?.main || '#FFFFFF';
      
      // Собираем все целевые кристаллы
      const targets = [];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const targetGem = this.grid[r][c];
          if (targetGem?.type === targetType) {
            targets.push({ 
              row: r, col: c, 
              gem: targetGem,
              x: targetGem.x, 
              y: targetGem.y 
            });
          }
        }
      }
      
      // Создаём молнии с задержкой для каждой цели
      targets.forEach((target, index) => {
        const delay = index * 50; // Молнии летят последовательно
        this.effects.push(new LightningEffect(
          gemX, gemY, 
          target.x, target.y, 
          targetColor, 
          delay
        ));
        
        // Рассыпание кристалла происходит когда молния долетает
        setTimeout(() => {
          const targetGem = this.grid[target.row]?.[target.col];
          if (targetGem) {
            this.grid[target.row][target.col] = null;
            const color = GEM_COLORS[targetGem.type]?.main || '#FFFFFF';
            const shape = GEM_SHAPES[targetGem.type];
            this.effects.push(new ShatterEffect(targetGem.x, targetGem.y, color, shape));
            this.score += 15;
            
            // Если это спецэлемент - активируем
            if (targetGem.specialType) {
              this.activateSpecial(targetGem);
            }
          }
        }, delay + 100); // +100мс на полёт молнии
      });
      
      // Супер-волна от радужной бомбы (после всех молний)
      setTimeout(() => {
        this.triggerWaveEffect(row, col, 1.5, 'radial');
      }, targets.length * 50);
      
      // Начальная вспышка
      this.effects.push(new FlashEffect(gemX, gemY, '#FFD700', 'radial'));
      SoundEffects.playBonus();
      
      // Rainbow обрабатывает уничтожение сам, очищаем cellsToDestroy
      cellsToDestroy.length = 0;
    }
    
    // Уничтожаем найденные ячейки с эффектом рассыпания (для LINE/BOMB)
    const toActivate = []; // Сначала собираем спецэлементы для активации
    
    for (const cell of cellsToDestroy) {
      const targetGem = this.grid[cell.row]?.[cell.col];
      if (targetGem) {
        // Сначала удаляем из сетки чтобы избежать рекурсии
        this.grid[cell.row][cell.col] = null;
        
        const color = GEM_COLORS[targetGem.type]?.main || '#FFFFFF';
        const shape = GEM_SHAPES[targetGem.type];
        // Эффект рассыпания на осколки
        this.effects.push(new ShatterEffect(targetGem.x, targetGem.y, color, shape));
        this.score += 15;
        
        // Если это тоже спецэлемент - добавляем в очередь активации
        if (targetGem.specialType) {
          toActivate.push(targetGem);
        }
      }
    }
    
    // Теперь активируем спецэлементы (уже удалённые из сетки)
    for (const specialGem of toActivate) {
      this.activateSpecial(specialGem);
    }
  }

  // Активация комбинации двух спецэлементов
  activateSpecialCombination(gem1, gem2) {
    const type1 = gem1.specialType;
    const type2 = gem2.specialType;
    const centerX = (gem1.x + gem2.x) / 2;
    const centerY = (gem1.y + gem2.y) / 2;
    
    // Удаляем оба спецэлемента
    this.grid[gem1.row][gem1.col] = null;
    this.grid[gem2.row][gem2.col] = null;
    
    // Супер эффект - вспышка + взрыв
    this.effects.push(new FlashEffect(centerX, centerY, '#FFD700', 'radial'));
    this.effects.push(new Effect(centerX, centerY, 'super_explosion', '#FFD700'));
    
    const cellsToDestroy = new Set();
    
    // RAINBOW + RAINBOW = уничтожает ВСЁ поле
    if (type1 === SPECIAL_TYPES.RAINBOW && type2 === SPECIAL_TYPES.RAINBOW) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          cellsToDestroy.add(`${r},${c}`);
        }
      }
      SoundEffects.playExplosion();
      this.comboText = { text: '💥 МЕГА ВЗРЫВ!', life: 1.5, y: this.H / 2 };
    }
    // RAINBOW + LINE = все элементы одного типа становятся линиями и активируются
    else if ((type1 === SPECIAL_TYPES.RAINBOW && (type2 === SPECIAL_TYPES.LINE_H || type2 === SPECIAL_TYPES.LINE_V)) ||
             (type2 === SPECIAL_TYPES.RAINBOW && (type1 === SPECIAL_TYPES.LINE_H || type1 === SPECIAL_TYPES.LINE_V))) {
      const targetType = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.grid[r][c]?.type === targetType) {
            // Уничтожаем ряд и столбец
            for (let cc = 0; cc < this.cols; cc++) cellsToDestroy.add(`${r},${cc}`);
            for (let rr = 0; rr < this.rows; rr++) cellsToDestroy.add(`${rr},${c}`);
          }
        }
      }
      SoundEffects.playLaser();
      this.comboText = { text: '⚡ ЛАЗЕРНЫЙ ШТОРМ!', life: 1.5, y: this.H / 2 };
    }
    // RAINBOW + BOMB = все элементы одного типа становятся бомбами и взрываются
    else if ((type1 === SPECIAL_TYPES.RAINBOW && type2 === SPECIAL_TYPES.BOMB) ||
             (type2 === SPECIAL_TYPES.RAINBOW && type1 === SPECIAL_TYPES.BOMB)) {
      const targetType = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.grid[r][c]?.type === targetType) {
            // Взрываем 3x3 вокруг каждого
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const rr = r + dr, cc = c + dc;
                if (rr >= 0 && rr < this.rows && cc >= 0 && cc < this.cols) {
                  cellsToDestroy.add(`${rr},${cc}`);
                }
              }
            }
          }
        }
      }
      SoundEffects.playExplosion();
      this.comboText = { text: '💣 БОМБОВЫЙ ДОЖДЬ!', life: 1.5, y: this.H / 2 };
    }
    // LINE + LINE = крест (ряд + столбец)
    else if ((type1 === SPECIAL_TYPES.LINE_H || type1 === SPECIAL_TYPES.LINE_V) &&
             (type2 === SPECIAL_TYPES.LINE_H || type2 === SPECIAL_TYPES.LINE_V)) {
      const row = gem1.row;
      const col = gem1.col;
      for (let c = 0; c < this.cols; c++) cellsToDestroy.add(`${row},${c}`);
      for (let r = 0; r < this.rows; r++) cellsToDestroy.add(`${r},${col}`);
      // Добавляем эффект линий
      this.effects.push(new LineEffect(centerX, centerY, 'horizontal', '#FFFFFF', this.cellSize));
      this.effects.push(new LineEffect(centerX, centerY, 'vertical', '#FFFFFF', this.cellSize));
      SoundEffects.playLaser();
      this.comboText = { text: '✚ КРЕСТ!', life: 1.2, y: this.H / 2 };
    }
    // LINE + BOMB = 3 ряда + 3 столбца
    else if ((type1 === SPECIAL_TYPES.BOMB && (type2 === SPECIAL_TYPES.LINE_H || type2 === SPECIAL_TYPES.LINE_V)) ||
             (type2 === SPECIAL_TYPES.BOMB && (type1 === SPECIAL_TYPES.LINE_H || type1 === SPECIAL_TYPES.LINE_V))) {
      const row = gem1.row;
      const col = gem1.col;
      for (let dr = -1; dr <= 1; dr++) {
        for (let c = 0; c < this.cols; c++) {
          if (row + dr >= 0 && row + dr < this.rows) cellsToDestroy.add(`${row + dr},${c}`);
        }
      }
      for (let dc = -1; dc <= 1; dc++) {
        for (let r = 0; r < this.rows; r++) {
          if (col + dc >= 0 && col + dc < this.cols) cellsToDestroy.add(`${r},${col + dc}`);
        }
      }
      SoundEffects.playExplosion();
      this.comboText = { text: '💥 МЕГА КРЕСТ!', life: 1.2, y: this.H / 2 };
    }
    // BOMB + BOMB = огромный взрыв 5x5
    else if (type1 === SPECIAL_TYPES.BOMB && type2 === SPECIAL_TYPES.BOMB) {
      const row = gem1.row;
      const col = gem1.col;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const r = row + dr, c = col + dc;
          if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            cellsToDestroy.add(`${r},${c}`);
          }
        }
      }
      SoundEffects.playExplosion();
      this.comboText = { text: '💣💣 СУПЕР БОМБА!', life: 1.2, y: this.H / 2 };
    }
    
    // Уничтожаем все ячейки
    for (const key of cellsToDestroy) {
      const [r, c] = key.split(',').map(Number);
      const targetGem = this.grid[r]?.[c];
      if (targetGem) {
        const color = GEM_COLORS[targetGem.type]?.main || '#FFFFFF';
        this.effects.push(new Effect(targetGem.x, targetGem.y, 'explosion', color));
        this.grid[r][c] = null;
        this.score += 20;
      }
    }
  }

  // Активация радужной бомбы на конкретный тип
  activateRainbowOnType(rainbowGem, targetType) {
    // Удаляем радужную бомбу
    this.effects.push(new Effect(rainbowGem.x, rainbowGem.y, 'super_explosion', '#FFD700'));
    this.grid[rainbowGem.row][rainbowGem.col] = null;
    
    // Уничтожаем все элементы указанного типа
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]?.type === targetType) {
          const gem = this.grid[r][c];
          const color = GEM_COLORS[gem.type]?.main || '#FFFFFF';
          this.effects.push(new Effect(gem.x, gem.y, 'burst', color));
          this.grid[r][c] = null;
          this.score += 15;
        }
      }
    }
    
    SoundEffects.playBonus();
    this.comboText = { text: '🌈 РАДУГА!', life: 1.2, y: this.H / 2 };
  }

  // Падение кристаллов
  applyGravity() {
    let moved = false;
    
    for (let c = 0; c < this.cols; c++) {
      let emptyRow = this.rows - 1;
      
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c]) {
          if (r !== emptyRow) {
            this.grid[emptyRow][c] = this.grid[r][c];
            this.grid[emptyRow][c].row = emptyRow;
            this.grid[r][c] = null;
            moved = true;
          }
          emptyRow--;
        }
      }
      
      // Заполняем пустые сверху
      for (let r = emptyRow; r >= 0; r--) {
        const type = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
        const gem = new Gem(type, r, c);
        gem.x = this.gridX + c * this.cellSize + this.cellSize / 2;
        gem.y = this.gridY - (emptyRow - r + 1) * this.cellSize;
        gem.scale = 0.5;
        this.grid[r][c] = gem;
        moved = true;
      }
    }
    
    return moved;
  }

  // Проверка возможных ходов
  hasValidMoves() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Проверяем обмен вправо
        if (c < this.cols - 1) {
          this.swapCells(r, c, r, c + 1);
          const result = this.findMatches();
          if (result.matches.length > 0) {
            this.swapCells(r, c, r, c + 1);
            return true;
          }
          this.swapCells(r, c, r, c + 1);
        }
        // Проверяем обмен вниз
        if (r < this.rows - 1) {
          this.swapCells(r, c, r + 1, c);
          const result = this.findMatches();
          if (result.matches.length > 0) {
            this.swapCells(r, c, r + 1, c);
            return true;
          }
          this.swapCells(r, c, r + 1, c);
        }
      }
    }
    return false;
  }

  swapCells(r1, c1, r2, c2) {
    const temp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = temp;
    if (this.grid[r1][c1]) {
      this.grid[r1][c1].row = r1;
      this.grid[r1][c1].col = c1;
    }
    if (this.grid[r2][c2]) {
      this.grid[r2][c2].row = r2;
      this.grid[r2][c2].col = c2;
    }
  }

  update() {
    // Обновление позиций кристаллов
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          this.grid[r][c].update(this.cellSize, this.gridX, this.gridY);
        }
      }
    }
    
    // Обновление эффектов
    this.effects = this.effects.filter(e => e.update());
    
    // Обновление комбо текста
    if (this.comboText) {
      this.comboText.life -= 0.02;
      this.comboText.y -= 0.5;
      if (this.comboText.life <= 0) this.comboText = null;
    }
    
    if (this.state === 'swapping') {
      this.swapProgress += 0.08; // Замедлено
      if (this.swapProgress >= 1) {
        this.doSwap();
        
        // Проверка комбинации спецэлементов
        const gem1 = this.grid[this.selected.row]?.[this.selected.col];
        const gem2 = this.grid[this.swapTarget.row]?.[this.swapTarget.col];
        
        // Если оба спецэлементы - активируем комбинацию
        if (gem1?.specialType && gem2?.specialType) {
          this.moves--;
          this.combo = 0;
          this.activateSpecialCombination(gem1, gem2);
          this.state = 'matching';
          this.selected = null;
          this.swapTarget = null;
          return;
        }
        
        // Если один радужный, а другой обычный - активируем радужный на тип другого
        if (gem1?.specialType === SPECIAL_TYPES.RAINBOW && gem2 && !gem2.specialType) {
          this.moves--;
          this.combo = 0;
          this.activateRainbowOnType(gem1, gem2.type);
          this.state = 'matching';
          this.selected = null;
          this.swapTarget = null;
          return;
        }
        if (gem2?.specialType === SPECIAL_TYPES.RAINBOW && gem1 && !gem1.specialType) {
          this.moves--;
          this.combo = 0;
          this.activateRainbowOnType(gem2, gem1.type);
          this.state = 'matching';
          this.selected = null;
          this.swapTarget = null;
          return;
        }
        
        const result = this.findMatches();
        if (result.matches.length > 0) {
          this.moves--;
          this.combo = 0;
          this.state = 'matching';
          this.removeMatches(result.matches, result.specialsToCreate);
        } else {
          // Обратный обмен
          this.doSwap();
          SoundEffects.playBounce();
          this.state = 'idle';
        }
        
        this.selected = null;
        this.swapTarget = null;
      }
    } else if (this.state === 'matching') {
      // Небольшая задержка перед падением (не ждём все эффекты)
      this.matchingDelay = (this.matchingDelay || 0) + 1;
      if (this.matchingDelay >= 8) { // ~8 кадров задержки
        this.matchingDelay = 0;
        this.state = 'falling';
      }
    } else if (this.state === 'falling') {
      this.applyGravity();
      
      // Проверяем, все ли на месте
      let allSettled = true;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const gem = this.grid[r][c];
          if (gem) {
            const dx = Math.abs(gem.x - gem.targetX);
            const dy = Math.abs(gem.y - gem.targetY);
            if (dx > 2 || dy > 2) allSettled = false;
          }
        }
      }
      
      if (allSettled) {
        const result = this.findMatches();
        if (result.matches.length > 0) {
          this.removeMatches(result.matches, result.specialsToCreate);
          this.state = 'matching';
        } else {
          this.combo = 0;
          if (this.moves <= 0) {
            this.state = 'gameover';
            SoundEffects.playGameOver();
          } else if (!this.hasValidMoves()) {
            // Перемешать поле
            this.shuffleGrid();
          } else {
            this.state = 'idle';
          }
        }
      }
    }
  }

  shuffleGrid() {
    // Простое перемешивание
    const gems = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) gems.push(this.grid[r][c]);
      }
    }
    
    // Fisher-Yates shuffle
    for (let i = gems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gems[i], gems[j]] = [gems[j], gems[i]];
    }
    
    let idx = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = gems[idx];
        this.grid[r][c].row = r;
        this.grid[r][c].col = c;
        idx++;
      }
    }
  }

  draw(ctx) {
    const padding = 8;
    const gridWidth = this.cellSize * this.cols;
    const gridHeight = this.cellSize * this.rows;
    
    // Внешняя тень
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    
    // Фон сетки с градиентом
    const bgGrad = ctx.createLinearGradient(
      this.gridX, this.gridY, 
      this.gridX, this.gridY + gridHeight
    );
    bgGrad.addColorStop(0, 'rgba(30, 20, 60, 0.9)');
    bgGrad.addColorStop(0.5, 'rgba(20, 15, 50, 0.95)');
    bgGrad.addColorStop(1, 'rgba(15, 10, 40, 0.9)');
    ctx.fillStyle = bgGrad;
    
    ctx.beginPath();
    ctx.roundRect(
      this.gridX - padding, 
      this.gridY - padding, 
      gridWidth + padding * 2, 
      gridHeight + padding * 2,
      16
    );
    ctx.fill();
    
    // Сброс теней
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Внешняя рамка (свечение)
    const borderGrad = ctx.createLinearGradient(
      this.gridX, this.gridY,
      this.gridX + gridWidth, this.gridY + gridHeight
    );
    borderGrad.addColorStop(0, 'rgba(100, 150, 255, 0.6)');
    borderGrad.addColorStop(0.5, 'rgba(150, 100, 255, 0.6)');
    borderGrad.addColorStop(1, 'rgba(255, 150, 200, 0.6)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(
      this.gridX - padding, 
      this.gridY - padding, 
      gridWidth + padding * 2, 
      gridHeight + padding * 2,
      16
    );
    ctx.stroke();
    
    // Ячейки с улучшенным стилем
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = this.gridX + c * this.cellSize;
        const y = this.gridY + r * this.cellSize;
        const isLight = (r + c) % 2 === 0;
        
        // Градиент для ячейки
        const cellGrad = ctx.createLinearGradient(x, y, x, y + this.cellSize);
        if (isLight) {
          cellGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
          cellGrad.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
        } else {
          cellGrad.addColorStop(0, 'rgba(0, 0, 0, 0.05)');
          cellGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
        }
        ctx.fillStyle = cellGrad;
        ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
        
        // Выделение выбранной ячейки
        if (this.selected && this.selected.row === r && this.selected.col === c) {
          // Пульсирующая рамка
          const pulse = 0.7 + Math.sin(performance.now() / 150) * 0.3;
          ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
          
          // Внутреннее свечение
          const glowGrad = ctx.createRadialGradient(
            x + this.cellSize/2, y + this.cellSize/2, 0,
            x + this.cellSize/2, y + this.cellSize/2, this.cellSize/2
          );
          glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.fillRect(x, y, this.cellSize, this.cellSize);
        }
      }
    }
    
    // Кристаллы (кроме перетаскиваемого)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const gem = this.grid[r][c];
        if (gem && (!this.dragging || gem !== this.dragging.gem)) {
          gem.draw(ctx, this.cellSize);
        }
      }
    }
    
    // Перетаскиваемый кристалл рисуем поверх всех
    if (this.dragging && this.dragging.gem) {
      ctx.save();
      // Небольшая тень под перетаскиваемым
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      this.dragging.gem.draw(ctx, this.cellSize);
      ctx.restore();
    }
    
    // Эффекты
    for (const effect of this.effects) {
      effect.draw(ctx);
    }
    
    // UI
    this.drawUI(ctx);
  }

  drawUI(ctx) {
    // Очки слева (стандартная позиция)
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${this.score}`, 12, 18);
    
    // Ходы под очками
    const movesColor = this.moves <= 5 ? '#FF6666' : '#888';
    ctx.fillStyle = movesColor;
    ctx.font = '16px Arial';
    ctx.fillText(`${i18n.t('game.moves')}: ${this.moves}`, 12, 48);
    
    // Комбо текст (анимированный) - по центру
    if (this.comboText) {
      ctx.save();
      ctx.globalAlpha = this.comboText.life;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.comboText.text, this.W / 2, this.comboText.y);
      ctx.restore();
    }
    
    // Game Over
    if (this.state === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, this.W, this.H);
      
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ИГРА ОКОНЧЕНА', this.W / 2, this.H / 2 - 40);
      
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`Очки: ${this.score}`, this.W / 2, this.H / 2 + 20);
    }
  }

  reset() {
    this.score = 0;
    this.moves = 30;
    this.combo = 0;
    this.state = 'idle'; // Важно: сбрасываем состояние в idle!
    this.selected = null;
    this.swapTarget = null;
    this.swapProgress = 0;
    this.effects = [];
    this.comboText = null;
    this.matchingDelay = 0;
    
    // Сбрасываем drag состояние
    this.dragging = null;
    this.dragOffset = { x: 0, y: 0 };
    this.hoveredGem = null;
    
    // Пересоздаём сетку
    this.initGrid();
  }
}
