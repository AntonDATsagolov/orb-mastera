// Простая реализация SceneManager + общий canvas/context
class Engine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.scenes = new Map();
    this.current = null;
    this.running = false;
    this.lastTime = 0;
    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();
  }
  register(name, factory) { this.scenes.set(name, factory); }
  async goTo(name, data = {}) {
    if (this.current && this.current.onExit) this.current.onExit();
    const factory = this.scenes.get(name);
    if (!factory) throw new Error(`Scene "${name}" not found`);
    this.current = factory(this, data);
    if (this.current.init) await this.current.init();
    // ensure loop
    if (!this.running) { this.running = true; this.lastTime = 0; requestAnimationFrame(this._loop.bind(this)); }
  }
  _resize() {
    const DPR = Math.max(1, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    this.canvas.width = Math.floor(W * DPR);
    this.canvas.height = Math.floor(H * DPR);
    this.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (this.current && this.current.onResize) this.current.onResize(W, H);
  }
  _loop(ts) {
    if (!this.lastTime) this.lastTime = ts;
    const dt = Math.min(40, ts - this.lastTime);
    this.lastTime = ts;
    if (this.current && this.current.update) this.current.update(dt);
    if (this.current && this.current.render) this.current.render(this.ctx);
    if (this.running) requestAnimationFrame(this._loop.bind(this));
  }
  stop() { this.running = false; if (this.current && this.current.onExit) this.current.onExit(); }
}
window.Engine = Engine;

// добавляем глобальные утилиты, используемые сценами
window.roundRect = window.roundRect || function(ctx, x, y, w, h, r) {
  if (!r) r = 0;
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,   x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,   y + h, r);
  ctx.arcTo(x,   y + h, x,   y,   r);
  ctx.arcTo(x,   y,   x + w, y,   r);
  ctx.closePath();
};

window.loadLevelJSON = window.loadLevelJSON || async function(path){
  const res = await fetch(path, {cache: 'no-store'});
  if (!res.ok) throw new Error('Не удалось загрузить уровень: ' + path + ' (' + res.status + ')');
  return await res.json();
};