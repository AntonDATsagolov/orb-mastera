// Physics.js - Физика коллизий

/**
 * Система физики для Bricks Breaker
 */
export class Physics {
  constructor(w, h) {
    this.W = w;
    this.H = h;
  }

  /**
   * Проверка столкновения со стенами
   */
  checkWallCollision(ball) {
    // Левая стена
    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
    }
    // Правая стена
    if (ball.x + ball.r > this.W) {
      ball.x = this.W - ball.r;
      ball.vx = -Math.abs(ball.vx);
    }
    // Верхняя стена
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
    }
  }

  /**
   * Проверка столкновения с блоком (AABB)
   * Возвращает true если было столкновение
   */
  checkBlockCollision(ball, block) {
    if (!block.active) return false;
    
    // Проверка пересечения
    if (ball.x + ball.r > block.x &&
        ball.x - ball.r < block.x + block.w &&
        ball.y + ball.r > block.y &&
        ball.y - ball.r < block.y + block.h) {
      
      // Вычисляем перекрытие с каждой стороны
      const overlapLeft = (ball.x + ball.r) - block.x;
      const overlapRight = (block.x + block.w) - (ball.x - ball.r);
      const overlapTop = (ball.y + ball.r) - block.y;
      const overlapBottom = (block.y + block.h) - (ball.y - ball.r);
      
      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);
      
      // Отталкивание в направлении минимального перекрытия
      if (minOverlapX < minOverlapY) {
        ball.vx = -ball.vx;
        ball.x += ball.vx > 0 ? minOverlapX : -minOverlapX;
      } else {
        ball.vy = -ball.vy;
        ball.y += ball.vy > 0 ? minOverlapY : -minOverlapY;
      }
      return true;
    }
    return false;
  }

  /**
   * Обновление размеров канваса
   */
  setCanvasSize(w, h) {
    this.W = w;
    this.H = h;
  }
}
