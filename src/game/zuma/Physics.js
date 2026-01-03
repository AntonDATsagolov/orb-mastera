// Physics.js — система столкновений и отскоков
export class Physics {
  constructor(canvasWidth, canvasHeight, ballRadius = 6) {
    this.W = canvasWidth;
    this.H = canvasHeight;
    this.ballRadius = ballRadius;
    this.elasticity = 0.95; // коэффициент отскока (потеря энергии)
    this.friction = 0.99; // трение при скольжении
  }

  // столкновение со стенами
  checkWallCollision(ball) {
    let collided = false;

    // левая стена
    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx *= -this.elasticity;
      collided = true;
    }

    // правая стена
    if (ball.x + ball.r > this.W) {
      ball.x = this.W - ball.r;
      ball.vx *= -this.elasticity;
      collided = true;
    }

    // верхняя стена
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy *= -this.elasticity;
      collided = true;
    }

    // нижняя граница (шарик упал)
    if (ball.y > this.H) {
      ball.active = false;
      return { landed: true };
    }

    return { collided, landPos: null };
  }

  // столкновение блока и шарика
  checkBlockCollision(ball, block) {
    if (!block.active) return null;

    // определяем точку контакта
    const closestX = Math.max(block.x - block.w / 2, Math.min(ball.x, block.x + block.w / 2));
    const closestY = Math.max(block.y - block.h / 2, Math.min(ball.y, block.y + block.h / 2));

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ball.r) {
      // есть столкновение!
      
      // определяем нормаль вектор для отскока
      const nx = dx / distance;
      const ny = dy / distance;

      // отскок
      ball.vx = nx * Math.abs(ball.vx) * this.elasticity;
      ball.vy = ny * Math.abs(ball.vy) * this.elasticity;

      // толкаем шарик из блока
      const overlap = ball.r - distance;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      return {
        collided: true,
        block: block,
        normalX: nx,
        normalY: ny,
        hitPos: { x: closestX, y: closestY }
      };
    }

    return null;
  }

  // столкновение между двумя шариками (упругий удар)
  checkBallCollision(ball1, ball2) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = ball1.r + ball2.r;

    if (distance < minDistance) {
      // нормализуем вектор направления
      const nx = dx / distance;
      const ny = dy / distance;

      // отскок (упругое столкновение)
      const dv = (ball1.vx - ball2.vx) * nx + (ball1.vy - ball2.vy) * ny;

      if (dv > 0) return; // шарики уже разлетаются

      ball1.vx -= dv * nx * 0.5;
      ball1.vy -= dv * ny * 0.5;
      ball2.vx += dv * nx * 0.5;
      ball2.vy += dv * ny * 0.5;

      // раздвигаем шарики чтобы они не прилипли
      const overlap = (minDistance - distance) / 2;
      ball1.x -= overlap * nx;
      ball1.y -= overlap * ny;
      ball2.x += overlap * nx;
      ball2.y += overlap * ny;
    }
  }

  // получить позицию приземления (если шарик упадёт прямо вниз)
  getLandingPosition(startX, startY, vx, vy) {
    // простое предсказание падения
    let x = startX;
    let y = startY;
    let velX = vx;
    let velY = vy;

    // симуляция до падения
    for (let i = 0; i < 1000; i++) {
      velY += 0.12;
      x += velX;
      y += velY;

      // столкновение со стеной
      if (x - this.ballRadius < 0) {
        x = this.ballRadius;
        velX *= -this.elasticity;
      } else if (x + this.ballRadius > this.W) {
        x = this.W - this.ballRadius;
        velX *= -this.elasticity;
      }

      // проверка падения
      if (y > this.H) {
        return { x: x, y: this.H - 10 };
      }
    }

    return { x: x, y: this.H - 10 };
  }

  // обновление размеров канваса
  setCanvasSize(w, h) {
    this.W = w;
    this.H = h;
  }
}
