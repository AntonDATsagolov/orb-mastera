// SpecialBlocks.js — логика для спец-блоков (раздвоение, лазер и т.д.)

export class SpecialBlockHandler {
  constructor() {
    this.activeLasers = []; // активные лазеры на экране
    this.activeRandomais = []; // активные рандомайи
  }

  // обработка спец-блока при попадании
  handleSpecialBlockHit(block, ball, ballManager, blockManager) {
    if (block.type === 'normal') return null;

    let result = { 
      newBalls: [],
      effectsToAdd: [],
      blocksToHit: [] 
    };

    switch (block.type) {
      case 'double':
        // раздвоение: шарик разбивается на 2 в разные стороны
        result.newBalls = this.createDoubleBalls(ball);
        break;

      case 'laser-v':
        // вертикальный лазер
        result.effectsToAdd.push({
          type: 'laser-v',
          x: block.x,
          intensity: 1 // по скольким шарикам попал
        });
        result.blocksToHit = this.getLaserHitBlocks(block, 'vertical', blockManager);
        break;

      case 'laser-h':
        // горизонтальный лазер
        result.effectsToAdd.push({
          type: 'laser-h',
          y: block.y,
          intensity: 1
        });
        result.blocksToHit = this.getLaserHitBlocks(block, 'horizontal', blockManager);
        break;

      case 'laser-cross':
        // крестообразный лазер
        result.effectsToAdd.push({
          type: 'laser-cross',
          x: block.x,
          y: block.y,
          intensity: 1
        });
        result.blocksToHit = this.getLaserHitBlocks(block, 'cross', blockManager);
        break;

      case 'randomai':
        // рандомай: шарики летят в разные стороны
        result.newBalls = this.createRandomaiBalls(ball);
        break;

      case 'triangle':
        // треугольный блок: меняет угол траектории
        result.newBalls = [this.createDeflectedBall(ball, block)];
        break;

      case 'ballpickup':
        // подбор шариков: добавляет шарики к количеству выстреленных
        // это обработается в главном игровом файле
        result.pickupCount = 1;
        break;
    }

    return result;
  }

  // раздвоение шарика на 2
  createDoubleBalls(originalBall) {
    const angle = Math.atan2(originalBall.vy, originalBall.vx);
    const speed = Math.sqrt(originalBall.vx ** 2 + originalBall.vy ** 2);

    const spreadAngle = Math.PI / 4; // 45 градусов разворота

    const ball1 = originalBall.clone();
    ball1.vx = Math.cos(angle - spreadAngle) * speed * 0.9;
    ball1.vy = Math.sin(angle - spreadAngle) * speed * 0.9;

    const ball2 = originalBall.clone();
    ball2.vx = Math.cos(angle + spreadAngle) * speed * 0.9;
    ball2.vy = Math.sin(angle + spreadAngle) * speed * 0.9;

    return [ball1, ball2];
  }

  // рандомай: шарики в разные стороны
  createRandomaiBalls(originalBall) {
    const numBalls = 4;
    const balls = [];

    for (let i = 0; i < numBalls; i++) {
      const angle = (Math.PI * 2 * i) / numBalls + Math.random() * 0.3;
      const speed = 5 + Math.random() * 2;

      const ball = originalBall.clone();
      ball.vx = Math.cos(angle) * speed;
      ball.vy = Math.sin(angle) * speed;
      balls.push(ball);
    }

    return balls;
  }

  // треугольный блок: отклонение траектории
  createDeflectedBall(originalBall, triangleBlock) {
    const ball = originalBall.clone();

    // определяем сторону блока для отклонения
    const dx = ball.x - triangleBlock.x;
    const dy = ball.y - triangleBlock.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      // отклонение горизонтально
      ball.vx *= -1.2;
    } else {
      // отклонение вертикально
      ball.vy *= -1.2;
    }

    return ball;
  }

  // получить блоки в зоне действия лазера
  getLaserHitBlocks(laserBlock, direction, blockManager) {
    const hitBlocks = [];
    const tolerance = 30; // допуск для определения блоков в зоне

    for (const block of blockManager.blocks) {
      if (!block.active) continue;

      if (direction === 'vertical') {
        // лазер идёт вверх-вниз
        if (Math.abs(block.x - laserBlock.x) < tolerance) {
          hitBlocks.push(block);
        }
      } else if (direction === 'horizontal') {
        // лазер идёт влево-вправо
        if (Math.abs(block.y - laserBlock.y) < tolerance) {
          hitBlocks.push(block);
        }
      } else if (direction === 'cross') {
        // крест: обе оси
        if (Math.abs(block.x - laserBlock.x) < tolerance || Math.abs(block.y - laserBlock.y) < tolerance) {
          hitBlocks.push(block);
        }
      }
    }

    return hitBlocks;
  }

  // рисование лазеров
  drawLasers(ctx, canvasWidth, canvasHeight) {
    for (const laser of this.activeLasers) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;

      if (laser.type === 'laser-v') {
        // вертикальный
        ctx.beginPath();
        ctx.moveTo(laser.x, 0);
        ctx.lineTo(laser.x, canvasHeight);
        ctx.stroke();
      } else if (laser.type === 'laser-h') {
        // горизонтальный
        ctx.beginPath();
        ctx.moveTo(0, laser.y);
        ctx.lineTo(canvasWidth, laser.y);
        ctx.stroke();
      } else if (laser.type === 'laser-cross') {
        // крест
        ctx.beginPath();
        ctx.moveTo(laser.x, 0);
        ctx.lineTo(laser.x, canvasHeight);
        ctx.moveTo(0, laser.y);
        ctx.lineTo(canvasWidth, laser.y);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // обновить лазеры (удалить старые)
  updateLasers() {
    // лазеры исчезают после спуска блоков
    this.activeLasers = [];
  }

  clear() {
    this.activeLasers = [];
    this.activeRandomais = [];
  }
}
