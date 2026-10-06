import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
};

const { PlayerProfile } = await import('../src/core/PlayerProfile.js');

test('first visit starts a daily streak and persists it immediately', () => {
  storage.clear();
  const profile = new PlayerProfile();
  const saved = JSON.parse(storage.get('orb-masters-profile'));
  assert.equal(profile.streak, 1);
  assert.equal(saved.daily.lastLogin, new Date().toDateString());
  assert.equal(saved.daily.streak, 1);
});

test('next-day login increments once and saves the streak across reloads', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const saved = JSON.parse(storage.get('orb-masters-profile'));
  saved.daily.lastLogin = yesterday.toDateString();
  saved.daily.streak = 4;
  storage.set('orb-masters-profile', JSON.stringify(saved));

  const nextDay = new PlayerProfile();
  assert.equal(nextDay.streak, 5);
  const reloaded = new PlayerProfile();
  assert.equal(reloaded.streak, 5);
});

test('malformed profile recovers to a saved usable player profile', () => {
  storage.set('orb-masters-profile', '{broken json');
  const recovered = new PlayerProfile();
  assert.equal(recovered.level, 1);
  assert.equal(recovered.streak, 1);
  assert.doesNotThrow(() => JSON.parse(storage.get('orb-masters-profile')));
});
