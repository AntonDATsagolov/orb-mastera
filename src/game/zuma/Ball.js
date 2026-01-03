// Ball.js — управление отдельным шариком
export class Ball {
  constructor(x, y, vx, vy, radius = 6, color = '#FF6B6B') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = radius;
    this.color = color;
    this.active = true; // шарик ещё летает
    this.isSpecial = false; // спецефект (раздвоение, лазер и т.д.)
    this.specialType = null; // тип спецэффекта
  }

  update(gravity = 0.12) {
    if (!this.active) return;
    
    // гравитация
    this.vy += gravity;
    
    // движение
    this.x += this.vx;
    this.y += this.vy;
  }

  // проверка выхода за границы (упал вниз)
  isOutOfBounds(height) {
    return this.y > height + this.r;
  }

  // рисование
  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    
    // если спецефект, добавляем визуальный индикатор
    if (this.isSpecial) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  // клонирование шарика
  clone() {
    const cloned = new Ball(this.x, this.y, this.vx, this.vy, this.r, this.color);
    cloned.isSpecial = this.isSpecial;
    cloned.specialType = this.specialType;
    return cloned;
  }
}

// BallManager.js — управление всеми шариками одновременно
export class BallManager {
  constructor() {
    this.balls = [];
    this.gravity = 0.12;
    this.maxBalls = 100; // лимит одновременных шариков
  }

  addBall(x, y, vx, vy, radius = 6, color = '#FF6B6B') {
    if (this.balls.length < this.maxBalls) {
      this.balls.push(new Ball(x, y, vx, vy, radius, color));
    }
  }

  // добавить несколько шариков (например при раздвоении)
  addMultiple(balls) {
    for (const ball of balls) {
      if (this.balls.length < this.maxBalls) {
        this.balls.push(ball);
      }
    }
  }

  update(gravity = null) {
    if (gravity !== null) this.gravity = gravity;
    
    for (let i = this.balls.length - 1; i >= 0; i--) {
      this.balls[i].update(this.gravity);
    }
  }

  // удалить неактивные шарики
  removeBall(index) {
    this.balls.splice(index, 1);
  }

  // получить активные шарики
  getActiveBalls() {
    return this.balls.filter(b => b.active);
  }

  // найти шарики, которые упали вниз
  getLandedBalls() {
    return this.balls.filter(b => b.active && b.y > 0).slice(-1); // последний упавший
  }

  draw(ctx) {
    for (const ball of this.balls) {
      ball.draw(ctx);
    }
  }

  clear() {
    this.balls = [];
  }
}
