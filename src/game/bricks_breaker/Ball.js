// Ball.js - Система шаров для Bricks Breaker

/**
 * Отдельный шар с физикой и отрисовкой
 */
export class Ball {
  constructor(x, y, vx, vy, radius = 5, color = '#FFFFFF') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = radius;
    this.color = color;
    this.active = true;
    this.ignoreBlocks = false;
    this.hitLasers = new Set(); // какие лазеры уже задеты этим шаром
  }

  update() {
    if (!this.active) return;
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    if (!this.active) return;
    // Простой шар без градиента для производительности
    ctx.fillStyle = '#E0E0FF';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Менеджер шаров - управляет стрельбой потоком и обновлением
 */
export class BallManager {
  constructor() {
    this.balls = [];
    this.maxBalls = 300;
    this.ballSpeed = 6;
    this.isFiring = false;
    this.fireQueue = 0;
    this.fireDelay = 0;
    this.fireAngle = 0;
    this.fireX = 0;
    this.fireY = 0;
  }

  /**
   * Начать стрельбу потоком шаров
   */
  fireStream(startX, startY, angle, count) {
    this.fireQueue = count;
    this.fireAngle = angle;
    this.fireX = startX;
    this.fireY = startY;
    this.fireDelay = 0;
    this.isFiring = true;
  }

  /**
   * Обновление стрельбы - выпуск шаров с задержкой
   */
  updateFiring() {
    if (!this.isFiring || this.fireQueue <= 0) {
      this.isFiring = false;
      return;
    }
    this.fireDelay++;
    if (this.fireDelay >= 3) {
      this.fireDelay = 0;
      const vx = Math.cos(this.fireAngle) * this.ballSpeed;
      const vy = Math.sin(this.fireAngle) * this.ballSpeed;
      if (this.balls.length < this.maxBalls) {
        this.balls.push(new Ball(this.fireX, this.fireY, vx, vy, 5, '#FFFFFF'));
      }
      this.fireQueue--;
    }
  }

  update() {
    this.updateFiring();
    for (const ball of this.balls) {
      ball.update();
    }
  }

  getActiveBalls() {
    return this.balls.filter(b => b.active);
  }

  allLanded() {
    return this.balls.length > 0 && this.getActiveBalls().length === 0 && !this.isFiring;
  }

  draw(ctx) {
    for (const ball of this.balls) {
      ball.draw(ctx);
    }
  }

  clear() {
    this.balls = [];
    this.isFiring = false;
    this.fireQueue = 0;
  }

  /**
   * Сбросить все шары вниз (кнопка ВНИЗ)
   */
  dropAllDown(targetY, speed = 25) {
    this.isFiring = false;
    this.fireQueue = 0;
    for (const ball of this.balls) {
      if (ball.active) {
        ball.vx = 0;
        ball.vy = speed;
        ball.ignoreBlocks = true;
      }
    }
  }
}
