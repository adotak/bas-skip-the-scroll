import {
  canCallProvider,
  recordProviderCall,
  getQuotaStatus,
  resetQuotaForTesting,
} from '../quota/guard';

describe('quotaGuard', () => {
  beforeEach(() => {
    resetQuotaForTesting();
  });

  test('initially permits calls for youtube and custom_search', () => {
    expect(canCallProvider('youtube')).toBe(true);
    expect(canCallProvider('custom_search')).toBe(true);
  });

  test('records calls and increments count', () => {
    recordProviderCall('youtube');
    recordProviderCall('youtube');
    const status = getQuotaStatus();
    expect(status.youtube.usedToday).toBe(2);
  });

  test('blocks calls when quota limit is reached', () => {
    const status = getQuotaStatus();
    for (let i = 0; i < status.youtube.maxDaily; i++) {
      recordProviderCall('youtube');
    }

    expect(canCallProvider('youtube')).toBe(false);
  });
});
