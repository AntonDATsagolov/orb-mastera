// Renderer.js - Система отрисовки UI

import i18n from '../../i18n/LanguageManager.js';

/**
 * Рендерер для Bricks Breaker - фон, HUD, прицел, кнопки
 */
export class Renderer {
  constructor(canvasWidth, canvasHeight) {
    this.W = canvasWidth;
    this.H = canvasHeight;
    this.downBtnRect = { x: canvasWidth - 70, y: canvasHeight - 45, width: 60, height: 35 };
  }

  /**
   * Обновление размеров
   */
  setCanvasSize(w, h) {
    this.W = w;
    this.H = h;
    this.downBtnRect = { x: w - 70, y: h - 45, width: 60, height: 35 };
  }

  /**
   * Отрисовка градиентного фона (оптимизировано для мобильных)
   */
  drawBackground(ctx) {
    // Простой цвет вместо градиента для производительности
    ctx.fillStyle = '#151530';
    ctx.fillRect(0, 0, this.W, this.H);
  }

  /**
   * Отрисовка границы игровой области (упрощено)
   */
  drawBorder(ctx) {
    // Убрали тени для производительности
    ctx.strokeStyle = '#4A5A8A';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, this.W - 4, this.H - 4);
  }

  /**
   * Отрисовка линии Game Over
   */
  drawGameOverLine(ctx, lineY) {
    ctx.strokeStyle = 'rgba(255, 68, 68, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(this.W, lineY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Отрисовка позиции запуска (такой же шарик как летящие)
   */
  drawLaunchPosition(ctx, x, y, ballCount) {
    // Такой же шарик как летящие (из Ball.js)
    ctx.fillStyle = '#E0E0FF';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Счётчик шаров
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('x' + ballCount, x + 25, y);
  }

  /**
   * Отрисовка линии прицеливания с отражениями (оптимизировано для мобильных)
   */
  drawAimLine(ctx, startX, startY, angle) {
    const totalLength = 600;
    const maxBounces = 3;
    const ballRadius = 8;
    const maxIterations = 50; // Защита от бесконечного цикла
    
    const leftWall = ballRadius;
    const rightWall = this.W - ballRadius;
    
    let x = startX;
    let y = startY;
    let vx = Math.cos(angle);
    let vy = Math.sin(angle);
    let remainingLength = totalLength;
    let bounces = 0;
    let iterations = 0;
    
    // Собираем точки траектории
    const points = [{ x, y }];
    
    while (remainingLength > 0 && bounces <= maxBounces && iterations < maxIterations) {
      iterations++;
      
      let tLeft = vx < 0 ? (leftWall - x) / vx : Infinity;
      let tRight = vx > 0 ? (rightWall - x) / vx : Infinity;
      let tTop = vy < 0 ? (ballRadius - y) / vy : Infinity;
      
      let tMin = Math.min(tLeft, tRight, tTop);
      
      // Если tMin невалидный, просто рисуем прямую линию
      if (!isFinite(tMin) || tMin <= 0.1) {
        const endX = x + vx * remainingLength;
        const endY = y + vy * remainingLength;
        points.push({ x: endX, y: endY });
        break;
      }
      
      let newX = x + vx * tMin;
      let newY = y + vy * tMin;
      
      const dist = Math.sqrt((newX - x) ** 2 + (newY - y) ** 2);
      
      // Защита от слишком маленьких шагов
      if (dist < 1) {
        const endX = x + vx * remainingLength;
        const endY = y + vy * remainingLength;
        points.push({ x: endX, y: endY });
        break;
      }
      
      if (dist >= remainingLength) {
        newX = x + vx * remainingLength;
        newY = y + vy * remainingLength;
        points.push({ x: newX, y: newY });
        break;
      }
      
      remainingLength -= dist;
      x = newX;
      y = newY;
      points.push({ x, y });
      
      if (Math.abs(tMin - tLeft) < 1 || Math.abs(tMin - tRight) < 1) {
        vx = -vx;
        bounces++;
      } else if (Math.abs(tMin - tTop) < 1) {
        vy = -vy;
        bounces++;
      }
      
      if (bounces > maxBounces) break;
    }
    
    // Рисуем траекторию одной линией (быстрее)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Отрисовка кнопки ВНИЗ (оптимизировано)
   */
  drawDownButton(ctx, pressed) {
    const btn = this.downBtnRect;
    
    // Простой цвет без градиента
    ctx.fillStyle = pressed ? '#FF5555' : '#5A5A6A';
    
    // Скруглённая кнопка
    const br = 6;
    ctx.beginPath();
    ctx.moveTo(btn.x + br, btn.y);
    ctx.lineTo(btn.x + btn.width - br, btn.y);
    ctx.quadraticCurveTo(btn.x + btn.width, btn.y, btn.x + btn.width, btn.y + br);
    ctx.lineTo(btn.x + btn.width, btn.y + btn.height - br);
    ctx.quadraticCurveTo(btn.x + btn.width, btn.y + btn.height, btn.x + btn.width - br, btn.y + btn.height);
    ctx.lineTo(btn.x + br, btn.y + btn.height);
    ctx.quadraticCurveTo(btn.x, btn.y + btn.height, btn.x, btn.y + btn.height - br);
    ctx.lineTo(btn.x, btn.y + br);
    ctx.quadraticCurveTo(btn.x, btn.y, btn.x + br, btn.y);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↓ ВНИЗ', btn.x + btn.width / 2, btn.y + btn.height / 2);
  }

  /**
   * Отрисовка HUD (номер хода) - по центру сверху
   */
  drawHUD(ctx, turnNumber) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${i18n.t('game.turn')}: ${turnNumber}`, this.W / 2, 12);
  }

  /**
   * Отрисовка подсказки
   */
  drawHint(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(i18n.t('hints.dragToShoot'), this.W / 2, this.H - 12);
  }

  /**
   * Проверка клика по кнопке ВНИЗ
   */
  isDownButtonClicked(x, y) {
    const btn = this.downBtnRect;
    return x >= btn.x && x <= btn.x + btn.width &&
           y >= btn.y && y <= btn.y + btn.height;
  }
}
