// SpecialElements.js - Специальные элементы игры

import { getNextBlockId } from './Block.js';

/**
 * Бомба - взрывает 8 соседних блоков
 */
export class Bomb {
  constructor(x, y, w = 40, h = 40, hp = 1) {
    this.id = getNextBlockId();
    this.type = 'bomb';
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.hp = hp;
    this.active = true;
  }

  takeDamage(dmg = 1) {
    if (!this.active) return { destroyed: false, explode: false };
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.active = false;
      return { destroyed: true, explode: true, explosionType: 'area' };
    }
    return { destroyed: false, explode: false };
  }

  move(dy) { this.y += dy; }

  draw(ctx) {
    if (!this.active) return;
    
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const r = 5;
    
    // Тёмно-красный блок с градиентом
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
    grad.addColorStop(0, '#E55');
    grad.addColorStop(1, '#922');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.w, this.h, r);
    ctx.fill();
    
    // Тонкая светлая рамка
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Бомба - чёрный шар с металлическим бликом
    const bombGrad = ctx.createRadialGradient(cx - 3, cy - 2, 0, cx, cy + 2, 11);
    bombGrad.addColorStop(0, '#555');
    bombGrad.addColorStop(0.4, '#333');
    bombGrad.addColorStop(1, '#111');
    ctx.fillStyle = bombGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 11, 0, Math.PI * 2);
    ctx.fill();
    
    // Фитиль (изогнутая линия)
    ctx.strokeStyle = '#A85';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy - 7);
    ctx.bezierCurveTo(cx + 8, cy - 10, cx + 10, cy - 13, cx + 5, cy - 15);
    ctx.stroke();
    
    // Огонёк на фитиле (маленькое пламя)
    ctx.fillStyle = '#F80';
    ctx.beginPath();
    ctx.ellipse(cx + 5, cy - 16, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF0';
    ctx.beginPath();
    ctx.ellipse(cx + 5, cy - 15, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // HP
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(this.hp.toString(), this.x + this.w - 4, this.y + 3);
  }
}

/**
 * Направленная бомба (H - горизонталь, V - вертикаль, X - крест)
 * Стиль: ракета/снаряд
 */
export class DirectionalBomb {
  constructor(x, y, w = 40, h = 40, hp = 1, direction = 'H') {
    this.id = getNextBlockId();
    this.type = 'directionalBomb';
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.hp = hp;
    this.direction = direction;
    this.active = true;
  }

  takeDamage(dmg = 1) {
    if (!this.active) return { destroyed: false, explode: false };
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.active = false;
      return { destroyed: true, explode: true, explosionType: 'directional', direction: this.direction };
    }
    return { destroyed: false, explode: false };
  }

  move(dy) { this.y += dy; }

  draw(ctx) {
    if (!this.active) return;
    
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const r = 5;
    
    // Оранжево-жёлтый блок
    const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y + this.h);
    grad.addColorStop(0, '#F90');
    grad.addColorStop(0.5, '#FC0');
    grad.addColorStop(1, '#F70');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.w, this.h, r);
    ctx.fill();
    
    // Рамка
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Рисуем понятные стрелки направления
    ctx.strokeStyle = '#FFF';
    ctx.fillStyle = '#FFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const arrowLen = 12;
    const headSize = 5;
    
    // Функция рисования стрелки
    const drawArrow = (fromX, fromY, toX, toY) => {
      const angle = Math.atan2(toY - fromY, toX - fromX);
      
      // Линия
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      
      // Наконечник (треугольник)
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headSize * Math.cos(angle - 0.5), toY - headSize * Math.sin(angle - 0.5));
      ctx.lineTo(toX - headSize * Math.cos(angle + 0.5), toY - headSize * Math.sin(angle + 0.5));
      ctx.closePath();
      ctx.fill();
    };
    
    if (this.direction === 'H') {
      // Горизонтальные стрелки ← →
      drawArrow(cx + 3, cy, cx + arrowLen, cy);  // →
      drawArrow(cx - 3, cy, cx - arrowLen, cy);  // ←
    } else if (this.direction === 'V') {
      // Вертикальные стрелки ↑ ↓
      drawArrow(cx, cy - 3, cx, cy - arrowLen);  // ↑
      drawArrow(cx, cy + 3, cx, cy + arrowLen);  // ↓
    } else if (this.direction === 'X') {
      // Крест: все 4 направления
      drawArrow(cx + 2, cy, cx + arrowLen - 2, cy);   // →
      drawArrow(cx - 2, cy, cx - arrowLen + 2, cy);   // ←
      drawArrow(cx, cy - 2, cx, cy - arrowLen + 2);   // ↑
      drawArrow(cx, cy + 2, cx, cy + arrowLen - 2);   // ↓
    }
    
    // HP в углу
    ctx.fillStyle = '#333';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(this.hp.toString(), this.x + this.w - 4, this.y + 3);
  }
}

/**
 * Лазер - наносит урон блокам в линии при активации
 * Стиль: энергетический кристалл
 */
export class Laser {
  constructor(x, y, w = 40, h = 40, direction = 'H', canvasWidth = 400, canvasHeight = 600) {
    this.id = getNextBlockId();
    this.type = 'laser';
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.direction = direction;
    this.active = true;
    this.triggered = false;  // Для удаления в конце раунда
    this.hitCount = 0;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.flashTime = 0;  // Время вспышки при попадании
  }

  move(dy) { this.y += dy; }

  checkCollision(ballX, ballY, ballR) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const dx = ballX - cx;
    const dy = ballY - cy;
    return Math.sqrt(dx * dx + dy * dy) < 15 + ballR;
  }

  // Вызывается при попадании для эффекта вспышки
  flash() {
    this.flashTime = performance.now();
  }

  draw(ctx) {
    if (!this.active) return;
    
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    
    // Вспышка длится 150мс
    const isFlashing = performance.now() - this.flashTime < 150;
    
    // Цвета - голубой в норме, белый при вспышке
    const baseColor = isFlashing ? '#FFF' : '#0EE';
    const darkColor = isFlashing ? '#AEE' : '#088';
    const glowColor = isFlashing ? '#FFF' : '#5FF';
    
    // Фоновый круг (свечение)
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
    glowGrad.addColorStop(0, glowColor);
    glowGrad.addColorStop(0.5, baseColor);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Центральный кристалл (гексагон)
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const px = cx + Math.cos(angle) * 12;
      const py = cy + Math.sin(angle) * 12;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    
    // Внутренний гексагон (темнее)
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const px = cx + Math.cos(angle) * 7;
      const py = cy + Math.sin(angle) * 7;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    
    // Молния в центре
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 1, cy - 6);
    ctx.lineTo(cx + 2, cy - 1);
    ctx.lineTo(cx - 2, cy + 1);
    ctx.lineTo(cx + 1, cy + 6);
    ctx.stroke();
    
    // Направление - маленькие точки по краям
    ctx.fillStyle = '#FFF';
    if (this.direction === 'H' || this.direction === 'X') {
      ctx.beginPath();
      ctx.arc(cx - 16, cy, 2, 0, Math.PI * 2);
      ctx.arc(cx + 16, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.direction === 'V' || this.direction === 'X') {
      ctx.beginPath();
      ctx.arc(cx, cy - 16, 2, 0, Math.PI * 2);
      ctx.arc(cx, cy + 16, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Рандомайзер - меняет траекторию шара
 * Стиль: магический вихрь
 */
export class Randomizer {
  constructor(x, y, w = 40, h = 40) {
    this.id = getNextBlockId();
    this.type = 'randomizer';
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.active = true;
    this.triggered = false;
  }

  move(dy) { this.y += dy; }

  checkCollision(ballX, ballY, ballR) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const dx = ballX - cx;
    const dy = ballY - cy;
    return Math.sqrt(dx * dx + dy * dy) < 15 + ballR;
  }

  draw(ctx) {
    if (!this.active) return;
    
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    
    // Цвета
    const color1 = this.triggered ? '#E55' : '#A5F';
    const color2 = this.triggered ? '#C33' : '#73D';
    
    // Внешний круг со спиральным градиентом
    const grad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, 16);
    grad.addColorStop(0, color1);
    grad.addColorStop(0.7, color2);
    grad.addColorStop(1, '#426');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Спиральные линии (3 дуги)
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const startAngle = (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, startAngle, startAngle + Math.PI * 0.6);
      ctx.stroke();
    }
    
    // Центральный глаз
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Зрачок
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Бонусный шар (+1 к количеству шаров)
 * Стиль: сияющая монета
 */
export class BonusBall {
  constructor(x, y) {
    this.id = getNextBlockId();
    this.type = 'bonus';
    this.x = x;
    this.y = y;
    this.r = 11;
    this.active = true;
  }

  move(dy) { this.y += dy; }

  checkCollision(ballX, ballY, ballR) {
    const dx = ballX - this.x;
    const dy = ballY - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.r + ballR;
  }

  draw(ctx) {
    if (!this.active) return;
    
    // Свечение вокруг
    const glowGrad = ctx.createRadialGradient(this.x, this.y, this.r * 0.5, this.x, this.y, this.r * 1.5);
    glowGrad.addColorStop(0, 'rgba(100, 255, 100, 0.5)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Основной шар с градиентом
    const gradient = ctx.createRadialGradient(
      this.x - 3, this.y - 3, 0,
      this.x, this.y, this.r
    );
    gradient.addColorStop(0, '#AFA');
    gradient.addColorStop(0.5, '#5E5');
    gradient.addColorStop(1, '#292');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    
    // Светлая обводка
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Плюс
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x - 5, this.y);
    ctx.lineTo(this.x + 5, this.y);
    ctx.moveTo(this.x, this.y - 5);
    ctx.lineTo(this.x, this.y + 5);
    ctx.stroke();
  }
}
