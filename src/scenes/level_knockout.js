// level_knockout.js — Level 2: Zuma-style shooter game
// Шарик запускается в направлении, спускаются ряды блоков, разбивай их!
import { ZumaGame } from '../zuma/ZumaGame.js';

let W, H;
let zumaGame = null;

function LevelKnockout(engine, opts = {}) {
  const canvas = engine.canvas;
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  // создаём игру Zuma
  zumaGame = new ZumaGame(canvas, engine);

  return {
    onResize(w, h) {
      W = w;
      H = h;
      if (zumaGame) zumaGame.onResize(w, h);
    },

    init() {
      return zumaGame.init();
    },

    update(dt) {
      if (zumaGame) zumaGame.update(dt);
    },

    render(ctx) {
      if (zumaGame) zumaGame.render(ctx);
    },

    onExit() {
      if (zumaGame) zumaGame.onExit();
    }
  };
}

export default LevelKnockout;