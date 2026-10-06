import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

globalThis.window = { orbAdProvider: null };
const { default: adManager } = await import('../src/core/AdManager.js');

test('no provider means no rewarded ad and no success callback', async () => {
  let completed = false;
  let error = '';
  const result = await adManager.showRewardedVideo({
    onComplete: () => { completed = true; },
    onError: (message) => { error = message; },
  });
  assert.equal(result, false);
  assert.equal(completed, false);
  assert.match(error, /недоступна/i);
});

test('reward is exposed to game code only after the provider confirms it', async () => {
  adManager.lastAdTime = 0;
  window.orbAdProvider = {
    isRewardedReady: () => true,
    showRewardedVideo: async () => ({ rewarded: false }),
  };
  let completed = false;
  let error = '';
  const declined = await adManager.showRewardedVideo({
    onComplete: () => { completed = true; },
    onError: (message) => { error = message; },
  });
  assert.equal(declined, false);
  assert.equal(completed, false);
  assert.match(error, /не подтверждён/i);

  window.orbAdProvider.showRewardedVideo = async () => ({ rewarded: true });
  const approved = await adManager.showRewardedVideo({ onComplete: () => { completed = true; } });
  assert.equal(approved, true);
  assert.equal(completed, true);
});

test('shop has no fake purchase callback that creates paid currency', () => {
  const shop = fs.readFileSync(new URL('../src/ui/Shop.js', import.meta.url), 'utf8');
  assert.match(shop, /btn\.disabled = true/);
  assert.doesNotMatch(shop, /orbsManager\.addOrbs\(totalOrbs\)/);
});
