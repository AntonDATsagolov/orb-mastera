// Основная сцена level_stack — использует LevelStackShapes и LevelStackUI
import LevelStackShapes from './level_stack/shapes.js';
import LevelStackUI from './level_stack/ui.js';
import { AudioManager } from '../game/AudioManager.js';
import { SoundEffects } from '../game/SoundEffects.js';

function LevelStack(engine, opts = {}) {
  const canvas = engine.canvas;
  const ctx = engine.ctx;
  let W = canvas.clientWidth, H = canvas.clientHeight;

  // grid
  const rows = 10, cols = 10;
  let grid = [];
  let cellSize = 0, gridX = 0, gridY = 0, panelY = 0;

  // pieces / bag
  let pieces = [];
  let shapeBag = null;

  let score = 0;
  let selected = null;
  const pieceSlotSize = 84;
  const pieceSlotGap = 18;

  // ui instances
  let toast = null;
  let pauseUI = null;
  let gameOverUI = null;

  // helpers from shapes module
  const shapesMod = LevelStackShapes;

  // ui module
  const uiMod = LevelStackUI;

  function initGrid(){ grid = Array.from({length:rows}, ()=>Array(cols).fill(0)); }

  function shuffleBag(){ shapeBag = shapesMod.createBag(); }

  function nextFromBag(){
    if(!shapeBag || shapeBag.length === 0) shuffleBag();
    return shapeBag.pop();
  }

  function randShapeByIndex(i){ return shapesMod.randShapeByIndex(i); }

  function refillPieces(){
    pieces = pieces.filter(Boolean);
    const used = new Set(pieces.map(p=>p.key));
    while(pieces.length < 3){
      let idx = nextFromBag();
      if(used.has(idx)){
        // try find alternative in bag
        for(let i = shapeBag.length - 1; i >= 0; i--){
          if(!used.has(shapeBag[i])){
            idx = shapeBag.splice(i,1)[0];
            break;
          }
        }
      }
      pieces.push(randShapeByIndex(idx));
      used.add(idx);
    }
  }

  function canPlace(piece, r0, c0){
    for(let r=0;r<piece.h;r++){
      for(let c=0;c<piece.w;c++){
        if(!piece.shape[r][c]) continue;
        const rr = r0 + r, cc = c0 + c;
        if(rr<0||rr>=rows||cc<0||cc>=cols) return false;
        if(grid[rr][cc]) return false;
      }
    }
    return true;
  }

  function hasValidPlacementForPiece(piece){
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(canPlace(piece,r,c)) return true;
    return false;
  }
  function hasAnyValidMove(){ return pieces.some(p => p && hasValidPlacementForPiece(p)); }

  function placePiece(idx, r0, c0){
    const p = pieces[idx];
    if(!p || !canPlace(p,r0,c0)) return false;
    for(let r=0;r<p.h;r++) for(let c=0;c<p.w;c++) if(p.shape[r][c]) grid[r0+r][c0+c] = 1;
    pieces[idx] = null;
    selected = null;

    // lines
    const fullRows = [], fullCols = [];
    for(let r=0;r<rows;r++) if(grid[r].every(v=>v===1)) fullRows.push(r);
    for(let c=0;c<cols;c++){
      let ok = true; for(let r=0;r<rows;r++) if(grid[r][c]===0){ ok=false; break; } if(ok) fullCols.push(c);
    }
    const n = fullRows.length + fullCols.length;
    if(n>0){
      for(const r of fullRows) for(let c=0;c<cols;c++) grid[r][c]=0;
      for(const c of fullCols) for(let r=0;r<rows;r++) grid[r][c]=0;
      const gained = 100 * n * n;
      score += gained;
      toast.show(`Сожжено ${n} строк — x${n} (+${gained})`);
    } else {
      let filled=0; for(let r=0;r<p.h;r++) for(let c=0;c<p.w;c++) if(p.shape[r][c]) filled++;
      score += filled * 2;
    }

    // refill and check moves
    refillPieces();
    if(!hasAnyValidMove()){
      toast.show('Ходов нет — игра окончена', 1600);
      setTimeout(()=> {
        gameOver = true;
        setPaused(true);
        gameOverUI.show(score);
      }, 600);
    }
    return true;
  }

  function recalcLayout(w,h){
    W = w; H = h;
    const available = Math.min(W * 0.78, H - 120);
    cellSize = Math.floor(available / Math.max(rows, cols));
    const gridW = cellSize * cols, gridH = cellSize * rows;
    gridX = Math.round((W * 0.5) - (gridW * 0.5));
    gridY = Math.round((H * 0.45) - (gridH * 0.5));
    panelY = gridY + gridH + 14;
  }

  // drag state
  const drag = { active:false, idx:null, x:0, y:0 };
  let paused = false;
  let gameOver = false;

  // input handlers
  function onPointerDown(e){
    if(paused || gameOver) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if(y >= panelY){
      const gridW = cellSize * cols;
      const totalWidth = 3 * pieceSlotSize + 2 * pieceSlotGap;
      const startX = gridX + Math.floor((gridW - totalWidth) / 2);
      for(let i=0;i<pieces.length;i++){
        const left = startX + i * (pieceSlotSize + pieceSlotGap);
        if(x >= left && x <= left + pieceSlotSize && y >= panelY && y <= panelY + pieceSlotSize){
          if(!pieces[i]) return;
          drag.active = true; drag.idx = i; drag.x = x; drag.y = y; selected = i; toast.show(`Взята фигура ${i+1}`);
          return;
        }
      }
      return;
    }
    if(selected !== null){ drag.active = true; drag.idx = selected; drag.x = x; drag.y = y; }
  }
  function onPointerMove(e){ if(paused||gameOver) return; if(!drag.active) return; const r = canvas.getBoundingClientRect(); drag.x = e.clientX - r.left; drag.y = e.clientY - r.top; }
  function onPointerUp(e){
    if(paused||gameOver) return;
    if(!drag.active) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const gx = x - gridX, gy = y - gridY;
    const c = Math.floor(gx / cellSize), rr = Math.floor(gy / cellSize);
    if(rr >= 0 && rr < rows && c >= 0 && c < cols && pieces[drag.idx] && canPlace(pieces[drag.idx], rr, c)){
      placePiece(drag.idx, rr, c);
    } else {
      toast.show('Нельзя разместить здесь');
    }
    drag.active = false; drag.idx = null;
  }
  function onKeyDown(e){
    if(e.key === 'Escape'){
      if(drag.active){ drag.active=false; drag.idx=null; selected=null; toast.show('Размещение отменено'); }
      else togglePause();
    }
  }

  // pause control
  function setPaused(v){
    paused = v;
    pauseUI.setPaused(v);
    if(v) { drag.active=false; drag.idx=null; selected=null; toast.show('Игра приостановлена'); }
    else toast.show('');
  }
  function togglePause(){ if(!gameOver) setPaused(!paused); }

  // scene api
  return {
    async init(){
      // Запуск музыки уровня
      AudioManager.playTrack('level3');
      
      initGrid();
      shuffleBag();
      refillPieces();
      selected = null; score = 0;
      recalcLayout(canvas.clientWidth, canvas.clientHeight);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      window.addEventListener('keydown', onKeyDown);

      const container = document.getElementById('game-container');
      // toast включается опционально (чекбокс в меню): по умолчанию показываем
      const toastEnabled = localStorage.getItem('mbg-showToast');
      if (toastEnabled === null || toastEnabled === 'true') {
        toast = uiMod.createToast(container);
      } else {
        // noop объект, чтобы не проверять во всех местах
        toast = { show() {}, remove() {} };
      }
      pauseUI = uiMod.createPauseUI(container, ()=> setPaused(false), ()=> engine.goTo('menu'));
      pauseUI.onToggle(()=> togglePause());
      gameOverUI = uiMod.createGameOverUI(container, ()=> { gameOverUI.hide(); restart(); }, ()=> engine.goTo('menu'));
      this._saveTick = setInterval(()=> {
        localStorage.setItem('mbg-lastLevel','3');
        localStorage.setItem('mbg-lastScore', String(score));
      }, 5000);
    },
    onResize(w,h){ recalcLayout(w,h); },
    update(dt){ /* no-op */ },
    render(ctx){
      ctx.clearRect(0,0,W,H);
      const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#062031'); g.addColorStop(1,'#2b1b45');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
          const x = gridX + c*cellSize, y = gridY + r*cellSize;
          ctx.fillStyle = grid[r][c] ? '#7EE7C8' : 'rgba(255,255,255,0.02)';
          ctx.fillRect(x+1,y+1,cellSize-2,cellSize-2);
          ctx.strokeRect(x+0.5,y+0.5,cellSize-1,cellSize-1);
        }
      }

      // bottom panel background
      const gridW = cellSize * cols;
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(gridX, panelY - 8, gridW, pieceSlotSize + 16);

      // pieces slots
      const totalWidth = 3 * pieceSlotSize + 2 * pieceSlotGap;
      const startX = gridX + Math.floor((gridW - totalWidth) / 2);
      for(let i=0;i<pieces.length;i++){
        const left = startX + i * (pieceSlotSize + pieceSlotGap);
        const top = panelY;
        if(i === selected && !drag.active){ ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(left, top, pieceSlotSize, pieceSlotSize); }
        ctx.fillStyle = '#cfeefe'; ctx.font = '12px sans-serif';
        ctx.fillText(`Фигура ${i+1}`, left + 8, top + 14);
        const p = pieces[i];
        if(p){
          const s = Math.max(12, Math.min(20, Math.floor(cellSize*0.45)));
          const shapeW = p.w*(s+6) - 6;
          const shapeH = p.h*(s+6) - 6;
          const offsetX = left + Math.floor((pieceSlotSize - shapeW)/2);
          const offsetY = top + Math.floor((pieceSlotSize - shapeH)/2);
          for(let r=0;r<p.h;r++) for(let c=0;c<p.w;c++) if(p.shape[r][c]){
            ctx.fillStyle = '#8fb4ff';
            ctx.fillRect(offsetX + c*(s+6), offsetY + r*(s+6), s, s);
            ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.strokeRect(offsetX + c*(s+6)+0.5, offsetY + r*(s+6)+0.5, s-1, s-1);
          }
        }
      }

      // ghost preview while dragging
      if(drag.active && drag.idx !== null){
        const gx = drag.x - gridX, gy = drag.y - gridY;
        const c = Math.floor(gx / cellSize), rr = Math.floor(gy / cellSize);
        const p = pieces[drag.idx];
        if(p && rr >= -p.h && c >= -p.w && rr < rows && c < cols){
          const valid = (rr >= 0 && c >= 0 && rr < rows && c < cols) && canPlace(p, rr, c);
          ctx.globalAlpha = 0.75;
          for(let r=0;r<p.h;r++) for(let c2=0;c2<p.w;c2++) if(p.shape[r][c2]){
            const R = rr + r, C = c + c2;
            if(R>=0 && C>=0 && R<rows && C<cols) {
              const x = gridX + C*cellSize, y = gridY + R*cellSize;
              ctx.fillStyle = valid ? '#9ff0df' : '#ff9b9b';
              ctx.fillRect(x+1,y+1,cellSize-2,cellSize-2);
            }
          }
          ctx.globalAlpha = 1;
        }
        // draw dragging piece near cursor
        const drawX = drag.x + 8, drawY = drag.y + 8;
        const dp = pieces[drag.idx];
        if(dp){
          const ds = Math.max(12, Math.min(20, Math.floor(cellSize*0.45)));
          for(let r=0;r<dp.h;r++) for(let c2=0;c2<dp.w;c2++) if(dp.shape[r][c2]){
            ctx.fillStyle = '#8fb4ff';
            ctx.fillRect(drawX + c2*(ds+6), drawY + r*(ds+6), ds, ds);
            ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.strokeRect(drawX + c2*(ds+6)+0.5, drawY + r*(ds+6)+0.5, ds-1, ds-1);
          }
        }
      }

      // instruction
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px sans-serif';
      ctx.fillText('Перетащите фигуру снизу на поле и отпустите. Esc — пауза/отмена', 12, H - 10);

      // update DOM HUD score (if present)
      const finalScore = document.getElementById('finalScore');
      if (finalScore) {
          finalScore.textContent = `Очки: ${score}`;
      } else {
          console.warn('finalScore element not found, score:', score);
      }
    },
    onExit(){
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      if(this._saveTick) clearInterval(this._saveTick);
      if(toast && typeof toast.remove === 'function') toast.remove();
      if(pauseUI) pauseUI.remove();
      if(gameOverUI) gameOverUI.remove();
    }
  };

  // restart helper (inner)
  function restart(){
    gameOver = false;
    setPaused(false);
    initGrid();
    shuffleBag();
    pieces = [];
    refillPieces();
    selected = null;
    score = 0;
  }
}

export default LevelStack;