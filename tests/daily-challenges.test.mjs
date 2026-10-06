import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
};

const { DailyChallengesManager, CHALLENGE_TYPES } = await import('../src/ui/DailyChallenges.js');
const { default: profile } = await import('../src/core/PlayerProfile.js');

test('daily set always starts with an achievable one-game objective', () => {
  storage.clear();
  const daily = new DailyChallengesManager();
  const first = daily.getChallenges()[0];
  assert.equal(first.type, CHALLENGE_TYPES.PLAY_GAMES);
  assert.equal(first.target, 1);
  assert.ok(first.reward > 0);
});

test('daily objective reward can be claimed only once', () => {
  storage.clear();
  const daily = new DailyChallengesManager();
  daily.updateProgress(CHALLENGE_TYPES.PLAY_GAMES, 1);
  const before = profile.orbs;
  assert.equal(daily.claimReward(0), true);
  assert.equal(profile.orbs, before + 30);
  assert.equal(daily.claimReward(0), false);
  assert.equal(profile.orbs, before + 30);
});

test('corrupt daily challenge save recovers with a fresh playable set', () => {
  storage.set('orb-masters-daily-challenges', '{bad json');
  const daily = new DailyChallengesManager();
  assert.equal(daily.getChallenges().length, 3);
  assert.equal(daily.getChallenges()[0].target, 1);
  assert.doesNotThrow(() => JSON.parse(storage.get('orb-masters-daily-challenges')));
});
