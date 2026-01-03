// BlockManager.js - Менеджер блоков и спецэлементов

import { Block, resetBlockIdCounter } from './Block.js';
import { Bomb, DirectionalBomb, Laser, Randomizer, BonusBall } from './SpecialElements.js';
import { EffectsManager } from './Effects.js';
import { SoundEffects } from '../SoundEffects.js';

/**
 * Управляет всеми блоками и спецэлементами на поле
 */
export class BlockManager {
  constructor(canvasWidth, canvasHeight) {
    this.blocks = [];
    this.specials = [];
    this.bonuses = [];
    this.effects = new EffectsManager();
    this.W = canvasWidth;
    this.H = canvasHeight;
    this.rowHeight = 42;
    this.blockWidth = 38;
    this.blockHeight = 38;
    this.gap = 2;
    this.margin = 4; // Минимальный отступ от стенок
    this.blocksPerRow = Math.floor((canvasWidth - this.margin * 2) / (this.blockWidth + this.gap));
    this.turnNumber = 0;
    this.playerBallCount = 1; // Количество шариков у игрока (обновляется извне)
  }

  /**
   * Обновление количества шариков игрока (для системы mercy)
   */
  setPlayerBallCount(count) {
    this.playerBallCount = count;
  }

  /**
   * Расчёт "силы" игрока для адаптивной сложности
   * Возвращает коэффициент mercy: < 1 = нужна помощь, > 1 = всё хорошо
   */
  getMercyFactor() {
    // Считаем общий HP всех блоков на поле
    let totalBlockHP = 0;
    for (const block of this.blocks) {
      totalBlockHP += block.hp || 0;
    }
    
    // Идеальное соотношение: 1 шарик на 3-4 HP блоков (за раунд)
    const idealRatio = 3.5;
    const avgHPPerBall = totalBlockHP / Math.max(1, this.playerBallCount);
    
    // mercyFactor < 1 означает что игроку тяжело
    return idealRatio / Math.max(1, avgHPPerBall);
  }

  /**
   * Генерация одного ряда элементов
   */
  generateRow(y) {
    const row = [];
    // Считаем ширину ряда и центрируем, чтобы блоки были ближе к краям
    const totalWidth = this.blocksPerRow * (this.blockWidth + this.gap) - this.gap;
    const startX = (this.W - totalWidth) / 2;
    
    // Система mercy: адаптивная сложность
    const mercy = this.getMercyFactor();
    
    // Если игроку тяжело (mercy < 0.7), увеличиваем шанс бонусных шаров
    // Если игроку легко (mercy > 1.3), уменьшаем бонусы и увеличиваем пустоту
    let bonusBallChance = 0.13; // Базовый 13%
    let emptyChance = 0.12;      // Базовый 12%
    let blockChance = 0.60;      // Базовый 60%
    
    if (mercy < 0.5) {
      // Критически тяжело - много помощи
      bonusBallChance = 0.25;
      emptyChance = 0.20;
      blockChance = 0.40;
    } else if (mercy < 0.7) {
      // Тяжело - немного помощи
      bonusBallChance = 0.20;
      emptyChance = 0.15;
      blockChance = 0.50;
    } else if (mercy > 1.5) {
      // Слишком легко - усложняем
      bonusBallChance = 0.08;
      emptyChance = 0.08;
      blockChance = 0.70;
    }
    
    for (let i = 0; i < this.blocksPerRow; i++) {
      const rand = Math.random();
      const x = startX + i * (this.blockWidth + this.gap);
      
      // Адаптивное снижение HP при низком mercy
      const hpReduction = mercy < 0.7 ? Math.floor((0.7 - mercy) * 3) : 0;
      
      if (rand < blockChance) {
        // Обычный блок
        const hp = Math.max(1, this.turnNumber + Math.floor(Math.random() * 3) + 1 - hpReduction);
        row.push(new Block(x, y, this.blockWidth, this.blockHeight, hp));
      } else if (rand < blockChance + 0.04) {
        // Бомба (4%)
        const hp = Math.max(1, this.turnNumber + Math.floor(Math.random() * 3) + 2 - hpReduction);
        row.push(new Bomb(x, y, this.blockWidth, this.blockHeight, hp));
      } else if (rand < blockChance + 0.08) {
        // Направленная бомба (4%)
        const dirs = ['H', 'V', 'X'];
        const dir = dirs[Math.floor(Math.random() * 3)];
        const hp = Math.max(1, this.turnNumber + Math.floor(Math.random() * 3) + 2 - hpReduction);
        row.push(new DirectionalBomb(x, y, this.blockWidth, this.blockHeight, hp, dir));
      } else if (rand < blockChance + 0.12) {
        // Лазер (4%)
        const dirs = ['H', 'V', 'X'];
        const dir = dirs[Math.floor(Math.random() * 3)];
        this.specials.push(new Laser(x, y, this.blockWidth, this.blockHeight, dir, this.W, this.H));
      } else if (rand < blockChance + 0.15) {
        // Рандомайзер (3%)
        this.specials.push(new Randomizer(x, y, this.blockWidth, this.blockHeight));
      } else if (rand < blockChance + 0.15 + bonusBallChance) {
        // Бонусный шар (адаптивный %)
        this.bonuses.push(new BonusBall(x + this.blockWidth / 2, y + this.blockHeight / 2));
      }
      // остальное - пустота
    }
    return row;
  }

  /**
   * Инициализация начального уровня
   */
  initLevel() {
    this.blocks = [];
    this.specials = [];
    this.bonuses = [];
    this.effects.clear();
    this.turnNumber = 1;
    resetBlockIdCounter();
    
    const startY = 80;
    for (let i = 0; i < 5; i++) {
      const row = this.generateRow(startY + i * this.rowHeight);
      this.blocks.push(...row);
    }
  }

  /**
   * Опустить все элементы на один ряд и добавить новый сверху
   */
  descendAll() {
    this.turnNumber++;
    for (const block of this.blocks) block.move(this.rowHeight);
    for (const special of this.specials) special.move(this.rowHeight);
    for (const bonus of this.bonuses) bonus.move(this.rowHeight);
    
    const newRow = this.generateRow(80);
    this.blocks.push(...newRow);
    
    this.blocks = this.blocks.filter(b => b.active && b.y < this.H);
    this.specials = this.specials.filter(s => s.active && s.y < this.H);
    this.bonuses = this.bonuses.filter(b => b.active && b.y < this.H);
  }

  /**
   * Обработка взрыва бомбы
   */
  processExplosion(bomb, result) {
    const cx = bomb.x + bomb.w / 2;
    const cy = bomb.y + bomb.h / 2;
    
    // Звук взрыва
    SoundEffects.playExplosion();
    
    // Добавляем эффект взрыва
    if (result.explosionType === 'area') {
      this.effects.addExplosion(cx, cy, 'area');
    } else if (result.explosionType === 'directional') {
      this.effects.addExplosion(cx, cy, 'directional', result.direction);
    }
    
    if (result.explosionType === 'area') {
      // Взрыв по площади (8 соседних клеток)
      for (const block of this.blocks) {
        if (!block.active || block.id === bomb.id) continue;
        const bx = block.x + block.w / 2;
        const by = block.y + block.h / 2;
        const dist = Math.max(Math.abs(bx - cx), Math.abs(by - cy));
        if (dist <= this.blockWidth + this.gap + 5) {
          block.active = false;
        }
      }
    } else if (result.explosionType === 'directional') {
      // Направленный взрыв
      for (const block of this.blocks) {
        if (!block.active || block.id === bomb.id) continue;
        const bx = block.x + block.w / 2;
        const by = block.y + block.h / 2;
        let hit = false;
        if ((result.direction === 'H' || result.direction === 'X') && Math.abs(by - cy) < this.blockHeight / 2 + 5) {
          hit = true;
        }
        if ((result.direction === 'V' || result.direction === 'X') && Math.abs(bx - cx) < this.blockWidth / 2 + 5) {
          hit = true;
        }
        if (hit) block.active = false;
      }
    }
  }

  /**
   * Активация лазера - нанесение урона блокам на линии
   */
  fireLaser(laser, damage = 1) {
    const cx = laser.x + laser.w / 2;
    const cy = laser.y + laser.h / 2;
    
    // Добавляем эффект лазера
    this.effects.addLaser(cx, cy, laser.direction, this.W, this.H);
    
    for (const block of this.blocks) {
      if (!block.active) continue;
      const bx = block.x + block.w / 2;
      const by = block.y + block.h / 2;
      let hit = false;
      if ((laser.direction === 'H' || laser.direction === 'X') && Math.abs(by - cy) < this.blockHeight / 2 + 5) {
        hit = true;
      }
      if ((laser.direction === 'V' || laser.direction === 'X') && Math.abs(bx - cx) < this.blockWidth / 2 + 5) {
        hit = true;
      }
      if (hit) {
        block.takeDamage(damage);
      }
    }
  }

  /**
   * Удаление сработавших спецэлементов
   */
  cleanupTriggered() {
    this.specials = this.specials.filter(s => !s.triggered);
  }

  /**
   * Проверка условия проигрыша
   */
  checkGameOver(threshold) {
    for (const block of this.blocks) {
      if (block.active && block.y + block.h >= threshold) {
        return true;
      }
    }
    return false;
  }

  /**
   * Обновление эффектов
   */
  update() {
    this.effects.update();
  }

  /**
   * Отрисовка всех элементов
   */
  draw(ctx) {
    for (const special of this.specials) special.draw(ctx);
    for (const block of this.blocks) block.draw(ctx);
    for (const bonus of this.bonuses) bonus.draw(ctx);
    // Эффекты рисуем поверх
    this.effects.draw(ctx);
  }

  /**
   * Очистка всех элементов
   */
  clear() {
    this.blocks = [];
    this.specials = [];
    this.bonuses = [];
    this.effects.clear();
  }

  /**
   * Обновление размеров канваса
   */
  setCanvasSize(w, h) {
    this.W = w;
    this.H = h;
    this.blocksPerRow = Math.floor((w - this.margin * 2) / (this.blockWidth + this.gap));
    
    // Обновляем размеры для всех лазеров
    for (const special of this.specials) {
      if (special.type === 'laser') {
        special.canvasWidth = w;
        special.canvasHeight = h;
      }
    }
  }
}
