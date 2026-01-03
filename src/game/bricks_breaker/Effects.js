// Effects.js - Визуальные эффекты (взрывы, лазеры)

/**
 * Эффект взрыва бомбы
 */
export class ExplosionEffect {
  constructor(x, y, type = 'area', direction = null) {
    this.x = x;
    this.y = y;
    this.type = type; // 'area' или 'directional'
    this.direction = direction; // 'H', 'V', 'X' для directional
    this.progress = 0;
    this.duration = 400; // мс
    this.startTime = Date.now();
    this.active = true;
    
    // Частицы для взрыва
    this.particles = [];
    this.initParticles();
  }

  initParticles() {
    const count = this.type === 'area' ? 16 : 20;
    
    for (let i = 0; i < count; i++) {
      let angle, speed;
      
      if (this.type === 'area') {
        // Круговой взрыв
        angle = (i / count) * Math.PI * 2;
        speed = 80 + Math.random() * 60;
      } else {
        // Направленный взрыв
        if (this.direction === 'H') {
          angle = i < count / 2 ? 0 : Math.PI;
          angle += (Math.random() - 0.5) * 0.3;
        } else if (this.direction === 'V') {
          angle = i < count / 2 ? -Math.PI / 2 : Math.PI / 2;
          angle += (Math.random() - 0.5) * 0.3;
        } else { // 'X'
          const dirs = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
          angle = dirs[i % 4] + (Math.random() - 0.5) * 0.3;
        }
        speed = 100 + Math.random() * 80;
      }
      
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: this.type === 'area' 
          ? `hsl(${30 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)` // Оранжевый
          : `hsl(${45 + Math.random() * 15}, 100%, ${50 + Math.random() * 30}%)`, // Жёлтый
        alpha: 1
      });
    }
  }

  update() {
    const elapsed = Date.now() - this.startTime;
    this.progress = Math.min(elapsed / this.duration, 1);
    
    if (this.progress >= 1) {
      this.active = false;
      return;
    }
    
    // Обновление частиц
    const dt = 0.016;
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha = 1 - this.progress;
      p.size *= 0.98;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    
    // Вспышка в центре
    const flashAlpha = Math.max(0, 1 - this.progress * 3);
    if (flashAlpha > 0) {
      const flashGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 60);
      flashGrad.addColorStop(0, `rgba(255, 255, 200, ${flashAlpha})`);
      flashGrad.addColorStop(0.3, `rgba(255, 150, 50, ${flashAlpha * 0.6})`);
      flashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 60, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Частицы
    for (const p of this.particles) {
      if (p.alpha <= 0 || p.size < 1) continue;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Кольцо взрывной волны
    if (this.type === 'area') {
      const ringRadius = this.progress * 80;
      const ringAlpha = Math.max(0, 0.6 - this.progress);
      ctx.strokeStyle = `rgba(255, 200, 100, ${ringAlpha})`;
      ctx.lineWidth = 4 * (1 - this.progress);
      ctx.beginPath();
      ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

/**
 * Эффект луча лазера (мягкая версия)
 */
export class LaserEffect {
  constructor(x, y, direction, canvasWidth, canvasHeight) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.progress = 0;
    this.duration = 250; // Чуть быстрее
    this.startTime = Date.now();
    this.active = true;
  }

  update() {
    const elapsed = Date.now() - this.startTime;
    this.progress = Math.min(elapsed / this.duration, 1);
    
    if (this.progress >= 1) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    
    // Плавное появление и исчезновение
    let alpha, width;
    if (this.progress < 0.2) {
      // Быстрое появление
      alpha = this.progress / 0.2 * 0.7;
      width = 2 + (this.progress / 0.2) * 4;
    } else if (this.progress < 0.5) {
      // Держим
      alpha = 0.7;
      width = 6;
    } else {
      // Плавное исчезновение
      alpha = 0.7 * (1 - (this.progress - 0.5) / 0.5);
      width = 6 * (1 - (this.progress - 0.5) / 0.5);
    }
    
    ctx.lineCap = 'round';
    
    if (this.direction === 'H' || this.direction === 'X') {
      this.drawBeam(ctx, 0, this.y, this.canvasWidth, this.y, width, alpha);
    }
    
    if (this.direction === 'V' || this.direction === 'X') {
      this.drawBeam(ctx, this.x, 0, this.x, this.canvasHeight, width, alpha);
    }
    
    // Мягкая вспышка в центре
    const flashAlpha = alpha * 0.5;
    const flashGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 18);
    flashGrad.addColorStop(0, `rgba(180, 255, 180, ${flashAlpha})`);
    flashGrad.addColorStop(0.6, `rgba(100, 220, 100, ${flashAlpha * 0.4})`);
    flashGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBeam(ctx, x1, y1, x2, y2, width, alpha) {
    // Мягкое внешнее свечение
    ctx.strokeStyle = `rgba(100, 220, 100, ${alpha * 0.2})`;
    ctx.lineWidth = width * 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Ядро луча
    ctx.strokeStyle = `rgba(150, 255, 150, ${alpha * 0.8})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

/**
 * Менеджер эффектов
 */
export class EffectsManager {
  constructor() {
    this.effects = [];
  }

  addExplosion(x, y, type, direction = null) {
    this.effects.push(new ExplosionEffect(x, y, type, direction));
  }

  addLaser(x, y, direction, canvasWidth, canvasHeight) {
    this.effects.push(new LaserEffect(x, y, direction, canvasWidth, canvasHeight));
  }

  update() {
    for (const effect of this.effects) {
      effect.update();
    }
    this.effects = this.effects.filter(e => e.active);
  }

  draw(ctx) {
    for (const effect of this.effects) {
      effect.draw(ctx);
    }
  }

  clear() {
    this.effects = [];
  }
}
