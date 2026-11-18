import { AndroidGate } from '../modules/android-gate';

describe('AndroidGate module wrapper', () => {
  test('returns default target apps list', () => {
    const apps = AndroidGate.getTargetApps();
    expect(apps).toBeDefined();
    expect(Array.isArray(apps)).toBe(true);
    expect(apps).toContain('com.instagram.android');
    expect(apps).toContain('com.google.android.youtube');
    expect(apps).toContain('com.zhiliaoapp.musically');
  });

  test('default pause duration is 5 seconds', () => {
    expect(AndroidGate.getPauseDuration()).toBe(5);
  });

  test('provides fallback gate statistics object', () => {
    const stats = AndroidGate.getGateStats();
    expect(stats).toBeDefined();
    expect(stats.basePauseDuration).toBe(5);
    expect(typeof stats.gateShown).toBe('number');
    expect(typeof stats.redirects).toBe('number');
    expect(typeof stats.continueAnyway).toBe('number');
    expect(typeof stats.gateShownLast7Days).toBe('number');
    expect(typeof stats.redirectsLast30Days).toBe('number');
  });

  test('isSupported returns boolean', () => {
    expect(typeof AndroidGate.isSupported()).toBe('boolean');
  });

  test('permission checks return booleans without crashing', () => {
    expect(typeof AndroidGate.hasUsageStatsPermission()).toBe('boolean');
    expect(typeof AndroidGate.hasOverlayPermission()).toBe('boolean');
    expect(typeof AndroidGate.isIgnoringBatteryOptimizations()).toBe('boolean');
  });
});
