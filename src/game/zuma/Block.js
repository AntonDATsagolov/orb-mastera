// Block.js — отдельный блок с HP системой
export class Block {
  constructor(x, y, w = 50, h = 25, hp = 1, color = '#48d0b2') {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.hp = hp;
    this.maxHp = hp;
    this.color = color;
    this.active = true; // блок ещё на экране
    this.type = 'normal'; // normal, double, laser-v, laser-h, laser-cross, randomai, triangle, ballpickup
    this.hitBy = 0; // счётчик попаданий для эффектов
  }

  takeDamage(damage = 1) {
    if (!this.active) return false;
    this.hp -= damage;
    this.hitBy += damage;
    
    if (this.hp <= 0) {
      this.active = false;
      return true; // блок разбит
    }
    return false; // блок получил урон, но жив
  }

  move(dy) {
    this.y += dy;
  }

  // проверка границ (блок ушёл вниз экрана = проигрыш)
  isOutOfBounds(height) {
    return this.y > height;
  }

  // AABB collision
  checkCollision(x, y, r) {
    const closestX = Math.max(this.x - this.w / 2, Math.min(x, this.x + this.w / 2));
    const closestY = Math.max(this.y - this.h / 2, Math.min(y, this.y + this.h / 2));

    const dx = x - closestX;
    const dy = y - closestY;

    return (dx * dx + dy * dy) < (r * r);
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - this.w / 2,
      this.y - this.h / 2,
      this.w,
      this.h
    );

    // границы блока
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      this.x - this.w / 2,
      this.y - this.h / 2,
      this.w,
      this.h
    );

    // HP bar (если HP > 1)
    if (this.maxHp > 1) {
      const hpPercent = Math.max(0, this.hp / this.maxHp);
      const barWidth = this.w * 0.8;
      const barHeight = 3;
      const barX = this.x - barWidth / 2;
      const barY = this.y + this.h / 2 + 2;

      // фон полоски
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // полоска HP
      ctx.fillStyle = hpPercent > 0.5 ? '#00AA00' : hpPercent > 0.25 ? '#FFAA00' : '#AA0000';
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

      // текст HP
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.hp, this.x, this.y);
    }

    // спецэффект (цветная граница для спец-блоков)
    if (this.type !== 'normal') {
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.x - this.w / 2,
        this.y - this.h / 2,
        this.w,
        this.h
      );
    }

    ctx.restore();
  }
}

// BlockManager.js — управление всеми блоками
export class BlockManager {
  constructor(canvasWidth, canvasHeight) {
    this.blocks = [];
    this.W = canvasWidth;
    this.H = canvasHeight;
    this.rowHeight = 30; // высота одного ряда блоков
    this.blockWidth = 50;
    this.blockHeight = 25;
    this.blocksPerRow = Math.floor((canvasWidth - 20) / (this.blockWidth + 10));
  }

  // создать новый ряд блоков (с рандомными спец-блоками)
  generateRow(y, options = {}) {
    const row = [];
    const { 
      hpRange = [1, 3], 
      specialChance = 0.2, // 20% спец-блоков
      colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#9B59B6', '#E67E22', '#16A085', '#8E44AD']
    } = options;

    const rowTypes = ['normal', 'normal', 'normal', 'double', 'laser-v', 'laser-h', 'randomai', 'triangle', 'ballpickup'];

    for (let i = 0; i < this.blocksPerRow; i++) {
      const x = 30 + i * (this.blockWidth + 10);
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // тип блока
      let blockType = 'normal';
      if (Math.random() < specialChance) {
        blockType = rowTypes[Math.floor(Math.random() * rowTypes.length)];
      }

      // HP (обычные блоки 1-3, спец выше)
      let hp = Math.floor(Math.random() * (hpRange[1] - hpRange[0] + 1)) + hpRange[0];
      if (blockType !== 'normal') {
        hp = Math.max(1, hp + 1);
      }

      const block = new Block(x, y, this.blockWidth, this.blockHeight, hp, color);
      block.type = blockType;
      row.push(block);
    }

    return row;
  }

  // инициализация начального уровня
  initLevel() {
    this.blocks = [];
    // начальная высота = от верха экрана, заполняем несколько рядов
    const startY = 100;
    const numRows = 3;

    for (let i = 0; i < numRows; i++) {
      const row = this.generateRow(startY + i * this.rowHeight, {
        hpRange: [1, 2],
        specialChance: 0.15
      });
      this.blocks.push(...row);
    }
  }

  // спуск всех блоков на 1 ряд + создание нового ряда сверху
  descendRows() {
    // спуск всех блоков вниз на высоту ряда
    for (const block of this.blocks) {
      block.move(this.rowHeight);
    }

    // создание нового ряда сверху
    const newRow = this.generateRow(0, {
      hpRange: [1, 3],
      specialChance: 0.25 // больше спец-блоков по мере игры
    });
    this.blocks.push(...newRow);

    // удаление блоков, которые ушли за границы (только если они разбиты)
    this.blocks = this.blocks.filter(b => b.active || b.y < this.H + 50);
  }

  // проверить столкновение с блоком
  checkCollision(ballX, ballY, ballRadius) {
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].active && this.blocks[i].checkCollision(ballX, ballY, ballRadius)) {
        return this.blocks[i];
      }
    }
    return null;
  }

  // удалить неактивные блоки
  removeInactive() {
    this.blocks = this.blocks.filter(b => b.active);
  }

  // проверить поражение (блоки коснулись дна)
  checkGameOver(height) {
    return this.blocks.some(b => b.isOutOfBounds(height));
  }

  // проверить победу (все блоки разбиты)
  isCleared() {
    return this.blocks.filter(b => b.active).length === 0;
  }

  draw(ctx) {
    for (const block of this.blocks) {
      block.draw(ctx);
    }
  }

  clear() {
    this.blocks = [];
  }
}
