// Block.js - Базовый блок с HP

// Глобальный счётчик ID
let blockIdCounter = 0;

export function resetBlockIdCounter() {
  blockIdCounter = 0;
}

export function getNextBlockId() {
  return blockIdCounter++;
}

/**
 * Обычный разрушаемый блок с градиентом
 */
export class Block {
  constructor(x, y, w = 40, h = 40, hp = 1) {
    this.id = getNextBlockId();
    this.type = 'block';
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.hp = hp;
    this.maxHp = hp;
    this.active = true;
  }

  takeDamage(dmg = 1) {
    if (!this.active) return { destroyed: false, explode: false };
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.active = false;
      return { destroyed: true, explode: false };
    }
    return { destroyed: false, explode: false };
  }

  move(dy) {
    this.y += dy;
  }

  draw(ctx) {
    if (!this.active) return;
    
    // Простой цвет на основе HP (без градиента для производительности)
    const hue = Math.max(0, 200 - this.hp * 12);
    ctx.fillStyle = `hsl(${hue}, 75%, 50%)`;
    
    // Простой прямоугольник со скруглёнными углами
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + r, this.y);
    ctx.lineTo(this.x + this.w - r, this.y);
    ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + r);
    ctx.lineTo(this.x + this.w, this.y + this.h - r);
    ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - r, this.y + this.h);
    ctx.lineTo(this.x + r, this.y + this.h);
    ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - r);
    ctx.lineTo(this.x, this.y + r);
    ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
    ctx.closePath();
    ctx.fill();
    
    // HP число (без тени)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.hp.toString(), this.x + this.w / 2, this.y + this.h / 2);
  }
}
