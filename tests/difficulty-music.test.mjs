import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
};

const { DifficultyManager } = await import('../src/core/DifficultyManager.js');
const { GAME_LEVELS } = await import('../src/core/LevelSystem.js');
const { Match3Game } = await import('../src/game/match3/Match3Game.js');

test('adaptive difficulty waits for three results and responds in small steps', () => {
  store.clear();
  const difficulty = new DifficultyManager();
  difficulty.resetAll();
  difficulty.recordGameResult('cashCatcher', 0, 2, true);
  difficulty.recordGameResult('cashCatcher', 0, 2, true);
  assert.equal(difficulty.getModifier('cashCatcher'), 1);
  difficulty.recordGameResult('cashCatcher', 0, 2, true);
  assert.equal(difficulty.getModifier('cashCatcher'), 0.78);
  difficulty.recordGameResult('cashCatcher', 800, 60, false);
  assert.equal(difficulty.getModifier('cashCatcher'), 0.85);
});

test('result flow maps public mode names and real play duration to difficulty history', () => {
  const source = fs.readFileSync(new URL('../src/ui/GameResultScreen.js', import.meta.url), 'utf8');
  assert.match(source, /'catch':\s*'cashCatcher'/);
  assert.match(source, /'bricks':\s*'bricksBreaker'/);
  assert.match(source, /'puzzle':\s*'blockPuzzle'/);
  assert.match(source, /'zuma':\s*'knockoutZuma'/);
  assert.match(source, /this\.options\.playTimeSeconds\s*\?\?\s*this\.options\.duration/);
});

test('music is original, Web Audio based, and bundled for offline play', () => {
  const music = fs.readFileSync(new URL('../src/game/ArcadeMusic.js', import.meta.url), 'utf8');
  const sw = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
  assert.match(music, /new AudioContextClass\(\)/);
  assert.match(music, /menuNotes/);
  assert.match(music, /gameNotes/);
  assert.match(sw, /'src\/game\/ArcadeMusic\.js'/);
  assert.match(sw, /const CACHE_PREFIX = 'orb-masters-orb-mastera-'/);
  assert.match(sw, /const CACHE_NAME = `\$\{CACHE_PREFIX\}v4`/);
});

test('Match 3 level pacing grows in time and uses a real longest combo stat', () => {
  const scene = fs.readFileSync(new URL('../src/scenes/level_match3.js', import.meta.url), 'utf8');
  const game = fs.readFileSync(new URL('../src/game/match3/Match3Game.js', import.meta.url), 'utf8');
  assert.ok(GAME_LEVELS.match3['1-1'].timeLimit <= 70);
  assert.ok(GAME_LEVELS.match3['1-1'].goal.target >= 450);
  assert.match(scene, /const levelColors = Math\.max\(4/);
  assert.match(game, /this\.maxCombo = Math\.max\(this\.maxCombo, this\.combo\)/);
});

test('Match 3 keeps its best cascade combo for level objectives and rewards', () => {
  const game = new Match3Game(320, 480, { moves: 40, gemTypes: 4 });
  const match = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }];
  game.removeMatches(match);
  game.removeMatches(match);
  assert.equal(game.combo, 2);
  assert.equal(game.maxCombo, 2);
});

test('canvas pixel density is capped and repeated Match 3 cell gradients are removed', () => {
  const engine = fs.readFileSync(new URL('../src/engine.js', import.meta.url), 'utf8');
  const match3 = fs.readFileSync(new URL('../src/game/match3/Match3Game.js', import.meta.url), 'utf8');
  assert.match(engine, /Math\.min\(2, Math\.max\(1, window\.devicePixelRatio/);
  assert.match(match3, /Flat checker cells avoid 64 short-lived gradients/);
});
