// ZumaGame.js — главная логика уровня 2 (Zuma-style shooter)
import { Ball, BallManager } from './Ball.js';
import { Block, BlockManager } from './Block.js';
import { Physics } from './Physics.js';
import { SpecialBlockHandler } from './SpecialBlocks.js';

export class ZumaGame {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;

    this.W = canvas.width;
    this.H = canvas.height;

    // системы
    this.ballManager = new BallManager();
    this.blockManager = new BlockManager(this.W, this.H);
    this.physics = new Physics(this.W, this.H);
    this.specialHandler = new SpecialBlockHandler();

    // состояние игры
    this.gameState = 'aiming'; // aiming, playing, gameOver, levelComplete
    this.score = 25; // количество оставшихся спусков
    this.shots = 0; // количество произведённых выстрелов
    this.ballCount = 1; // количество шариков для следующего выстрела
    this.currentLaunchPos = { x: this.W / 2, y: this.H - 40 }; // позиция запуска
    this.aimAngle = 0; // угол прицела
    this.aimDistance = 100; // длина линии прицела

    // визуальные элементы
    this.ballColor = '#FF6B6B';
    this.aimLineColor = 'rgba(255, 255, 255, 0.5)';

    // UI элементы
    this.scoreEl = null;
    this.shotCountEl = null;
    this.ballCountEl = null;
    this.overlay = null;
    this.finalScore = null;

    this.isPaused = false;
    this.levelStartTime = performance.now();

    // handlers
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  // инициализация уровня
  init() {
    return (async () => {
      try {
        // в будущем загружаем уровень из JSON если нужно
        this.blockManager.initLevel();
      } catch (e) {
        console.error('Ошибка инициализации Level 2:', e);
      }

      this.setupHUD();
      this.addEventListeners();
      this.updateHUD();
    })();
  }

  // создание HUD элементов
  setupHUD() {
    // создаём контейнер
    const hudContainer = document.createElement('div');
    hudContainer.id = 'zuma-hud';
    hudContainer.style.cssText = `
      position: absolute;
      top: 10px;
      left: 65px;
      color: white;
      font: 16px Arial;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
      z-index: 100;
    `;

    // score (спуски)
    this.scoreEl = document.createElement('div');
    this.scoreEl.textContent = `Спусков: ${this.score}`;
    hudContainer.appendChild(this.scoreEl);

    // выстрелы
    this.shotCountEl = document.createElement('div');
    this.shotCountEl.textContent = `Выстрелов: ${this.shots}`;
    hudContainer.appendChild(this.shotCountEl);

    // шарики в запасе
    this.ballCountEl = document.createElement('div');
    this.ballCountEl.textContent = `Шариков: ${this.ballCount}`;
    hudContainer.appendChild(this.ballCountEl);

    document.body.appendChild(hudContainer);

    // overlay для game over/win
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 200;
    `;

    this.finalScore = document.createElement('div');
    this.finalScore.style.cssText = `
      color: white;
      font-size: 36px;
      margin-bottom: 20px;
      text-align: center;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px;';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Переиграть';
    retryBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
    `;
    retryBtn.onclick = () => this.init();

    const menuBtn = document.createElement('button');
    menuBtn.textContent = 'В меню';
    menuBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 5px;
    `;
    menuBtn.onclick = () => this.engine.goTo('menu');

    buttonContainer.appendChild(retryBtn);
    buttonContainer.appendChild(menuBtn);

    this.overlay.appendChild(this.finalScore);
    this.overlay.appendChild(buttonContainer);
    document.body.appendChild(this.overlay);
  }

  // удаление HUD
  cleanupHUD() {
    const hud = document.getElementById('zuma-hud');
    if (hud) hud.remove();
    if (this.overlay) this.overlay.remove();
  }

  // обновление HUD
  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = `Спусков: ${this.score}`;
    if (this.shotCountEl) this.shotCountEl.textContent = `Выстрелов: ${this.shots}`;
    if (this.ballCountEl) this.ballCountEl.textContent = `Шариков: ${this.ballCount}`;
  }

  // обработка движения мыши (прицел)
  onPointerMove(e) {
    if (this.gameState !== 'aiming') return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // расчёт угла от позиции запуска
    const dx = mouseX - this.currentLaunchPos.x;
    const dy = mouseY - this.currentLaunchPos.y;

    this.aimAngle = Math.atan2(dy, dx);
  }

  // обработка клика (выстрел)
  onPointerDown(e) {
    if (this.gameState !== 'aiming' || this.ballCount <= 0) return;

    e.preventDefault();

    // запускаем шарики
    for (let i = 0; i < this.ballCount; i++) {
      const speed = 8;
      const offsetAngle = (Math.random() - 0.5) * 0.2; // небольшой разброс

      const ball = new Ball(
        this.currentLaunchPos.x,
        this.currentLaunchPos.y,
        Math.cos(this.aimAngle + offsetAngle) * speed,
        Math.sin(this.aimAngle + offsetAngle) * speed,
        6,
        this.ballColor
      );

      this.ballManager.addBall(
        ball.x,
        ball.y,
        ball.vx,
        ball.vy,
        ball.r,
        ball.color
      );
    }

    this.shots++;
    this.ballCount = 0; // расходуем шарики
    this.gameState = 'playing';
  }

  // обработка клавиш
  onKeyDown(e) {
    if (e.key === 'Escape') {
      this.isPaused = !this.isPaused;
    }
  }

  // добавление обработчиков событий
  addEventListeners() {
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    document.addEventListener('keydown', this.onKeyDown);
  }

  // удаление обработчиков событий
  removeEventListeners() {
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  // основной цикл обновления
  update(dt) {
    if (this.isPaused || this.gameState === 'gameOver' || this.gameState === 'levelComplete') return;

    // обновляем шарики
    this.ballManager.update();

    // обработка столкновений
    const ballsToRemove = [];

    for (let i = 0; i < this.ballManager.balls.length; i++) {
      const ball = this.ballManager.balls[i];
      if (!ball.active) continue;

      // столкновение со стенами
      this.physics.checkWallCollision(ball);

      // столкновение с блоками
      const hitBlock = this.blockManager.checkCollision(ball.x, ball.y, ball.r);
      if (hitBlock) {
        // обработка спец-блока если нужно
        if (hitBlock.type !== 'normal') {
          const result = this.specialHandler.handleSpecialBlockHit(
            hitBlock,
            ball,
            this.ballManager,
            this.blockManager
          );

          if (result) {
            // добавляем новые шарики
            if (result.newBalls.length > 0) {
              this.ballManager.addMultiple(result.newBalls);
            }

            // обработка лазеров
            if (result.blocksToHit.length > 0) {
              for (const targetBlock of result.blocksToHit) {
                targetBlock.takeDamage(1);
              }
            }
          }
        }

        // наносим урон блоку
        const blockDestroyed = hitBlock.takeDamage(1);
        ballsToRemove.push(i);
      }

      // столкновение между шариками
      for (let j = i + 1; j < this.ballManager.balls.length; j++) {
        const other = this.ballManager.balls[j];
        if (other.active) {
          this.physics.checkBallCollision(ball, other);
        }
      }

      // проверка падения
      if (ball.y > this.H) {
        ball.active = false;
        // запоминаем позицию падения для следующего выстрела
        this.currentLaunchPos = {
          x: Math.max(this.physics.ballRadius, Math.min(ball.x, this.W - this.physics.ballRadius)),
          y: this.H - 40
        };

        // если больше нет активных шариков - переходим в режим прицела
        const activeBalls = this.ballManager.getActiveBalls();
        if (activeBalls.length === 0) {
          this.gameState = 'aiming';
          this.ballCount = 1; // готовим следующий выстрел
          this.ballManager.clear(); // очищаем мёртвые шарики

          // спускаем блоки
          this.descendBlocks();

          // проверяем победу/поражение
          this.checkGameState();
        }
      }
    }

    // удаляем мёртвые шарики
    for (const i of ballsToRemove.reverse()) {
      this.ballManager.removeBall(i);
    }

    this.blockManager.removeInactive();
    this.updateHUD();
  }

  // спуск блоков
  descendBlocks() {
    this.score--; // уменьшаем счёт
    this.blockManager.descendRows();
    this.specialHandler.updateLasers();
  }

  // проверка состояния игры
  checkGameState() {
    // проверка поражения
    if (this.blockManager.checkGameOver(this.H)) {
      this.gameState = 'gameOver';
      this.finalScore.textContent = `ПОРАЖЕНИЕ!\nШарики коснулись дна!`;
      this.overlay.style.display = 'flex';
      return;
    }

    // проверка победы
    if (this.blockManager.isCleared() && this.score === 0) {
      this.gameState = 'levelComplete';
      this.finalScore.textContent = `ПОБЕДА!\nВы разбили все блоки!`;
      this.overlay.style.display = 'flex';
      return;
    }

    // проверка победы по условию (все блоки разбиты)
    if (this.blockManager.isCleared()) {
      this.finalScore.textContent = `ПРОМЕЖУТОЧНАЯ ПОБЕДА!\nБлоки разбиты, спусков осталось: ${this.score}`;
      this.overlay.style.display = 'flex';
      setTimeout(() => {
        this.overlay.style.display = 'none';
        this.gameState = 'aiming';
        this.ballCount = 1;
      }, 2000);
    }
  }

  // рендер
  render(ctx) {
    // очищаем канвас
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.W, this.H);

    // рисуем блоки
    this.blockManager.draw(ctx);

    // рисуем лазеры
    this.specialHandler.drawLasers(ctx, this.W, this.H);

    // рисуем шарики
    this.ballManager.draw(ctx);

    // рисуем линию прицела (в режиме прицела)
    if (this.gameState === 'aiming') {
      ctx.save();
      ctx.strokeStyle = this.aimLineColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(this.currentLaunchPos.x, this.currentLaunchPos.y);
      ctx.lineTo(
        this.currentLaunchPos.x + Math.cos(this.aimAngle) * this.aimDistance,
        this.currentLaunchPos.y + Math.sin(this.aimAngle) * this.aimDistance
      );
      ctx.stroke();
      ctx.restore();

      // рисуем позицию запуска
      ctx.fillStyle = this.ballColor;
      ctx.beginPath();
      ctx.arc(this.currentLaunchPos.x, this.currentLaunchPos.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // очистка при выходе
  onExit() {
    this.removeEventListeners();
    this.cleanupHUD();
  }

  // обработка изменения размера окна
  onResize(w, h) {
    this.W = w;
    this.H = h;
    this.physics.setCanvasSize(w, h);
    this.blockManager.W = w;
    this.blockManager.H = h;
    this.currentLaunchPos.y = h - 40;
    this.currentLaunchPos.x = w / 2;
  }
}

export { ZumaGame };
