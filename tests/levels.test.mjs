import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const savedValues = new Map();
globalThis.localStorage = {
  getItem(key) { return savedValues.has(key) ? savedValues.get(key) : null; },
  setItem(key, value) { savedValues.set(key, String(value)); },
};

const { default: levels, GAME_LEVELS, GOAL_TYPES, LevelSystemManager } = await import('../src/core/LevelSystem.js');
const { GAME_MODES } = await import('../src/core/GameConfig.js');
const modes = ['catch', 'bricks', 'puzzle', 'match3'];

test('four level modes each contain 49 valid, progressively indexed levels', () => {
  assert.ok(Object.values(GAME_MODES).every((mode) => mode.unlockLevel === 1), 'all four mini-games should be available immediately');
  for (const mode of modes) {
    const modeLevels = Object.entries(GAME_LEVELS[mode]);
    assert.equal(modeLevels.length, 49, `${mode} should have 49 levels`);
    for (const [id, level] of modeLevels) {
      assert.match(id, /^[1-5]-\d+$/);
      assert.ok(level.stage >= 1 && level.stage <= 5, `${mode}/${id} stage`);
      assert.ok(level.sublevel >= 1, `${mode}/${id} sublevel`);
      assert.ok(level.timeLimit > 0, `${mode}/${id} time limit`);
      assert.ok(Object.values(GOAL_TYPES).includes(level.goal.type), `${mode}/${id} goal type`);
      assert.ok(level.goal.target > 0, `${mode}/${id} goal target`);
      assert.ok(level.stars.one <= level.stars.two && level.stars.two <= level.stars.three, `${mode}/${id} star thresholds`);
      assert.ok(level.rewards.orbs > 0, `${mode}/${id} reward`);
    }
  }
});

test('first level is available; completing it unlocks the next and saves progress', () => {
  levels.resetProgress();
  assert.equal(levels.isLevelUnlocked('catch', '1-1'), true);
  assert.equal(levels.isLevelUnlocked('catch', '1-2'), false);
  levels.completeLevel('catch', '1-1', 2);
  assert.equal(levels.isLevelUnlocked('catch', '1-2'), true);
  assert.equal(levels.getNextLevel('catch').id, '1-2');
  assert.equal(JSON.parse(savedValues.get('orb-masters-level-progress')).catch.completed['1-1'], true);
  levels.resetProgress();
});

test('completing the stage-one boss unlocks the next stage', () => {
  levels.resetProgress('catch');
  for (let sublevel = 1; sublevel <= 5; sublevel += 1) {
    const id = `1-${sublevel}`;
    assert.equal(levels.isLevelUnlocked('catch', id), true, `${id} should unlock in sequence`);
    levels.completeLevel('catch', id, 1);
  }
  assert.equal(levels.getProgressStats('catch').unlockedStage, 2);
  assert.equal(levels.isLevelUnlocked('catch', '2-1'), true);
  levels.resetProgress('catch');
});

test('Crystal Match level timer and goal checks run in actual non-gameover states', () => {
  const scene = fs.readFileSync(new URL('../src/scenes/level_match3.js', import.meta.url), 'utf8');
  assert.match(scene, /levelTimer\s*-=\s*dt/);
  assert.match(scene, /game\.state\s*!==\s*'gameover'\s*&&\s*checkLevelGoal\(\)/);
  assert.doesNotMatch(scene, /game\.state\s*===\s*'playing'/);
});

test('corrupt saved level progress recovers to a playable first level', () => {
  savedValues.set('orb-masters-level-progress', '{broken json');
  const recovered = new LevelSystemManager();
  assert.equal(recovered.isLevelUnlocked('catch', '1-1'), true);
  assert.equal(recovered.isLevelUnlocked('catch', '1-2'), false);
  assert.doesNotThrow(() => JSON.parse(savedValues.get('orb-masters-level-progress')));
});

test('replaying a level keeps best stars and clamps values to three', () => {
  const replay = new LevelSystemManager();
  replay.resetProgress('catch');
  replay.completeLevel('catch', '1-1', 2);
  replay.completeLevel('catch', '1-1', 1);
  replay.completeLevel('catch', '1-1', 99);
  assert.equal(replay.progress.catch.stars['1-1'], 3);
  replay.completeLevel('catch', '1-1', 0);
  assert.equal(replay.progress.catch.stars['1-1'], 3);
});
