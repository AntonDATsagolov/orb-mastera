/**
 * Ad provider adapter.
 * The production SDK should expose window.orbAdProvider before the app starts.
 * Rewards are granted by the calling feature only after `rewarded: true`.
 */
class AdManager {
  constructor() {
    this.isAdLoading = false;
    this.lastAdTime = 0;
    this.minCooldown = 30000;
  }

  get provider() {
    return typeof window !== 'undefined' ? window.orbAdProvider || null : null;
  }

  isAdReady() {
    const provider = this.provider;
    if (!provider || typeof provider.showRewardedVideo !== 'function' || this.isAdLoading) return false;
    if (Date.now() - this.lastAdTime <= this.minCooldown) return false;
    return typeof provider.isRewardedReady !== 'function' || provider.isRewardedReady() === true;
  }

  async showRewardedVideo({ reward = 50, reason = 'Rewarded Ad', onComplete, onError } = {}) {
    if (!this.isAdReady()) {
      onError?.('Реклама сейчас недоступна');
      return false;
    }

    this.isAdLoading = true;
    try {
      const result = await this.provider.showRewardedVideo({ reward, reason });
      if (result?.rewarded !== true) {
        onError?.('Просмотр не подтверждён');
        return false;
      }
      this.lastAdTime = Date.now();
      onComplete?.({ reward });
      return true;
    } catch (error) {
      onError?.(error?.message || 'Не удалось загрузить рекламу');
      return false;
    } finally {
      this.isAdLoading = false;
    }
  }

  async showInterstitial(onComplete) {
    const provider = this.provider;
    if (typeof provider?.showInterstitial === 'function') {
      try {
        await provider.showInterstitial();
        this.lastAdTime = Date.now();
      } catch {
        // An unavailable optional interstitial must never interrupt gameplay.
      }
    }
    onComplete?.();
  }

  showBanner() {
    return null;
  }

  hideBanner() {}
}

const adManager = new AdManager();
export { adManager };
export default adManager;
